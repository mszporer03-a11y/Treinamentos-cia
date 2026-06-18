import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(5000).optional(),
  published: z.boolean().optional(),
  fileUrl: z.string().url().nullable().optional(),
  fileKey: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileType: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await db.comunicado.update({
    where: { id: params.id },
    data: parsed.data,
    include: { createdBy: { select: { name: true } }, _count: { select: { views: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  await db.comunicado.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
