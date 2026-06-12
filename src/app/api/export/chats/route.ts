import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  FRANCHISEE: "Franqueado",
  MANAGER: "Gerente",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  SEEN: "Vista",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
};

function csvField(value: string | null | undefined): string {
  if (!value) return "";
  return `"${value.replace(/"/g, '""')}"`;
}

// GET /api/export/chats?conversationId=...
// Admin only — exporta o histórico de chats/suporte em CSV (data e hora).
// Sem conversationId exporta todas as conversas.
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId") || undefined;

  const messages = await db.message.findMany({
    where: conversationId ? { conversationId } : {},
    include: {
      sender: { select: { name: true, role: true } },
      conversation: {
        select: {
          id: true,
          franchisee: { select: { name: true, email: true, role: true, phone: true } },
          admin: { select: { name: true } },
        },
      },
      linkedStores: { include: { store: { select: { name: true } } } },
    },
    orderBy: [{ conversationId: "asc" }, { createdAt: "asc" }],
  });

  const header = [
    "Data",
    "Hora",
    "Conversa com",
    "Tipo de conta",
    "Telefone",
    "Admin responsável",
    "Remetente",
    "Função do remetente",
    "Categoria",
    "Status da solicitação",
    "Mensagem",
    "Arquivo",
    "Lojas vinculadas",
    "Resposta do admin",
  ].join(";");

  const rows = messages.map((m) => {
    const d = new Date(m.createdAt);
    const date = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const time = d.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const user = m.conversation.franchisee;
    return [
      date,
      time,
      csvField(user.name),
      ROLE_LABEL[user.role] ?? user.role,
      csvField(user.phone),
      csvField(m.conversation.admin?.name ?? "Geral (histórico)"),
      csvField(m.sender.name),
      ROLE_LABEL[m.sender.role] ?? m.sender.role,
      csvField(m.category),
      m.requestStatus ? (STATUS_LABEL[m.requestStatus] ?? m.requestStatus) : "",
      csvField(m.content),
      csvField(m.fileName ?? m.fileUrl),
      csvField(m.linkedStores.map((ls) => ls.store.name).join(", ")),
      csvField(m.adminReplyContent),
    ].join(";");
  });

  // BOM para o Excel reconhecer UTF-8
  const csv = "﻿" + [header, ...rows].join("\r\n");

  const today = new Date().toISOString().slice(0, 10);
  const filename = conversationId
    ? `chat-${conversationId}-${today}.csv`
    : `historico-chats-${today}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
