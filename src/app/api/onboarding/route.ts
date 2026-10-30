import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const DEFAULT_STEPS = [
  { title: "Obras e Reformas", description: "Adequação do espaço físico conforme padrão Companhia do Churrasco", phase: "OBRAS" as const, order: 0 },
  { title: "Equipamentos", description: "Instalação e vistoria de equipamentos (churrasqueiras, refrigeração, etc.)", phase: "EQUIPAMENTOS" as const, order: 1 },
  { title: "Treinamento da Equipe", description: "Treinamento operacional de toda a equipe", phase: "TREINAMENTO" as const, order: 2 },
  { title: "Aprovação Final", description: "Vistoria final e aprovação para abertura", phase: "APROVACAO" as const, order: 3 },
];

const createSchema = z.object({
  storeId: z.string().cuid(),
  isNewStore: z.boolean().default(true),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");

  let where: Record<string, unknown> = {};

  if (session.user.role !== "ADMIN") {
    const userStores = await db.userStore.findMany({
      where: { userId: session.user.id },
      select: { storeId: true },
    });
    const ids = userStores.map((s) => s.storeId);
    where.storeId = { in: ids };
  } else if (storeId) {
    where.storeId = storeId;
  }

  const onboardings = await db.storeOnboarding.findMany({
    where,
    include: {
      store: { select: { id: true, name: true, code: true } },
      steps: { orderBy: { order: "asc" } },
    },
  });
  return NextResponse.json(onboardings);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const onboarding = await db.storeOnboarding.create({
    data: {
      storeId: parsed.data.storeId,
      isNewStore: parsed.data.isNewStore,
      steps: { create: DEFAULT_STEPS },
    },
    include: {
      store: { select: { id: true, name: true } },
      steps: { orderBy: { order: "asc" } },
    },
  });
  return NextResponse.json(onboarding, { status: 201 });
}
