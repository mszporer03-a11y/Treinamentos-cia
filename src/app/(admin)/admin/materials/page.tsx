"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, FileText, ExternalLink, Users, Play, Image as ImageIcon, File, Megaphone, Paperclip } from "lucide-react";
import { formatFileSize, formatDate } from "@/lib/utils";
import { materialAttachments } from "@/lib/attachments";
import { AttachmentMosaic } from "@/components/attachments/AttachmentMosaic";
import { AttachmentPicker } from "@/components/attachments/AttachmentPicker";
import { useAttachmentUploader } from "@/components/attachments/useAttachmentUploader";
import { materialUsesMosaic } from "@/components/attachments/MaterialFeedMedia";
import { MaterialViewer } from "@/components/franchisee/MaterialViewer";
import { MaterialViewsModal } from "@/components/admin/MaterialViewsModal";
import { PdfThumbnail } from "@/components/PdfPreview";

interface Category {
  id: string;
  name: string;
  slug?: string;
  icon?: string | null;
}

interface StoreRef {
  id: string;
  name: string;
  code: string;
}

interface Material {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string | null;
  fileType: string;
  fileSize?: number | null;
  mimeType?: string | null;
  attachments?: unknown;
  published: boolean;
  categoryId: string;
  category: Category;
  linkedStores: { store: StoreRef }[];
  createdAt: string;
  createdBy?: { name: string } | null;
}

const typeIcon: Record<string, React.ElementType> = {
  VIDEO: Play,
  PDF: FileText,
  IMAGE: ImageIcon,
  DOCUMENT: FileText,
  OTHER: File,
  NOTICE: Megaphone,
};

const typeColor: Record<string, string> = {
  VIDEO: "bg-red-100 text-red-500",
  PDF: "bg-orange-100 text-orange-500",
  IMAGE: "bg-green-100 text-green-500",
  DOCUMENT: "bg-blue-100 text-blue-500",
  OTHER: "bg-gray-100 text-gray-500",
  NOTICE: "bg-amber-100 text-amber-600",
};

const typeLabel: Record<string, string> = {
  VIDEO: "Vídeo",
  PDF: "PDF",
  IMAGE: "Imagem",
  DOCUMENT: "Documento",
  OTHER: "Arquivo",
  NOTICE: "Aviso",
};

const DEFAULT_FORM = {
  title: "",
  description: "",
  categoryId: "",
  published: true,
  linkedStoreIds: [] as string[],
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<StoreRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const uploader = useAttachmentUploader("materialUploader");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [viewing, setViewing] = useState<Material | null>(null);
  const [viewingViews, setViewingViews] = useState<Material | null>(null);

  const fetchData = useCallback(async () => {
    const [matRes, catRes, storeRes] = await Promise.all([
      fetch("/api/materials"),
      fetch("/api/categories"),
      fetch("/api/stores"),
    ]);
    const [mats, cats, sts] = await Promise.all([matRes.json(), catRes.json(), storeRes.json()]);
    setMaterials(mats);
    setCategories(cats);
    setStores(Array.isArray(sts) ? sts : sts.stores ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreate() {
    setForm(DEFAULT_FORM);
    uploader.reset();
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
      linkedStoreIds: (mat.linkedStores ?? []).map(({ store }) => store.id),
    });
    uploader.reset(materialAttachments(mat));
    setError("");
    setShowEditModal(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categoryId) {
      setError("Selecione uma categoria");
      return;
    }
    if (isAviso) {
      if (!form.description.trim()) {
        setError("Escreva a descrição do aviso");
        return;
      }
    } else if (uploader.attachments.length === 0) {
      setError("Selecione pelo menos um arquivo para upload");
      return;
    }
    if (uploader.busy) {
      setError("Aguarde o envio dos arquivos terminar");
      return;
    }

    setSaving(true);
    setError("");

    const body = {
      ...form,
      ...(isAviso ? { fileType: "NOTICE" } : {}),
      attachments: uploader.attachments,
      linkedStoreIds: form.linkedStoreIds,
    };

    const res = await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
    if (uploader.busy) {
      setError("Aguarde o envio dos arquivos terminar");
      return;
    }
    if (editing.fileType !== "NOTICE" && uploader.attachments.length === 0) {
      setError("O material precisa de pelo menos um anexo");
      return;
    }
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
        attachments: uploader.attachments,
        linkedStoreIds: form.linkedStoreIds,
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

  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const isAviso = selectedCategory?.slug === "avisos";
  const allStoresSelected = stores.length > 0 && form.linkedStoreIds.length === stores.length;

  // Segmentação: lojas que terão acesso ao conteúdo
  const storePicker = stores.length > 0 && (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Lojas com acesso
          <span className="ml-1.5 text-xs font-normal text-gray-400">(nenhuma marcada = todas)</span>
        </label>
        <button
          type="button"
          onClick={() =>
            setForm((f) => ({ ...f, linkedStoreIds: allStoresSelected ? [] : stores.map((st) => st.id) }))
          }
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          {allStoresSelected ? "Desmarcar todas" : "✓ Marcar todas as lojas"}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 p-2.5 border border-gray-200 rounded-lg max-h-36 overflow-y-auto">
        {stores.map((store) => {
          const selected = form.linkedStoreIds.includes(store.id);
          return (
            <button
              key={store.id}
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  linkedStoreIds: selected
                    ? f.linkedStoreIds.filter((id) => id !== store.id)
                    : [...f.linkedStoreIds, store.id],
                }))
              }
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                selected
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"
              }`}
            >
              {store.name}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Preenche o título com o nome do primeiro arquivo enviado
  const firstAttachmentName = uploader.attachments[0]?.name;
  useEffect(() => {
    if (showCreateModal && firstAttachmentName) {
      setForm((f) => (f.title ? f : { ...f, title: firstAttachmentName.replace(/\.[^/.]+$/, "") }));
    }
  }, [showCreateModal, firstAttachmentName]);

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

      {/* Category filter — compact scrollable pills */}
      <div className="mb-5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilterCategory("")}
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition ${
            filterCategory === ""
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => {
          const active = filterCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(active ? "" : cat.id)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition ${
                active
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {cat.icon && <span>{cat.icon}</span>}
              <span>{cat.name}</span>
            </button>
          );
        })}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((mat) => {
              const TypeIcon = typeIcon[mat.fileType] ?? File;
              const color = typeColor[mat.fileType] ?? typeColor.OTHER;
              return (
                <div
                  key={mat.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col"
                >
                  {/* Cabeçalho do post */}
                  <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {(mat.createdBy?.name ?? "A").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {mat.createdBy?.name ?? "Admin"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {mat.category.icon} {mat.category.name} · {formatDate(mat.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => togglePublish(mat)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition flex-shrink-0 ${
                        mat.published
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      title={mat.published ? "Clique para despublicar" : "Clique para publicar"}
                    >
                      {mat.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {mat.published ? "Publicado" : "Rascunho"}
                    </button>
                  </div>

                  {/* Capa */}
                  <button onClick={() => setViewing(mat)} className="w-full text-left focus:outline-none group">
                    {materialUsesMosaic(mat) ? (
                      <div className="mx-3">
                        <AttachmentMosaic attachments={materialAttachments(mat)} />
                      </div>
                    ) : mat.fileType === "PDF" && mat.fileUrl ? (
                      <PdfThumbnail
                        url={mat.fileUrl}
                        className="mx-3 rounded-xl aspect-video group-hover:opacity-90 transition-opacity"
                      />
                    ) : mat.fileType === "IMAGE" && mat.fileUrl ? (
                      <div className="mx-3 rounded-xl overflow-hidden bg-gray-100 aspect-video">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mat.fileUrl}
                          alt={mat.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div
                        className={`mx-3 rounded-xl aspect-video flex flex-col items-center justify-center gap-2 ${color} group-hover:opacity-80 transition-opacity`}
                      >
                        <TypeIcon className="h-10 w-10 sm:h-14 sm:w-14 opacity-70" />
                        <span className="text-xs sm:text-sm font-medium opacity-80">
                          {typeLabel[mat.fileType] ?? "Arquivo"}
                        </span>
                      </div>
                    )}
                    <div className="px-4 pt-2.5 pb-2">
                      <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {mat.title}
                      </p>
                      {mat.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{mat.description}</p>
                      )}
                    </div>
                  </button>

                  {mat.linkedStores && mat.linkedStores.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-4 pb-2">
                      {mat.linkedStores.map(({ store }) => (
                        <span
                          key={store.id}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700"
                        >
                          {store.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Rodapé: tamanho e ações */}
                  <div className="mt-auto px-4 pb-3 pt-1 flex items-center justify-between border-t border-gray-50">
                    <span className="text-xs text-gray-400 inline-flex items-center gap-1">
                      {mat.fileSize ? formatFileSize(mat.fileSize) : "—"}
                      {materialAttachments(mat).length > 1 && (
                        <>
                          {" · "}
                          <Paperclip className="h-3 w-3" /> {materialAttachments(mat).length}
                        </>
                      )}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => setViewing(mat)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Abrir arquivo"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewingViews(mat)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        title="Ver visualizações"
                      >
                        <Users className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEdit(mat)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(mat.id, mat.title)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg p-6 max-h-[95vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              {isAviso ? "Novo Aviso" : "Novo Material"}
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Category — first, so "Avisos" toggles the text-only mode */}
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
                {isAviso && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    Avisos são texto — preencha o título e a descrição; anexos são opcionais.
                  </p>
                )}
              </div>

              {/* Anexos — vários arquivos por post (opcional para Avisos) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isAviso ? "Anexos (opcional)" : "Arquivos *"}
                </label>
                <AttachmentPicker
                  uploader={uploader}
                  hint="Vídeos (até 2GB), PDFs, imagens e documentos — vários de uma vez"
                />
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
                  {isAviso ? "Descrição *" : "Descrição"}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={isAviso ? 4 : 2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  placeholder={isAviso ? "Texto do aviso" : "Descrição opcional"}
                />
              </div>

              {storePicker}

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
                  disabled={saving || uploader.busy || (!isAviso && uploader.attachments.length === 0)}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition text-sm"
                >
                  {saving ? "Salvando..." : uploader.busy ? "Enviando arquivos..." : isAviso ? "Publicar Aviso" : "Salvar Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editing && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg p-6 max-h-[95vh] overflow-y-auto">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editing.fileType === "NOTICE" ? "Anexos (opcional)" : "Arquivos *"}
                </label>
                <AttachmentPicker uploader={uploader} />
              </div>

              {storePicker}

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
                  disabled={saving || uploader.busy}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition text-sm"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewer */}
      {viewingViews && (
        <MaterialViewsModal
          materialId={viewingViews.id}
          materialTitle={viewingViews.title}
          onClose={() => setViewingViews(null)}
        />
      )}

      {viewing && (
        <MaterialViewer
          material={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
