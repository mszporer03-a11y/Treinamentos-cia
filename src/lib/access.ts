import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type SessionUser = { id: string; role: string };

export const isAdmin = (u: SessionUser) => u.role === "ADMIN";

/** IDs das lojas vinculadas ao usuário. */
export async function userStoreIds(userId: string): Promise<string[]> {
  const rows = await db.userStore.findMany({ where: { userId }, select: { storeId: true } });
  return rows.map((r) => r.storeId);
}

export async function userHasStore(userId: string, storeId: string): Promise<boolean> {
  const row = await db.userStore.findUnique({ where: { userId_storeId: { userId, storeId } } });
  return !!row;
}

/** Filtro de materiais que o usuário pode ver (admin vê tudo). */
export async function materialVisibilityWhere(user: SessionUser): Promise<Prisma.MaterialWhereInput> {
  if (isAdmin(user)) return {};
  const storeIds = await userStoreIds(user.id);
  return {
    published: true,
    OR: [{ linkedStores: { none: {} } }, { linkedStores: { some: { storeId: { in: storeIds } } } }],
  };
}

/**
 * Conversas (solicitações/chat) são privadas: só a Franqueadora (admin)
 * e o próprio usuário que abriu o canal podem ler ou escrever.
 */
export async function canAccessConversation(user: SessionUser, conversationId: string) {
  const conv = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) return { conv: null, allowed: false } as const;
  return { conv, allowed: isAdmin(user) || conv.franchiseeId === user.id } as const;
}

const channelStoreSelect = { id: true, name: true, code: true } as const;

/** Busca ou cria o canal (usuário + loja). storeId null = canal geral. */
export async function getOrCreateChannel(franchiseeId: string, storeId: string | null) {
  if (storeId) {
    return db.conversation.upsert({
      where: { franchiseeId_storeId: { franchiseeId, storeId } },
      create: { franchiseeId, storeId },
      update: {},
      include: { store: { select: channelStoreSelect } },
    });
  }
  const existing = await db.conversation.findFirst({
    where: { franchiseeId, storeId: null },
    include: { store: { select: channelStoreSelect } },
  });
  return existing ?? db.conversation.create({ data: { franchiseeId }, include: { store: { select: channelStoreSelect } } });
}


/** Admin sempre; franqueado só se a loja do registro estiver vinculada a ele. */
export async function canAccessStoreRecord(user: SessionUser, storeId: string | null | undefined) {
  if (isAdmin(user)) return true;
  if (!storeId) return false;
  return userHasStore(user.id, storeId);
}
