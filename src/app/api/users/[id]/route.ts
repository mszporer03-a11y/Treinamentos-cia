import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "FRANCHISEE", "MANAGER"]).optional(),
  phone: z.string().max(30).optional().nullable(),
  active: z.boolean().optional(),
  storeIds: z.array(z.string()).optional(),
});

const userSelectFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  active: true,
  createdAt: true,
  stores: { select: { store: { select: { id: true, name: true, code: true } } } },
};

// Apenas administradores gerenciam contas. Franqueados solicitam via "Solicitações".
async function canManage(_sessionUserId: string, sessionRole: string, _targetId: string) {
  return sessionRole === "ADMIN";
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const isAdmin = session.user.role === "ADMIN";
  if (!(await canManage(session.user.id, session.user.role, params.id))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    // Franqueado não pode alterar o papel da conta
    if (!isAdmin && data.role && data.role !== "MANAGER") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { storeIds, ...fields } = data;
    const updateData: Record<string, unknown> = { ...fields };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    // Franqueado só pode vincular às próprias lojas
    if (storeIds && !isAdmin) {
      const myStores = await db.userStore.findMany({
        where: { userId: session.user.id },
        select: { storeId: true },
      });
      const myStoreIds = new Set(myStores.map((s) => s.storeId));
      if (storeIds.some((id) => !myStoreIds.has(id))) {
        return NextResponse.json(
          { error: "Você só pode vincular gerentes às suas próprias lojas" },
          { status: 403 }
        );
      }
    }

    const user = await db.user.update({
      where: { id: params.id },
      data: {
        ...updateData,
        ...(storeIds
          ? {
              stores: {
                deleteMany: {},
                create: storeIds.map((storeId) => ({ storeId })),
              },
            }
          : {}),
      },
      select: userSelectFields,
    });
    return NextResponse.json(user);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Prevent self-deletion
  if (params.id === session.user.id) {
    return NextResponse.json(
      { error: "Não é possível excluir sua própria conta" },
      { status: 400 }
    );
  }

  if (!(await canManage(session.user.id, session.user.role, params.id))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    await db.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao excluir usuário" },
      { status: 500 }
    );
  }
}
