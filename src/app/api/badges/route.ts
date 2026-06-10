import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/badges
 * Returns unread/new counts per section for the current user.
 * Franchisee: { surveys, chat, solicitacoes, materiais, cardapios, documentos, notificacoes }
 * Admin:      { chat, solicitacoes, notificacoes }
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({}, { status: 401 });

  const userId = session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  const sevenDaysAgo  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000);
  const fourteenDays  = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const thirtyDays    = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  if (isAdmin) {
    const [chat, solicitacoes, notificacoes] = await Promise.all([
      // Conversations with unread franchisee messages
      db.conversation.count({
        where: {
          messages: {
            some: { readByAdmin: false, sender: { role: "FRANCHISEE" } },
          },
        },
      }),
      // Requests awaiting attention (PENDING)
      db.message.count({
        where: {
          category: { not: null },
          requestStatus: "PENDING",
        },
      }),
      // Open non-conformity alerts
      db.nonComplianceAlert.count({
        where: { status: { not: "RESOLVED" } },
      }),
    ]);

    return NextResponse.json({ chat, solicitacoes, notificacoes });
  }

  // ── FRANCHISEE ────────────────────────────────────────────────────────
  // Get user's store IDs for alert filtering
  const userStoreIds = await db.userStore
    .findMany({ where: { userId }, select: { storeId: true } })
    .then((rows) => rows.map((r) => r.storeId));

  const [surveys, chat, solicitacoes, materiais, cardapios, documentos, notificacoes] =
    await Promise.all([
      // Active surveys not yet answered by this user
      db.survey.count({
        where: {
          active: true,
          OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
          responses: { none: { userId } },
        },
      }),

      // Unread messages from admin
      db.message.count({
        where: {
          conversation: { franchiseeId: userId },
          readByFranchisee: false,
          sender: { role: "ADMIN" },
        },
      }),

      // Requests with status update in the last 7 days
      db.message.count({
        where: {
          conversation: { franchiseeId: userId },
          category: { not: null },
          requestStatus: { in: ["SEEN", "IN_PROGRESS", "DONE"] },
          OR: [
            { seenAt:        { gte: sevenDaysAgo } },
            { inProgressAt:  { gte: sevenDaysAgo } },
            { doneAt:        { gte: sevenDaysAgo } },
          ],
        },
      }),

      // New materials (not cardápio) published in last 14 days, not yet viewed
      db.material.count({
        where: {
          published: true,
          createdAt: { gte: fourteenDays },
          views: { none: { userId } },
          NOT: {
            category: {
              OR: [
                { name: { contains: "cardápio", mode: "insensitive" } },
                { slug: { contains: "cardapio" } },
              ],
            },
          },
        },
      }),

      // New cardápio materials published in last 30 days, not yet viewed
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

      // New documents uploaded for this franchisee in last 14 days
      db.franchiseeDocument.count({
        where: {
          franchiseeId: userId,
          createdAt: { gte: fourteenDays },
        },
      }),

      // Open non-conformity alerts for this franchisee's stores
      db.nonComplianceAlert.count({
        where: {
          storeId: { in: userStoreIds },
          status: { not: "RESOLVED" },
        },
      }),
    ]);

  return NextResponse.json({
    surveys,
    chat,
    solicitacoes,
    materiais,
    cardapios,
    documentos,
    notificacoes,
  });
}
