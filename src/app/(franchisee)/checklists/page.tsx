"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ClipboardList, Check, ChevronDown, ChevronLeft, ChevronUp, Store, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface ChecklistItemData {
  id: string;
  text: string;
  order: number;
}

interface ChecklistSection {
  id: string;
  name: string;
  order: number;
  items: ChecklistItemData[];
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  sections: ChecklistSection[];
}

interface StoreOption {
  id: string;
  name: string;
  code: string;
}

interface ItemAnswer {
  itemId: string;
  checked: boolean;
  notes: string;
}

interface ResponseSummary {
  id: string;
  createdAt: string;
  completedAt: string | null;
  template: { name: string };
  store: { name: string; code: string };
  notes: string | null;
  items: { checked: boolean }[];
}

export default function FranchiseeChecklistsPage() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [myStores, setMyStores] = useState<StoreOption[]>([]);
  const [responses, setResponses] = useState<ResponseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Fill form state
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [selectedStore, setSelectedStore] = useState("");
  const [answers, setAnswers] = useState<ItemAnswer[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Expand responses
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [tRes, sRes, rRes] = await Promise.all([
      fetch("/api/checklists/templates"),
      fetch("/api/stores"),
      fetch("/api/checklists/responses"),
    ]);
    if (tRes.ok) setTemplates(await tRes.json());
    if (sRes.ok) setMyStores(await sRes.json());
    if (rRes.ok) setResponses(await rRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openTemplate(t: Template) {
    setActiveTemplate(t);
    setSelectedStore(myStores[0]?.id ?? "");
    setAnswers(
      t.sections.flatMap((s) => s.items.map((item) => ({ itemId: item.id, checked: false, notes: "" })))
    );
    setNotes("");
    setSubmitted(false);
  }

  function toggleItem(itemId: string) {
    setAnswers((prev) =>
      prev.map((a) => (a.itemId === itemId ? { ...a, checked: !a.checked } : a))
    );
  }

  async function submitChecklist() {
    if (!activeTemplate || !selectedStore) return;
    setSubmitting(true);
    const res = await fetch("/api/checklists/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: activeTemplate.id,
        storeId: selectedStore,
        notes,
        items: answers,
      }),
    });
    if (res.ok) {
      setSubmitted(true);
      await loadData();
    }
    setSubmitting(false);
  }

  if (!session?.user) return null;

  const checkedCount = answers.filter((a) => a.checked).length;
  const totalItems = answers.length;
  const pct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/gallery" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-5">
        <ChevronLeft className="h-4 w-4" /> Voltar ao início
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="h-7 w-7 text-orange-500" /> Checklists
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Preencha os checklists atribuídos às suas lojas</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : activeTemplate ? (
        /* ── Fill checklist ── */
        <div>
          <button
            onClick={() => setActiveTemplate(null)}
            className="text-sm text-gray-500 hover:text-gray-800 mb-4 flex items-center gap-1"
          >
            ← Voltar
          </button>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <p className="text-lg font-bold text-green-800">Checklist enviado!</p>
              <p className="text-sm text-green-600 mt-1">{checkedCount} de {totalItems} itens concluídos</p>
              <button
                onClick={() => setActiveTemplate(null)}
                className="mt-5 px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition"
              >
                Ver outros checklists
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 bg-orange-50">
                <h2 className="text-lg font-bold text-gray-900">{activeTemplate.name}</h2>
                {activeTemplate.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{activeTemplate.description}</p>
                )}
                {/* Store selector */}
                {myStores.length > 1 && (
                  <div className="mt-3 flex items-center gap-2">
                    <Store className="h-4 w-4 text-gray-400" />
                    <select
                      value={selectedStore}
                      onChange={(e) => setSelectedStore(e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {myStores.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Progress */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{checkedCount} de {totalItems} itens</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-50">
                {activeTemplate.sections.map((sec) => (
                  <div key={sec.id} className="px-6 py-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{sec.name}</p>
                    <div className="space-y-2">
                      {sec.items.map((item) => {
                        const ans = answers.find((a) => a.itemId === item.id);
                        const checked = ans?.checked ?? false;
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition ${
                              checked ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-transparent hover:border-gray-200"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition ${
                              checked ? "bg-green-500 border-green-500" : "border-gray-300"
                            }`}>
                              {checked && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className={`text-sm leading-snug ${checked ? "text-green-800 line-through" : "text-gray-700"}`}>
                              {item.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="Comentários gerais..."
                />
                <button
                  onClick={submitChecklist}
                  disabled={submitting || !selectedStore}
                  className="mt-3 w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition"
                >
                  {submitting ? "Enviando..." : "Enviar Checklist"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Template list + responses ── */
        <>
          {templates.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-200" />
              <p>Nenhum checklist disponível no momento.</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Disponíveis</p>
              <div className="space-y-3 mb-8">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openTemplate(t)}
                    className="w-full bg-white border border-gray-100 hover:border-orange-200 hover:bg-orange-50 rounded-xl px-5 py-4 text-left transition shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition">
                        <ClipboardList className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{t.name}</p>
                        {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t.sections.reduce((a, s) => a + s.items.length, 0)} itens
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {responses.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Histórico</p>
              <div className="space-y-2">
                {responses.map((r) => {
                  const total = r.items.length;
                  const checked = r.items.filter((i) => i.checked).length;
                  const pctR = total > 0 ? Math.round((checked / total) * 100) : 0;
                  return (
                    <div key={r.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"
                        onClick={() => setExpandedResponse(expandedResponse === r.id ? null : r.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{r.template.name}</p>
                          <p className="text-xs text-gray-400">{r.store.name} · {new Date(r.createdAt).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-sm font-bold ${pctR === 100 ? "text-green-600" : "text-orange-600"}`}>{pctR}%</span>
                          {expandedResponse === r.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                        </div>
                      </button>
                      {expandedResponse === r.id && (
                        <div className="px-4 pb-3 border-t border-gray-50">
                          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pctR}%` }} />
                          </div>
                          <p className="text-xs text-gray-500">{checked} de {total} itens concluídos</p>
                          {r.notes && <p className="text-xs text-gray-500 mt-1 italic">{r.notes}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
