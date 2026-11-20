import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { canAccessStoreRecord } from "@/lib/access";

const assignSchema = z.object({
  materialId: z.string().cuid(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const emp = await db.employee.findUnique({ where: { id: params.id }, select: { storeId: true } });
  if (!emp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await canAccessStoreRecord(session.user, emp.storeId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const trainings = await db.employeeTraining.findMany({
    where: { employeeId: params.id },
    include: { material: { select: { id: true, title: true, fileType: true, categoryId: true } } },
    orderBy: { assignedAt: "desc" },
  });
  return NextResponse.json(trainings);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const emp = await db.employee.findUnique({ where: { id: params.id }, select: { storeId: true } });
  if (!emp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await canAccessStoreRecord(session.user, emp.storeId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const training = await db.employeeTraining.upsert({
    where: { employeeId_materialId: { employeeId: params.id, materialId: parsed.data.materialId } },
    create: { employeeId: params.id, materialId: parsed.data.materialId },
    update: {},
  });
  return NextResponse.json(training, { status: 201 });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const emp = await db.employee.findUnique({ where: { id: params.id }, select: { storeId: true } });
  if (!emp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await canAccessStoreRecord(session.user, emp.storeId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { materialId, completedAt } = await req.json();
  const training = await db.employeeTraining.update({
    where: { employeeId_materialId: { employeeId: params.id, materialId } },
    data: { completedAt: completedAt ? new Date(completedAt) : new Date() },
  });
  return NextResponse.json(training);
}
