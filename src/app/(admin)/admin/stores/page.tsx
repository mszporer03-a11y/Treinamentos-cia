"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamicImport from "next/dynamic";
import Link from "next/link";
import {
  Plus, Pencil, Trash2, Store as StoreIcon, Users, X, UserPlus, MapPin, Phone, Mail, MessageCircle,
  MessagesSquare, Search, Navigation, Loader2, Crosshair, UserRound, LocateFixed,
} from "lucide-react";
import type { MapStore } from "@/components/admin/StoreMap";

// Leaflet só roda no navegador
const StoreMap = dynamicImport(() => import("@/components/admin/StoreMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse" />,
});

interface UserRef {
  id: string;
  name: string;
  email: string;
  active?: boolean;
}

interface StoreData extends MapStore {
  address: string | null;
  contactName: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  pinColor: string | null;
  users: { user: UserRef }[];
  _count?: { employees: number };
}

interface AllUser extends UserRef {
  role: string;
}

const PIN_COLORS = ["#EA580C", "#DC2626", "#DB2777", "#7C3AED", "#2563EB", "#0891B2", "#059669", "#65A30D", "#CA8A04", "#374151"];

const EMPTY_FORM = {
  name: "",
  code: "",
  city: "",
  active: true,
  address: "",
  contactName: "",
  phone: "",
  whatsapp: "",
  email: "",
  pinColor: PIN_COLORS[0],
  lat: "",
  lng: "",
};

type FormState = typeof EMPTY_FORM;

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

function whatsappLink(raw: string) {
  let d = onlyDigits(raw);
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  return `https://wa.me/${d}`;
}

export default function StoresPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StoreData | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [managingId, setManagingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "active" | "inactive" | "nomap">("");
  const [geocoding, setGeocoding] = useState(false);
  const [chatMenu, setChatMenu] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [stRes, usRes] = await Promise.all([fetch("/api/stores"), fetch("/api/users")]);
    const [sts, us] = await Promise.all([stRes.json(), usRes.json()]);
    setStores(Array.isArray(sts) ? sts : []);
    setAllUsers(Array.isArray(us) ? us.filter((u: AllUser) => u.role === "FRANCHISEE") : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return stores.filter(
      (s) =>
        (!q ||
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          (s.city ?? "").toLowerCase().includes(q) ||
          (s.contactName ?? "").toLowerCase().includes(q) ||
          s.users.some((u) => u.user.name.toLowerCase().includes(q))) &&
        (!status ||
          (status === "active" && s.active) ||
          (status === "inactive" && !s.active) ||
          (status === "nomap" && (s.lat == null || s.lng == null)))
    );
  }, [stores, search, status]);

  const mappedCount = stores.filter((s) => s.lat != null && s.lng != null).length;
  const managingStore = stores.find((s) => s.id === managingId) ?? null;

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  }

  function openEdit(s: StoreData) {
    setEditing(s);
    setForm({
      name: s.name,
      code: s.code,
      city: s.city ?? "",
      active: s.active,
      address: s.address ?? "",
      contactName: s.contactName ?? "",
      phone: s.phone ?? "",
      whatsapp: s.whatsapp ?? "",
      email: s.email ?? "",
      pinColor: s.pinColor ?? PIN_COLORS[0],
      lat: s.lat?.toString() ?? "",
      lng: s.lng?.toString() ?? "",
    });
    setError("");
    setShowForm(true);
  }

  async function geocode() {
    const q = [form.address, form.city].filter(Boolean).join(", ");
    if (!q) return setError("Preencha o endereço ou a cidade para buscar no mapa");
    setGeocoding(true);
    setError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&accept-language=pt-BR&q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        setForm((f) => ({ ...f, lat: Number(data[0].lat).toFixed(6), lng: Number(data[0].lon).toFixed(6) }));
      } else {
        setError("Endereço não encontrado. Clique no mapa para posicionar o pin manualmente.");
      }
    } catch {
      setError("Não foi possível buscar o endereço agora. Clique no mapa para posicionar o pin.");
    } finally {
      setGeocoding(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const lat = form.lat.trim() === "" ? null : Number(form.lat.replace(",", "."));
    const lng = form.lng.trim() === "" ? null : Number(form.lng.replace(",", "."));
    if ((lat !== null && Number.isNaN(lat)) || (lng !== null && Number.isNaN(lng))) {
      setSaving(false);
      return setError("Latitude/longitude inválidas");
    }
    const body = {
      name: form.name.trim(),
      code: form.code.trim(),
      city: form.city.trim() || null,
      active: form.active,
      address: form.address.trim() || null,
      contactName: form.contactName.trim() || null,
      phone: form.phone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      pinColor: form.pinColor,
      lat,
      lng,
    };
    const res = await fetch(editing ? `/api/stores/${editing.id}` : "/api/stores", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Erro ao salvar");
      return;
    }
    await fetchData();
    setShowForm(false);
  }

  async function handleDelete(s: StoreData) {
    if (!confirm(`Excluir a loja "${s.name}"?\n\nFuncionários, escalas, alertas e checklists dessa loja também serão removidos.`)) return;
    const res = await fetch(`/api/stores/${s.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Erro ao excluir loja");
    }
    await fetchData();
  }

  async function addUser(storeId: string, userId: string) {
    await fetch(`/api/stores/${storeId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await fetchData();
  }

  async function removeUser(storeId: string, userId: string) {
    await fetch(`/api/stores/${storeId}/users?userId=${userId}`, { method: "DELETE" });
    await fetchData();
  }

  const draft =
    showForm && form.lat && form.lng && !Number.isNaN(Number(form.lat)) && !Number.isNaN(Number(form.lng))
      ? { lat: Number(form.lat), lng: Number(form.lng), color: form.pinColor, label: form.code || "?" }
      : null;

  const input = "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Lojas da Rede</h1>
          <p className="text-gray-500 text-sm mt-1">
            {stores.length} loja{stores.length !== 1 ? "s" : ""} · {stores.filter((s) => s.active).length} ativa{stores.filter((s) => s.active).length !== 1 ? "s" : ""} ·{" "}
            {mappedCount} no mapa
          </p>
        </div>
        <button onClick={openCreate} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-sm">
          <Plus className="h-4 w-4" />
          Nova Loja
        </button>
      </div>

      {/* Mapa interativo */}
      <div className="relative mb-5 rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white h-[340px] sm:h-[420px] z-0">
        {!loading && (
          <StoreMap stores={filtered} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); document.getElementById(`store-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }} />
        )}
        {!loading && mappedCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500]">
            <div className="bg-white/95 rounded-xl px-4 py-3 shadow text-sm text-gray-600 text-center">
              <MapPin className="h-5 w-5 mx-auto text-orange-500 mb-1" />
              Nenhuma loja posicionada ainda.<br />Edite uma loja e busque o endereço ou clique no mapa.
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, código, cidade, responsável ou franqueado..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {([["", "Todas"], ["active", "Ativas"], ["inactive", "Inativas"], ["nomap", "Sem localização"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setStatus(v)}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold border transition ${status === v ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl">
          <StoreIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">{stores.length === 0 ? "Nenhuma loja cadastrada ainda" : "Nenhuma loja encontrada"}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((store) => {
            const color = store.pinColor ?? PIN_COLORS[0];
            const hasMap = store.lat != null && store.lng != null;
            const franchisees = store.users.map((u) => u.user);
            return (
              <article
                key={store.id}
                id={`store-${store.id}`}
                className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition hover:shadow-lg ${selectedId === store.id ? "ring-2 ring-offset-2" : "border-gray-100"}`}
                style={selectedId === store.id ? ({ "--tw-ring-color": color } as React.CSSProperties) : undefined}
              >
                <div className="h-1.5" style={{ background: color }} />
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0 shadow-sm" style={{ background: color }}>
                      {store.code.slice(0, 4).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 leading-tight truncate">{store.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {store.code}{store.city ? ` · ${store.city}` : ""}
                      </p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${store.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {store.active ? "Ativa" : "Inativa"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 text-sm">
                    {store.address && (
                      <p className="flex items-start gap-2 text-gray-600"><MapPin className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" /><span className="line-clamp-2">{store.address}</span></p>
                    )}
                    {store.contactName && (
                      <p className="flex items-center gap-2 text-gray-600"><UserRound className="h-4 w-4 text-gray-400 flex-shrink-0" /><span className="truncate">{store.contactName}</span></p>
                    )}
                    {store.phone && (
                      <p className="flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />{store.phone}</p>
                    )}
                    {store.email && (
                      <p className="flex items-center gap-2 text-gray-600"><Mail className="h-4 w-4 text-gray-400 flex-shrink-0" /><span className="truncate">{store.email}</span></p>
                    )}
                    {!store.address && !store.contactName && !store.phone && !store.email && (
                      <button onClick={() => openEdit(store)} className="text-xs text-blue-600 hover:underline">+ Adicionar contato e endereço da loja</button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-4">
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {franchisees.length} franqueado{franchisees.length !== 1 ? "s" : ""}</span>
                    {store._count && <span>· {store._count.employees} funcionário{store._count.employees !== 1 ? "s" : ""}</span>}
                  </div>
                  {franchisees.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {franchisees.slice(0, 4).map((u) => (
                        <span key={u.id} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{u.name}</span>
                      ))}
                      {franchisees.length > 4 && <span className="text-[11px] text-gray-400">+{franchisees.length - 4}</span>}
                    </div>
                  )}

                  {/* Contato direto com a loja */}
                  <div className="grid grid-cols-4 gap-1.5 mt-4 pt-4 border-t border-gray-100 relative">
                    <a href={store.whatsapp ? whatsappLink(store.whatsapp) : undefined} target="_blank" rel="noopener noreferrer"
                      aria-disabled={!store.whatsapp} title={store.whatsapp ? `WhatsApp ${store.whatsapp}` : "Sem WhatsApp cadastrado"}
                      className={`flex flex-col items-center gap-0.5 py-2 rounded-lg text-[11px] font-medium transition ${store.whatsapp ? "text-green-700 hover:bg-green-50" : "text-gray-300 pointer-events-none"}`}>
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                    <a href={store.phone ? `tel:${onlyDigits(store.phone)}` : undefined} aria-disabled={!store.phone}
                      className={`flex flex-col items-center gap-0.5 py-2 rounded-lg text-[11px] font-medium transition ${store.phone ? "text-gray-700 hover:bg-gray-50" : "text-gray-300 pointer-events-none"}`}>
                      <Phone className="h-4 w-4" /> Ligar
                    </a>
                    <a href={store.email ? `mailto:${store.email}` : undefined} aria-disabled={!store.email}
                      className={`flex flex-col items-center gap-0.5 py-2 rounded-lg text-[11px] font-medium transition ${store.email ? "text-gray-700 hover:bg-gray-50" : "text-gray-300 pointer-events-none"}`}>
                      <Mail className="h-4 w-4" /> E-mail
                    </a>
                    {franchisees.length <= 1 ? (
                      <Link
                        href={franchisees[0] ? `/admin/chat?franchiseeId=${franchisees[0].id}&storeId=${store.id}` : "#"}
                        aria-disabled={!franchisees[0]}
                        title={franchisees[0] ? "Abrir o canal exclusivo da loja" : "Vincule um franqueado para abrir o canal"}
                        className={`flex flex-col items-center gap-0.5 py-2 rounded-lg text-[11px] font-medium transition ${franchisees[0] ? "text-blue-700 hover:bg-blue-50" : "text-gray-300 pointer-events-none"}`}
                      >
                        <MessagesSquare className="h-4 w-4" /> Chat
                      </Link>
                    ) : (
                      <button onClick={() => setChatMenu(chatMenu === store.id ? null : store.id)}
                        className="flex flex-col items-center gap-0.5 py-2 rounded-lg text-[11px] font-medium text-blue-700 hover:bg-blue-50 transition">
                        <MessagesSquare className="h-4 w-4" /> Chat
                      </button>
                    )}
                    {chatMenu === store.id && (
                      <div className="absolute right-0 bottom-full mb-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-1 z-20">
                        <p className="px-2 py-1 text-[10px] uppercase font-semibold text-gray-400">Canal da loja com</p>
                        {franchisees.map((u) => (
                          <Link key={u.id} href={`/admin/chat?franchiseeId=${u.id}&storeId=${store.id}`}
                            className="block px-2 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-blue-50 truncate">
                            {u.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setManagingId(store.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600">
                      <UserPlus className="h-3.5 w-3.5" /> Franqueados
                    </button>
                    <button onClick={() => (hasMap ? setSelectedId(store.id) : openEdit(store))} title={hasMap ? "Ver no mapa" : "Definir localização"}
                      className={`p-1.5 rounded-lg transition ${hasMap ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50" : "text-amber-500 hover:bg-amber-50"}`}>
                      {hasMap ? <LocateFixed className="h-4 w-4" /> : <Crosshair className="h-4 w-4" />}
                    </button>
                    {hasMap && (
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`} target="_blank" rel="noopener noreferrer"
                        title="Como chegar" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Navigation className="h-4 w-4" />
                      </a>
                    )}
                    <button onClick={() => openEdit(store)} title="Editar" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(store)} title="Excluir" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Criar / editar loja */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-[1000] flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-4xl shadow-xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h2 className="text-lg font-bold text-gray-900">{editing ? "Editar Loja" : "Nova Loja"}</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6 px-6 pb-6">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dados da loja</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={input} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                    <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required className={input} placeholder="SP001" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={input} placeholder="São Paulo - SP" />
                </div>

                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Contato da loja</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                  <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={input} placeholder="Nome do gerente/responsável" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} placeholder="(11) 3333-4444" inputMode="tel" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                    <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={input} placeholder="(11) 98888-7777" inputMode="tel" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail da loja</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} placeholder="loja@ciadochurrasco.com.br" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" />
                  <span className="text-sm text-gray-700">Loja ativa</span>
                </label>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Localização e pin no mapa</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <div className="flex gap-2">
                    <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={input} placeholder="Rua, número, bairro" />
                    <button type="button" onClick={geocode} disabled={geocoding}
                      className="px-3 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5 disabled:opacity-60 whitespace-nowrap">
                      {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar
                    </button>
                  </div>
                </div>
                <div className="h-56 rounded-xl overflow-hidden border border-gray-200 relative z-0">
                  <StoreMap stores={stores.filter((s) => s.id !== editing?.id)} placing onPlace={(lat, lng) => setForm((f) => ({ ...f, lat: String(lat), lng: String(lng) }))} draft={draft} />
                </div>
                <p className="text-[11px] text-gray-400 -mt-2">Clique no mapa ou arraste o pin para ajustar a posição.</p>
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} className={input} placeholder="Latitude" inputMode="decimal" />
                  <input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} className={input} placeholder="Longitude" inputMode="decimal" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cor do pin</label>
                  <div className="flex flex-wrap items-center gap-2">
                    {PIN_COLORS.map((c) => (
                      <button key={c} type="button" onClick={() => setForm({ ...form, pinColor: c })} aria-label={`Cor ${c}`}
                        className={`w-7 h-7 rounded-full border-2 transition ${form.pinColor.toLowerCase() === c.toLowerCase() ? "border-gray-900 scale-110" : "border-white shadow"}`}
                        style={{ background: c }} />
                    ))}
                    <label className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 overflow-hidden cursor-pointer relative" title="Cor personalizada">
                      <input type="color" value={form.pinColor} onChange={(e) => setForm({ ...form, pinColor: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <span className="block w-full h-full" style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }} />
                    </label>
                  </div>
                </div>
              </div>

              {error && <p className="md:col-span-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="md:col-span-2 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-60 transition">
                  {saving ? "Salvando…" : editing ? "Salvar" : "Criar loja"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Franqueados da loja */}
      {managingStore && (
        <div className="fixed inset-0 bg-black/40 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Franqueados — {managingStore.name}</h2>
              <button onClick={() => setManagingId(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Vinculados</p>
            {managingStore.users.length === 0 ? (
              <p className="text-sm text-gray-400 mb-4">Nenhum franqueado vinculado</p>
            ) : (
              <div className="space-y-2 mb-4">
                {managingStore.users.map((su) => (
                  <div key={su.user.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{su.user.name}</p>
                      <p className="text-xs text-gray-500">{su.user.email}</p>
                    </div>
                    <button onClick={() => removeUser(managingStore.id, su.user.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Adicionar</p>
            <div className="overflow-y-auto flex-1 space-y-1.5">
              {allUsers
                .filter((u) => !managingStore.users.some((su) => su.user.id === u.id))
                .map((u) => (
                  <button key={u.id} onClick={() => addUser(managingStore.id, u.id)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-blue-50 rounded-xl transition text-left">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <UserPlus className="h-4 w-4 text-blue-500" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
