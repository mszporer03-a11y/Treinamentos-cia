import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const schema = z.object({ active: z.boolean().optional(), endsAt: z.string().optional().nullable() });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await db.survey.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      ...(parsed.data.endsAt !== undefined ? { endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null } : {}),
    },
    include: { options: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.survey.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
