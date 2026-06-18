"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Inbox, Store, Tag, Clock, ChevronDown, ChevronUp, FileText, Image as ImageIcon } from "lucide-react";
import { useSession } from "next-auth/react";

type StoreRef = { store: { id: string; name: string; code: string } };

type Solicitacao = {
  id: string;
  category: string;
  content: string | null;
  requestStatus: "PENDING" | "SEEN" | "IN_PROGRESS" | "DONE" | null;
  createdAt: string;
  seenAt: string | null;
  inProgressAt: string | null;
  doneAt: string | null;
  adminReplyContent: string | null;
  adminReplyFileUrl: string | null;
  adminReplyFileName: string | null;
  adminReplyFileType: string | null;
  linkedStores: StoreRef[];
  conversation: { id: string };
  recipients?: string[];
  fileUrl?: string | null;
  fileName?: string | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  solicitacoes: "Solicitações (Geral)", marketing: "Mídia",
  "senhas-usuarios": "Senhas e usuários", "suporte-sistema": "Suporte Sistema",
  "conta-gerente": "Conta de gerente", outros: "Outros",
  Solicitacoes: "Solicitações (Geral)", Marketing: "Mídia",
  SenhasUsuarios: "Senhas e usuários", SuporteSistema: "Suporte Sistema",
};
const CATEGORY_COLOR: Record<string, string> = {
  solicitacoes: "bg-blue-100 text-blue-700", marketing: "bg-purple-100 text-purple-700",
  "senhas-usuarios": "bg-orange-100 text-orange-700", "suporte-sistema": "bg-cyan-100 text-cyan-700",
  "conta-gerente": "bg-violet-100 text-violet-700", outros: "bg-gray-100 text-gray-600",
  Solicitacoes: "bg-blue-100 text-blue-700", Marketing: "bg-purple-100 text-purple-700",
  SenhasUsuarios: "bg-orange-100 text-orange-700", SuporteSistema: "bg-cyan-100 text-cyan-700",
};
const STATUS_CONFIG = {
  PENDING:     { label: "Pendente",   color: "bg-gray-100 text-gray-600",     dot: "bg-gray-400" },
  SEEN:        { label: "Visto",      color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400" },
  IN_PROGRESS: { label: "Em preparo", color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500" },
  DONE:        { label: "Pronto",     color: "bg-green-100 text-green-700",   dot: "bg-green-500" },
};

function fmtDt(v: string | null | undefined) {
  if (!v) return null;
  return new Date(v).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

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

  const categories = Array.from(new Set(items.map((i) => i.category)));
  const allStores  = Array.from(new Map(items.flatMap((i) => i.linkedStores.map((ls) => [ls.store.id, ls.store]))).values());

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

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
        <span className="flex-shrink-0 mt-0.5">📬</span>
        <div>
          <p className="text-sm font-semibold text-indigo-900 mb-0.5">Acompanhe suas solicitações</p>
          <p className="text-sm text-indigo-700 leading-relaxed">
            Aqui você visualiza todas as solicitações enviadas para a Companhia do Churrasco e pode acompanhar
            o andamento de cada uma em tempo real.
          </p>
        </div>
      </div>

      {/* Filters */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="all">Todas categorias</option>
            {categories.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c] ?? c}</option>)}
          </select>
          {allStores.length > 0 && (
            <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="all">Todas as lojas</option>
              {allStores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
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
            const hasReply = item.adminReplyContent || item.adminReplyFileUrl;

            return (
              <div key={item.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <button
                  className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition"
                  onClick={() => setExpanded(isExpanded ? null : item.id)}
                >
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${statusCfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${catColor}`}>
                        <Tag className="h-2.5 w-2.5" /> {catLabel}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      {status === "DONE" && hasReply && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-600 text-white">
                          ✉️ Resposta disponível
                        </span>
                      )}
                    </div>
                    {item.content && (
                      <p className="text-sm text-gray-700 line-clamp-2 leading-snug">
                        {item.content.replace(/^\[.*?\]\n\n/, "")}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" /> {fmtDt(item.createdAt)}
                      </span>
                      {item.linkedStores.map(({ store }) => (
                        <span key={store.id} className="flex items-center gap-1 text-xs text-gray-400">
                          <Store className="h-3 w-3" /> {store.name}
                        </span>
                      ))}
                      {item.recipients && item.recipients.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          📨 {item.recipients.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                    : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-50 space-y-4">
                    {/* Original message */}
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

                    {/* Timeline */}
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Andamento</p>
                      <div className="space-y-2">
                        <StepRow done icon="📤" label="Enviada"    time={fmtDt(item.createdAt)} />
                        <StepRow done={!!item.seenAt}        icon="👁️"  label="Vista"       time={fmtDt(item.seenAt)} />
                        <StepRow done={!!item.inProgressAt}  icon="🔧"  label="Em preparo"  time={fmtDt(item.inProgressAt)} />
                        <StepRow done={!!item.doneAt}        icon="✅"  label="Concluída"   time={fmtDt(item.doneAt)} />
                      </div>
                    </div>

                    {/* Admin reply */}
                    {status === "DONE" && hasReply && (
                      <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-3">
                        <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wide mb-2">Resposta da equipe</p>
                        {item.adminReplyContent && (
                          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed mb-2">
                            {item.adminReplyContent}
                          </p>
                        )}
                        {item.adminReplyFileUrl && (
                          <a href={item.adminReplyFileUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-green-200 rounded-xl text-xs text-green-700 hover:bg-green-50 transition">
                            {item.adminReplyFileType === "image"
                              ? <ImageIcon className="h-3.5 w-3.5" />
                              : <FileText className="h-3.5 w-3.5" />}
                            {item.adminReplyFileName ?? "Arquivo"}
                          </a>
                        )}
                      </div>
                    )}

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

function StepRow({ done, icon, label, time }: { done: boolean; icon: string; label: string; time: string | null }) {
  return (
    <div className={`flex items-center gap-2 ${done ? "" : "opacity-30"}`}>
      <span className="text-sm leading-none">{icon}</span>
      <span className={`text-xs font-medium ${done ? "text-gray-700" : "text-gray-400"}`}>{label}</span>
      {time ? (
        <span className="text-xs text-gray-400 ml-auto">{time}</span>
      ) : (
        <span className="text-xs text-gray-300 ml-auto italic">pendente</span>
      )}
    </div>
  );
}
