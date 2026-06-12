"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, MessageSquare, History } from "lucide-react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useSession } from "next-auth/react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

interface ConversationItem {
  id: string;
  admin: AdminUser | null;
  isLegacy: boolean;
  lastMessage: {
    content: string | null;
    fileName: string | null;
    createdAt: string;
    senderId: string;
    readByFranchisee: boolean;
  } | null;
  updatedAt: string;
}

export default function FranchiseeChatPage() {
  const { data: session } = useSession();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selected, setSelected] = useState<ConversationItem | null>(null);
  const [myStores, setMyStores] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);
  const { permission, subscribe } = usePushNotifications();

  const refresh = useCallback(async () => {
    const [adminsRes, convRes] = await Promise.all([
      fetch("/api/admins"),
      fetch("/api/conversations"),
    ]);
    if (adminsRes.ok) setAdmins(await adminsRes.json());
    if (convRes.ok) {
      const data = await convRes.json();
      if (Array.isArray(data)) setConversations(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    fetch("/api/stores")
      .then((r) => r.json())
      .then((data) =>
        setMyStores(
          Array.isArray(data)
            ? data.map((s: { id: string; name: string; code: string }) => ({ id: s.id, name: s.name, code: s.code }))
            : []
        )
      );
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [refresh]);

  async function openAdminChat(admin: AdminUser) {
    const existing = conversations.find((c) => c.admin?.id === admin.id);
    if (existing) {
      setSelected(existing);
      return;
    }
    setOpening(admin.id);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId: admin.id }),
    });
    if (res.ok) {
      const conv: ConversationItem = await res.json();
      setConversations((prev) => [conv, ...prev]);
      setSelected(conv);
    }
    setOpening(null);
  }

  function preview(c: ConversationItem | undefined): string {
    const lm = c?.lastMessage;
    if (!lm) return "Iniciar conversa";
    if (lm.content) return lm.content.length > 48 ? lm.content.slice(0, 48) + "…" : lm.content;
    if (lm.fileName) return `📎 ${lm.fileName}`;
    return "Arquivo enviado";
  }

  const legacy = conversations.find((c) => c.isLegacy && c.lastMessage);

  // ── Chat aberto ─────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="flex flex-col h-[calc(100vh-56px)] md:h-screen">
        <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3">
          <button
            onClick={() => { setSelected(null); refresh(); }}
            className="text-gray-400 hover:text-gray-700 transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="font-bold text-gray-900">
            {selected.isLegacy ? "Histórico (antigo)" : `Chat com ${selected.admin?.name ?? "Admin"}`}
          </h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            conversationId={selected.id}
            currentUserId={session?.user?.id ?? ""}
            currentUserRole="FRANCHISEE"
            recipientName={selected.admin?.name ?? "Equipe"}
            recipientRole="ADMIN"
            availableStores={myStores}
            readOnly={selected.isLegacy}
          />
        </div>
      </div>
    );
  }

  // ── Lista de admins ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-screen">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/gallery" className="text-gray-400 hover:text-gray-700 transition">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-bold text-gray-900">Suporte</h1>
        </div>
        {permission !== "granted" && (
          <button onClick={subscribe} className="text-xs text-blue-600 hover:underline">
            Ativar notificações
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="max-w-xl mx-auto space-y-3">
            <p className="text-sm text-gray-500 mb-1">
              Escolha um administrador para conversar:
            </p>
            {admins.map((admin) => {
              const conv = conversations.find((c) => c.admin?.id === admin.id);
              const unread =
                conv?.lastMessage &&
                !conv.lastMessage.readByFranchisee &&
                conv.lastMessage.senderId !== session?.user?.id;
              return (
                <button
                  key={admin.id}
                  onClick={() => openAdminChat(admin)}
                  disabled={opening !== null}
                  className="w-full bg-white rounded-2xl border border-gray-100 hover:border-orange-300 hover:shadow-md transition p-4 flex items-center gap-3 text-left"
                >
                  <div className="w-11 h-11 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center flex-shrink-0">
                    {opening === admin.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      admin.name[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm text-gray-900 truncate ${unread ? "font-bold" : "font-semibold"}`}>
                      {admin.name}
                    </p>
                    <p className={`text-xs truncate ${unread ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                      {preview(conv)}
                    </p>
                  </div>
                  {unread && <div className="w-2.5 h-2.5 rounded-full bg-orange-600 flex-shrink-0" />}
                  <MessageSquare className="h-4 w-4 text-gray-300 flex-shrink-0" />
                </button>
              );
            })}
            {admins.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-10">
                Nenhum administrador disponível.
              </p>
            )}

            {legacy && (
              <button
                onClick={() => setSelected(legacy)}
                className="w-full bg-gray-50 rounded-2xl border border-gray-200 hover:border-gray-300 transition p-4 flex items-center gap-3 text-left"
              >
                <div className="w-11 h-11 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center flex-shrink-0">
                  <History className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700">Histórico (antigo)</p>
                  <p className="text-xs text-gray-500 truncate">
                    Conversas anteriores à separação por administrador
                  </p>
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
