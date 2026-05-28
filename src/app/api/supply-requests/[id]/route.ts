import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "DELIVERED"]).optional(),
  adminNotes: z.string().max(500).optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const request = await db.supplyRequest.findUnique({
    where: { id: params.id },
    include: {
      store: { select: { id: true, name: true, code: true } },
      requester: { select: { id: true, name: true } },
      items: true,
    },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(request);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await db.supplyRequest.update({
    where: { id: params.id },
    data: parsed.data,
    include: { items: true, store: { select: { id: true, name: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.supplyRequest.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
