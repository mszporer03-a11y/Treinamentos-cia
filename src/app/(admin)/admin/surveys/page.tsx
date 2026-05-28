"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useSession } from "next-auth/react";
import { BarChart2, Plus, X, Users } from "lucide-react";

type Option = { id: string; text: string; order: number; _count: { responses: number } };
type Survey = {
  id: string;
  question: string;
  active: boolean;
  endsAt: string | null;
  createdAt: string;
  options: Option[];
  _count: { responses: number };
};

export default function SurveysPage() {
  const { data: session } = useSession();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [endsAt, setEndsAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/surveys").then((r) => r.json()).then((d) => { setSurveys(d); setLoading(false); });
  }, []);

  async function create() {
    const filled = options.filter((o) => o.trim());
    if (!question || filled.length < 2) return;
    setSaving(true);
    const res = await fetch("/api/surveys", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, options: filled, endsAt: endsAt || undefined }),
    });
    const s = await res.json();
    setSurveys((prev) => [s, ...prev]);
    setQuestion(""); setOptions(["", ""]); setEndsAt(""); setShowForm(false); setSaving(false);
  }

  async function toggleActive(s: Survey) {
    const res = await fetch(`/api/surveys/${s.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !s.active }),
    });
    const updated = await res.json();
    setSurveys((prev) => prev.map((x) => (x.id === s.id ? { ...x, ...updated } : x)));
  }

  async function deleteSurvey(id: string) {
    if (!confirm("Excluir esta pesquisa e todas as respostas?")) return;
    await fetch(`/api/surveys/${id}`, { method: "DELETE" });
    setSurveys((prev) => prev.filter((s) => s.id !== id));
  }

  if (!session?.user) return null;

  return (
    <AdminShell user={session.user}>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="h-7 w-7 text-violet-500" /> Pesquisas Rápidas
            </h1>
            <p className="text-gray-500 mt-1">Crie polls para coletar feedback dos franqueados em tempo real.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition">
            <Plus className="h-4 w-4" /> Nova Pesquisa
          </button>
        </div>

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Nova Pesquisa</h2>
              <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                rows={2} placeholder="Qual é a pergunta?" value={question} onChange={(e) => setQuestion(e.target.value)} />
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600">Opções de resposta</p>
                {options.map((o, i) => (
                  <div key={i} className="flex gap-2">
                    <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder={`Opção ${i + 1}`} value={o} onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} />
                    {options.length > 2 && (
                      <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="p-2 text-gray-400 hover:text-red-500 transition">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 8 && (
                  <button onClick={() => setOptions([...options, ""])} className="text-sm text-violet-600 hover:underline">+ Adicionar opção</button>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Encerra em (opcional)</label>
                <input type="datetime-local" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              </div>
              <button disabled={saving || !question || options.filter((o) => o.trim()).length < 2} onClick={create}
                className="w-full py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition">
                {saving ? "Criando..." : "Criar Pesquisa"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Nenhuma pesquisa criada ainda.</div>
        ) : (
          <div className="space-y-4">
            {surveys.map((s) => {
              const total = s._count.responses;
              return (
                <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{s.question}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{total} {total === 1 ? "resposta" : "respostas"}</span>
                        {s.endsAt && <span>Encerra {new Date(s.endsAt).toLocaleDateString("pt-BR")}</span>}
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.active ? "Ativa" : "Encerrada"}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {s.options.map((o) => {
                      const pct = total > 0 ? Math.round((o._count.responses / total) * 100) : 0;
                      return (
                        <div key={o.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">{o.text}</span>
                            <span className="text-gray-500 font-mono text-xs">{o._count.responses} ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleActive(s)}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                      {s.active ? "Encerrar" : "Reativar"}
                    </button>
                    <button onClick={() => deleteSurvey(s.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition">Excluir</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
