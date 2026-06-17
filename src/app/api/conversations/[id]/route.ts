import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// DELETE /api/conversations/[id]
// Admin apaga uma conversa (e, em cascata, todas as mensagens dela).
// Só pode apagar conversas próprias (adminId = ele) ou legadas (adminId null).
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const conv = await db.conversation.findUnique({
    where: { id: params.id },
    select: { id: true, adminId: true },
  });
  if (!conv) {
    return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  }

  if (conv.adminId && conv.adminId !== session.user.id) {
    return NextResponse.json({ error: "Conversa de outro admin" }, { status: 403 });
  }

  // onDelete: Cascade remove as mensagens (e seus vínculos de loja)
  await db.conversation.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
