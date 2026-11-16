"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronLeft, Loader2, Siren } from "lucide-react";
import { EmergencyChatPanel, type EmergencyChat } from "@/components/emergency/EmergencyChatPanel";

export default function FranchiseeEmergencyPage() {
  const { data: session } = useSession();
  const [chats, setChats] = useState<EmergencyChat[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/emergency");
    setChats(res.ok ? await res.json() : []);
  }, []);

  useEffect(() => {
    load();
    // Detecta quando a Franquia abre uma nova sessão
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  const current = chats?.[0] ?? null;

  return (
    <div className="flex flex-col h-[calc(100svh-56px-80px)] md:h-screen">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3 flex-shrink-0">
        <Link href="/gallery" className="text-gray-400 hover:text-gray-700 transition">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-bold text-gray-900 flex items-center gap-2">
          <Siren className="h-5 w-5 text-red-600" /> Chat Emergencial
        </h1>
      </div>

      {chats === null ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : !current ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <Siren className="h-12 w-12 text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">Nenhum chat emergencial ativo</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            Este canal é aberto somente pela Franquia em situações de emergência. Quando houver um contato, você será
            notificado e poderá responder aqui.
          </p>
          <Link href="/chat" className="mt-4 text-sm text-orange-600 font-medium hover:underline">
            Precisa falar com a Franquia? Use o Suporte →
          </Link>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <EmergencyChatPanel
            key={current.id}
            chatId={current.id}
            currentUserId={session?.user?.id ?? ""}
            isAdmin={false}
            onChange={load}
          />
        </div>
      )}
    </div>
  );
}
