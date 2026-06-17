import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["SEEN", "IN_PROGRESS", "DONE"] as const;
type ValidStatus = typeof VALID_STATUSES[number];

// PATCH /api/solicitacoes/[id]
// Admin only — atualiza status, salva reply + arquivo, envia no chat
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const {
    status,
    reply,
    replyFileUrl,
    replyFileKey,
    replyFileName,
    replyFileType,
  } = body as {
    status: string;
    reply?: string;
    replyFileUrl?: string;
    replyFileKey?: string;
    replyFileName?: string;
    replyFileType?: string;
  };

  if (!VALID_STATUSES.includes(status as ValidStatus)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const message = await db.message.findUnique({
    where: { id: params.id },
    include: { conversation: { select: { id: true, franchiseeId: true, adminId: true } } },
  });

  if (!message || !message.category) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  // Admin só atua nas solicitações das suas conversas (ou legadas).
  // Em solicitações enviadas a vários admins, cada admin atua na sua própria
  // cópia (a lista só mostra a cópia da conversa dele), então esta checagem
  // garante que ele é um dos destinatários.
  if (message.conversation.adminId && message.conversation.adminId !== session.user.id) {
    return NextResponse.json({ error: "Solicitação atribuída a outro admin" }, { status: 403 });
  }

  const now = new Date();

  // Status + timestamps são compartilhados por todas as cópias do grupo
  const statusData: Record<string, unknown> = { requestStatus: status };
  if (status === "SEEN")        statusData.seenAt = now;
  if (status === "IN_PROGRESS") statusData.inProgressAt = now;
  if (status === "DONE")        statusData.doneAt = now;

  // Resposta da equipe fica só na cópia do admin que respondeu
  const replyData: Record<string, unknown> = {};
  if (status === "DONE") {
    if (reply?.trim())  replyData.adminReplyContent  = reply.trim();
    if (replyFileUrl)   replyData.adminReplyFileUrl  = replyFileUrl;
    if (replyFileKey)   replyData.adminReplyFileKey  = replyFileKey;
    if (replyFileName)  replyData.adminReplyFileName = replyFileName;
    if (replyFileType)  replyData.adminReplyFileType = replyFileType;
  }

  // Propaga o status para todas as cópias (ou só esta, se não houver grupo)
  if (message.requestGroupId) {
    await db.message.updateMany({
      where: { requestGroupId: message.requestGroupId },
      data: statusData,
    });
  } else {
    await db.message.update({ where: { id: params.id }, data: statusData });
  }

  const updated = Object.keys(replyData).length
    ? await db.message.update({ where: { id: params.id }, data: replyData })
    : await db.message.findUnique({ where: { id: params.id } });

  // If DONE and there's a reply (text or file) → create chat message
  const hasReply = reply?.trim() || replyFileUrl;
  if (status === "DONE" && hasReply) {
    const replyMsg = await db.message.create({
      data: {
        conversationId: message.conversation.id,
        senderId: session.user.id,
        content: reply?.trim() || null,
        fileUrl:  replyFileUrl  || null,
        fileKey:  replyFileKey  || null,
        fileName: replyFileName || null,
        fileType: replyFileType || null,
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
      data: { updatedAt: now },
    });

    const notifBody = reply?.trim()
      ? reply.trim()
      : `📎 ${replyFileName ?? "Arquivo enviado"}`;

    await sendPushToUser(message.conversation.franchiseeId, {
      title: "Solicitação concluída!",
      body: notifBody,
      url: "/solicitacoes",
    }).catch(() => {});

    return NextResponse.json({ updated, replyMsg });
  }

  // Notificar status intermediário
  const statusLabels: Record<string, string> = {
    SEEN:        "Sua solicitação foi vista!",
    IN_PROGRESS: "Sua solicitação está em preparo.",
    DONE:        "Sua solicitação foi concluída!",
  };
  await sendPushToUser(message.conversation.franchiseeId, {
    title: statusLabels[status] ?? "Atualização na solicitação",
    body: "Acesse o portal para ver o andamento.",
    url: "/solicitacoes",
  }).catch(() => {});

  return NextResponse.json({ updated });
}
