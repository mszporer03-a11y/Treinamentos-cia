import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const itemSchema = z.object({
  category: z.enum(["INSUMOS", "UNIFORMES", "TALHERES", "DESCARTAVEIS", "OUTROS"]),
  name: z.string().min(1).max(200),
  quantity: z.number().int().positive(),
  unit: z.string().default("un"),
});

const createSchema = z.object({
  storeId: z.string().cuid(),
  notes: z.string().max(500).optional(),
  items: z.array(itemSchema).min(1),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role === "ADMIN") {
    const requests = await db.supplyRequest.findMany({
      include: {
        store: { select: { id: true, name: true, code: true } },
        requester: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests);
  }

  // Franchisee — only their store's requests
  const userStores = await db.userStore.findMany({
    where: { userId: session.user.id },
    select: { storeId: true },
  });
  const storeIds = userStores.map((s) => s.storeId);

  const requests = await db.supplyRequest.findMany({
    where: { storeId: { in: storeIds } },
    include: {
      store: { select: { id: true, name: true, code: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { storeId, notes, items } = parsed.data;

  // Franchisees can only request for their own stores
  if (session.user.role !== "ADMIN") {
    const access = await db.userStore.findUnique({
      where: { userId_storeId: { userId: session.user.id, storeId } },
    });
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const request = await db.supplyRequest.create({
    data: {
      storeId,
      requesterId: session.user.id,
      notes,
      items: { create: items },
    },
    include: { items: true, store: { select: { id: true, name: true } } },
  });

  return NextResponse.json(request, { status: 201 });
}
