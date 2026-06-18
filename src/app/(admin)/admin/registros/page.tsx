"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { ClipboardList, Plus, X, Trash2, Paperclip, Loader2, Eye } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-components";
import { formatDate } from "@/lib/utils";

type Store = { id: string; name: string; code: string };
type Alert = {
  id: string;
  title: string;
  description: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  createdAt: string;
  store: Store;
  _count?: { views: number };
};
type Viewer = {
  id: string;
  viewedAt: string;
  user: { id: string; name: string; email: string };
};

export default function AdminRegistrosPage() {
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [storeId, setStoreId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pendingFile, setPendingFile] = useState<{ url: string; key: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewersFor, setViewersFor] = useState<string | null>(null);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("chatAttachment", {
    onClientUploadComplete: (res) => {
      const file = res?.[0];
      if (file) setPendingFile({ url: file.url, key: file.key, name: file.name });
      setUploading(false);
    },
    onUploadError: () => setUploading(false),
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/alerts").then((r) => r.json()),
      fetch("/api/stores").then((r) => r.json()),
    ]).then(([a, s]) => {
      setAlerts(Array.isArray(a) ? a : []);
      setStores(Array.isArray(s) ? s : []);
      setLoading(false);
    });
  }, []);

  async function create() {
    if (!storeId || !title.trim() || !description.trim()) return;
    setSaving(true);
    const ext = pendingFile?.name.split(".").pop()?.toLowerCase() ?? "";
    const isImg = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        title: title.trim(),
        description: description.trim(),
        fileUrl: pendingFile?.url,
        fileKey: pendingFile?.key,
        fileName: pendingFile?.name,
        fileType: pendingFile ? (isImg ? "image" : "document") : undefined,
      }),
    });
    if (res.ok) {
      const a = await res.json();
      setAlerts((prev) => [{ ...a, _count: { views: 0 } }, ...prev]);
      setStoreId("");
      setTitle("");
      setDescription("");
      setPendingFile(null);
      setShowForm(false);
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Excluir este registro?")) return;
    const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    if (res.ok) setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  async function openViewers(id: string) {
    setViewersFor(id);
    setViewers([]);
    const res = await fetch(`/api/alerts/${id}/views`);
    if (res.ok) setViewers(await res.json());
  }

  if (!session?.user) return null;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-orange-500" /> Registros
          </h1>
          <p className="text-gray-500 text-sm mt-1">Registre ocorrências por loja para o franqueado visualizar.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-xl hover:bg-orange-700 transition"
        >
          <Plus className="h-4 w-4" /> Novo registro
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Novo registro</h2>
            <button onClick={() => setShowForm(false)}>
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <div className="space-y-3">
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
            >
              <option value="">Selecionar loja...</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Título do registro"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              rows={3}
              placeholder="Descrição detalhada"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {pendingFile ? (
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                <Paperclip className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate flex-1">{pendingFile.name}</span>
                <button type="button" onClick={() => setPendingFile(null)} className="text-gray-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-orange-400 hover:text-orange-600 transition w-full justify-center"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                {uploading ? "Enviando arquivo…" : "Anexar mídia (opcional)"}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setUploading(true);
                  startUpload([file]);
                }
                e.target.value = "";
              }}
            />
            <button
              disabled={saving || uploading || !storeId || !title.trim() || !description.trim()}
              onClick={create}
              className="w-full py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 transition"
            >
              {saving ? "Salvando..." : "Criar registro"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum registro ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{a.title}</p>
                    <span className="text-xs text-gray-400">· {a.store.name}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 whitespace-pre-wrap">{a.description}</p>
                  {a.fileUrl && (
                    <a
                      href={a.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs text-orange-600 hover:underline"
                    >
                      <Paperclip className="h-3 w-3" /> {a.fileName ?? "Anexo"}
                    </a>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-gray-400">{formatDate(a.createdAt)}</span>
                    <button
                      onClick={() => openViewers(a.id)}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600"
                    >
                      <Eye className="h-3 w-3" /> {a._count?.views ?? 0} viram
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => remove(a.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Viewers modal */}
      {viewersFor && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setViewersFor(null)}>
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Quem visualizou</h2>
              <button onClick={() => setViewersFor(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            {viewers.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">Ninguém visualizou ainda.</p>
            ) : (
              <div className="space-y-2">
                {viewers.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                    <span className="text-gray-800">{v.user.name}</span>
                    <span className="text-xs text-gray-400">{formatDate(v.viewedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
