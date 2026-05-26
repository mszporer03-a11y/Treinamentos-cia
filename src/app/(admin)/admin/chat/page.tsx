"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import { MessageSquare, Search } from "lucide-react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useSession } from "next-auth/react";

interface StoreRef {
  store: { name: string; code: string };
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

interface ConversationItem {
  id: string;
  franchisee: Franchisee;
  lastMessage: LastMessage | null;
  updatedAt: string;
}

export default function AdminChatPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selected, setSelected] = useState<ConversationItem | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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
          <h1 className="text-lg font-bold text-gray-900 mb-3">Chat</h1>
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
                      {conv.franchisee.stores.length > 0 && (
                        <p className="text-[10px] text-blue-600 mb-0.5">
                          {conv.franchisee.stores.map((s) => s.store.name).join(", ")}
                        </p>
                      )}
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
