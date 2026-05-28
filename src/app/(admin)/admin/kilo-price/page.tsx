"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useSession } from "next-auth/react";
import { DollarSign, TrendingUp, Plus, X } from "lucide-react";

type KiloPrice = { id: string; price: number; confirmedAt: string | null; effectiveFrom: string; createdAt: string; suggestedNote: string | null };
type Store = { id: string; name: string; code: string; city: string | null; active: boolean; kiloPrices: KiloPrice[] };

export default function KiloPricePage() {
  const { data: session } = useSession();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ storeId: "", price: "", suggestedNote: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/kilo-prices").then((r) => r.json()).then((d) => { setStores(d); setLoading(false); });
  }, []);

  async function submit() {
    const price = parseFloat(form.price);
    if (!form.storeId || isNaN(price) || price <= 0) return;
    setSaving(true);
    await fetch("/api/kilo-prices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: form.storeId, price, suggestedNote: form.suggestedNote || undefined }),
    });
    // Refresh
    const updated = await fetch("/api/kilo-prices").then((r) => r.json());
    setStores(updated);
    setForm({ storeId: "", price: "", suggestedNote: "" });
    setShowForm(false);
    setSaving(false);
  }

  if (!session?.user) return null;

  const avg = stores.length
    ? stores.filter((s) => s.kiloPrices[0]).reduce((acc, s) => acc + s.kiloPrices[0].price, 0) / stores.filter((s) => s.kiloPrices[0]).length
    : 0;

  return (
    <AdminShell user={session.user}>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-7 w-7 text-emerald-500" /> Monitor do Preço do Quilo
            </h1>
            <p className="text-gray-500 mt-1">Acompanhe e sugira o preço do quilo para cada loja.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition">
            <Plus className="h-4 w-4" /> Sugerir Preço
          </button>
        </div>

        {avg > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 col-span-2 sm:col-span-1">
              <p className="text-xs text-emerald-600 font-medium mb-1">Preço médio da rede</p>
              <p className="text-3xl font-bold text-emerald-700">R$ {avg.toFixed(2).replace(".", ",")}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-medium mb-1">Lojas monitoradas</p>
              <p className="text-3xl font-bold text-gray-900">{stores.filter((s) => s.kiloPrices[0]).length}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-medium mb-1">Confirmados</p>
              <p className="text-3xl font-bold text-gray-900">{stores.filter((s) => s.kiloPrices[0]?.confirmedAt).length}</p>
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Sugerir Preço do Quilo</h2>
              <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
                <option value="">Selecionar loja...</option>
                {stores.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
              <input type="number" step="0.01" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Preço sugerido (R$)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Observação (opcional)" value={form.suggestedNote} onChange={(e) => setForm({ ...form, suggestedNote: e.target.value })} />
              <button disabled={saving || !form.storeId || !form.price} onClick={submit}
                className="w-full py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition">
                {saving ? "Salvando..." : "Enviar Sugestão"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Loja</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cidade</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Preço Atual</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Atualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stores.map((s) => {
                  const kp = s.kiloPrices[0];
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">{s.name} <span className="text-gray-400 font-normal text-xs">({s.code})</span></td>
                      <td className="px-4 py-3 text-gray-500">{s.city ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {kp ? (
                          <span className="font-bold text-emerald-700 font-mono">R$ {kp.price.toFixed(2).replace(".", ",")}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {kp ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${kp.confirmedAt ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {kp.confirmedAt ? "Confirmado" : "Sugerido"}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Sem preço</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 text-xs">
                        {kp ? new Date(kp.createdAt).toLocaleDateString("pt-BR") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
