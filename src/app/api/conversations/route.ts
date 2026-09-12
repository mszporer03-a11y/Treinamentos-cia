import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  stores: { include: { store: { select: { id: true, name: true, code: true } } } },
} as const;

// GET /api/conversations
// Admin     → suas conversas (adminId = ele) + conversas legadas (adminId null)
// Não-admin → suas conversas (uma por admin) + legada, se houver
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (session.user.role === "ADMIN") {
    const conversations = await db.conversation.findMany({
      where: { OR: [{ adminId: session.user.id }, { adminId: null }] },
      include: {
        franchisee: { select: userSelect },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            fileName: true,
            fileType: true,
            createdAt: true,
            senderId: true,
            readByAdmin: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Find stores linked to unread admin messages, grouped by conversation
    const convIds = conversations.map((c) => c.id);
    const unreadMessages = await db.message.findMany({
      where: {
        conversationId: { in: convIds },
        readByFranchisee: false,
        sender: { role: "ADMIN" },
        linkedStores: { some: {} },
      },
      select: {
        conversationId: true,
        linkedStores: { include: { store: { select: { id: true, name: true, code: true } } } },
      },
    });

    // Group stores by conversation, deduplicate
    const pendingStoresByConv = new Map<string, { id: string; name: string; code: string }[]>();
    for (const msg of unreadMessages) {
      const existing = pendingStoresByConv.get(msg.conversationId) ?? [];
      for (const ms of msg.linkedStores) {
        if (!existing.find((s) => s.id === ms.store.id)) existing.push(ms.store);
      }
      pendingStoresByConv.set(msg.conversationId, existing);
    }

    return NextResponse.json(
      conversations.map((c) => ({
        id: c.id,
        adminId: c.adminId,
        isLegacy: c.adminId === null,
        franchisee: c.franchisee,
        lastMessage: c.messages[0] ?? null,
        unreadCount: 0,
        pendingStores: pendingStoresByConv.get(c.id) ?? [],
        updatedAt: c.updatedAt,
      }))
    );
  }

  // Franqueado / gerente — lista das suas conversas (uma por admin)
  const conversations = await db.conversation.findMany({
    where: { franchiseeId: session.user.id },
    include: {
      admin: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          content: true,
          fileName: true,
          createdAt: true,
          senderId: true,
          readByFranchisee: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    conversations.map((c) => ({
      id: c.id,
      admin: c.admin,
      isLegacy: c.adminId === null,
      lastMessage: c.messages[0] ?? null,
      updatedAt: c.updatedAt,
    }))
  );
}

// POST /api/conversations
// Admin     → { franchiseeId } inicia conversa própria com franqueado/gerente
// Não-admin → { adminId } inicia conversa com um admin
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();

  if (session.user.role === "ADMIN") {
    const { franchiseeId } = body;
    if (!franchiseeId) {
      return NextResponse.json({ error: "franchiseeId obrigatório" }, { status: 400 });
    }

    const franchisee = await db.user.findFirst({
      where: { id: franchiseeId, role: { in: ["FRANCHISEE", "MANAGER"] } },
      select: userSelect,
    });
    if (!franchisee) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const existing = await db.conversation.findFirst({
      where: { franchiseeId, adminId: session.user.id },
      select: { id: true, updatedAt: true },
    });
    const conv =
      existing ??
      (await db.conversation.create({
        data: { franchiseeId, adminId: session.user.id },
        select: { id: true, updatedAt: true },
      }));

    return NextResponse.json({
      id: conv.id,
      adminId: session.user.id,
      isLegacy: false,
      franchisee,
      lastMessage: null,
      pendingStores: [],
      updatedAt: conv.updatedAt,
    });
  }

  // Franqueado / gerente
  const { adminId } = body;
  if (!adminId) {
    return NextResponse.json({ error: "adminId obrigatório" }, { status: 400 });
  }

  const admin = await db.user.findFirst({
    where: { id: adminId, role: "ADMIN", active: true },
    select: { id: true, name: true, email: true },
  });
  if (!admin) {
    return NextResponse.json({ error: "Admin não encontrado" }, { status: 404 });
  }

  const existing = await db.conversation.findFirst({
    where: { franchiseeId: session.user.id, adminId },
    select: { id: true, updatedAt: true },
  });
  const conv =
    existing ??
    (await db.conversation.create({
      data: { franchiseeId: session.user.id, adminId },
      select: { id: true, updatedAt: true },
    }));

  return NextResponse.json({
    id: conv.id,
    admin,
    isLegacy: false,
    lastMessage: null,
    updatedAt: conv.updatedAt,
  });
}
