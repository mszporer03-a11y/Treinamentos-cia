import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/managers
// Franqueado → gerentes criados por ele
// Admin      → todos os gerentes
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && session.user.role !== "FRANCHISEE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const managers = await db.user.findMany({
    where: {
      role: "MANAGER",
      ...(isAdmin ? {} : { createdById: session.user.id }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      active: true,
      createdAt: true,
      stores: { select: { store: { select: { id: true, name: true, code: true } } } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(managers);
}
