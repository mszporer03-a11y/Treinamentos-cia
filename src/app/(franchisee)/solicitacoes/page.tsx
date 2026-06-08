"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Inbox, Store, Tag, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useSession } from "next-auth/react";

type StoreRef = { store: { id: string; name: string; code: string } };

type Solicitacao = {
  id: string;
  category: string;
  content: string | null;
  requestStatus: "PENDING" | "SEEN" | "IN_PROGRESS" | "DONE" | null;
  createdAt: string;
  linkedStores: StoreRef[];
  conversation: { id: string };
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
  PENDING: { label: "Pendente", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  SEEN:    { label: "Visto",    color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400" },
  IN_PROGRESS: { label: "Em preparo", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  DONE:    { label: "Pronto",   color: "bg-green-100 text-green-700", dot: "bg-green-500" },
};

export default function SolicitacoesPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/solicitacoes")
      .then((r) => r.json())
      .then((d) => { setItems(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  if (!session?.user) return null;

  // Build filter options
  const categories = Array.from(new Set(items.map((i) => i.category)));
  const allStores = Array.from(
    new Map(
      items.flatMap((i) => i.linkedStores.map((ls) => [ls.store.id, ls.store]))
    ).values()
  );

  const filtered = items.filter((i) => {
    if (catFilter !== "all" && i.category !== catFilter) return false;
    if (storeFilter !== "all" && !i.linkedStores.some((ls) => ls.store.id === storeFilter)) return false;
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/gallery" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-5">
        <ChevronLeft className="h-4 w-4" /> Voltar ao início
      </Link>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Inbox className="h-7 w-7 text-indigo-500" /> Minhas Solicitações
        </h1>
      </div>

      {/* Info box */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
        <span className="flex-shrink-0 mt-0.5">📬</span>
        <div>
          <p className="text-sm font-semibold text-indigo-900 mb-0.5">Acompanhe suas solicitações</p>
          <p className="text-sm text-indigo-700 leading-relaxed">
            Aqui você visualiza todas as solicitações enviadas para a Companhia do Churrasco e pode acompanhar
            o andamento de cada uma delas em tempo real.
          </p>
        </div>
      </div>

      {/* Filters */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Category filter */}
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">Todas categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABEL[c] ?? c}</option>
            ))}
          </select>

          {/* Store filter */}
          {allStores.length > 0 && (
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">Todas as lojas</option>
              {allStores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Inbox className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma solicitação encontrada.</p>
          <p className="text-sm mt-1">Use o menu <strong>Solicitações Rápidas</strong> para enviar uma.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const status = item.requestStatus ?? "PENDING";
            const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
            const catLabel = CATEGORY_LABEL[item.category] ?? item.category;
            const catColor = CATEGORY_COLOR[item.category] ?? "bg-gray-100 text-gray-600";
            const isExpanded = expanded === item.id;

            return (
              <div key={item.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <button
                  className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition"
                  onClick={() => setExpanded(isExpanded ? null : item.id)}
                >
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${statusCfg.dot}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${catColor}`}>
                        <Tag className="h-2.5 w-2.5" />
                        {catLabel}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    {item.content && (
                      <p className="text-sm text-gray-700 line-clamp-2 leading-snug">
                        {item.content.replace(/^\[.*?\]\n\n/, "")}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      {item.linkedStores.map(({ store }) => (
                        <span key={store.id} className="flex items-center gap-1 text-xs text-gray-400">
                          <Store className="h-3 w-3" />
                          {store.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                    : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                  }
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-50">
                    {item.content && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-3">
                        {item.content.replace(/^\[.*?\]\n\n/, "")}
                      </p>
                    )}
                    {item.fileName && (
                      <a
                        href={item.fileUrl ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline mb-3"
                      >
                        📎 {item.fileName}
                      </a>
                    )}
                    <Link
                      href="/chat"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-1.5 transition hover:bg-indigo-50"
                    >
                      Ver no Chat →
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
