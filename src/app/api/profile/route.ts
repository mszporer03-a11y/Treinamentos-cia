import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const profileSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  email: z.string().email("E-mail inválido"),
  password: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .optional()
    .or(z.literal("")),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = profileSchema.parse(body);

    const updateData: Record<string, unknown> = {
      name: data.name,
      email: data.email,
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(user);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}
