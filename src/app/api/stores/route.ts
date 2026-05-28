import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const storeSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().min(1).max(40),
  city: z.string().max(80).optional(),
  active: z.boolean().optional(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

// GET /api/stores
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Admins see all stores; franchisees see only their assigned stores
  if (session.user.role !== "ADMIN") {
    const userStores = await db.userStore.findMany({
      where: { userId: session.user.id },
      include: { store: true },
    });
    return NextResponse.json(userStores.map((us) => us.store));
  }

  const stores = await db.store.findMany({
    include: {
      users: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(stores);
}

// POST /api/stores
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = storeSchema.parse(body);

    const store = await db.store.create({ data });
    return NextResponse.json(store, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar loja" }, { status: 500 });
  }
}
