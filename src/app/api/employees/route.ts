import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  storeId: z.string().cuid(),
  name: z.string().min(1).max(100),
  role: z.enum(["CHURRASQUEIRO", "AUXILIAR_CHURRASCO", "CAIXA", "GERENTE_OPERACIONAL", "ASG", "OUTRO"]).default("OUTRO"),
  contact: z.string().max(100).optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");

  let where: Record<string, unknown> = { active: true };

  if (session.user.role !== "ADMIN") {
    const userStores = await db.userStore.findMany({
      where: { userId: session.user.id },
      select: { storeId: true },
    });
    const ids = userStores.map((s) => s.storeId);
    where = { ...where, storeId: { in: ids } };
  } else if (storeId) {
    where = { ...where, storeId };
  }

  const employees = await db.employee.findMany({
    where,
    include: { store: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(employees);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (session.user.role !== "ADMIN") {
    const access = await db.userStore.findUnique({
      where: { userId_storeId: { userId: session.user.id, storeId: parsed.data.storeId } },
    });
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const employee = await db.employee.create({
    data: parsed.data,
    include: { store: { select: { id: true, name: true } } },
  });
  return NextResponse.json(employee, { status: 201 });
}
