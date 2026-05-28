"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Megaphone, Plus, X, Calendar, Eye, EyeOff, ImagePlus, Loader2 } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing-components";

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  published: boolean;
  assets: { id: string; fileName: string; fileUrl: string; fileType: string }[];
  createdAt: string;
};

export default function CampaignsPage() {
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", startDate: "", endDate: "", published: false });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("campaignImageUploader");

  useEffect(() => {
    fetch("/api/campaigns").then((r) => r.json()).then((d) => { setCampaigns(d); setLoading(false); });
  }, []);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setPendingFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }

  function removeFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function create() {
    if (!form.title || !form.startDate) return;
    setSaving(true);
    let assets: { fileUrl: string; fileKey: string; fileName: string; fileType: string }[] = [];
    if (pendingFiles.length > 0) {
      setUploading(true);
      const uploaded = await startUpload(pendingFiles);
      setUploading(false);
      if (uploaded) {
        assets = uploaded.map((u) => ({
          fileUrl: u.url,
          fileKey: u.key,
          fileName: u.name,
          fileType: "image",
        }));
      }
    }
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, assets }),
    });
    const c = await res.json();
    setCampaigns((prev) => [c, ...prev]);
    setForm({ title: "", description: "", startDate: "", endDate: "", published: false });
    setPendingFiles([]);
    setPreviews([]);
    setShowForm(false);
    setSaving(false);
  }

  async function togglePublish(campaign: Campaign) {
    const res = await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !campaign.published }),
    });
    const updated = await res.json();
    setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? { ...c, ...updated } : c)));
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Excluir esta campanha?")) return;
    await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  if (!session?.user) return null;

  return (
    <>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="h-7 w-7 text-pink-500" /> Campanhas de Marketing
            </h1>
            <p className="text-gray-500 mt-1">Crie e publique campanhas sazonais para os franqueados.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-xl hover:bg-pink-700 transition">
            <Plus className="h-4 w-4" /> Nova Campanha
          </button>
        </div>

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Nova Campanha</h2>
              <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Título da campanha" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                rows={2} placeholder="Descrição (opcional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Data de início *</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Data de término</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" className="rounded" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                Publicar imediatamente
              </label>

              {/* Image upload */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Imagens</label>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => addFiles(e.target.files)} />
                {previews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {previews.map((src, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeFile(i)}
                          className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 hover:border-pink-400 hover:bg-pink-50 transition text-gray-400 hover:text-pink-500">
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                )}
                {previews.length === 0 && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-pink-400 hover:bg-pink-50 text-sm text-gray-400 hover:text-pink-500 transition">
                    <ImagePlus className="h-4 w-4" /> Adicionar imagens
                  </button>
                )}
              </div>

              <button disabled={saving || uploading || !form.title || !form.startDate} onClick={create}
                className="w-full py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                {(saving || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
                {uploading ? "Enviando imagens..." : saving ? "Salvando..." : "Criar Campanha"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Nenhuma campanha criada ainda.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {campaigns.map((c) => (
              <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{c.title}</h3>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${c.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.published ? "Publicada" : "Rascunho"}
                  </span>
                </div>
                {c.description && <p className="text-sm text-gray-500 mb-2">{c.description}</p>}
                {c.assets.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {c.assets.map((a) => (
                      <a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer"
                        className="w-16 h-16 rounded-lg overflow-hidden border border-gray-100 hover:opacity-90 transition">
                        <img src={a.fileUrl} alt={a.fileName} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(c.startDate).toLocaleDateString("pt-BR")}
                  {c.endDate && ` — ${new Date(c.endDate).toLocaleDateString("pt-BR")}`}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => togglePublish(c)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    {c.published ? <><EyeOff className="h-3.5 w-3.5" /> Despublicar</> : <><Eye className="h-3.5 w-3.5" /> Publicar</>}
                  </button>
                  <button onClick={() => deleteCampaign(c.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition">
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
