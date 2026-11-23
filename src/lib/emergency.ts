import { db } from "@/lib/db";

export const emergencyChatInclude = {
  franchisee: { select: { id: true, name: true, email: true } },
  store: { select: { id: true, name: true, code: true } },
  openedBy: { select: { id: true, name: true } },
  closedBy: { select: { id: true, name: true } },
  _count: { select: { messages: true } },
} as const;

/** Admin vê qualquer sessão; o franqueado só as próprias. */
export async function getEmergencyChatFor(chatId: string, user: { id: string; role: string }) {
  const chat = await db.emergencyChat.findUnique({ where: { id: chatId } });
  if (!chat) return { chat: null, error: "Sessão não encontrada", status: 404 } as const;
  if (user.role !== "ADMIN" && chat.franchiseeId !== user.id) {
    return { chat: null, error: "Não autorizado", status: 403 } as const;
  }
  return { chat, error: null, status: 200 } as const;
}
