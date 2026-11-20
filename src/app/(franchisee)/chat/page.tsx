"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, Store, Lock } from "lucide-react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useSession } from "next-auth/react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface Channel {
  key: string; // storeId ou "geral"
  conversationId: string | null;
  store: { id: string; name: string; code: string } | null;
  unread: number;
}

export default function FranchiseeChatPage() {
  const { data: session } = useSession();
  const [channels, setChannels] = useState<Channel[] | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { permission, subscribe } = usePushNotifications();

  const loadChannels = useCallback(async () => {
    const res = await fetch("/api/conversations");
    const data = await res.json();
    const list: Channel[] = Array.isArray(data?.channels) ? data.channels : [];
    setChannels(list);
    return list;
  }, []);

  const openChannel = useCallback(async (key: string) => {
    setActiveKey(key);
    setConversationId(null);
    const res = await fetch(`/api/conversations?storeId=${encodeURIComponent(key)}`);
    if (res.ok) {
      const conv = await res.json();
      setConversationId(conv.id);
      setChannels((prev) => prev?.map((c) => (c.key === key ? { ...c, conversationId: conv.id, unread: 0 } : c)) ?? prev);
    }
  }, []);

  useEffect(() => {
    loadChannels().then((list) => {
      const fromUrl = new URLSearchParams(window.location.search).get("loja");
      const initial = list.find((c) => c.key === fromUrl) ?? list.find((c) => c.unread > 0) ?? list[0];
      if (initial) openChannel(initial.key);
    });
    const id = setInterval(loadChannels, 15000);
    return () => clearInterval(id);
  }, [loadChannels, openChannel]);

  const active = channels?.find((c) => c.key === activeKey);

  return (
    <div className="flex flex-col h-[calc(100vh-56px-64px)] md:h-screen">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/gallery" className="text-gray-400 hover:text-gray-700 transition">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 leading-tight">Suporte — Franqueadora</h1>
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Canal privado: só você e a Franqueadora veem estas mensagens
            </p>
          </div>
        </div>
        {permission !== "granted" && (
          <button onClick={subscribe} className="text-xs text-blue-600 hover:underline flex-shrink-0">
            Ativar notificações
          </button>
        )}
      </div>

      {/* Canais por loja */}
      {channels && channels.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 bg-white border-b border-gray-100">
          {channels.map((c) => (
            <button
              key={c.key}
              onClick={() => openChannel(c.key)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                c.key === activeKey ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              {c.store ? c.store.name : "Geral"}
              {c.unread > 0 && c.key !== activeKey && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {!conversationId ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            key={conversationId}
            conversationId={conversationId}
            currentUserId={session?.user?.id ?? ""}
            currentUserRole="FRANCHISEE"
            recipientName="Cia do Churrasco — Franqueadora"
            recipientSubtitle={active?.store ? `Canal exclusivo da loja ${active.store.name} (${active.store.code})` : "Canal geral"}
          />
        </div>
      )}
    </div>
  );
}
