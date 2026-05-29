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

interface AllStore { id: string; name: string; code: string; }

interface ConversationItem {
  id: string;
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
  const [allStores, setAllStores] = useState<AllStore[]>([]);

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
    // Fetch all stores once for the store picker
    fetch("/api/stores")
      .then((r) => r.json())
      .then((data) => setAllStores(Array.isArray(data) ? data.map((s: AllStore) => ({ id: s.id, name: s.name, code: s.code })) : []));
    return () => clearInterval(id);
  }, [fetchConversations]);

  async function openPicker() {
    setPickerSearch("");
    setShowPicker(true);
    if (allFranchisees.length === 0) {
      const res = await fetch("/api/users");
      if (res.ok) {
        const users = await res.json();
        setAllFranchisees(users.filter((u: Franchisee & { role: string }) => u.role === "FRANCHISEE"));
      }
    }
  }

  async function startConversation(franchisee: Franchisee) {
    setCreating(true);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ franchiseeId: franchisee.id }),
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

  // Franchisees that don't yet have a conversation shown in the list
  const franchiseesWithConv = new Set(conversations.map((c) => c.franchisee.id));
  const pickerFranchisees = allFranchisees.filter(
    (f) =>
      !franchiseesWithConv.has(f.id) &&
      (f.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        f.email.toLowerCase().includes(pickerSearch.toLowerCase()))
  );

  const filtered = conversations.filter(
    (c) =>
      c.franchisee.name.toLowerCase().includes(search.toLowerCase()) ||
      c.franchisee.email.toLowerCase().includes(search.toLowerCase()) ||
      c.franchisee.stores.some((s) =>
        s.store.name.toLowerCase().includes(search.toLowerCase())
      )
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
              placeholder="Buscar franqueado ou loja..."
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
                placeholder="Buscar franqueado..."
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {pickerFranchisees.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400">
                  {allFranchisees.length === 0 ? "Carregando…" : "Nenhum franqueado sem conversa"}
                </p>
              ) : (
                pickerFranchisees.map((f) => (
                  <button
                    key={f.id}
                    disabled={creating}
                    onClick={() => startConversation(f)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition flex items-center gap-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                      {f.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                      <p className="text-xs text-gray-400 truncate">{f.email}</p>
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
              const unread =
                conv.lastMessage &&
                !conv.lastMessage.readByAdmin &&
                conv.lastMessage.senderId !== session?.user?.id;

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
                      {conv.franchisee.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium text-gray-900 truncate ${unread ? "font-bold" : ""}`}>
                          {conv.franchisee.name}
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
                      {conv.pendingStores && conv.pendingStores.length > 0 ? (
                        <p className="text-[10px] text-emerald-600 mb-0.5 flex items-center gap-1 flex-wrap">
                          🏪 {conv.pendingStores.map((s) => s.name).join(", ")}
                        </p>
                      ) : conv.franchisee.stores.length > 0 ? (
                        <p className="text-[10px] text-gray-400 mb-0.5 truncate">
                          {conv.franchisee.stores.map((s) => s.store.name).join(", ")}
                        </p>
                      ) : null}
                      <p className={`text-xs truncate ${unread ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                        {getLastMessagePreview(conv.lastMessage)}
                      </p>
                    </div>
                    {unread && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-1 flex-shrink-0" />
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
              recipientName={selected.franchisee.name}
              availableStores={allStores}
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
