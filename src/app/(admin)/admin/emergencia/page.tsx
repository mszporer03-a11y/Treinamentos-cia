"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { ChevronDown, ChevronRight, Siren, User, Loader2, Search } from "lucide-react";
import { EmergencyChatPanel, type EmergencyChat } from "@/components/emergency/EmergencyChatPanel";
import { AttachmentPicker } from "@/components/attachments/AttachmentPicker";
import { useAttachmentUploader } from "@/components/attachments/useAttachmentUploader";

const DEFAULT_MESSAGE =
  "Notamos que sua solicitação necessita ser tratada de maneira mais específica, por isso entramos em contato através do chat emergencial para que possamos resolver.";

interface StoreRef {
  id: string;
  name: string;
  code: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "FRANCHISEE" | "MANAGER";
  active: boolean;
  stores?: { store: StoreRef }[];
}

interface Selection {
  user: UserRow;
  store: StoreRef | null;
}

const NO_STORE = "__sem_loja__";

export default function AdminEmergencyChatPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [openChats, setOpenChats] = useState<EmergencyChat[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Selection | null>(null);
  const [history, setHistory] = useState<EmergencyChat[] | null>(null);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const uploader = useAttachmentUploader("chatAttachment");

  const loadOpen = useCallback(async () => {
    const res = await fetch("/api/emergency?status=OPEN");
    if (res.ok) setOpenChats(await res.json());
  }, []);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data: UserRow[]) => {
        const franchisees = Array.isArray(data) ? data.filter((u) => u.role !== "ADMIN" && u.active) : [];
        setUsers(franchisees);
        // Link de notificação: /admin/emergencia?user=<id>
        const wanted = new URLSearchParams(window.location.search).get("user");
        const u = franchisees.find((f) => f.id === wanted);
        if (u) setSelected({ user: u, store: u.stores?.[0]?.store ?? null });
      });
    loadOpen();
    const id = setInterval(loadOpen, 10000);
    return () => clearInterval(id);
  }, [loadOpen]);

  // Árvore Lojas → usuários
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, { store: StoreRef | null; users: UserRow[] }>();
    for (const u of users) {
      const stores = u.stores?.length ? u.stores.map((s) => s.store) : [null];
      for (const store of stores) {
        const key = store?.id ?? NO_STORE;
        if (!map.has(key)) map.set(key, { store, users: [] });
        map.get(key)!.users.push(u);
      }
    }
    return Array.from(map.entries())
      .map(([key, g]) => ({
        key,
        ...g,
        users: g.users.filter(
          (u) => !q || u.name.toLowerCase().includes(q) || (g.store?.name ?? "").toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.users.length > 0)
      .sort((a, b) => (a.store?.name ?? "~").localeCompare(b.store?.name ?? "~"));
  }, [users, search]);

  const openByUser = useMemo(() => new Map(openChats.map((c) => [c.franchisee.id, c])), [openChats]);

  const loadHistory = useCallback(async (userId: string) => {
    setHistory(null);
    const res = await fetch(`/api/emergency?franchiseeId=${userId}`);
    setHistory(res.ok ? await res.json() : []);
  }, []);

  useEffect(() => {
    if (!selected) return;
    setMessage(DEFAULT_MESSAGE);
    setError("");
    uploader.reset();
    loadHistory(selected.user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.user.id, loadHistory]);

  async function startChat() {
    if (!selected || !message.trim() || uploader.busy) return;
    setStarting(true);
    setError("");
    const res = await fetch("/api/emergency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        franchiseeId: selected.user.id,
        storeId: selected.store?.id ?? null,
        message,
        attachments: uploader.attachments,
      }),
    });
    setStarting(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok && res.status !== 409) {
      setError(data.error ?? "Erro ao iniciar o chat");
      return;
    }
    uploader.reset();
    await Promise.all([loadHistory(selected.user.id), loadOpen()]);
  }

  const current = history?.[0] ?? null;
  const activeChat = current?.status === "OPEN" ? current : null;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Siren className="h-6 w-6 text-red-600" /> Chat Individual Emergencial
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Uso exclusivo da Franquia. Somente o administrador inicia e encerra a sessão; a loja só responde enquanto a
          sessão estiver aberta.
        </p>
      </div>

      <div className="flex flex-col md:flex-row border border-gray-200 rounded-2xl overflow-hidden bg-white md:h-[calc(100vh-200px)] min-h-[520px]">
        {/* Sidebar: lojas e usuários */}
        <aside className="md:w-80 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50 flex flex-col max-h-80 md:max-h-none">
          <div className="bg-red-700 text-white text-center font-semibold py-2.5 text-sm">Falar com &quot;Lojas&quot;</div>
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar loja ou usuário"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {groups.map((g) => {
              const isExpanded = expanded[g.key] ?? (!!search || g.users.some((u) => u.id === selected?.user.id));
              const openCount = g.users.filter((u) => openByUser.has(u.id)).length;
              return (
                <li key={g.key}>
                  <button
                    onClick={() => setExpanded((e) => ({ ...e, [g.key]: !isExpanded }))}
                    className="w-full flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-gray-800 border-b border-gray-100 hover:bg-gray-100 text-left"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="flex-1 truncate">{g.store?.name ?? "Sem loja vinculada"}</span>
                    {openCount > 0 && (
                      <span className="bg-red-600 text-white text-[10px] font-bold rounded-full px-1.5">{openCount}</span>
                    )}
                  </button>
                  {isExpanded &&
                    g.users.map((u) => {
                      const active = selected?.user.id === u.id && (selected.store?.id ?? NO_STORE) === g.key;
                      return (
                        <button
                          key={`${g.key}-${u.id}`}
                          onClick={() => setSelected({ user: u, store: g.store })}
                          className={`w-full flex items-center gap-2 pl-8 pr-3 py-2 text-sm border-b border-gray-100 text-left transition ${
                            active ? "bg-red-100" : "hover:bg-red-50"
                          }`}
                        >
                          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="flex-1 truncate">
                            {u.name}
                            <span className="text-[11px] text-gray-400"> ({u.role === "MANAGER" ? "Gerente" : "Franqueado"})</span>
                          </span>
                          {openByUser.has(u.id) && (
                            <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" title="Sessão aberta" />
                          )}
                        </button>
                      );
                    })}
                </li>
              );
            })}
            {groups.length === 0 && <li className="p-4 text-sm text-gray-400 text-center">Nenhum usuário encontrado</li>}
          </ul>
        </aside>

        {/* Conversa */}
        <section className="flex-1 flex flex-col min-h-[420px] min-w-0">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <Siren className="h-10 w-10 mb-3 text-gray-300" />
              <p className="text-sm">Selecione um usuário para iniciar ou acompanhar um chat emergencial.</p>
              {openChats.length > 0 && (
                <p className="text-xs mt-2 text-red-600">{openChats.length} sessão(ões) aberta(s) no momento</p>
              )}
            </div>
          ) : history === null ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : activeChat ? (
            <EmergencyChatPanel
              key={activeChat.id}
              chatId={activeChat.id}
              currentUserId={session?.user?.id ?? ""}
              isAdmin
              onChange={() => {
                loadHistory(selected.user.id);
                loadOpen();
              }}
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-5">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded mb-2">
                  <Siren className="h-3 w-3" /> NOVO CHAT EMERGENCIAL
                </span>
                <h2 className="font-bold text-gray-900">
                  {selected.user.name}
                  {selected.store ? <span className="font-normal text-gray-500"> · {selected.store.name}</span> : null}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Ao iniciar, o usuário recebe notificação push e e-mail com a mensagem abaixo.
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem inicial</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="mt-3">
                  <AttachmentPicker uploader={uploader} hint="Opcional — imagens, vídeos ou documentos" />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mt-3">{error}</p>}
                <button
                  onClick={startChat}
                  disabled={starting || uploader.busy || !message.trim()}
                  className="mt-4 w-full sm:w-auto px-5 py-2.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-semibold rounded-lg transition text-sm"
                >
                  {starting ? "Iniciando..." : "💬 Iniciar chat emergencial"}
                </button>
              </div>

              {current && (
                <div className="mt-8">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Última sessão</p>
                  <div className="h-80 border border-gray-200 rounded-xl overflow-hidden flex flex-col">
                    <EmergencyChatPanel
                      key={current.id}
                      chatId={current.id}
                      currentUserId={session?.user?.id ?? ""}
                      isAdmin
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
