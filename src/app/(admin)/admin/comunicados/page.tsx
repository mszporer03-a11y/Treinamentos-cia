"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Megaphone, Plus, Trash2, Paperclip, X, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { postAttachments } from "@/lib/attachments";
import { MaterialViewer } from "@/components/franchisee/MaterialViewer";
import { comunicadoToViewer } from "@/components/franchisee/ComunicadoCard";
import { AttachmentMosaic } from "@/components/attachments/AttachmentMosaic";
import { AttachmentPicker } from "@/components/attachments/AttachmentPicker";
import { useAttachmentUploader } from "@/components/attachments/useAttachmentUploader";

interface Comunicado {
  id: string;
  title: string;
  body: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  attachments?: unknown;
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
  const uploader = useAttachmentUploader("chatAttachment");
  const uploading = uploader.busy;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    uploader.reset();
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim() || uploading) return;
    setSaving(true);
    setError("");

    const res = await fetch("/api/comunicados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        attachments: uploader.attachments,
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
            const attachments = postAttachments(item);
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                {attachments.length > 0 && (
                  <AttachmentMosaic attachments={attachments} onOpen={() => setViewing(item)} className="rounded-none" />
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
                    {attachments.length > 0 && (
                      <span className="inline-flex items-center gap-1 ml-auto text-sky-600">
                        <Paperclip className="h-3 w-3" /> {attachments.length > 1 ? `${attachments.length} anexos` : "Anexo"}
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
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg p-6 max-h-[95vh] overflow-y-auto">
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
                  Anexos <span className="text-gray-400 font-normal">(opcional — vários arquivos)</span>
                </label>
                <AttachmentPicker
                  uploader={uploader}
                  accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                  hint="Imagens, PDFs, vídeos ou documentos — vários de uma vez"
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
                  {saving ? "Publicando..." : uploading ? "Enviando arquivos..." : "Publicar"}
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
