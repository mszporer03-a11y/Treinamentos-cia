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
  role: z.enum(["ADMIN", "FRANCHISEE"]).optional(),
  active: z.boolean().optional(),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9._-]{3,40}$/, "Login deve ter 3-40 caracteres (letras, números, ponto, hífen)")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(30).optional(),
  storeIds: z.array(z.string()).optional(),
});

const userSelectFields = {
  id: true,
  name: true,
  email: true,
  username: true,
  phone: true,
  role: true,
  active: true,
  createdAt: true,
  stores: { select: { store: { select: { id: true, name: true, code: true } } } },
};

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

    const { storeIds, username, phone, ...rest } = data;
    const updateData: Record<string, unknown> = { ...rest };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }
    if (username !== undefined) {
      if (username) {
        const taken = await db.user.findFirst({
          where: { username: { equals: username, mode: "insensitive" }, NOT: { id: params.id } },
        });
        if (taken) {
          return NextResponse.json({ error: "Login já está em uso" }, { status: 400 });
        }
      }
      updateData.username = username || null;
    }
    if (phone !== undefined) updateData.phone = phone || null;
    if (storeIds) {
      updateData.stores = {
        deleteMany: {},
        create: storeIds.map((storeId) => ({ storeId })),
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
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Prevent self-deletion
  if (params.id === session.user.id) {
    return NextResponse.json(
      { error: "Não é possível excluir sua própria conta" },
      { status: 400 }
    );
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
