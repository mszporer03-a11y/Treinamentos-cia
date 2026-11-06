import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ action: z.literal("close") });

// PATCH /api/conversations/[id] — somente admin encerra o chat emergencial
// (a sessão é aberta automaticamente quando o admin envia a primeira mensagem)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  const conv = await db.conversation.update({
    where: { id: params.id },
    data: { isOpen: false, closedAt: new Date() },
    select: { id: true, isOpen: true, openedAt: true, closedAt: true },
  });

  return NextResponse.json(conv);
}
