"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, BellRing, CheckCircle2, XCircle, Loader2, Send, RefreshCw } from "lucide-react";
import { registerPush, isIos, isStandalone } from "@/lib/push-client";

interface Status {
  vapidConfigured: boolean;
  subscriptionCount: number;
}

export function PushNotificationSettings() {
  const [status, setStatus] = useState<Status | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [activating, setActivating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err" | "info"; text: string } | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/push/test");
      if (res.ok) setStatus(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setIos(isIos());
    setStandalone(isStandalone());
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
    loadStatus();
  }, [loadStatus]);

  async function handleActivate() {
    setActivating(true);
    setMsg(null);
    try {
      await registerPush();
      setPermission(Notification.permission);
      await loadStatus();
      setMsg({ type: "ok", text: "Aparelho inscrito! Agora envie uma notificação de teste." });
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Falha ao ativar." });
    } finally {
      setActivating(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json();
      await loadStatus();
      if (data.ok) {
        setMsg({ type: "ok", text: "Notificação de teste enviada! Verifique a tela do aparelho." });
      } else {
        setMsg({ type: "err", text: data.reason ?? "Não foi possível enviar o teste." });
      }
    } catch {
      setMsg({ type: "err", text: "Erro de conexão ao enviar o teste." });
    } finally {
      setTesting(false);
    }
  }

  const needsInstall = ios && !standalone;
  const subscribed = (status?.subscriptionCount ?? 0) > 0 && permission === "granted";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-6">
      <div className="flex items-center gap-2 mb-1">
        <BellRing className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-bold text-gray-900">Notificações push</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Receba avisos de mensagens, solicitações e novidades direto no aparelho.
      </p>

      {/* Diagnóstico */}
      <div className="space-y-2 mb-4 text-sm">
        <DiagRow
          ok={status?.vapidConfigured ?? false}
          label="Servidor configurado (VAPID)"
          failText="Não configurado — avise o administrador do sistema"
        />
        <DiagRow
          ok={permission === "granted"}
          label="Permissão concedida neste aparelho"
          failText={
            permission === "denied"
              ? "Bloqueada — libere nas configurações do aparelho/navegador"
              : "Ainda não concedida"
          }
        />
        {ios && (
          <DiagRow
            ok={standalone}
            label="App instalado na Tela de Início (necessário no iPhone)"
            failText="Toque em Compartilhar → Adicionar à Tela Inicial e abra por lá"
          />
        )}
        <DiagRow
          ok={subscribed}
          label={`Aparelho inscrito (${status?.subscriptionCount ?? 0} ${
            (status?.subscriptionCount ?? 0) === 1 ? "inscrição" : "inscrições"
          })`}
          failText="Este aparelho ainda não está inscrito"
        />
      </div>

      {needsInstall && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800">
          <strong>No iPhone</strong>, abra este site no Safari, toque em{" "}
          <strong>Compartilhar</strong> e depois em{" "}
          <strong>&quot;Adicionar à Tela Inicial&quot;</strong>. Abra o app pelo ícone criado e volte
          aqui para ativar.
        </div>
      )}

      {msg && (
        <div
          className={`rounded-xl px-4 py-2.5 mb-4 text-sm border ${
            msg.type === "ok"
              ? "bg-green-50 border-green-200 text-green-700"
              : msg.type === "err"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-blue-50 border-blue-200 text-blue-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleActivate}
          disabled={activating || needsInstall}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
        >
          {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          {subscribed ? "Reativar neste aparelho" : "Ativar notificações"}
        </button>
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-sm font-medium rounded-lg transition"
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Enviar notificação de teste
        </button>
        <button
          onClick={loadStatus}
          className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-gray-600 text-sm font-medium rounded-lg transition"
          title="Atualizar status"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DiagRow({ ok, label, failText }: { ok: boolean; label: string; failText: string }) {
  return (
    <div className="flex items-start gap-2">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
      )}
      <span className={ok ? "text-gray-700" : "text-gray-500"}>
        {label}
        {!ok && <span className="block text-xs text-red-500 mt-0.5">{failText}</span>}
      </span>
    </div>
  );
}
