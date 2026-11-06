"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useSession } from "next-auth/react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function FranchiseeChatPage() {
  const { data: session } = useSession();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [myStores, setMyStores] = useState<{ id: string; name: string; code: string }[]>([]);
  const { permission, subscribe } = usePushNotifications();

  useEffect(() => {
    // Estado da sessão emergencial (aberta/encerrada pelo admin) — atualizado periodicamente
    const loadConversation = () =>
      fetch("/api/conversations")
        .then((r) => r.json())
        .then((data) => {
          setConversationId(data.id);
          setSessionOpen(!!data.isOpen);
        })
        .catch(() => {});
    loadConversation();
    const id = setInterval(loadConversation, 5000);
    fetch("/api/stores")
      .then((r) => r.json())
      .then((data) => setMyStores(Array.isArray(data) ? data.map((s: { id: string; name: string; code: string }) => ({ id: s.id, name: s.name, code: s.code })) : []));
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-screen">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/gallery" className="text-gray-400 hover:text-gray-700 transition">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900">Chat Emergencial</h1>
            <p className="text-[11px] text-gray-400">Contato individual iniciado pela Franquia</p>
          </div>
        </div>
        {permission !== "granted" && (
          <button
            onClick={subscribe}
            className="text-xs text-blue-600 hover:underline"
          >
            Ativar notificações
          </button>
        )}
      </div>

      {!conversationId ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            conversationId={conversationId}
            currentUserId={session?.user?.id ?? ""}
            currentUserRole="FRANCHISEE"
            recipientName="Franquia Companhia do Churrasco"
            availableStores={myStores}
            sessionOpen={sessionOpen}
          />
        </div>
      )}
    </div>
  );
}
