"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import { UtensilsCrossed, Plus, Trash2, Loader2, FileText, Image as ImageIcon, X, Search } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-components";
import { formatDate } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Material {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string | null;
  fileType: string;
  createdAt: string;
  category: Category;
}

function isCardapioCategory(cat: { name: string; slug: string }) {
  return (
    cat.name.toLowerCase().includes("cardápio") ||
    cat.name.toLowerCase().includes("cardapio") ||
    cat.slug.includes("cardapio")
  );
}

export default function AdminCardapiosPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pendingFile, setPendingFile] = useState<{
    url: string; key: string; name: string; size: number; mime: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("materialUploader", {
    onClientUploadComplete: (res) => {
      const file = res?.[0];
      if (file) {
        setPendingFile({
          url: file.url,
          key: file.key,
          name: file.name,
          size: file.size,
          mime: file.type ?? "",
        });
      }
      setUploading(false);
    },
    onUploadError: () => {
      setUploading(false);
      setError("Falha no upload do arquivo");
    },
  });

  const fetchData = useCallback(async () => {
    const [matRes, catRes] = await Promise.all([
      fetch("/api/materials"),
      fetch("/api/categories"),
    ]);
    const [mats, cats] = await Promise.all([matRes.json(), catRes.json()]);

    const cardapioCat = Array.isArray(cats) ? cats.find(isCardapioCategory) : null;
    setCategory(cardapioCat ?? null);

    if (Array.isArray(mats)) {
      setMaterials(mats.filter((m: Material) => isCardapioCategory(m.category)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Garante que a categoria de cardápios exista antes de salvar
  async function ensureCategory(): Promise<Category | null> {
    if (category) return category;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Cardápio do Mês",
        description: "Cardápios mensais da rede",
        icon: "🍽️",
      }),
    });
    if (!res.ok) return null;
    const cat = await res.json();
    setCategory(cat);
    return cat;
  }

  function openCreate() {
    setTitle("");
    setDescription("");
    setPendingFile(null);
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !pendingFile) return;
    setSaving(true);
    setError("");

    const cat = await ensureCategory();
    if (!cat) {
      setError("Não foi possível criar a categoria de cardápios");
      setSaving(false);
      return;
    }

    const ext = pendingFile.name.split(".").pop()?.toLowerCase() ?? "";
    const fileType = ext === "pdf"
      ? "PDF"
      : ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)
      ? "IMAGE"
      : ["mp4", "mov", "avi", "webm"].includes(ext)
      ? "VIDEO"
      : "DOCUMENT";

    const res = await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        fileUrl: pendingFile.url,
        fileKey: pendingFile.key,
        fileType,
        mimeType: pendingFile.mime || undefined,
        fileSize: pendingFile.size,
        categoryId: cat.id,
        published: true,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao salvar cardápio");
      return;
    }

    setShowModal(false);
    await fetchData();
  }

  async function handleDelete(material: Material) {
    if (!confirm(`Excluir o cardápio "${material.title}"?`)) return;
    const res = await fetch(`/api/materials/${material.id}`, { method: "DELETE" });
    if (res.ok) {
      setMaterials((prev) => prev.filter((m) => m.id !== material.id));
    } else {
      alert("Erro ao excluir cardápio");
    }
  }

  const filtered = materials.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-amber-500" /> Cardápios do Mês
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Anexe e gerencie os cardápios disponíveis para a rede
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition text-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Cardápio</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cardápio..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {search ? "Nenhum cardápio encontrado" : "Nenhum cardápio anexado ainda"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((material) => (
            <div
              key={material.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {material.fileType === "IMAGE" && material.fileUrl ? (
                <div className="aspect-video bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={material.fileUrl}
                    alt={material.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-amber-50 flex flex-col items-center justify-center gap-2 text-amber-500">
                  <FileText className="h-10 w-10 opacity-70" />
                  <span className="text-xs font-medium opacity-70">{material.fileType}</span>
                </div>
              )}
              <div className="p-4">
                <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                  {material.title}
                </p>
                {material.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{material.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">{formatDate(material.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    {material.fileUrl && (
                      <a
                        href={material.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                      >
                        Abrir
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(material)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Novo Cardápio</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  placeholder="Cardápio de Junho 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Arquivo *</label>
                {pendingFile ? (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                    {/\.(jpg|jpeg|png|gif|webp)$/i.test(pendingFile.name) ? (
                      <ImageIcon className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    )}
                    <span className="text-sm text-gray-700 truncate flex-1">{pendingFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setPendingFile(null)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-amber-400 hover:text-amber-600 transition w-full justify-center"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {uploading ? "Enviando arquivo…" : "Anexar cardápio (PDF ou imagem)"}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploading(true);
                      startUpload([file]);
                    }
                    e.target.value = "";
                  }}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading || !pendingFile || !title.trim()}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium rounded-lg transition text-sm"
                >
                  {saving ? "Salvando..." : "Publicar Cardápio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
