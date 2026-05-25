import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ userId: z.string().cuid() });

// POST /api/stores/[id]/users — associar franqueado à loja
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { userId } = schema.parse(body);

  await db.userStore.upsert({
    where: { userId_storeId: { userId, storeId: params.id } },
    create: { userId, storeId: params.id },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/stores/[id]/users — remover franqueado da loja
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

  await db.userStore.delete({
    where: { userId_storeId: { userId, storeId: params.id } },
  });

  return NextResponse.json({ ok: true });
}
