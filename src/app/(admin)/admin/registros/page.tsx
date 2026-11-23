"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ClipboardList, Plus, X, Trash2, Eye } from "lucide-react";
import { postAttachments } from "@/lib/attachments";
import { MaterialViewer } from "@/components/franchisee/MaterialViewer";
import { AttachmentMosaic } from "@/components/attachments/AttachmentMosaic";
import { AttachmentPicker } from "@/components/attachments/AttachmentPicker";
import { useAttachmentUploader } from "@/components/attachments/useAttachmentUploader";
import { formatDate } from "@/lib/utils";

type Store = { id: string; name: string; code: string };
type Alert = {
  id: string;
  title: string;
  description: string;
  fileUrl: string | null;
  attachments?: unknown;
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
  const uploader = useAttachmentUploader("chatAttachment");
  const uploading = uploader.busy;
  const [viewing, setViewing] = useState<Alert | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewersFor, setViewersFor] = useState<string | null>(null);
  const [viewers, setViewers] = useState<Viewer[]>([]);
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
    if (!storeId || !title.trim() || !description.trim() || uploading) return;
    setSaving(true);
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        title: title.trim(),
        description: description.trim(),
        attachments: uploader.attachments,
      }),
    });
    if (res.ok) {
      const a = await res.json();
      setAlerts((prev) => [{ ...a, _count: { views: 0 } }, ...prev]);
      setStoreId("");
      setTitle("");
      setDescription("");
      uploader.reset();
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
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Mídias (opcional — fotos, vídeos, PDFs; vários arquivos)</label>
              <AttachmentPicker uploader={uploader} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" />
            </div>
            <button
              disabled={saving || uploading || !storeId || !title.trim() || !description.trim()}
              onClick={create}
              className="w-full py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 transition"
            >
              {saving ? "Salvando..." : uploading ? "Enviando arquivos..." : "Criar registro"}
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
                  {postAttachments(a).length > 0 && (
                    <div className="mt-2 max-w-sm">
                      <AttachmentMosaic attachments={postAttachments(a)} onOpen={() => setViewing(a)} />
                    </div>
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
      {viewing && (
        <MaterialViewer
          material={{
            id: viewing.id,
            title: viewing.title,
            body: viewing.description,
            fileUrl: viewing.fileUrl,
            fileType: "OTHER",
            attachments: postAttachments(viewing),
          }}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
