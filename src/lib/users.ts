import { db } from "@/lib/db";

export const userSelectFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  stores: { select: { store: { select: { id: true, name: true, code: true } } } },
} as const;

/** Quantidade de administradores ativos, opcionalmente desconsiderando um usuário. */
export function activeAdminCount(excludeId?: string) {
  return db.user.count({ where: { role: "ADMIN", active: true, ...(excludeId && { id: { not: excludeId } }) } });
}
