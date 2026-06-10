"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  Megaphone,
  CheckCircle2,
  Eye,
  Clock,
  Calendar,
  Plus,
  ExternalLink,
  Image as ImageIcon,
  ChevronLeft,
} from "lucide-react";

type StoreRef = { id: string; name: string; code: string };

type Alert = {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  dueDate: string | null;
  resolution: string | null;
  createdAt: string;
  store: StoreRef;
};

type CampaignAsset = { id: string; fileName: string; fileUrl: string; fileType: string };

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  published: boolean;
  assets: CampaignAsset[];
  createdAt: string;
};

const SEV_CONFIG: Record<string, { color: string; label: string; dot: string }> = {
  LOW:      { color: "bg-gray-100 text-gray-600",     label: "Baixa",   dot: "bg-gray-400" },
  MEDIUM:   { color: "bg-yellow-100 text-yellow-700", label: "Média",   dot: "bg-yellow-400" },
  HIGH:     { color: "bg-orange-100 text-orange-700", label: "Alta",    dot: "bg-orange-500" },
  CRITICAL: { color: "bg-red-100 text-red-700",       label: "Crítica", dot: "bg-red-500" },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminNotificacoesPage() {
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"alertas" | "campanhas">("alertas");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/alerts").then((r) => r.json()),
      fetch("/api/campaigns").then((r) => r.json()),
    ]).then(([a, c]) => {
      setAlerts(Array.isArray(a) ? a : []);
      setCampaigns(Array.isArray(c) ? c : []);
      setLoading(false);
    });
  }, []);

  async function updateAlertStatus(id: string, status: string) {
    setUpdating(id);
    await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: status as Alert["status"] } : a)));
    setUpdating(null);
  }

  if (!session?.user) return null;

  const openAlerts = alerts.filter((a) => a.status !== "RESOLVED");
  const resolvedAlerts = alerts.filter((a) => a.status === "RESOLVED");
  const publishedCampaigns = campaigns.filter((c) => c.published);
  const draftCampaigns = campaigns.filter((c) => !c.published);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-rose-500 flex items-center justify-center shadow-sm">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notificações</h1>
            <p className="text-sm text-gray-500">
              {loading ? "Carregando..." : `${openAlerts.length} alerta${openAlerts.length !== 1 ? "s" : ""} aberto${openAlerts.length !== 1 ? "s" : ""} · ${campaigns.length} campanha${campaigns.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/alerts"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition">
            <AlertTriangle className="h-3.5 w-3.5" /> Ver todos os alertas
          </Link>
          <Link href="/admin/campaigns"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-100 rounded-lg hover:bg-purple-100 transition">
            <Megaphone className="h-3.5 w-3.5" /> Campanhas
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab("alertas")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${
            tab === "alertas" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Alertas
          {openAlerts.length > 0 && (
            <span className="ml-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {openAlerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("campanhas")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${
            tab === "campanhas" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Megaphone className="h-3.5 w-3.5" />
          Campanhas
          {campaigns.length > 0 && (
            <span className="ml-1 min-w-[18px] h-[18px] bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {campaigns.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : tab === "alertas" ? (
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="flex gap-2">
            <Link href="/admin/alerts"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-xl hover:bg-orange-700 transition">
              <Plus className="h-3.5 w-3.5" /> Novo Alerta
            </Link>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl">✅</span>
              <p className="text-gray-500 mt-4 font-medium">Nenhum alerta registrado.</p>
            </div>
          ) : (
            <>
              {/* Open alerts */}
              {openAlerts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Abertos / Em andamento ({openAlerts.length})
                  </p>
                  <div className="space-y-2">
                    {openAlerts.map((alert) => {
                      const sev = SEV_CONFIG[alert.severity] ?? SEV_CONFIG.MEDIUM;
                      return (
                        <div key={alert.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${sev.dot}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sev.color}`}>{sev.label}</span>
                                <span className="text-xs text-gray-400">{alert.store.name}</span>
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ml-auto ${
                                  alert.status === "OPEN"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}>
                                  {alert.status === "OPEN" ? "Aberto" : "Reconhecido"}
                                </span>
                              </div>
                              <p className="font-semibold text-gray-900 text-sm">{alert.title}</p>
                              <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{alert.description}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {fmtDate(alert.createdAt)}
                                </span>
                                {alert.dueDate && (
                                  <span className="flex items-center gap-1 text-orange-500">
                                    <Calendar className="h-3 w-3" /> Prazo: {fmtDate(alert.dueDate)}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2 mt-3">
                                {alert.status === "OPEN" && (
                                  <button
                                    onClick={() => updateAlertStatus(alert.id, "ACKNOWLEDGED")}
                                    disabled={updating === alert.id}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                                  >
                                    <Eye className="h-3 w-3" /> Reconhecer
                                  </button>
                                )}
                                <button
                                  onClick={() => updateAlertStatus(alert.id, "RESOLVED")}
                                  disabled={updating === alert.id}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 border border-green-100 rounded-lg hover:bg-green-50 disabled:opacity-50 transition"
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Resolver
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {resolvedAlerts.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600">
                    Resolvidos ({resolvedAlerts.length})
                  </summary>
                  <div className="mt-2 space-y-2">
                    {resolvedAlerts.map((alert) => {
                      const sev = SEV_CONFIG[alert.severity] ?? SEV_CONFIG.MEDIUM;
                      return (
                        <div key={alert.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 opacity-70">
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sev.color}`}>{sev.label}</span>
                            <p className="text-sm font-medium text-gray-700 flex-1 truncate">{alert.title}</p>
                            <span className="text-xs text-gray-400">{alert.store.name}</span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </>
          )}
        </div>
      ) : (
        /* Campanhas tab */
        <div className="space-y-4">
          <div className="flex gap-2">
            <Link href="/admin/campaigns"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-xl hover:bg-purple-700 transition">
              <Plus className="h-3.5 w-3.5" /> Nova Campanha
            </Link>
          </div>

          {draftCampaigns.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Rascunhos ({draftCampaigns.length})</p>
              <div className="space-y-2">
                {draftCampaigns.map((c) => (
                  <CampaignCard key={c.id} campaign={c} />
                ))}
              </div>
            </div>
          )}

          {publishedCampaigns.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Publicadas ({publishedCampaigns.length})</p>
              <div className="space-y-2">
                {publishedCampaigns.map((c) => (
                  <CampaignCard key={c.id} campaign={c} />
                ))}
              </div>
            </div>
          )}

          {campaigns.length === 0 && (
            <div className="text-center py-16">
              <span className="text-5xl">📢</span>
              <p className="text-gray-500 mt-4 font-medium">Nenhuma campanha criada ainda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {campaign.assets.length > 0 && (
        <div className="flex gap-1 p-2 overflow-x-auto">
          {campaign.assets.slice(0, 4).map((asset) => (
            <a key={asset.id} href={asset.fileUrl} target="_blank" rel="noopener noreferrer"
              className="group flex-shrink-0 relative">
              {asset.fileType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset.fileUrl} alt={asset.fileName}
                  className="h-24 w-24 object-cover rounded-xl" />
              ) : (
                <div className="h-24 w-24 bg-gray-100 rounded-xl flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <ExternalLink className="h-4 w-4 text-white" />
              </div>
            </a>
          ))}
        </div>
      )}
      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-gray-900 text-sm flex-1">{campaign.title}</p>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            campaign.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          }`}>
            {campaign.published ? "Publicada" : "Rascunho"}
          </span>
        </div>
        {campaign.description && (
          <p className="text-xs text-gray-500 leading-relaxed">{campaign.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {fmtDate(campaign.startDate)}
          </span>
          {campaign.assets.length > 0 && (
            <span>{campaign.assets.length} arquivo{campaign.assets.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </div>
  );
}
