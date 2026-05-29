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
  const { permission, subscribe } = usePushNotifications();

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => setConversationId(data.id));
  }, []);

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 64px)" }}>
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/gallery" className="text-gray-400 hover:text-gray-700 transition">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-bold text-gray-900">Chat com Admin</h1>
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
            recipientName="Admin"
          />
        </div>
      )}
    </div>
  );
}
