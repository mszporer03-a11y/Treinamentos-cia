import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/materials/[id]/views — lista quem visualizou (admin only)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const views = await db.materialView.findMany({
    where: { materialId: params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          stores: { include: { store: { select: { name: true, code: true } } } },
        },
      },
    },
    orderBy: { viewedAt: "desc" },
  });

  return NextResponse.json(views);
}
