import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/comunicados/[id]/view — registra leitura do comunicado
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await db.comunicadoView.upsert({
    where: { userId_comunicadoId: { userId: session.user.id, comunicadoId: params.id } },
    create: { userId: session.user.id, comunicadoId: params.id },
    update: { viewedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
