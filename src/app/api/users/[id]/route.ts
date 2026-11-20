import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { userSelectFields, activeAdminCount } from "@/lib/users";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "FRANCHISEE"]).optional(),
  active: z.boolean().optional(),
  storeIds: z.array(z.string()).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { storeIds, ...data } = updateSchema.parse(body);

    const current = await db.user.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    // Proteções: não se auto-inativar/rebaixar e nunca deixar a rede sem administrador ativo
    const losesAdmin =
      current.role === "ADMIN" && current.active && (data.role === "FRANCHISEE" || data.active === false);
    if (losesAdmin && params.id === session.user.id) {
      return NextResponse.json({ error: "Você não pode inativar ou remover o seu próprio acesso de administrador" }, { status: 400 });
    }
    if (losesAdmin && (await activeAdminCount(params.id)) === 0) {
      return NextResponse.json({ error: "É necessário manter ao menos um administrador ativo" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.email) {
      const email = data.email.trim().toLowerCase();
      const clash = await db.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" }, id: { not: params.id } },
      });
      if (clash) return NextResponse.json({ error: "Email já está em uso" }, { status: 400 });
      updateData.email = email;
    }
    if (data.password) updateData.password = await bcrypt.hash(data.password, 12);
    if (storeIds) {
      updateData.stores = {
        deleteMany: {},
        create: Array.from(new Set(storeIds)).map((storeId) => ({ storeId })),
      };
    }

    const user = await db.user.update({
      where: { id: params.id },
      data: updateData,
      select: userSelectFields,
    });
    return NextResponse.json(user);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (params.id === session.user.id) {
    return NextResponse.json({ error: "Não é possível excluir sua própria conta" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  if (target.role === "ADMIN" && target.active && (await activeAdminCount(params.id)) === 0) {
    return NextResponse.json({ error: "É necessário manter ao menos um administrador ativo" }, { status: 400 });
  }

  try {
    // Registros sem exclusão em cascata no banco precisam ser removidos antes
    await db.$transaction([
      db.checklistResponse.deleteMany({ where: { responderId: params.id } }),
      db.supplyRequest.deleteMany({ where: { requesterId: params.id } }),
      db.user.delete({ where: { id: params.id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir usuário" }, { status: 500 });
  }
}
