"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  ClipboardList,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Edit2,
  X,
  Check,
  Eye,
  BarChart2,
} from "lucide-react";

interface ChecklistItem {
  id?: string;
  text: string;
}

interface ChecklistSection {
  id?: string;
  name: string;
  items: ChecklistItem[];
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  sections: (ChecklistSection & { id: string; items: (ChecklistItem & { id: string })[] })[];
  _count?: { responses: number };
}

interface ResponseSummary {
  id: string;
  createdAt: string;
  completedAt: string | null;
  template: { name: string };
  store: { name: string; code: string };
  responder: { name: string };
  notes: string | null;
  items: { checked: boolean }[];
}

export default function AdminChecklistsPage() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [responses, setResponses] = useState<ResponseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"templates" | "responses">("templates");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formSections, setFormSections] = useState<ChecklistSection[]>([{ name: "", items: [{ text: "" }] }]);
  const [saving, setSaving] = useState(false);

  // Expanded state per template
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchTemplates = useCallback(async () => {
    const res = await fetch("/api/checklists/templates");
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  }, []);

  const fetchResponses = useCallback(async () => {
    const res = await fetch("/api/checklists/responses");
    if (res.ok) setResponses(await res.json());
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchResponses();
  }, [fetchTemplates, fetchResponses]);

  function openNew() {
    setEditingId(null);
    setFormName("");
    setFormDesc("");
    setFormSections([{ name: "Seção 1", items: [{ text: "" }] }]);
    setShowForm(true);
  }

  function openEdit(t: Template) {
    setEditingId(t.id);
    setFormName(t.name);
    setFormDesc(t.description ?? "");
    setFormSections(
      t.sections.map((s) => ({
        id: s.id,
        name: s.name,
        items: s.items.map((i) => ({ id: i.id, text: i.text })),
      }))
    );
    setShowForm(true);
  }

  async function saveTemplate() {
    if (!formName.trim()) return;
    setSaving(true);
    const payload = {
      name: formName,
      description: formDesc,
      sections: formSections.map((s) => ({
        name: s.name,
        items: s.items.filter((i) => i.text.trim()).map((i) => ({ text: i.text })),
      })).filter((s) => s.name.trim()),
    };

    const url = editingId ? `/api/checklists/templates/${editingId}` : "/api/checklists/templates";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await fetchTemplates();
      setShowForm(false);
      setEditingId(null);
    }
    setSaving(false);
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Desativar este checklist?")) return;
    await fetch(`/api/checklists/templates/${id}`, { method: "DELETE" });
    await fetchTemplates();
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addSection() {
    setFormSections((prev) => [...prev, { name: `Seção ${prev.length + 1}`, items: [{ text: "" }] }]);
  }

  function removeSection(si: number) {
    setFormSections((prev) => prev.filter((_, i) => i !== si));
  }

  function addItem(si: number) {
    setFormSections((prev) =>
      prev.map((s, i) => i === si ? { ...s, items: [...s.items, { text: "" }] } : s)
    );
  }

  function removeItem(si: number, ii: number) {
    setFormSections((prev) =>
      prev.map((s, i) => i === si ? { ...s, items: s.items.filter((_, j) => j !== ii) } : s)
    );
  }

  function updateSection(si: number, name: string) {
    setFormSections((prev) => prev.map((s, i) => i === si ? { ...s, name } : s));
  }

  function updateItem(si: number, ii: number, text: string) {
    setFormSections((prev) =>
      prev.map((s, i) => i === si
        ? { ...s, items: s.items.map((item, j) => j === ii ? { ...item, text } : item) }
        : s)
    );
  }

  if (!session?.user) return null;

  return (
    <>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="h-7 w-7 text-orange-500" /> Checklists
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Crie modelos de checklist para preenchimento por gerentes e franqueados</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition"
          >
            <Plus className="h-4 w-4" /> Novo Checklist
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(["templates", "responses"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                activeTab === tab
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "templates" ? (
                <span className="flex items-center gap-1.5"><ClipboardList className="h-4 w-4" /> Modelos</span>
              ) : (
                <span className="flex items-center gap-1.5"><BarChart2 className="h-4 w-4" /> Respostas ({responses.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Templates tab ─── */}
        {activeTab === "templates" && (
          <>
            {loading ? (
              <div className="text-center py-16 text-gray-400">Carregando...</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                <p>Nenhum checklist criado ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((t) => (
                  <div key={t.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="flex items-center gap-3 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{t.name}</p>
                        {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          {t.sections.length} seção(ões) · {t.sections.reduce((a, s) => a + s.items.length, 0)} itens · {t._count?.responses ?? 0} respostas
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(t.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                          title="Desativar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleExpand(t.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition"
                        >
                          {expanded.has(t.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {expanded.has(t.id) && (
                      <div className="px-5 pb-4 border-t border-gray-50">
                        {t.sections.map((s) => (
                          <div key={s.id} className="mt-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{s.name}</p>
                            <ul className="space-y-1">
                              {s.items.map((item) => (
                                <li key={item.id} className="flex items-start gap-2 text-sm text-gray-700">
                                  <Check className="h-3.5 w-3.5 mt-0.5 text-gray-300 flex-shrink-0" />
                                  {item.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Responses tab ─── */}
        {activeTab === "responses" && (
          <div className="space-y-3">
            {responses.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Eye className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                <p>Nenhuma resposta ainda.</p>
              </div>
            ) : (
              responses.map((r) => {
                const total = r.items.length;
                const checked = r.items.filter((i) => i.checked).length;
                const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
                return (
                  <div key={r.id} className="bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{r.template.name}</p>
                        <p className="text-sm text-gray-500">{r.store.name} <span className="text-gray-400">({r.store.code})</span></p>
                        <p className="text-xs text-gray-400 mt-1">
                          Por {r.responder.name} · {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                        {r.notes && <p className="text-xs text-gray-500 mt-1 italic">{r.notes}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-bold text-gray-900">{pct}%</p>
                        <p className="text-xs text-gray-400">{checked}/{total} itens</p>
                        {r.completedAt && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <Check className="h-3 w-3" /> Concluído
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ─── Form modal ─── */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-8 px-4 pb-8 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId ? "Editar Checklist" : "Novo Checklist"}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex.: Checklist de Abertura"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <input
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">Seções e itens</label>
                    <button
                      onClick={addSection}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Adicionar Seção
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formSections.map((sec, si) => (
                      <div key={si} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            value={sec.name}
                            onChange={(e) => updateSection(si, e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                            placeholder="Nome da seção"
                          />
                          {formSections.length > 1 && (
                            <button
                              onClick={() => removeSection(si)}
                              className="text-gray-400 hover:text-red-500 transition"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          {sec.items.map((item, ii) => (
                            <div key={ii} className="flex items-center gap-2">
                              <span className="text-gray-300 flex-shrink-0">
                                <Check className="h-3.5 w-3.5" />
                              </span>
                              <input
                                value={item.text}
                                onChange={(e) => updateItem(si, ii, e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                placeholder="Descreva o item..."
                              />
                              {sec.items.length > 1 && (
                                <button
                                  onClick={() => removeItem(si, ii)}
                                  className="text-gray-300 hover:text-red-400 transition"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => addItem(si)}
                            className="mt-1 text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" /> Adicionar Item
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={saving || !formName.trim()}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition"
                >
                  {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar Checklist"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
