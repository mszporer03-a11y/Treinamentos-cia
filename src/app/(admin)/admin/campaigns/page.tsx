"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useSession } from "next-auth/react";
import { Megaphone, Plus, X, Calendar, Eye, EyeOff } from "lucide-react";

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  published: boolean;
  assets: { id: string; fileName: string; fileUrl: string; fileType: string }[];
  createdAt: string;
};

export default function CampaignsPage() {
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", startDate: "", endDate: "", published: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/campaigns").then((r) => r.json()).then((d) => { setCampaigns(d); setLoading(false); });
  }, []);

  async function create() {
    if (!form.title || !form.startDate) return;
    setSaving(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, assets: [] }),
    });
    const c = await res.json();
    setCampaigns((prev) => [c, ...prev]);
    setForm({ title: "", description: "", startDate: "", endDate: "", published: false });
    setShowForm(false);
    setSaving(false);
  }

  async function togglePublish(campaign: Campaign) {
    const res = await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !campaign.published }),
    });
    const updated = await res.json();
    setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? { ...c, ...updated } : c)));
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Excluir esta campanha?")) return;
    await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  if (!session?.user) return null;

  return (
    <AdminShell user={session.user}>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="h-7 w-7 text-pink-500" /> Campanhas de Marketing
            </h1>
            <p className="text-gray-500 mt-1">Crie e publique campanhas sazonais para os franqueados.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-xl hover:bg-pink-700 transition">
            <Plus className="h-4 w-4" /> Nova Campanha
          </button>
        </div>

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Nova Campanha</h2>
              <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Título da campanha" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                rows={2} placeholder="Descrição (opcional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Data de início *</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Data de término</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" className="rounded" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                Publicar imediatamente
              </label>
              <button disabled={saving || !form.title || !form.startDate} onClick={create}
                className="w-full py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 disabled:opacity-50 transition">
                {saving ? "Salvando..." : "Criar Campanha"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Nenhuma campanha criada ainda.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {campaigns.map((c) => (
              <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{c.title}</h3>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${c.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.published ? "Publicada" : "Rascunho"}
                  </span>
                </div>
                {c.description && <p className="text-sm text-gray-500 mb-2">{c.description}</p>}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(c.startDate).toLocaleDateString("pt-BR")}
                  {c.endDate && ` — ${new Date(c.endDate).toLocaleDateString("pt-BR")}`}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => togglePublish(c)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    {c.published ? <><EyeOff className="h-3.5 w-3.5" /> Despublicar</> : <><Eye className="h-3.5 w-3.5" /> Publicar</>}
                  </button>
                  <button onClick={() => deleteCampaign(c.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition">
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
