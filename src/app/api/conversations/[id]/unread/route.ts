import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { canAccessConversation } from "@/lib/access";

export const dynamic = "force-dynamic";

// GET /api/conversations/[id]/unread
// Retorna contagem de mensagens não lidas para a sessão atual
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { conv, allowed } = await canAccessConversation(session.user, params.id);
  if (!conv) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const isAdmin = session.user.role === "ADMIN";

  const count = await db.message.count({
    where: {
      conversationId: params.id,
      ...(isAdmin ? { readByAdmin: false } : { readByFranchisee: false }),
    },
  });

  return NextResponse.json({ count });
}
