import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPushToUser } from "@/lib/push";
import { appUrl, brandedEmail, escapeHtml, sendEmail } from "@/lib/email";
import { attachmentsSchema, attachmentsSummary } from "@/lib/attachments";
import { emergencyChatInclude } from "@/lib/emergency";

export const dynamic = "force-dynamic";

const startSchema = z.object({
  franchiseeId: z.string().min(1),
  storeId: z.string().optional().nullable(),
  message: z.string().trim().min(1, "Escreva a mensagem inicial").max(4000),
  attachments: attachmentsSchema.default([]),
});

// GET /api/emergency — admin: sessões (filtros ?franchiseeId= / ?status=OPEN); franqueado: as próprias
export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const franchiseeId =
    session.user.role === "ADMIN" ? searchParams.get("franchiseeId") ?? undefined : session.user.id;

  const chats = await db.emergencyChat.findMany({
    where: {
      ...(franchiseeId ? { franchiseeId } : {}),
      ...(status === "OPEN" || status === "CLOSED" ? { status } : {}),
    },
    include: emergencyChatInclude,
    orderBy: { createdAt: "desc" },
    take: franchiseeId ? 20 : 200,
  });
  return NextResponse.json(chats);
}

// POST /api/emergency — somente a Franquia (admin) inicia uma sessão
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Somente a Franquia pode iniciar o chat emergencial" }, { status: 403 });
  }

  const parsed = startSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const { franchiseeId, storeId, message, attachments } = parsed.data;

  const franchisee = await db.user.findFirst({
    where: { id: franchiseeId, role: { not: "ADMIN" } },
    select: { id: true, name: true, email: true },
  });
  if (!franchisee) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const open = await db.emergencyChat.findFirst({ where: { franchiseeId, status: "OPEN" } });
  if (open) {
    return NextResponse.json({ error: "Já existe uma sessão aberta com este usuário", chatId: open.id }, { status: 409 });
  }

  let chat;
  try {
    chat = await db.emergencyChat.create({
      data: {
        franchiseeId,
        storeId: storeId || null,
        openedById: session.user.id,
        messages: { create: { senderId: session.user.id, content: message, attachments } },
      },
      include: emergencyChatInclude,
    });
  } catch (e) {
    // Outro admin abriu uma sessão ao mesmo tempo (índice único parcial)
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Já existe uma sessão aberta com este usuário" }, { status: 409 });
    }
    throw e;
  }

  // Notificação automática ao iniciar a sessão: push + e-mail
  const adminName = session.user.name ?? "Administrador";
  await Promise.allSettled([
    sendPushToUser(franchisee.id, {
      title: "🚨 CONTATO INDIVIDUAL EMERGENCIAL",
      body: `${adminName}: ${message}${attachments.length ? ` ${attachmentsSummary(attachments)}` : ""}`,
      url: "/emergencia",
    }),
    sendEmail(
      franchisee.email,
      "CONTATO INDIVIDUAL EMERGENCIAL — Companhia do Churrasco",
      brandedEmail({
        heading: "CONTATO INDIVIDUAL EMERGENCIAL",
        paragraphs: [
          `<strong>${escapeHtml(adminName)} (Admin Franquia)</strong> lhe enviou a seguinte mensagem pelo intranet. Por favor, responda imediatamente:`,
        ],
        quote: message,
        buttonLabel: "💬 Acessar Chat para Responder",
        buttonUrl: appUrl("/emergencia"),
      })
    ),
  ]);

  return NextResponse.json(chat, { status: 201 });
}
