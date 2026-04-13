"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, FileText, Upload, CheckCircle } from "lucide-react";
import { UploadButton } from "@/lib/uploadthing-components";
import { getFileType, formatFileSize, formatDate, fileTypeIcon } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  icon?: string | null;
}

interface Material {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileType: string;
  fileSize?: number | null;
  published: boolean;
  categoryId: string;
  category: Category;
  createdAt: string;
}

interface UploadedFile {
  url: string;
  key: string;
  name: string;
  size: number;
  type: string;
}

const DEFAULT_FORM = {
  title: "",
  description: "",
  categoryId: "",
  published: true,
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const fetchData = useCallback(async () => {
    const [matRes, catRes] = await Promise.all([
      fetch("/api/materials"),
      fetch("/api/categories"),
    ]);
    const [mats, cats] = await Promise.all([matRes.json(), catRes.json()]);
    setMaterials(mats);
    setCategories(cats);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreate() {
    setForm(DEFAULT_FORM);
    setUploadedFile(null);
    setError("");
    setShowCreateModal(true);
  }

  function openEdit(mat: Material) {
    setEditing(mat);
    setForm({
      title: mat.title,
      description: mat.description ?? "",
      categoryId: mat.categoryId,
      published: mat.published,
    });
    setError("");
    setShowEditModal(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadedFile) {
      setError("Selecione um arquivo para upload");
      return;
    }
    if (!form.categoryId) {
      setError("Selecione uma categoria");
      return;
    }

    setSaving(true);
    setError("");

    const res = await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        fileUrl: uploadedFile.url,
        fileKey: uploadedFile.key,
        fileType: getFileType(uploadedFile.type),
        mimeType: uploadedFile.type,
        fileSize: uploadedFile.size,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao salvar");
      return;
    }

    await fetchData();
    setShowCreateModal(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/materials/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        published: form.published,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao salvar");
      return;
    }

    await fetchData();
    setShowEditModal(false);
  }

  async function togglePublish(mat: Material) {
    await fetch(`/api/materials/${mat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !mat.published }),
    });
    await fetchData();
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Excluir o material "${title}"?`)) return;
    const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    }
  }

  const filtered = filterCategory
    ? materials.filter((m) => m.categoryId === filterCategory)
    : materials;

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-5 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Materiais</h1>
          <p className="text-gray-500 text-sm mt-1">
            Faça upload e gerencie os materiais de treinamento
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Material</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Filter */}
      <div className="mb-5">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todas as categorias</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum material encontrado</p>
          <button
            onClick={openCreate}
            className="mt-3 text-blue-600 text-sm hover:underline"
          >
            Adicionar material
          </button>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {filtered.map((mat) => (
              <div key={mat.id} className="bg-white rounded-xl shadow-sm p-4 flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 mt-0.5">{fileTypeIcon(mat.fileType)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm leading-snug">{mat.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {mat.category.icon} {mat.category.name}
                    {mat.fileSize ? ` · ${formatFileSize(mat.fileSize)}` : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => togglePublish(mat)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition ${
                        mat.published
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {mat.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {mat.published ? "Publicado" : "Rascunho"}
                    </button>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(mat)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(mat.id, mat.title)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Material
                </th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Categoria
                </th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Tamanho
                </th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Status
                </th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Data
                </th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((mat) => (
                <tr key={mat.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{fileTypeIcon(mat.fileType)}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-xs">
                          {mat.title}
                        </p>
                        {mat.description && (
                          <p className="text-xs text-gray-400 truncate max-w-xs">
                            {mat.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {mat.category.icon} {mat.category.name}
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {mat.fileSize ? formatFileSize(mat.fileSize) : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => togglePublish(mat)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                        mat.published
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {mat.published ? (
                        <>
                          <Eye className="h-3 w-3" /> Publicado
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" /> Rascunho
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {formatDate(mat.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(mat)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(mat.id, mat.title)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg p-6 max-h-[95vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              Novo Material
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo *
                </label>
                {uploadedFile ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(uploadedFile.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="text-xs text-red-500 hover:text-red-700 flex-shrink-0"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center text-center">
                    <Upload className="h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 mb-3">
                      Vídeos (até 2GB), PDFs, Imagens, Documentos
                    </p>
                    <UploadButton
                      endpoint="materialUploader"
                      onClientUploadComplete={(res) => {
                        if (res && res[0]) {
                          const file = res[0];
                          setUploadedFile({
                            url: file.url,
                            key: file.key,
                            name: file.name,
                            size: file.size,
                            type: file.type ?? "",
                          });
                          if (!form.title) {
                            setForm((f) => ({
                              ...f,
                              title: file.name.replace(/\.[^/.]+$/, ""),
                            }));
                          }
                        }
                      }}
                      onUploadError={(err) => {
                        setError(`Erro no upload: ${err.message}`);
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Nome do material"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  placeholder="Descrição opcional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published-create"
                  checked={form.published}
                  onChange={(e) =>
                    setForm({ ...form, published: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600"
                />
                <label
                  htmlFor="published-create"
                  className="text-sm text-gray-700"
                >
                  Publicar imediatamente
                </label>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !uploadedFile}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition text-sm"
                >
                  {saving ? "Salvando..." : "Salvar Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editing && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6 max-h-[95vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              Editar Material
            </h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published-edit"
                  checked={form.published}
                  onChange={(e) =>
                    setForm({ ...form, published: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="published-edit" className="text-sm text-gray-700">
                  Publicado
                </label>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition text-sm"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
