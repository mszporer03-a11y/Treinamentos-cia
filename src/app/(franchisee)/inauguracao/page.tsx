"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronLeft, CheckSquare, CheckCircle2, Circle, Paperclip, UserRound } from "lucide-react";
import { MaterialViewer } from "@/components/franchisee/MaterialViewer";
import { postAttachments } from "@/lib/attachments";
import { AttachmentMosaic } from "@/components/attachments/AttachmentMosaic";
import { formatDate } from "@/lib/utils";

type Step = {
  id: string;
  title: string;
  description: string | null;
  phase: string;
  responsible: string | null;
  order: number;
  completedAt: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  attachments?: unknown;
};

type Onboarding = {
  id: string;
  isNewStore: boolean;
  completedAt: string | null;
  createdAt: string;
  store: { id: string; name: string; code: string };
  steps: Step[];
};

// Mesmos rótulos/cores da tela de Inauguração do admin
const PHASE_LABEL: Record<string, string> = { OBRAS: "Obras", EQUIPAMENTOS: "Equipamentos", TREINAMENTO: "Treinamento", APROVACAO: "Aprovação" };
const PHASE_COLOR: Record<string, string> = {
  OBRAS: "bg-orange-100 text-orange-700",
  EQUIPAMENTOS: "bg-blue-100 text-blue-700",
  TREINAMENTO: "bg-violet-100 text-violet-700",
  APROVACAO: "bg-green-100 text-green-700",
};

/** Inauguração da(s) loja(s) do franqueado — somente leitura (quem atualiza é a Franqueadora). */
export default function InauguracaoPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<Onboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Step | null>(null);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (!session?.user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link href="/gallery" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-5">
        <ChevronLeft className="h-4 w-4" /> Menu Principal
      </Link>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-sm">
          <CheckSquare className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inauguração da Loja</h1>
          <p className="text-sm text-gray-500">Acompanhe as etapas de abertura da sua loja</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma inauguração em andamento.</p>
          <p className="text-sm text-gray-400 mt-1">Quando a Franqueadora iniciar a abertura de uma loja sua, o acompanhamento aparecerá aqui.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {items.map((o) => {
            const done = o.steps.filter((s) => s.completedAt).length;
            const pct = o.steps.length > 0 ? Math.round((done / o.steps.length) * 100) : 0;
            return (
              <section key={o.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-gray-900">{o.store.name}</h2>
                    <span className="text-xs text-gray-400">({o.store.code})</span>
                    {o.isNewStore && <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full font-medium">Loja nova</span>}
                    {o.completedAt && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Concluída em {formatDate(o.completedAt)} ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Iniciada em {formatDate(o.createdAt)}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 shrink-0">{pct}%</span>
                    <span className="text-xs text-gray-500 shrink-0">{done}/{o.steps.length} etapas</span>
                  </div>
                </div>

                <ol className="p-4 space-y-2 bg-gray-50">
                  {o.steps.map((step) => {
                    const attachments = postAttachments(step);
                    return (
                      <li key={step.id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100">
                        {step.completedAt ? (
                          <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" aria-label="Concluída" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" aria-label="Pendente" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-medium text-sm ${step.completedAt ? "text-gray-500" : "text-gray-900"}`}>{step.title}</p>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${PHASE_COLOR[step.phase] ?? "bg-gray-100 text-gray-600"}`}>
                              {PHASE_LABEL[step.phase] ?? step.phase}
                            </span>
                            <span className={`text-xs font-medium ${step.completedAt ? "text-teal-600" : "text-amber-600"}`}>
                              {step.completedAt ? `Concluída em ${formatDate(step.completedAt)}` : "Pendente"}
                            </span>
                          </div>
                          {step.description && <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>}
                          {step.responsible && (
                            <p className="text-xs text-teal-700 mt-1 inline-flex items-center gap-1">
                              <UserRound className="h-3 w-3" /> Responsável: {step.responsible}
                            </p>
                          )}
                          {attachments.length > 0 && (
                            <div className="mt-2">
                              <div className="w-56 max-w-full">
                                <AttachmentMosaic variant="chat" attachments={attachments} onOpen={() => setViewing(step)} />
                              </div>
                              <button onClick={() => setViewing(step)} className="mt-1 text-xs text-teal-700 hover:underline inline-flex items-center gap-1">
                                <Paperclip className="h-3 w-3" /> {attachments.length > 1 ? `Ver ${attachments.length} anexos` : "Ver anexo"}
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      )}

      {viewing && (
        <MaterialViewer
          material={{
            id: viewing.id,
            title: viewing.title,
            body: viewing.description ?? "",
            fileUrl: viewing.fileUrl,
            fileName: viewing.fileName,
            fileType: "OTHER",
            attachments: postAttachments(viewing),
          }}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
