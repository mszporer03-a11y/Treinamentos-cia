import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/solicitacoes/seen
// Franqueado/gerente marca como vistas as atualizações de status das suas
// solicitações, removendo a notificação (badge) do acompanhamento.
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await db.message.updateMany({
    where: {
      conversation: { franchiseeId: session.user.id },
      category: { not: null },
      requestStatus: { in: ["SEEN", "IN_PROGRESS", "DONE"] },
      readByFranchisee: false,
    },
    data: { readByFranchisee: true },
  });

  return NextResponse.json({ ok: true });
}
