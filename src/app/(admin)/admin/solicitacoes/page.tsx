"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Inbox,
  Store,
  Tag,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Eye,
  Loader2,
  Send,
  X,
} from "lucide-react";

type StoreRef = { store: { id: string; name: string; code: string } };
type Franchisee = { id: string; name: string; email: string };

type Solicitacao = {
  id: string;
  category: string;
  content: string | null;
  requestStatus: "PENDING" | "SEEN" | "IN_PROGRESS" | "DONE" | null;
  createdAt: string;
  linkedStores: StoreRef[];
  sender: Franchisee;
  conversation: { id: string; franchisee: Franchisee };
  fileUrl?: string | null;
  fileName?: string | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  solicitacoes: "Solicitações",
  marketing: "Marketing",
  "senhas-usuarios": "Senhas e usuários",
  "suporte-sistema": "Suporte Sistema",
  outros: "Outros",
  Solicitacoes: "Solicitações",
  Marketing: "Marketing",
  SenhasUsuarios: "Senhas e usuários",
  SuporteSistema: "Suporte Sistema",
};

const CATEGORY_COLOR: Record<string, string> = {
  solicitacoes: "bg-blue-100 text-blue-700",
  marketing: "bg-purple-100 text-purple-700",
  "senhas-usuarios": "bg-orange-100 text-orange-700",
  "suporte-sistema": "bg-cyan-100 text-cyan-700",
  outros: "bg-gray-100 text-gray-600",
  Solicitacoes: "bg-blue-100 text-blue-700",
  Marketing: "bg-purple-100 text-purple-700",
  SenhasUsuarios: "bg-orange-100 text-orange-700",
  SuporteSistema: "bg-cyan-100 text-cyan-700",
};

const STATUS_CONFIG = {
  PENDING:     { label: "Pendente",   color: "bg-gray-100 text-gray-600",     dot: "bg-gray-400",   ring: "ring-gray-300" },
  SEEN:        { label: "Visto",      color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400", ring: "ring-yellow-300" },
  IN_PROGRESS: { label: "Em preparo", color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500",   ring: "ring-blue-300" },
  DONE:        { label: "Pronto",     color: "bg-green-100 text-green-700",   dot: "bg-green-500",  ring: "ring-green-300" },
};

export default function AdminSolicitacoesPage() {
  const [items, setItems] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [franchiseeFilter, setFranchiseeFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Expand + reply
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (franchiseeFilter !== "all") params.set("franchiseeId", franchiseeFilter);
    if (storeFilter !== "all") params.set("storeId", storeFilter);
    if (catFilter !== "all") params.set("category", catFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);

    const r = await fetch("/api/solicitacoes?" + params.toString());
    if (r.ok) setItems(await r.json());
    setLoading(false);
  }, [franchiseeFilter, storeFilter, catFilter, statusFilter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  async function updateStatus(id: string, status: string, reply?: string) {
    setUpdating(id);
    await fetch(`/api/solicitacoes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reply }),
    });
    setUpdating(null);
    setReplyTarget(null);
    setReplyText("");
    // Update locally
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, requestStatus: status as Solicitacao["requestStatus"] } : i
      )
    );
  }

  async function handleDone(id: string) {
    if (!replyText.trim()) return;
    setSendingReply(true);
    await updateStatus(id, "DONE", replyText);
    setSendingReply(false);
  }

  // Build filter options from data
  const franchisees = Array.from(
    new Map(items.map((i) => [i.conversation.franchisee.id, i.conversation.franchisee])).values()
  );
  const allStores = Array.from(
    new Map(items.flatMap((i) => i.linkedStores.map((ls) => [ls.store.id, ls.store]))).values()
  );
  const categories = Array.from(new Set(items.map((i) => i.category)));

  const counts = {
    PENDING: items.filter((i) => !i.requestStatus || i.requestStatus === "PENDING").length,
    SEEN: items.filter((i) => i.requestStatus === "SEEN").length,
    IN_PROGRESS: items.filter((i) => i.requestStatus === "IN_PROGRESS").length,
    DONE: items.filter((i) => i.requestStatus === "DONE").length,
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Inbox className="h-7 w-7 text-indigo-500" /> Acompanhamento de Solicitações
        </h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie e responda as solicitações dos franqueados.</p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG["PENDING"]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              statusFilter === key ? `${cfg.color} border-transparent ring-2 ${cfg.ring}` : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            {cfg.label}
            <span className="ml-0.5 font-bold">{counts[key as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={franchiseeFilter} onChange={(e) => setFranchiseeFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="all">Todos franqueados</option>
          {franchisees.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>

        {allStores.length > 0 && (
          <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="all">Todas as lojas</option>
            {allStores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

        {categories.length > 0 && (
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="all">Todas categorias</option>
            {categories.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c] ?? c}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Inbox className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma solicitação encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const status = item.requestStatus ?? "PENDING";
            const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
            const catLabel = CATEGORY_LABEL[item.category] ?? item.category;
            const catColor = CATEGORY_COLOR[item.category] ?? "bg-gray-100 text-gray-600";
            const isExpanded = expanded === item.id;
            const isUpdating = updating === item.id;
            const isReplyOpen = replyTarget === item.id;

            return (
              <div key={item.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Header row */}
                <button
                  className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition"
                  onClick={() => setExpanded(isExpanded ? null : item.id)}
                >
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${statusCfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-sm font-semibold text-gray-900">{item.conversation.franchisee.name}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${catColor}`}>
                        <Tag className="h-2.5 w-2.5" /> {catLabel}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    {item.content && (
                      <p className="text-sm text-gray-600 line-clamp-1 leading-snug">
                        {item.content.replace(/^\[.*?\]\n\n/, "")}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {item.linkedStores.map(({ store }) => (
                        <span key={store.id} className="flex items-center gap-1 text-xs text-gray-400">
                          <Store className="h-3 w-3" /> {store.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                              : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-50 space-y-4">
                    {/* Message content */}
                    {item.content && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {item.content.replace(/^\[.*?\]\n\n/, "")}
                      </p>
                    )}
                    {item.fileName && (
                      <a href={item.fileUrl ?? "#"} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline">
                        📎 {item.fileName}
                      </a>
                    )}

                    {/* Status actions */}
                    {status !== "DONE" && (
                      <div className="flex flex-wrap gap-2">
                        {status === "PENDING" && (
                          <button
                            onClick={() => updateStatus(item.id, "SEEN")}
                            disabled={isUpdating}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition disabled:opacity-50"
                          >
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                            Marcar como Visto
                          </button>
                        )}
                        {(status === "PENDING" || status === "SEEN") && (
                          <button
                            onClick={() => updateStatus(item.id, "IN_PROGRESS")}
                            disabled={isUpdating}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition disabled:opacity-50"
                          >
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Loader2 className="h-3 w-3" />}
                            Em Preparo
                          </button>
                        )}
                        <button
                          onClick={() => setReplyTarget(isReplyOpen ? null : item.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Marcar como Pronto
                        </button>
                      </div>
                    )}

                    {/* Already done badge */}
                    {status === "DONE" && (
                      <div className="flex items-center gap-2 text-green-700 text-xs font-semibold">
                        <CheckCircle2 className="h-4 w-4" /> Solicitação concluída
                      </div>
                    )}

                    {/* Reply box for DONE */}
                    {isReplyOpen && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-semibold text-green-800">Resposta ao franqueado (via chat):</p>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={3}
                          placeholder="Digite a resposta que será enviada pelo chat..."
                          className="w-full border border-green-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setReplyTarget(null); setReplyText(""); }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          >
                            <X className="h-3 w-3" /> Cancelar
                          </button>
                          <button
                            onClick={() => handleDone(item.id)}
                            disabled={sendingReply || !replyText.trim()}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl transition disabled:opacity-50"
                          >
                            {sendingReply ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                            Concluir e Enviar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Link to chat */}
                    <Link
                      href={`/admin/chat`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-1.5 transition hover:bg-indigo-50"
                    >
                      Abrir Chat com {item.conversation.franchisee.name} →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
