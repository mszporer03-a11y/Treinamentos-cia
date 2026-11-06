import { db } from "@/lib/db";

// Franqueados ativos que devem receber um conteúdo.
// Sem lojas vinculadas → todos os franqueados ativos.
// Com lojas vinculadas → somente os usuários vinculados a essas lojas.
export async function getTargetFranchisees(storeIds: string[]) {
  return db.user.findMany({
    where: {
      role: "FRANCHISEE",
      active: true,
      ...(storeIds.length > 0 ? { stores: { some: { storeId: { in: storeIds } } } } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      stores: { include: { store: { select: { name: true, code: true } } } },
    },
    orderBy: { name: "asc" },
  });
}
