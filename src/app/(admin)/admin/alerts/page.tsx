"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, Plus, X, CheckCircle2 } from "lucide-react";

type Store = { id: string; name: string; code: string };
type Alert = {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  dueDate: string | null;
  resolution: string | null;
  createdAt: string;
  store: Store;
};

const SEV_CONFIG: Record<string, string> = {
  LOW:      "bg-gray-100 text-gray-600",
  MEDIUM:   "bg-yellow-100 text-yellow-700",
  HIGH:     "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};
const SEV_LABEL: Record<string, string> = { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta", CRITICAL: "Crítica" };
const STATUS_LABEL: Record<string, string> = { OPEN: "Aberto", ACKNOWLEDGED: "Reconhecido", RESOLVED: "Resolvido" };

export default function AlertsPage() {
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ storeId: "", title: "", description: "", severity: "MEDIUM", dueDate: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/alerts").then((r) => r.json()),
      fetch("/api/stores").then((r) => r.json()),
    ]).then(([a, s]) => { setAlerts(a); setStores(s); setLoading(false); });
  }, []);

  async function create() {
    if (!form.storeId || !form.title || !form.description) return;
    setSaving(true);
    const res = await fetch("/api/alerts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dueDate: form.dueDate || undefined }),
    });
    const a = await res.json();
    setAlerts((prev) => [a, ...prev]);
    setForm({ storeId: "", title: "", description: "", severity: "MEDIUM", dueDate: "" });
    setShowForm(false);
    setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/alerts/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
  }

  if (!session?.user) return null;

  const open = alerts.filter((a) => a.status !== "RESOLVED");
  const resolved = alerts.filter((a) => a.status === "RESOLVED");

  return (
    <>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-7 w-7 text-orange-500" /> Alertas de Não Conformidade
            </h1>
            <p className="text-gray-500 mt-1">Registre e acompanhe alertas de não conformidade por loja.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-xl hover:bg-orange-700 transition">
            <Plus className="h-4 w-4" /> Novo Alerta
          </button>
        </div>

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Novo Alerta</h2>
              <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
                <option value="">Selecionar loja...</option>
                {stores.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Título do alerta" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                rows={3} placeholder="Descrição detalhada" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Severidade</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="CRITICAL">Crítica</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Prazo (opcional)</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <button disabled={saving || !form.storeId || !form.title || !form.description} onClick={create}
                className="w-full py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 transition">
                {saving ? "Salvando..." : "Criar Alerta"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : (
          <div className="space-y-6">
            {open.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Abertos ({open.length})</h2>
                <div className="space-y-2">
                  {open.map((a) => (
                    <div key={a.id} className="bg-white border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${SEV_CONFIG[a.severity]}`}>{SEV_LABEL[a.severity]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{a.title}</p>
                            <span className="text-xs text-gray-400">· {a.store.name}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{a.description}</p>
                          {a.dueDate && <p className="text-xs text-orange-600 mt-1">Prazo: {new Date(a.dueDate).toLocaleDateString("pt-BR")}</p>}
                          <div className="flex gap-2 mt-3">
                            {a.status === "OPEN" && (
                              <button onClick={() => updateStatus(a.id, "ACKNOWLEDGED")}
                                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition">Reconhecer</button>
                            )}
                            <button onClick={() => updateStatus(a.id, "RESOLVED")}
                              className="px-3 py-1.5 text-xs font-medium text-green-600 border border-green-100 rounded-lg hover:bg-green-50 transition flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Resolver
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {resolved.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Resolvidos ({resolved.length})</h2>
                <div className="space-y-2 opacity-60">
                  {resolved.map((a) => (
                    <div key={a.id} className="bg-white border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <p className="font-medium text-gray-700">{a.title} <span className="text-gray-400 font-normal text-sm">· {a.store.name}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {alerts.length === 0 && <div className="text-center py-12 text-gray-400">Nenhum alerta registrado.</div>}
          </div>
        )}
      </div>
    </>
  );
}
