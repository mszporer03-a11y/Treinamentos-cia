import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/push";
import { sendEmail, emergencyChatEmail, newRequestEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// GET /api/conversations/[id]/messages
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const conv = await db.conversation.findUnique({ where: { id: params.id } });
  if (!conv) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });

  // Somente admin ou o próprio franqueado pode ver
  if (session.user.role !== "ADMIN" && conv.franchiseeId !== session.user.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const messages = await db.message.findMany({
    where: { conversationId: params.id },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      linkedStores: { include: { store: { select: { id: true, name: true, code: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Marcar como lido
  if (session.user.role === "ADMIN") {
    await db.message.updateMany({
      where: { conversationId: params.id, readByAdmin: false },
      data: { readByAdmin: true },
    });
  } else {
    await db.message.updateMany({
      where: { conversationId: params.id, readByFranchisee: false },
      data: { readByFranchisee: true },
    });
  }

  return NextResponse.json(messages);
}

// POST /api/conversations/[id]/messages
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const conv = await db.conversation.findUnique({ where: { id: params.id } });
  if (!conv) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });

  if (session.user.role !== "ADMIN" && conv.franchiseeId !== session.user.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { content, fileUrl, fileKey, fileType, fileName, category, linkedStoreIds } = body;

  if (!content?.trim() && !fileUrl) {
    return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const storeIds: string[] = Array.isArray(linkedStoreIds) ? linkedStoreIds : [];
  // Solicitações (Solicitações Rápidas) podem ser abertas a qualquer momento.
  // Mensagens de chat do franqueado só são aceitas com a sessão emergencial aberta pelo admin.
  const isRequest = !isAdmin && typeof category === "string" && category.length > 0;

  if (!isAdmin && !isRequest && !conv.isOpen) {
    return NextResponse.json(
      { error: "O chat emergencial está encerrado. Somente a Franquia pode iniciar uma nova conversa." },
      { status: 403 }
    );
  }

  // Admin enviando com a sessão fechada → abre o chat emergencial
  const openingSession = isAdmin && !conv.isOpen;

  const message = await db.message.create({
    data: {
      conversationId: params.id,
      senderId: session.user.id,
      content: content?.trim() || null,
      fileUrl: fileUrl || null,
      fileKey: fileKey || null,
      fileType: fileType || null,
      fileName: fileName || null,
      category: category || null,
      readByAdmin: isAdmin,
      readByFranchisee: !isAdmin,
      linkedStores: storeIds.length > 0
        ? { create: storeIds.map((storeId) => ({ storeId })) }
        : undefined,
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      linkedStores: { include: { store: { select: { id: true, name: true, code: true } } } },
    },
  });

  // Atualizar updatedAt da conversa (e abrir a sessão, se for o caso)
  await db.conversation.update({
    where: { id: params.id },
    data: openingSession
      ? { updatedAt: new Date(), isOpen: true, openedAt: new Date(), openedById: session.user.id, closedAt: null }
      : { updatedAt: new Date() },
  });

  // Enviar push para o destinatário
  const senderName = session.user.name ?? "Alguém";
  const notifBody = content?.trim() ? content.trim() : `📎 ${fileName ?? "Arquivo"}`;

  if (isAdmin) {
    // Notificar o franqueado
    await sendPushToUser(conv.franchiseeId, {
      title: openingSession ? "CONTATO INDIVIDUAL EMERGENCIAL" : `Mensagem de ${senderName}`,
      body: notifBody,
      url: "/chat",
    });

    // Passo 8 — e-mail ao abrir a sessão emergencial
    if (openingSession) {
      const franchisee = await db.user.findUnique({
        where: { id: conv.franchiseeId },
        select: { email: true },
      });
      if (franchisee) {
        const email = emergencyChatEmail(senderName, notifBody);
        await sendEmail(franchisee.email, email.subject, email.html);
      }
    }
  } else {
    // Notificar todos os admins
    const admins = await db.user.findMany({
      where: { role: "ADMIN", active: true },
      select: { id: true, email: true },
    });
    await Promise.allSettled(
      admins.map((admin) =>
        sendPushToUser(admin.id, {
          title: `${isRequest ? "Nova solicitação" : "Nova mensagem"} de ${senderName}`,
          body: notifBody,
          url: "/admin/chat",
        })
      )
    );

    // Nova solicitação → e-mail para os administradores
    if (isRequest) {
      const storeNames = message.linkedStores.map((ls) => ls.store.name).join(", ");
      const email = newRequestEmail(senderName, storeNames, notifBody);
      await sendEmail(admins.map((a) => a.email), email.subject, email.html);
    }
  }

  return NextResponse.json(message, { status: 201 });
}
