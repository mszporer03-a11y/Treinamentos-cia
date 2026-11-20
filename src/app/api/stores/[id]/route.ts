import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  code: z.string().min(1).max(40).optional(),
  city: z.string().max(80).optional().nullable(),
  active: z.boolean().optional(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  contactName: z.string().max(120).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
  email: z.string().email().max(120).optional().nullable().or(z.literal("")),
  pinColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
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
    if (data.email === "") data.email = null;
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

  try {
    // Respostas de checklist não têm exclusão em cascata no banco
    await db.$transaction([
      db.checklistResponse.deleteMany({ where: { storeId: params.id } }),
      db.store.delete({ where: { id: params.id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir loja" }, { status: 500 });
  }
}
