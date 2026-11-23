import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { emergencyChatInclude } from "@/lib/emergency";

export const dynamic = "force-dynamic";

// POST /api/emergency/[id]/close — somente o administrador encerra a sessão
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Somente a Franquia pode encerrar o chat" }, { status: 403 });
  }

  const chat = await db.emergencyChat.findUnique({ where: { id: params.id } });
  if (!chat) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
  if (chat.status === "CLOSED") {
    const current = await db.emergencyChat.findUnique({ where: { id: params.id }, include: emergencyChatInclude });
    return NextResponse.json(current);
  }

  const updated = await db.emergencyChat.update({
    where: { id: params.id },
    data: { status: "CLOSED", closedAt: new Date(), closedById: session.user.id },
    include: emergencyChatInclude,
  });
  return NextResponse.json(updated);
}
