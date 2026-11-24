import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ACTIVE_STORE_COOKIE,
  ACTIVE_STORE_COOKIE_OPTIONS,
  getUserStores,
  resolveActiveStore,
} from "@/lib/active-store";

export const dynamic = "force-dynamic";

// GET /api/active-store → { stores, activeStoreId, needsSelection }
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { stores, active, needsSelection } = await resolveActiveStore(session.user.id);
  return NextResponse.json({ stores, activeStoreId: active?.id ?? null, needsSelection });
}

const bodySchema = z.object({ storeId: z.string().min(1) });

// POST /api/active-store { storeId } → define a loja ativa
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Loja inválida" }, { status: 400 });

  const stores = await getUserStores(session.user.id);
  const store = stores.find((s) => s.id === parsed.data.storeId);
  if (!store) return NextResponse.json({ error: "Você não tem acesso a esta loja" }, { status: 403 });

  const res = NextResponse.json({ ok: true, store });
  res.cookies.set(ACTIVE_STORE_COOKIE, store.id, ACTIVE_STORE_COOKIE_OPTIONS);
  return res;
}

// DELETE /api/active-store → limpa a escolha (usado no login e ao sair)
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACTIVE_STORE_COOKIE, "", { ...ACTIVE_STORE_COOKIE_OPTIONS, maxAge: 0 });
  return res;
}
