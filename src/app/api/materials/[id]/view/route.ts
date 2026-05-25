import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/materials/[id]/view — registra visualização do material
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await db.materialView.upsert({
    where: { userId_materialId: { userId: session.user.id, materialId: params.id } },
    create: { userId: session.user.id, materialId: params.id },
    update: { viewedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
