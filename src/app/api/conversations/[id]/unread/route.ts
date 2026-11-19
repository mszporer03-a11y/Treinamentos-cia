import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/conversations/[id]/unread
// Retorna contagem de mensagens não lidas para a sessão atual
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN";

  if (!isAdmin) {
    const conv = await db.conversation.findUnique({
      where: { id: params.id },
      select: { franchiseeId: true },
    });
    if (!conv || conv.franchiseeId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }
  }

  const count = await db.message.count({
    where: {
      conversationId: params.id,
      ...(isAdmin ? { readByAdmin: false } : { readByFranchisee: false }),
    },
  });

  return NextResponse.json({ count });
}
