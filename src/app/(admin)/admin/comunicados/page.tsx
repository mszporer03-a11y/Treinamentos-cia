"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import { Megaphone, Plus, Trash2, Loader2, Paperclip, X, Eye, FileText, Play, File } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-components";
import { formatDate } from "@/lib/utils";
import { PdfThumbnail } from "@/components/PdfPreview";
import { MaterialViewer } from "@/components/franchisee/MaterialViewer";
import { comunicadoFileKind, comunicadoToViewer } from "@/components/franchisee/ComunicadoCard";

interface Comunicado {
  id: string;
  title: string;
  body: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  published: boolean;
  createdAt: string;
  createdBy?: { name: string } | null;
  _count?: { views: number };
}

export default function AdminComunicadosPage() {
  const [items, setItems] = useState<Comunicado[]>([]);
  const [viewing, setViewing] = useState<Comunicado | null>(null);
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
    const kind = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)
      ? "image"
      : ext === "pdf"
        ? "pdf"
        : ["mp4", "mov", "webm", "m4v"].includes(ext)
          ? "video"
          : "document";

    const res = await fetch("/api/comunicados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        fileUrl: pendingFile?.url,
        fileKey: pendingFile?.key,
        fileName: pendingFile?.name,
        fileType: pendingFile ? kind : undefined,
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
            <Megaphone className="h-6 w-6 text-sky-500" /> Novidades e Comunicados
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Publique novidades para toda a rede: aparecem como card em destaque (com título e a 1ª página do PDF) e enviam notificação push
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => {
            const kind = comunicadoFileKind(item);
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                {item.fileUrl && (
                  <button
                    onClick={() => setViewing(item)}
                    className="block w-full text-left group focus:outline-none"
                    title="Abrir anexo"
                  >
                    {kind === "IMAGE" ? (
                      <div className="aspect-video bg-gray-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.fileUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : kind === "PDF" ? (
                      <PdfThumbnail url={item.fileUrl} className="aspect-video group-hover:opacity-90 transition-opacity" />
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-sky-600 to-sky-500 flex flex-col items-center justify-center gap-1 text-white/90">
                        {kind === "VIDEO" ? (
                          <Play className="h-12 w-12" />
                        ) : kind === "DOCUMENT" ? (
                          <FileText className="h-12 w-12" />
                        ) : (
                          <File className="h-12 w-12" />
                        )}
                        <span className="text-xs font-medium opacity-80 px-4 truncate max-w-full">{item.fileName ?? "Anexo"}</span>
                      </div>
                    )}
                  </button>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-gray-900 leading-snug">{item.title}</p>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0 -mt-1 -mr-1.5"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed line-clamp-4">{item.body}</p>
                  <div className="flex items-center gap-3 mt-auto pt-3 text-xs text-gray-400">
                    <span>{formatDate(item.createdAt)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {item._count?.views ?? 0} leram
                    </span>
                    {item.fileUrl && (
                      <span className="inline-flex items-center gap-1 ml-auto text-sky-600">
                        <Paperclip className="h-3 w-3" /> Anexo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
                  placeholder="Ex.: Nova campanha de verão"
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
                    {uploading ? "Enviando arquivo…" : "Anexar imagem, PDF, vídeo ou documento"}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx"
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

      {viewing && <MaterialViewer material={comunicadoToViewer(viewing)} onClose={() => setViewing(null)} />}
    </div>
  );
}
