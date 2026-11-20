"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import { MessageSquare, Search, Plus, X } from "lucide-react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useSession } from "next-auth/react";

interface StoreRef {
  store: { id: string; name: string; code: string };
}

interface Franchisee {
  id: string;
  name: string;
  email: string;
  stores: StoreRef[];
}

interface LastMessage {
  content: string | null;
  fileName: string | null;
  fileType: string | null;
  createdAt: string;
  senderId: string;
  readByAdmin: boolean;
}

interface PendingStore { id: string; name: string; code: string; }

interface ConversationItem {
  id: string;
  store: { id: string; name: string; code: string } | null;
  unreadCount: number;
  franchisee: Franchisee;
  lastMessage: LastMessage | null;
  updatedAt: string;
  pendingStores: PendingStore[];
}

export default function AdminChatPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selected, setSelected] = useState<ConversationItem | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // New-conversation picker state
  const [showPicker, setShowPicker] = useState(false);
  const [allFranchisees, setAllFranchisees] = useState<Franchisee[]>([]);
  const [pickerSearch, setPickerSearch] = useState("");
  const [creating, setCreating] = useState(false);

  // Use a ref so fetchConversations can read latest `selected` without being
  // re-created (and re-starting the polling interval) on every click.
  const selectedRef = useRef<ConversationItem | null>(null);
  selectedRef.current = selected;

  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (res.ok) {
      const data = await res.json();
      setConversations(data);
      // Keep the selected conversation up-to-date without the closure trap
      setSelected((prev) => {
        if (!prev) return prev;
        const updated = data.find((c: ConversationItem) => c.id === prev.id);
        return updated ?? prev;
      });
    }
    setLoading(false);
  }, []); // stable — no deps needed

  useEffect(() => {
    fetchConversations();
    const id = setInterval(fetchConversations, 5000);
    return () => clearInterval(id);
  }, [fetchConversations]);

  // Deep links: ?c=<conversa> (push) ou ?franchiseeId=..&storeId=.. (botão "Chat" da aba Lojas)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("c");
    const franchiseeId = params.get("franchiseeId");
    const storeId = params.get("storeId");
    if (franchiseeId) {
      fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ franchiseeId, storeId: storeId || undefined }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((conv: ConversationItem | null) => conv && setSelected(conv));
    } else if (c) {
      fetch("/api/conversations")
        .then((r) => r.json())
        .then((list: ConversationItem[]) => {
          const found = Array.isArray(list) ? list.find((x) => x.id === c) : null;
          if (found) setSelected(found);
        });
    }
  }, []);

  async function openPicker() {
    setPickerSearch("");
    setShowPicker(true);
    if (allFranchisees.length === 0) {
      const res = await fetch("/api/users");
      if (res.ok) {
        const users = await res.json();
        setAllFranchisees(
          users
            .filter((u: Franchisee & { role: string }) => u.role === "FRANCHISEE")
            .map((u: Franchisee) => ({ ...u, stores: u.stores ?? [] }))
        );
      }
    }
  }

  async function startConversation(franchisee: Franchisee, storeId?: string) {
    setCreating(true);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ franchiseeId: franchisee.id, storeId }),
    });
    if (res.ok) {
      const conv: ConversationItem = await res.json();
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conv.id);
        return exists ? prev : [conv, ...prev];
      });
      setSelected(conv);
    }
    setCreating(false);
    setShowPicker(false);
  }

  // Canais (loja + franqueado) ainda sem conversa
  const existingKeys = new Set(conversations.map((c) => `${c.franchisee.id}:${c.store?.id ?? ""}`));
  const q = pickerSearch.toLowerCase();
  const pickerOptions = allFranchisees
    .flatMap((f) =>
      f.stores.length > 0
        ? f.stores.map((s) => ({ franchisee: f, store: s.store }))
        : [{ franchisee: f, store: null as StoreRef["store"] | null }]
    )
    .filter((o) => !existingKeys.has(`${o.franchisee.id}:${o.store?.id ?? ""}`))
    .filter(
      (o) =>
        o.franchisee.name.toLowerCase().includes(q) ||
        o.franchisee.email.toLowerCase().includes(q) ||
        (o.store?.name.toLowerCase().includes(q) ?? false) ||
        (o.store?.code.toLowerCase().includes(q) ?? false)
    );

  const sq = search.toLowerCase();
  const filtered = conversations.filter(
    (c) =>
      c.franchisee.name.toLowerCase().includes(sq) ||
      c.franchisee.email.toLowerCase().includes(sq) ||
      (c.store?.name.toLowerCase().includes(sq) ?? false) ||
      (c.store?.code.toLowerCase().includes(sq) ?? false)
  );

  function getLastMessagePreview(lm: LastMessage | null): string {
    if (!lm) return "Nenhuma mensagem";
    if (lm.content) return lm.content.length > 40 ? lm.content.slice(0, 40) + "…" : lm.content;
    if (lm.fileName) return `📎 ${lm.fileName}`;
    return "Arquivo enviado";
  }

  return (
    <div className="flex h-[calc(100vh-56px)] md:h-screen overflow-hidden">
      {/* Left panel — conversation list */}
      <div
        className={`${
          selected ? "hidden md:flex" : "flex"
        } w-full md:w-80 lg:w-96 flex-col border-r border-gray-200 bg-white flex-shrink-0`}
      >
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">Chat</h1>
            <button
              onClick={openPicker}
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
              title="Nova conversa"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar loja ou franqueado..."
              className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* New-conversation picker */}
        {showPicker && (
          <div className="border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nova conversa</span>
              <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-3 pb-2">
              <input
                autoFocus
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Buscar loja ou franqueado..."
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {pickerOptions.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400">
                  {allFranchisees.length === 0 ? "Carregando…" : "Todos os canais já existem"}
                </p>
              ) : (
                pickerOptions.map((o) => (
                  <button
                    key={`${o.franchisee.id}:${o.store?.id ?? ""}`}
                    disabled={creating}
                    onClick={() => startConversation(o.franchisee, o.store?.id)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition flex items-center gap-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                      {(o.store?.name ?? o.franchisee.name)[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {o.store ? `🏪 ${o.store.name}` : o.franchisee.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {o.store ? `${o.franchisee.name} · ${o.franchisee.email}` : `${o.franchisee.email} · canal geral`}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Nenhuma conversa encontrada
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive = selected?.id === conv.id;
              const unread = conv.unreadCount > 0 && selected?.id !== conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelected(conv)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-100 ${
                    isActive ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center flex-shrink-0">
                      {(conv.store?.name ?? conv.franchisee.name)[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium text-gray-900 truncate ${unread ? "font-bold" : ""}`}>
                          {conv.store ? `🏪 ${conv.store.name}` : conv.franchisee.name}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                            {new Date(conv.lastMessage.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mb-0.5 truncate">
                        {conv.store ? `${conv.store.code} · ${conv.franchisee.name}` : "Canal geral"}
                      </p>
                      <p className={`text-xs truncate ${unread ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                        {getLastMessagePreview(conv.lastMessage)}
                      </p>
                    </div>
                    {unread && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5 flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel — chat window */}
      <div className={`${selected ? "flex" : "hidden md:flex"} flex-1 flex-col overflow-hidden`}>
        {selected ? (
          <div className="flex-1 overflow-hidden relative">
            {/* Back button for mobile */}
            <button
              className="md:hidden absolute top-3 left-3 z-10 p-1.5 bg-white rounded-lg shadow text-gray-500"
              onClick={() => setSelected(null)}
            >
              ←
            </button>
            <ChatWindow
              key={selected.id}
              conversationId={selected.id}
              currentUserId={session?.user?.id ?? ""}
              currentUserRole="ADMIN"
              recipientName={selected.store ? `${selected.store.name} (${selected.store.code})` : selected.franchisee.name}
              recipientSubtitle={selected.store ? `Canal exclusivo da loja · ${selected.franchisee.name}` : `Canal geral · ${selected.franchisee.email}`}
              availableStores={
                selected.store
                  ? []
                  : selected.franchisee.stores.map((s) => ({ id: s.store.id, name: s.store.name, code: s.store.code }))
              }
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Selecione uma conversa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
