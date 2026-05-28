"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FileText, Plus, X, Download, Trash2 } from "lucide-react";

type Doc = {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  fileName: string;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
  franchisee: { id: string; name: string; email: string };
};
type User = { id: string; name: string; email: string };

const CAT_LABEL: Record<string, string> = {
  CONTRATO: "Contrato", ADITIVO: "Aditivo", PROCURACAO: "Procuração",
  ALVARA: "Alvará", CERTIFICADO: "Certificado", OUTRO: "Outro",
};
const CAT_COLOR: Record<string, string> = {
  CONTRATO: "bg-blue-100 text-blue-700", ADITIVO: "bg-purple-100 text-purple-700",
  PROCURACAO: "bg-orange-100 text-orange-700", ALVARA: "bg-green-100 text-green-700",
  CERTIFICADO: "bg-teal-100 text-teal-700", OUTRO: "bg-gray-100 text-gray-600",
};

export default function DocumentsPage() {
  const { data: session } = useSession();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ franchiseeId: "", title: "", category: "CONTRATO", fileUrl: "", fileKey: "", fileName: "", expiresAt: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/documents").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([d, u]) => {
      setDocs(d);
      setUsers(u.filter((x: User & { role?: string }) => x.role === "FRANCHISEE" || !x.role));
      setLoading(false);
    });
  }, []);

  async function create() {
    if (!form.franchiseeId || !form.title || !form.fileUrl) return;
    setSaving(true);
    const res = await fetch("/api/documents", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, expiresAt: form.expiresAt || undefined }),
    });
    const d = await res.json();
    setDocs((prev) => [d, ...prev]);
    setForm({ franchiseeId: "", title: "", category: "CONTRATO", fileUrl: "", fileKey: "", fileName: "", expiresAt: "", notes: "" });
    setShowForm(false);
    setSaving(false);
  }

  async function deleteDoc(id: string) {
    if (!confirm("Excluir este documento?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  if (!session?.user) return null;

  const expiringSoon = docs.filter((d) => {
    if (!d.expiresAt) return false;
    const days = (new Date(d.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  });

  return (
    <>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-7 w-7 text-blue-500" /> Contratos e Documentos
            </h1>
            <p className="text-gray-500 mt-1">Gerencie os documentos de cada franqueado.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition">
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        </div>

        {expiringSoon.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
            ⚠️ {expiringSoon.length} documento(s) vencem nos próximos 30 dias.
          </div>
        )}

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Adicionar Documento</h2>
              <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.franchiseeId} onChange={(e) => setForm({ ...form, franchiseeId: e.target.value })}>
                <option value="">Selecionar franqueado...</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Título do documento" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {Object.entries(CAT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="URL do arquivo" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do arquivo" value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Validade (opcional)</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Observação</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <button disabled={saving || !form.franchiseeId || !form.title || !form.fileUrl} onClick={create}
                className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                {saving ? "Salvando..." : "Adicionar Documento"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : docs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Nenhum documento adicionado ainda.</div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Documento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Franqueado</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categoria</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Validade</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {docs.map((d) => {
                  const expiring = d.expiresAt && (new Date(d.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 30;
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">{d.title}</td>
                      <td className="px-4 py-3 text-gray-500">{d.franchisee.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLOR[d.category]}`}>{CAT_LABEL[d.category]}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        {d.expiresAt ? (
                          <span className={expiring ? "text-yellow-600 font-medium" : "text-gray-500"}>
                            {new Date(d.expiresAt).toLocaleDateString("pt-BR")}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition">
                            <Download className="h-4 w-4" />
                          </a>
                          <button onClick={() => deleteDoc(d.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
