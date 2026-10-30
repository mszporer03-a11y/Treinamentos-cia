import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "FRANCHISEE"]).default("FRANCHISEE"),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9._-]{3,40}$/, "Login deve ter 3-40 caracteres (letras, números, ponto, hífen)")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(30).optional(),
  storeIds: z.array(z.string()).optional().default([]),
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

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const users = await db.user.findMany({
      select: userSelectFields,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = userSchema.parse(body);

    const { storeIds, username, phone, ...rest } = data;

    const existing = await db.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email já está em uso" },
        { status: 400 }
      );
    }
    if (username) {
      const taken = await db.user.findFirst({ where: { username: { equals: username, mode: "insensitive" } } });
      if (taken) {
        return NextResponse.json({ error: "Login já está em uso" }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await db.user.create({
      data: {
        ...rest,
        username: username || null,
        phone: phone || null,
        password: hashedPassword,
        stores: storeIds.length > 0 ? { create: storeIds.map((storeId) => ({ storeId })) } : undefined,
      },
      select: userSelectFields,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
