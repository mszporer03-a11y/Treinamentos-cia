import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
        sender: { role: "FRANCHISEE" },
        ...(franchiseeId ? { conversation: { franchiseeId } } : {}),
        ...(category ? { category } : {}),
        ...(status ? { requestStatus: status as never } : {}),
        ...(storeId
          ? { linkedStores: { some: { storeId } } }
          : {}),
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        conversation: {
          select: {
            id: true,
            franchisee: { select: { id: true, name: true, email: true } },
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

  // Franqueado: apenas as suas mensagens que são quick-requests
  const conv = await db.conversation.findUnique({
    where: { franchiseeId: session.user.id },
    select: { id: true },
  });

  if (!conv) return NextResponse.json([]);

  const category = searchParams.get("category") || undefined;
  const storeId = searchParams.get("storeId") || undefined;

  const messages = await db.message.findMany({
    where: {
      conversationId: conv.id,
      senderId: session.user.id,
      category: category ? { equals: category } : { not: null },
      ...(storeId ? { linkedStores: { some: { storeId } } } : {}),
    },
    include: {
      linkedStores: {
        include: { store: { select: { id: true, name: true, code: true } } },
      },
      conversation: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(messages);
}
