import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/conversations
// Admin  → lista todas as conversas (com último mensagem + unread)
// Franqueado → retorna/cria sua própria conversa
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (session.user.role === "ADMIN") {
    const conversations = await db.conversation.findMany({
      include: {
        franchisee: {
          select: {
            id: true,
            name: true,
            email: true,
            stores: { include: { store: { select: { id: true, name: true, code: true } } } },
          },
        },
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
        franchisee: c.franchisee,
        lastMessage: c.messages[0] ?? null,
        unreadCount: 0,
        pendingStores: pendingStoresByConv.get(c.id) ?? [],
        updatedAt: c.updatedAt,
      }))
    );
  }

  // Franqueado — criar ou buscar conversa própria
  const conv = await db.conversation.upsert({
    where: { franchiseeId: session.user.id },
    create: { franchiseeId: session.user.id },
    update: {},
    select: { id: true },
  });

  return NextResponse.json(conv);
}

// POST /api/conversations  — Admin inicia conversa com um franqueado
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { franchiseeId } = await req.json();
  if (!franchiseeId) {
    return NextResponse.json({ error: "franchiseeId obrigatório" }, { status: 400 });
  }

  const franchisee = await db.user.findUnique({
    where: { id: franchiseeId, role: "FRANCHISEE" },
    select: {
      id: true,
      name: true,
      email: true,
      stores: { include: { store: { select: { name: true, code: true } } } },
    },
  });
  if (!franchisee) {
    return NextResponse.json({ error: "Franqueado não encontrado" }, { status: 404 });
  }

  const conv = await db.conversation.upsert({
    where: { franchiseeId },
    create: { franchiseeId },
    update: {},
    select: { id: true, updatedAt: true },
  });

  return NextResponse.json({
    id: conv.id,
    franchisee,
    lastMessage: null,
    updatedAt: conv.updatedAt,
  });
}
