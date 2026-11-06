import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTargetFranchisees } from "@/lib/audience";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/materials/[id]/views — quem visualizou e quem está pendente (admin only)
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const material = await db.material.findUnique({
    where: { id: params.id },
    select: { linkedStores: { select: { storeId: true } } },
  });
  if (!material) {
    return NextResponse.json({ error: "Material não encontrado" }, { status: 404 });
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

  const viewedIds = new Set(views.map((v) => v.userId));
  const targets = await getTargetFranchisees(material.linkedStores.map((l) => l.storeId));
  const pending = targets.filter((u) => !viewedIds.has(u.id));

  return NextResponse.json({ views, pending });
}
