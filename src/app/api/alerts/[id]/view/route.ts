import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/alerts/[id]/view — registra visualização do registro
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await db.alertView.upsert({
    where: { userId_alertId: { userId: session.user.id, alertId: params.id } },
    create: { userId: session.user.id, alertId: params.id },
    update: { viewedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
