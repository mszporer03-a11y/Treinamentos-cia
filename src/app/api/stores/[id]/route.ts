import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  code: z.string().min(1).max(40).optional(),
  city: z.string().max(80).optional(),
  active: z.boolean().optional(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

// PATCH /api/stores/[id]
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const store = await db.store.update({ where: { id: params.id }, data });
    return NextResponse.json(store);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar loja" }, { status: 500 });
  }
}

// DELETE /api/stores/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await db.store.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
