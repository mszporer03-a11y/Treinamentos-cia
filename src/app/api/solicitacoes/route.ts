import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/push";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const STATUS_RANK: Record<string, number> = {
  PENDING: 0,
  SEEN: 1,
  IN_PROGRESS: 2,
  DONE: 3,
};

// GET /api/solicitacoes
// Franchisee → suas solicitações (mensagens com category != null enviadas por ele)
// Admin      → todas as solicitações, com filtros: ?franchiseeId=&storeId=&category=&status=
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  if (session.user.role === "ADMIN") {
    const franchiseeId = searchParams.get("franchiseeId") || undefined;
    const storeId = searchParams.get("storeId") || undefined;
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;

    const messages = await db.message.findMany({
      where: {
        category: { not: null },
        sender: { role: { in: ["FRANCHISEE", "MANAGER"] } },
        conversation: {
          OR: [{ adminId: session.user.id }, { adminId: null }],
          ...(franchiseeId ? { franchiseeId } : {}),
        },
        ...(category ? { category } : {}),
        ...(status ? { requestStatus: status as never } : {}),
        ...(storeId
          ? { linkedStores: { some: { storeId } } }
          : {}),
      },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true, phone: true } },
        conversation: {
          select: {
            id: true,
            franchisee: { select: { id: true, name: true, email: true, role: true, phone: true } },
          },
        },
        linkedStores: {
          include: { store: { select: { id: true, name: true, code: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(messages);
  }

  // Franqueado/gerente: apenas as suas mensagens que são quick-requests
  const category = searchParams.get("category") || undefined;
  const storeId = searchParams.get("storeId") || undefined;

  const messages = await db.message.findMany({
    where: {
      conversation: { franchiseeId: session.user.id },
      senderId: session.user.id,
      category: category ? { equals: category } : { not: null },
      ...(storeId ? { linkedStores: { some: { storeId } } } : {}),
    },
    include: {
      linkedStores: {
        include: { store: { select: { id: true, name: true, code: true } } },
      },
      conversation: {
        select: { id: true, admin: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Mensagens enviadas a vários admins compartilham requestGroupId — colapsa
  // num único item, listando os destinatários e o status mais avançado.
  type Msg = (typeof messages)[number];
  const groups = new Map<string, Msg[]>();
  for (const m of messages) {
    const key = m.requestGroupId ?? m.id;
    const arr = groups.get(key);
    if (arr) arr.push(m);
    else groups.set(key, [m]);
  }

  const result = Array.from(groups.values()).map((copies) => {
    // Representante: o que tem resposta da equipe, senão o de status mais avançado
    const rep =
      copies.find((c) => c.adminReplyContent || c.adminReplyFileUrl) ??
      copies.reduce((best, c) =>
        (STATUS_RANK[c.requestStatus ?? "PENDING"] ?? 0) >
        (STATUS_RANK[best.requestStatus ?? "PENDING"] ?? 0)
          ? c
          : best
      );

    const recipients = Array.from(
      new Map(
        copies
          .map((c) => c.conversation.admin)
          .filter((a): a is { id: string; name: string } => !!a)
          .map((a) => [a.id, a.name])
      ).values()
    );

    return { ...rep, recipients };
  });

  // Reordena por data (desc) após o agrupamento
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(result);
}

// POST /api/solicitacoes — franqueado/gerente envia uma solicitação rápida
// para um ou mais admins. As cópias compartilham requestGroupId para que
// qualquer admin destinatário possa atualizar o status de todas.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.user.role === "ADMIN") {
    return NextResponse.json({ error: "Apenas franqueados e gerentes" }, { status: 403 });
  }

  const body = await req.json();
  const {
    adminIds,
    category,
    content,
    fileUrl,
    fileKey,
    fileType,
    fileName,
    linkedStoreIds,
  } = body as {
    adminIds?: string[];
    category?: string;
    content?: string;
    fileUrl?: string;
    fileKey?: string;
    fileType?: string;
    fileName?: string;
    linkedStoreIds?: string[];
  };

  if (!Array.isArray(adminIds) || adminIds.length === 0) {
    return NextResponse.json({ error: "Selecione ao menos um administrador" }, { status: 400 });
  }
  if (!category) {
    return NextResponse.json({ error: "Categoria obrigatória" }, { status: 400 });
  }
  if (!content?.trim() && !fileUrl) {
    return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
  }

  // Valida os destinatários
  const admins = await db.user.findMany({
    where: { id: { in: adminIds }, role: "ADMIN", active: true },
    select: { id: true },
  });
  if (admins.length === 0) {
    return NextResponse.json({ error: "Nenhum administrador válido" }, { status: 400 });
  }

  const storeIds: string[] = Array.isArray(linkedStoreIds) ? linkedStoreIds : [];
  const groupId = admins.length > 1 ? randomUUID() : null;
  const senderName = session.user.name ?? "Franqueado";
  const notifBody = content?.trim() ? content.trim() : `📎 ${fileName ?? "Arquivo"}`;

  for (const admin of admins) {
    const conv = await db.conversation.upsert({
      where: { franchiseeId_adminId: { franchiseeId: session.user.id, adminId: admin.id } },
      create: { franchiseeId: session.user.id, adminId: admin.id },
      update: { updatedAt: new Date() },
      select: { id: true },
    });

    await db.message.create({
      data: {
        conversationId: conv.id,
        senderId: session.user.id,
        content: content?.trim() || null,
        fileUrl: fileUrl || null,
        fileKey: fileKey || null,
        fileType: fileType || null,
        fileName: fileName || null,
        category,
        requestStatus: "PENDING",
        requestGroupId: groupId,
        readByAdmin: false,
        readByFranchisee: true,
        linkedStores:
          storeIds.length > 0 ? { create: storeIds.map((storeId) => ({ storeId })) } : undefined,
      },
    });

    await sendPushToUser(admin.id, {
      title: `Nova solicitação de ${senderName}`,
      body: notifBody,
      url: "/admin/solicitacoes",
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, count: admins.length }, { status: 201 });
}
