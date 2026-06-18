"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import { Megaphone, Plus, Trash2, Loader2, Paperclip, X, Eye } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-components";
import { formatDate } from "@/lib/utils";

interface Comunicado {
  id: string;
  title: string;
  body: string;
  fileUrl: string | null;
  fileName: string | null;
  published: boolean;
  createdAt: string;
  createdBy?: { name: string } | null;
  _count?: { views: number };
}

export default function AdminComunicadosPage() {
  const [items, setItems] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pendingFile, setPendingFile] = useState<{ url: string; key: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("chatAttachment", {
    onClientUploadComplete: (res) => {
      const file = res?.[0];
      if (file) setPendingFile({ url: file.url, key: file.key, name: file.name });
      setUploading(false);
    },
    onUploadError: () => {
      setUploading(false);
      setError("Falha no upload do arquivo");
    },
  });

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/comunicados");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreate() {
    setTitle("");
    setBody("");
    setPendingFile(null);
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    setError("");

    const ext = pendingFile?.name.split(".").pop()?.toLowerCase() ?? "";
    const isImg = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);

    const res = await fetch("/api/comunicados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        fileUrl: pendingFile?.url,
        fileKey: pendingFile?.key,
        fileName: pendingFile?.name,
        fileType: pendingFile ? (isImg ? "image" : "document") : undefined,
        published: true,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.formErrors?.[0] ?? "Erro ao publicar comunicado");
      return;
    }
    setShowModal(false);
    await fetchData();
  }

  async function handleDelete(item: Comunicado) {
    if (!confirm(`Excluir o comunicado "${item.title}"?`)) return;
    const res = await fetch(`/api/comunicados/${item.id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((c) => c.id !== item.id));
    else alert("Erro ao excluir comunicado");
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-sky-500" /> Comunicados
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Avisos gerais enviados para toda a rede (com notificação push)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition text-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo comunicado</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum comunicado publicado ainda</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{item.body}</p>
                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs text-sky-600 hover:underline"
                    >
                      <Paperclip className="h-3 w-3" /> {item.fileName ?? "Anexo"}
                    </a>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span>{formatDate(item.createdAt)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {item._count?.views ?? 0} leram
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item)}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Novo comunicado</h2>
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                  placeholder="Aviso importante"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem *</label>
                <textarea
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm resize-none"
                  placeholder="Escreva o comunicado para a rede…"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anexo <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                {pendingFile ? (
                  <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-sky-200">
                    <Paperclip className="h-4 w-4 text-sky-600 flex-shrink-0" />
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
                    className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-sky-400 hover:text-sky-600 transition w-full justify-center"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                    {uploading ? "Enviando arquivo…" : "Anexar imagem ou documento"}
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
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

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
                  disabled={saving || uploading || !title.trim() || !body.trim()}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-medium rounded-lg transition text-sm"
                >
                  {saving ? "Publicando..." : "Publicar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
