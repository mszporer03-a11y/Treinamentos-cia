import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["SEEN", "IN_PROGRESS", "DONE"] as const;
type ValidStatus = typeof VALID_STATUSES[number];

// PATCH /api/solicitacoes/[id]
// Admin only — atualiza o status e opcionalmente envia resposta no chat
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { status, reply } = body as { status: string; reply?: string };

  if (!VALID_STATUSES.includes(status as ValidStatus)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const message = await db.message.findUnique({
    where: { id: params.id },
    include: {
      conversation: {
        select: { id: true, franchiseeId: true },
      },
    },
  });

  if (!message || !message.category) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  // Update status
  const updated = await db.message.update({
    where: { id: params.id },
    data: { requestStatus: status as ValidStatus },
  });

  // If DONE + reply → create a chat message as admin
  if (status === "DONE" && reply?.trim()) {
    const replyMsg = await db.message.create({
      data: {
        conversationId: message.conversation.id,
        senderId: session.user.id,
        content: reply.trim(),
        readByAdmin: true,
        readByFranchisee: false,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        linkedStores: { include: { store: { select: { id: true, name: true, code: true } } } },
      },
    });

    await db.conversation.update({
      where: { id: message.conversation.id },
      data: { updatedAt: new Date() },
    });

    // Notificar o franqueado
    await sendPushToUser(message.conversation.franchiseeId, {
      title: `Solicitação concluída`,
      body: reply.trim(),
      url: "/chat",
    }).catch(() => {});

    return NextResponse.json({ updated, replyMsg });
  }

  // Notificar o franqueado sobre mudança de status
  const statusLabels: Record<string, string> = {
    SEEN: "Sua solicitação foi vista!",
    IN_PROGRESS: "Sua solicitação está em preparo.",
    DONE: "Sua solicitação foi concluída!",
  };
  await sendPushToUser(message.conversation.franchiseeId, {
    title: statusLabels[status] ?? "Atualização na solicitação",
    body: "Acesse o portal para ver o andamento.",
    url: "/solicitacoes",
  }).catch(() => {});

  return NextResponse.json({ updated });
}
