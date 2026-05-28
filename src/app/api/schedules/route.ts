import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const shiftSchema = z.object({
  employeeId: z.string().cuid(),
  dayIndex: z.number().int().min(0).max(6),
  type: z.enum(["MANHA", "TARDE", "NOITE", "INTEGRAL", "FOLGA"]),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

const createSchema = z.object({
  storeId: z.string().cuid(),
  weekStart: z.string(), // ISO date
  shifts: z.array(shiftSchema),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  const weekStart = searchParams.get("weekStart");

  let where: Record<string, unknown> = {};
  if (storeId) where.storeId = storeId;
  if (weekStart) where.weekStart = new Date(weekStart);

  if (session.user.role !== "ADMIN") {
    const userStores = await db.userStore.findMany({
      where: { userId: session.user.id },
      select: { storeId: true },
    });
    const ids = userStores.map((s) => s.storeId);
    where.storeId = { in: ids };
  }

  const schedules = await db.workSchedule.findMany({
    where,
    include: {
      store: { select: { id: true, name: true } },
      shifts: {
        include: { employee: { select: { id: true, name: true, role: true } } },
        orderBy: [{ dayIndex: "asc" }],
      },
    },
    orderBy: { weekStart: "desc" },
  });
  return NextResponse.json(schedules);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { storeId, weekStart, shifts } = parsed.data;

  if (session.user.role !== "ADMIN") {
    const access = await db.userStore.findUnique({
      where: { userId_storeId: { userId: session.user.id, storeId } },
    });
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schedule = await db.workSchedule.upsert({
    where: { storeId_weekStart: { storeId, weekStart: new Date(weekStart) } },
    create: {
      storeId,
      weekStart: new Date(weekStart),
      shifts: { create: shifts },
    },
    update: {
      updatedAt: new Date(),
      shifts: {
        deleteMany: {},
        create: shifts,
      },
    },
    include: {
      shifts: { include: { employee: { select: { id: true, name: true, role: true } } } },
    },
  });

  return NextResponse.json(schedule, { status: 201 });
}
