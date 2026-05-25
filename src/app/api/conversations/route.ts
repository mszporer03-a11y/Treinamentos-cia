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
            stores: { include: { store: { select: { name: true, code: true } } } },
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

    return NextResponse.json(
      conversations.map((c) => ({
        id: c.id,
        franchisee: c.franchisee,
        lastMessage: c.messages[0] ?? null,
        unreadCount: 0, // calculated below separately if needed
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
