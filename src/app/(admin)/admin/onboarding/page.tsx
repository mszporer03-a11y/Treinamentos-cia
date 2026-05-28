"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CheckSquare, Plus, X, CheckCircle2, Circle } from "lucide-react";

type Store = { id: string; name: string; code: string };
type Step = { id: string; title: string; description: string | null; phase: string; responsible: string | null; order: number; completedAt: string | null };
type Onboarding = {
  id: string;
  isNewStore: boolean;
  completedAt: string | null;
  createdAt: string;
  store: Store;
  steps: Step[];
};

const PHASE_LABEL: Record<string, string> = { OBRAS: "Obras", EQUIPAMENTOS: "Equipamentos", TREINAMENTO: "Treinamento", APROVACAO: "Aprovação" };
const PHASE_COLOR: Record<string, string> = {
  OBRAS: "bg-orange-100 text-orange-700", EQUIPAMENTOS: "bg-blue-100 text-blue-700",
  TREINAMENTO: "bg-violet-100 text-violet-700", APROVACAO: "bg-green-100 text-green-700",
};

export default function OnboardingPage() {
  const { data: session } = useSession();
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ storeId: "", isNewStore: true });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/onboarding").then((r) => r.json()),
      fetch("/api/stores").then((r) => r.json()),
    ]).then(([o, s]) => { setOnboardings(o); setStores(s); setLoading(false); });
  }, []);

  async function create() {
    if (!form.storeId) return;
    setSaving(true);
    const res = await fetch("/api/onboarding", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const o = await res.json();
    setOnboardings((prev) => [o, ...prev]);
    setForm({ storeId: "", isNewStore: true });
    setShowForm(false);
    setSaving(false);
  }

  async function toggleStep(onboardingId: string, stepId: string, completed: boolean) {
    const res = await fetch(`/api/onboarding/${onboardingId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId, completed }),
    });
    const updated = await res.json();
    setOnboardings((prev) => prev.map((o) => (o.id === onboardingId ? updated : o)));
  }

  const existingStoreIds = new Set(onboardings.map((o) => o.store.id));
  const availableStores = stores.filter((s) => !existingStoreIds.has(s.id));

  if (!session?.user) return null;

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CheckSquare className="h-7 w-7 text-teal-500" /> Onboarding de Lojas
            </h1>
            <p className="text-gray-500 mt-1">Acompanhe o processo de abertura e checklist de novas lojas.</p>
          </div>
          {availableStores.length > 0 && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition">
              <Plus className="h-4 w-4" /> Nova Loja
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Iniciar Onboarding</h2>
              <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
                <option value="">Selecionar loja...</option>
                {availableStores.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" className="rounded" checked={form.isNewStore} onChange={(e) => setForm({ ...form, isNewStore: e.target.checked })} />
                Loja nova (gerar checklist de abertura)
              </label>
              <button disabled={saving || !form.storeId} onClick={create}
                className="w-full py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
                {saving ? "Criando..." : "Iniciar Onboarding"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : onboardings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Nenhum onboarding iniciado.</div>
        ) : (
          <div className="space-y-4">
            {onboardings.map((o) => {
              const done = o.steps.filter((s) => s.completedAt).length;
              const pct = o.steps.length > 0 ? Math.round((done / o.steps.length) * 100) : 0;
              const isExpanded = expanded === o.id;
              return (
                <div key={o.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition" onClick={() => setExpanded(isExpanded ? null : o.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{o.store.name}</p>
                        <span className="text-xs text-gray-400">({o.store.code})</span>
                        {o.completedAt && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Concluído ✓</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{done}/{o.steps.length} etapas</span>
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 space-y-2 bg-gray-50">
                      {o.steps.map((step) => (
                        <div key={step.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                          <button onClick={() => toggleStep(o.id, step.id, !step.completedAt)} className="shrink-0 mt-0.5">
                            {step.completedAt
                              ? <CheckCircle2 className="h-5 w-5 text-teal-500" />
                              : <Circle className="h-5 w-5 text-gray-300" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium text-sm ${step.completedAt ? "line-through text-gray-400" : "text-gray-900"}`}>{step.title}</p>
                              <span className={`shrink-0 px-1.5 py-0.5 rounded text-xs font-medium ${PHASE_COLOR[step.phase]}`}>{PHASE_LABEL[step.phase]}</span>
                            </div>
                            {step.description && <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>}
                            {step.responsible && <p className="text-xs text-teal-600 mt-0.5">Responsável: {step.responsible}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
