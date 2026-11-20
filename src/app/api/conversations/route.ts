import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { userHasStore, getOrCreateChannel } from "@/lib/access";

export const dynamic = "force-dynamic";

const storeSelect = { id: true, name: true, code: true } as const;

// GET /api/conversations
// Admin      → lista todos os canais (loja + franqueado) com última mensagem e não lidas
// Franqueado → ?storeId=X abre/cria o canal exclusivo daquela loja;
//              sem parâmetro lista os canais disponíveis (um por loja vinculada)
export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (session.user.role === "ADMIN") {
    const conversations = await db.conversation.findMany({
      include: {
        store: { select: storeSelect },
        franchisee: {
          select: {
            id: true,
            name: true,
            email: true,
            stores: { include: { store: { select: storeSelect } } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, fileName: true, fileType: true, createdAt: true, senderId: true, readByAdmin: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const unread = await db.message.groupBy({
      by: ["conversationId"],
      where: { readByAdmin: false, sender: { role: { not: "ADMIN" } } },
      _count: { _all: true },
    });
    const unreadMap = new Map(unread.map((u) => [u.conversationId, u._count._all]));

    return NextResponse.json(
      conversations.map((c) => ({
        id: c.id,
        store: c.store,
        franchisee: c.franchisee,
        lastMessage: c.messages[0] ?? null,
        unreadCount: unreadMap.get(c.id) ?? 0,
        pendingStores: [],
        updatedAt: c.updatedAt,
      }))
    );
  }

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");

  if (storeId) {
    if (storeId !== "geral" && !(await userHasStore(session.user.id, storeId))) {
      return NextResponse.json({ error: "Loja não vinculada ao seu usuário" }, { status: 403 });
    }
    const conv = await getOrCreateChannel(session.user.id, storeId === "geral" ? null : storeId);
    return NextResponse.json({ id: conv.id, store: conv.store });
  }

  // Lista de canais: um por loja vinculada + canal geral (se não houver loja ou se já tiver histórico)
  const [links, convs] = await Promise.all([
    db.userStore.findMany({
      where: { userId: session.user.id, store: { active: true } },
      include: { store: { select: storeSelect } },
      orderBy: { store: { name: "asc" } },
    }),
    db.conversation.findMany({
      where: { franchiseeId: session.user.id },
      select: {
        id: true,
        storeId: true,
        _count: { select: { messages: { where: { readByFranchisee: false } } } },
        messages: { take: 1, select: { id: true } },
      },
    }),
  ]);

  const byStore = new Map(convs.map((c) => [c.storeId ?? "geral", c]));
  const channels = links.map((l) => {
    const c = byStore.get(l.storeId);
    return { key: l.storeId, conversationId: c?.id ?? null, store: l.store, unread: c?._count.messages ?? 0 };
  });
  const general = byStore.get("geral");
  if (channels.length === 0 || (general && general.messages.length > 0)) {
    channels.push({ key: "geral", conversationId: general?.id ?? null, store: null as never, unread: general?._count.messages ?? 0 });
  }

  return NextResponse.json({ channels });
}

// POST /api/conversations — Admin abre o canal de uma loja com um franqueado
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { franchiseeId, storeId } = await req.json();
  if (!franchiseeId) {
    return NextResponse.json({ error: "franchiseeId obrigatório" }, { status: 400 });
  }

  const franchisee = await db.user.findUnique({
    where: { id: franchiseeId, role: "FRANCHISEE" },
    select: {
      id: true,
      name: true,
      email: true,
      stores: { include: { store: { select: storeSelect } } },
    },
  });
  if (!franchisee) {
    return NextResponse.json({ error: "Franqueado não encontrado" }, { status: 404 });
  }
  if (storeId && !franchisee.stores.some((s) => s.store.id === storeId)) {
    return NextResponse.json({ error: "Franqueado não pertence a essa loja" }, { status: 400 });
  }

  const conv = await getOrCreateChannel(franchiseeId, storeId ?? null);

  return NextResponse.json({
    id: conv.id,
    store: conv.store,
    franchisee,
    lastMessage: null,
    unreadCount: 0,
    pendingStores: [],
    updatedAt: conv.updatedAt,
  });
}
