"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, FileText, Upload, CheckCircle, ExternalLink, Users,
  ImagePlus, Loader2, X, Wand2, LayoutGrid, List,
} from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-components";
import { getFileType, formatFileSize, formatDate } from "@/lib/utils";
import { generateCoverFromFile } from "@/lib/media-client";
import { MaterialViewer } from "@/components/franchisee/MaterialViewer";
import { MaterialViewsModal } from "@/components/admin/MaterialViewsModal";
import { PostThumb } from "@/components/posts/PostThumb";
import { PostCard } from "@/components/posts/PostCard";

interface Category {
  id: string;
  name: string;
  slug?: string;
  icon: string | null;
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
  mimeType?: string | null;
  fileSize?: number | null;
  coverUrl?: string | null;
  published: boolean;
  categoryId: string;
  category: Category;
  linkedStores: { store: StoreRef }[];
  createdBy?: { name: string } | null;
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
  linkedStoreIds: [] as string[],
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<StoreRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [cover, setCover] = useState<{ url: string; key: string; auto: boolean } | null>(null);
  const [fileProgress, setFileProgress] = useState<number | null>(null);
  const [coverBusy, setCoverBusy] = useState<"" | "upload" | "auto">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [layout, setLayout] = useState<"list" | "cards">("list");
  const [viewing, setViewing] = useState<Material | null>(null);
  const [viewingViews, setViewingViews] = useState<Material | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  // Capa escolhida manualmente tem prioridade sobre a gerada automaticamente
  const manualCoverRef = useRef(false);

  const fileUpload = useUploadThing("materialUploader", {
    onUploadProgress: (p) => setFileProgress(p),
  });
  const coverUpload = useUploadThing("coverImageUploader");

  const fetchData = useCallback(async () => {
    const [matRes, catRes, storeRes] = await Promise.all([
      fetch("/api/materials"),
      fetch("/api/categories"),
      fetch("/api/stores"),
    ]);
    const [mats, cats, sts] = await Promise.all([matRes.json(), catRes.json(), storeRes.json()]);
    setMaterials(Array.isArray(mats) ? mats : []);
    setCategories(Array.isArray(cats) ? cats : []);
    setStores(Array.isArray(sts) ? sts : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    if (new URLSearchParams(window.location.search).get("new") === "1") openCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  function resetMedia() {
    setFile(null);
    setCover(null);
    setFileProgress(null);
    setCoverBusy("");
    manualCoverRef.current = false;
  }

  function openCreate() {
    setEditing(null);
    setForm(DEFAULT_FORM);
    resetMedia();
    setError("");
    setShowModal(true);
  }

  function openEdit(mat: Material) {
    setEditing(mat);
    setForm({
      title: mat.title,
      description: mat.description ?? "",
      categoryId: mat.categoryId,
      published: mat.published,
      linkedStoreIds: mat.linkedStores?.map((l) => l.store.id) ?? [],
    });
    resetMedia();
    if (mat.coverUrl) {
      setCover({ url: mat.coverUrl, key: "", auto: false });
      manualCoverRef.current = true;
    }
    setError("");
    setShowModal(true);
  }

  async function uploadCover(f: File, auto: boolean) {
    setCoverBusy(auto ? "auto" : "upload");
    try {
      const res = await coverUpload.startUpload([f]);
      const up = res?.[0];
      if (up && (!auto || !manualCoverRef.current)) setCover({ url: up.url, key: up.key, auto });
    } catch {
      if (!auto) setError("Erro ao enviar a imagem de capa");
    } finally {
      setCoverBusy("");
    }
  }

  async function handleFileChosen(f: File) {
    setError("");
    setFileProgress(0);
    if (!form.title) setForm((prev) => ({ ...prev, title: f.name.replace(/\.[^/.]+$/, "") }));
    // Capa automática: 1ª página do PDF ou um quadro do vídeo (em paralelo ao upload)
    if (!manualCoverRef.current) {
      generateCoverFromFile(f).then((c) => {
        if (c && !manualCoverRef.current) uploadCover(c, true);
      });
    }
    try {
      const res = await fileUpload.startUpload([f]);
      const up = res?.[0];
      if (!up) throw new Error();
      setFile({ url: up.url, key: up.key, name: up.name, size: up.size, type: up.type || f.type });
    } catch {
      setError("Erro no upload do arquivo. Verifique o tamanho e o formato.");
    } finally {
      setFileProgress(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categoryId) return setError("Selecione uma categoria");
    const hasExistingFile = !!editing?.fileUrl && editing.fileType !== "NOTICE";
    if (!form.description.trim() && !file && !cover && !hasExistingFile) {
      return setError("Escreva uma descrição ou anexe uma imagem/arquivo");
    }
    setSaving(true);
    setError("");

    const coverFields = cover ? { coverUrl: cover.url, ...(cover.key && { coverKey: cover.key }) } : { coverUrl: null, coverKey: null };
    const fileFields = file
      ? {
          fileUrl: file.url,
          fileKey: file.key,
          fileType: getFileType(file.type),
          mimeType: file.type,
          fileSize: file.size,
        }
      : {};

    const res = editing
      ? await fetch(`/api/materials/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, ...coverFields }),
        })
      : await fetch("/api/materials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, ...fileFields, ...(cover ? coverFields : {}) }),
        });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao salvar");
      return;
    }
    await fetchData();
    setShowModal(false);
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
    if (!confirm(`Excluir a publicação "${title}"?`)) return;
    const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
    if (res.ok) setMaterials((prev) => prev.filter((m) => m.id !== id));
  }

  const filtered = filterCategory ? materials.filter((m) => m.categoryId === filterCategory) : materials;
  const uploadingFile = fileProgress !== null;

  // Pré-visualização ao vivo do post-card no modal
  const previewMaterial = {
    id: "preview",
    title: form.title || "Título do post",
    description: form.description || null,
    fileUrl: file?.url ?? editing?.fileUrl ?? null,
    fileType: file ? getFileType(file.type) : editing?.fileType ?? "NOTICE",
    mimeType: file?.type ?? editing?.mimeType ?? null,
    fileSize: file?.size ?? editing?.fileSize ?? null,
    coverUrl: cover?.url ?? null,
    createdAt: new Date().toISOString(),
    category: categories.find((c) => c.id === form.categoryId) ?? null,
    createdBy: null,
  };

  const actions = (mat: Material, size = "p-1.5") => (
    <>
      <button onClick={() => setViewing(mat)} className={`${size} text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition`} title="Abrir">
        <ExternalLink className="h-4 w-4" />
      </button>
      <button onClick={() => setViewingViews(mat)} className={`${size} text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition`} title="Ver visualizações">
        <Users className="h-4 w-4" />
      </button>
      <button onClick={() => openEdit(mat)} className={`${size} text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition`} title="Editar">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={() => handleDelete(mat.id, mat.title)} className={`${size} text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition`} title="Excluir">
        <Trash2 className="h-4 w-4" />
      </button>
    </>
  );

  const statusPill = (mat: Material) => (
    <button
      onClick={() => togglePublish(mat)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition ${
        mat.published ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {mat.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      {mat.published ? "Publicado" : "Rascunho"}
    </button>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-5 md:mb-6 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Publicações</h1>
          <p className="text-gray-500 text-sm mt-1">Posts do feed: título, descrição, imagem e anexo</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setLayout("list")} className={`p-2 ${layout === "list" ? "bg-gray-100 text-gray-900" : "text-gray-400"}`} title="Lista">
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => setLayout("cards")} className={`p-2 ${layout === "cards" ? "bg-gray-100 text-gray-900" : "text-gray-400"}`} title="Cards">
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Publicação</span>
            <span className="sm:hidden">Nova</span>
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-5 flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCategory("")}
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition ${
            filterCategory === "" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
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
                active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
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
          <p className="text-gray-500 font-medium">Nenhuma publicação encontrada</p>
          <button onClick={openCreate} className="mt-3 text-blue-600 text-sm hover:underline">Criar publicação</button>
        </div>
      ) : layout === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((mat) => (
            <div key={mat.id} className="relative">
              <PostCard material={mat} onOpen={() => setViewing(mat)} showStatus accent="blue" />
              <div className="absolute top-14 right-2 flex gap-1 bg-white/90 rounded-lg shadow p-0.5">{actions(mat, "p-1")}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-50">
          {filtered.map((mat) => (
            <div key={mat.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:px-4 hover:bg-gray-50 transition">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button onClick={() => setViewing(mat)} className="w-28 sm:w-32 flex-shrink-0 rounded-lg overflow-hidden">
                  <PostThumb material={mat} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{mat.title}</p>
                  {mat.description && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{mat.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {mat.category.icon} {mat.category.name} · {formatDate(mat.createdAt)}
                    {mat.fileSize ? ` · ${formatFileSize(mat.fileSize)}` : ""}
                  </p>
                  {mat.linkedStores?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mat.linkedStores.map(({ store }) => (
                        <span key={store.id} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">{store.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2">
                {statusPill(mat)}
                <div className="flex items-center gap-0.5">{actions(mat)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h2 className="text-xl font-bold text-gray-900">{editing ? "Editar Publicação" : "Nova Publicação"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid md:grid-cols-[1fr_300px] gap-6 px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria / Aba *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Título em destaque do post"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm"
                    placeholder="Texto do post (obrigatório se não houver anexo)"
                  />
                </div>

                {/* Imagem de capa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagem de capa <span className="text-xs font-normal text-gray-400">(opcional — PDFs e vídeos geram capa automática)</span>
                  </label>
                  {cover ? (
                    <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cover.url} alt="Capa" className="w-24 aspect-video object-cover rounded" />
                      <span className="text-xs text-gray-500 flex-1 inline-flex items-center gap-1">
                        {cover.auto ? <><Wand2 className="h-3.5 w-3.5" /> Gerada automaticamente</> : "Capa definida"}
                      </span>
                      <button type="button" onClick={() => coverInput.current?.click()} className="text-xs text-blue-600 hover:underline">Trocar</button>
                      <button type="button" onClick={() => { setCover(null); manualCoverRef.current = true; }} className="text-xs text-red-500 hover:underline">Remover</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => coverInput.current?.click()}
                      disabled={!!coverBusy}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition disabled:opacity-60"
                    >
                      {coverBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                      {coverBusy === "auto" ? "Gerando capa automática…" : coverBusy === "upload" ? "Enviando imagem…" : "Escolher imagem de capa"}
                    </button>
                  )}
                  <input
                    ref={coverInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) {
                        manualCoverRef.current = true;
                        uploadCover(f, false);
                      }
                    }}
                  />
                </div>

                {/* Anexo */}
                {!editing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Anexo <span className="text-xs font-normal text-gray-400">(opcional — vídeo até 2GB, PDF, imagem, Word, PowerPoint)</span>
                    </label>
                    {file ? (
                      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setFile(null); if (cover?.auto) setCover(null); }}
                          className="text-xs text-red-500 hover:text-red-700 flex-shrink-0"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        disabled={uploadingFile}
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center text-center hover:border-blue-300 transition disabled:opacity-70"
                      >
                        {uploadingFile ? (
                          <>
                            <Loader2 className="h-7 w-7 text-blue-500 animate-spin mb-2" />
                            <p className="text-sm text-gray-600">Enviando… {fileProgress}%</p>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-blue-500 transition-all" style={{ width: `${fileProgress}%` }} />
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="h-7 w-7 text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">Clique para anexar um arquivo</p>
                          </>
                        )}
                      </button>
                    )}
                    <input
                      ref={fileInput}
                      type="file"
                      className="hidden"
                      accept="video/*,image/*,application/pdf,.doc,.docx,.ppt,.pptx"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) handleFileChosen(f);
                      }}
                    />
                  </div>
                )}

                {stores.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Visível para lojas <span className="ml-1 text-xs font-normal text-gray-400">(vazio = todas)</span>
                    </label>
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
                                linkedStoreIds: selected ? f.linkedStoreIds.filter((id) => id !== store.id) : [...f.linkedStoreIds, store.id],
                              }))
                            }
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                              selected ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"
                            }`}
                          >
                            {store.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{editing ? "Publicado" : "Publicar imediatamente"}</span>
                </label>

                {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploadingFile || coverBusy === "upload"}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition text-sm"
                  >
                    {saving ? "Salvando..." : editing ? "Salvar" : "Publicar"}
                  </button>
                </div>
              </form>

              {/* Pré-visualização */}
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pré-visualização no feed</p>
                <div className="pointer-events-none">
                  <PostCard material={previewMaterial} onOpen={() => {}} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingViews && (
        <MaterialViewsModal materialId={viewingViews.id} materialTitle={viewingViews.title} onClose={() => setViewingViews(null)} />
      )}

      {viewing && <MaterialViewer material={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
