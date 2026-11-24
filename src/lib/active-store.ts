import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * Loja ativa do franqueado/gerente.
 *
 * Usuários vinculados a mais de uma loja escolhem, após o login, em qual loja
 * vão trabalhar. A escolha fica num cookie e pode ser trocada a qualquer
 * momento pelo seletor de loja do portal. O cookie é sempre validado contra os
 * vínculos do usuário — nunca dá acesso a uma loja que não é dele.
 */
export const ACTIVE_STORE_COOKIE = "cia_store";

export const ACTIVE_STORE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 365,
};

export type UserStoreOption = { id: string; name: string; code: string; city: string | null };

/** Lojas vinculadas ao usuário, em ordem alfabética. */
export async function getUserStores(userId: string): Promise<UserStoreOption[]> {
  const rows = await db.userStore.findMany({
    where: { userId },
    select: { store: { select: { id: true, name: true, code: true, city: true } } },
    orderBy: { store: { name: "asc" } },
  });
  return rows.map((r) => r.store);
}

/** ID da loja gravada no cookie (sem validação). */
export function readActiveStoreCookie(): string | null {
  return cookies().get(ACTIVE_STORE_COOKIE)?.value || null;
}

/**
 * Resolve a loja ativa do usuário:
 * - cookie válido (loja vinculada ao usuário) → essa loja;
 * - usuário com uma única loja → essa loja;
 * - caso contrário → null (precisa escolher).
 */
export async function resolveActiveStore(userId: string) {
  const stores = await getUserStores(userId);
  const cookieId = readActiveStoreCookie();
  const fromCookie = cookieId ? stores.find((s) => s.id === cookieId) : undefined;
  const active = fromCookie ?? (stores.length === 1 ? stores[0] : null);
  return { stores, active, needsSelection: stores.length > 1 && !active };
}

/**
 * IDs de loja usados para filtrar o conteúdo do franqueado/gerente.
 * Com loja ativa → apenas ela; sem escolha → todas as lojas do usuário.
 */
export async function getScopedStoreIds(userId: string): Promise<string[]> {
  const stores = await getUserStores(userId);
  const cookieId = readActiveStoreCookie();
  if (cookieId && stores.some((s) => s.id === cookieId)) return [cookieId];
  return stores.map((s) => s.id);
}

/** Loja ativa escolhida explicitamente (cookie válido) ou null. */
export async function getActiveStoreIdFor(userId: string): Promise<string | null> {
  const cookieId = readActiveStoreCookie();
  if (!cookieId) return null;
  const link = await db.userStore.findUnique({
    where: { userId_storeId: { userId, storeId: cookieId } },
    select: { storeId: true },
  });
  return link?.storeId ?? null;
}
