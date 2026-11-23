import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPushToUser } from "@/lib/push";
import { attachmentsSchema, attachmentsSummary } from "@/lib/attachments";
import { emergencyChatInclude, getEmergencyChatFor } from "@/lib/emergency";

export const dynamic = "force-dynamic";

const messageSchema = z.object({
  content: z.string().trim().max(4000).optional().nullable(),
  attachments: attachmentsSchema.default([]),
});

// GET /api/emergency/[id]/messages — sessão + mensagens
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { error, status } = await getEmergencyChatFor(params.id, session.user);
  if (error) return NextResponse.json({ error }, { status });

  const [chat, messages] = await Promise.all([
    db.emergencyChat.findUnique({ where: { id: params.id }, include: emergencyChatInclude }),
    db.emergencyMessage.findMany({
      where: { chatId: params.id },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  return NextResponse.json({ chat, messages });
}

// POST /api/emergency/[id]/messages — só enquanto a sessão estiver aberta
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { chat, error, status } = await getEmergencyChatFor(params.id, session.user);
  if (error) return NextResponse.json({ error }, { status });
  if (chat.status !== "OPEN") {
    return NextResponse.json(
      { error: "Sessão encerrada. Aguarde a Franquia iniciar um novo contato." },
      { status: 409 }
    );
  }

  const parsed = messageSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 });
  const content = parsed.data.content?.trim() || null;
  const { attachments } = parsed.data;
  if (!content && attachments.length === 0) {
    return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
  }

  const message = await db.emergencyMessage.create({
    data: { chatId: chat.id, senderId: session.user.id, content, attachments },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });

  const senderName = session.user.name ?? "Alguém";
  const body = content ?? attachmentsSummary(attachments);
  if (session.user.role === "ADMIN") {
    await sendPushToUser(chat.franchiseeId, {
      title: `🚨 Chat emergencial — ${senderName}`,
      body,
      url: "/emergencia",
    });
  } else {
    const admins = await db.user.findMany({ where: { role: "ADMIN", active: true }, select: { id: true } });
    await Promise.allSettled(
      admins.map((a) =>
        sendPushToUser(a.id, {
          title: `🚨 Resposta no chat emergencial — ${senderName}`,
          body,
          url: `/admin/emergencia?user=${chat.franchiseeId}`,
        })
      )
    );
  }

  return NextResponse.json(message, { status: 201 });
}
