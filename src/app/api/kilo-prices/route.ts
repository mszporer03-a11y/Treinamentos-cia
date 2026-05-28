import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  storeId: z.string().cuid(),
  price: z.number().positive(),
  suggestedNote: z.string().max(300).optional(),
  effectiveFrom: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");

  if (session.user.role === "ADMIN") {
    // Return latest price per store
    const stores = await db.store.findMany({
      where: storeId ? { id: storeId } : {},
      include: {
        kiloPrices: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(stores);
  }

  // Franchisee — their stores
  const userStores = await db.userStore.findMany({
    where: { userId: session.user.id },
    select: { storeId: true },
  });
  const ids = userStores.map((s) => s.storeId);

  const prices = await db.kiloPrice.findMany({
    where: { storeId: { in: ids } },
    include: { store: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(prices);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const kp = await db.kiloPrice.create({
    data: {
      ...parsed.data,
      suggestedById: session.user.id,
      effectiveFrom: parsed.data.effectiveFrom ? new Date(parsed.data.effectiveFrom) : new Date(),
    },
    include: { store: { select: { id: true, name: true } } },
  });
  return NextResponse.json(kp, { status: 201 });
}
