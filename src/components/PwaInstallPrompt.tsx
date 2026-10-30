"use client";

import { useState, useEffect } from "react";
import { X, Bell, Share } from "lucide-react";
import { registerPush, isIos, isStandalone } from "@/lib/push-client";

type State = "hidden" | "ios-install" | "notify-btn" | "notify-granted";

export function PwaInstallPrompt() {
  const [state, setState] = useState<State>("hidden");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed) return;

    const ios = isIos();
    const standalone = isStandalone();

    if (ios && !standalone) {
      setState("ios-install");
      return;
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    const perm = Notification.permission;
    if (perm === "granted") return; // already granted, nothing to show
    if (perm === "denied") return;  // user blocked, don't ask again

    setState("notify-btn");
  }, []);

  const dismiss = () => {
    localStorage.setItem("pwa-prompt-dismissed", "1");
    setState("hidden");
  };

  const activate = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      await registerPush();
      setState("notify-granted");
      setTimeout(() => setState("hidden"), 3000);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Não foi possível ativar as notificações.");
    } finally {
      setLoading(false);
    }
  };

  if (state === "hidden") return null;

  if (state === "notify-granted") {
    return (
      <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
        <Bell className="h-4 w-4" /> Notificações ativadas! ✓
      </div>
    );
  }

  if (state === "ios-install") {
    return (
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-50 bg-gray-900 text-white rounded-2xl shadow-xl p-4 flex gap-3 items-start">
        <Share className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-400" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Ative as notificações</p>
          <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
            No Safari, toque em <strong className="text-white">Compartilhar</strong>{" "}
            <Share className="inline h-3 w-3" /> e depois em{" "}
            <strong className="text-white">&quot;Adicionar à Tela Inicial&quot;</strong>.
            Assim você recebe alertas em tempo real.
          </p>
        </div>
        <button onClick={dismiss} className="text-gray-400 hover:text-white p-1 flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // notify-btn
  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-gray-900 text-white rounded-2xl shadow-xl p-4 flex gap-3 items-start">
      <Bell className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-400" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Ativar notificações</p>
        <p className="text-xs text-gray-300 mt-0.5">
          Receba alertas de novas solicitações, materiais e mensagens.
        </p>
        <button
          onClick={activate}
          disabled={loading}
          className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
        >
          {loading ? "Aguarde..." : "Ativar agora"}
        </button>
        {errorMsg && (
          <p className="mt-2 text-xs text-red-300 leading-snug">{errorMsg}</p>
        )}
      </div>
      <button onClick={dismiss} className="text-gray-400 hover:text-white p-1 flex-shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
