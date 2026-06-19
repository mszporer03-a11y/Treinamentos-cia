import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/badges
 * Returns unread/new counts per section for the current user.
 * Franchisee/Manager: { solicitacoes, comunicados, registros, cianews, materiais, cardapios, universidade }
 * Admin:              { solicitacoes }
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({}, { status: 401 });

  const userId = session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  const fourteenDays  = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const thirtyDays    = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  if (isAdmin) {
    // Cada admin vê apenas suas conversas + legadas (adminId null)
    const myConvFilter = { OR: [{ adminId: userId }, { adminId: null }] };

    const solicitacoes = await db.message.count({
      where: {
        category: { not: null },
        requestStatus: "PENDING",
        conversation: myConvFilter,
      },
    });

    return NextResponse.json({ solicitacoes });
  }

  // ── FRANCHISEE / MANAGER ──────────────────────────────────────────────
  const userStoreIds = await db.userStore
    .findMany({ where: { userId }, select: { storeId: true } })
    .then((rows) => rows.map((r) => r.storeId));

  const isCiaCardUni = {
    OR: [
      { name: { contains: "cardápio", mode: "insensitive" as const } },
      { slug: { contains: "cardapio" } },
      { name: { contains: "universidade", mode: "insensitive" as const } },
      { slug: { contains: "universidade" } },
      { name: { contains: "cia news", mode: "insensitive" as const } },
      { slug: { contains: "cia-news" } },
    ],
  };

  const [solicitacoes, comunicados, registros, cianews, materiais, cardapios, universidade] =
    await Promise.all([
      // Solicitações com atualização de status ainda não vista pelo franqueado
      db.message.count({
        where: {
          conversation: { franchiseeId: userId },
          category: { not: null },
          requestStatus: { in: ["SEEN", "IN_PROGRESS", "DONE"] },
          readByFranchisee: false,
        },
      }),

      // Comunicados publicados ainda não lidos
      db.comunicado.count({
        where: { published: true, views: { none: { userId } } },
      }),

      // Registros das lojas do usuário ainda não vistos
      db.nonComplianceAlert.count({
        where: { storeId: { in: userStoreIds }, views: { none: { userId } } },
      }),

      // Novas publicações CIA News (30 dias) não vistas
      db.material.count({
        where: {
          published: true,
          createdAt: { gte: thirtyDays },
          views: { none: { userId } },
          category: {
            OR: [
              { name: { contains: "cia news", mode: "insensitive" } },
              { slug: { contains: "cia-news" } },
            ],
          },
        },
      }),

      // Novos materiais (exceto cardápio/universidade/cia news) 14 dias, não vistos
      db.material.count({
        where: {
          published: true,
          createdAt: { gte: fourteenDays },
          views: { none: { userId } },
          NOT: { category: isCiaCardUni },
        },
      }),

      // Novos cardápios (30 dias) não vistos
      db.material.count({
        where: {
          published: true,
          createdAt: { gte: thirtyDays },
          views: { none: { userId } },
          category: {
            OR: [
              { name: { contains: "cardápio", mode: "insensitive" } },
              { slug: { contains: "cardapio" } },
            ],
          },
        },
      }),

      // Novos tutoriais Universidade (30 dias) não vistos
      db.material.count({
        where: {
          published: true,
          createdAt: { gte: thirtyDays },
          views: { none: { userId } },
          category: {
            OR: [
              { name: { contains: "universidade", mode: "insensitive" } },
              { slug: { contains: "universidade" } },
            ],
          },
        },
      }),
    ]);

  return NextResponse.json({
    solicitacoes,
    comunicados,
    registros,
    cianews,
    materiais,
    cardapios,
    universidade,
  });
}
