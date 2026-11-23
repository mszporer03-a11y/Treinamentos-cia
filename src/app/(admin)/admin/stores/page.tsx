"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamicImport from "next/dynamic";
import {
  Plus, Pencil, Trash2, Store as StoreIcon, Users, X, UserPlus, Phone, MapPin, Search, Crosshair, Loader2,
} from "lucide-react";

// Leaflet só roda no cliente
const StoreMap = dynamicImport(() => import("@/components/admin/StoreMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse" />,
});

interface UserRef {
  id: string;
  name: string;
  email: string;
}

interface StoreUser {
  user: UserRef;
}

interface StoreData {
  id: string;
  name: string;
  code: string;
  city: string | null;
  contactName: string | null;
  contactPhone: string | null;
  lat: number | null;
  lng: number | null;
  active: boolean;
  users: StoreUser[];
}

interface AllUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const DEFAULT_FORM = {
  name: "", code: "", city: "", contactName: "", contactPhone: "", lat: "", lng: "", active: true,
};

// Payload da API: campos de contato vazios viram null; coordenadas viram número
function toPayload(f: typeof DEFAULT_FORM) {
  const lat = parseFloat(f.lat.replace(",", "."));
  const lng = parseFloat(f.lng.replace(",", "."));
  return {
    name: f.name,
    code: f.code,
    active: f.active,
    city: f.city || undefined,
    contactName: f.contactName.trim() || null,
    contactPhone: f.contactPhone.trim() || null,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
}

function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length <= 11 ? "55" + digits : digits}`;
}

type StatusFilter = "all" | "active" | "inactive" | "nomap";

export default function StoresPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<StoreData | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState("");
  const [managingStore, setManagingStore] = useState<StoreData | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    const [stRes, usRes] = await Promise.all([
      fetch("/api/stores"),
      fetch("/api/users"),
    ]);
    const [sts, us] = await Promise.all([stRes.json(), usRes.json()]);
    setStores(Array.isArray(sts) ? sts : []);
    setAllUsers(Array.isArray(us) ? us.filter((u: AllUser) => u.role === "FRANCHISEE") : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hasCoords = (s: StoreData) => s.lat !== null && s.lng !== null;

  const stats = useMemo(() => ({
    total: stores.length,
    active: stores.filter((s) => s.active).length,
    mapped: stores.filter(hasCoords).length,
  }), [stores]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stores.filter((s) => {
      if (filter === "active" && !s.active) return false;
      if (filter === "inactive" && s.active) return false;
      if (filter === "nomap" && hasCoords(s)) return false;
      if (!q) return true;
      return [s.name, s.code, s.city ?? "", s.contactName ?? ""].some((v) => v.toLowerCase().includes(q));
    });
  }, [stores, search, filter]);

  function openCreate() {
    setForm(DEFAULT_FORM);
    setError("");
    setShowCreate(true);
  }

  function openEdit(s: StoreData) {
    setEditing(s);
    setForm({
      name: s.name,
      code: s.code,
      city: s.city ?? "",
      contactName: s.contactName ?? "",
      contactPhone: s.contactPhone ?? "",
      lat: s.lat?.toString() ?? "",
      lng: s.lng?.toString() ?? "",
      active: s.active,
    });
    setError("");
    setShowEdit(true);
  }

  // Busca coordenadas pelo nome/cidade (OpenStreetMap Nominatim)
  async function geocode() {
    const query = [form.name, form.city].filter(Boolean).join(", ");
    if (!form.city.trim() && !form.name.trim()) {
      setError("Informe a cidade (ou o nome) para localizar no mapa");
      return;
    }
    setGeocoding(true);
    setError("");
    try {
      const attempt = async (q: string) => {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`
        );
        const data: { lat: string; lon: string }[] = await res.json();
        return data[0];
      };
      const hit = (await attempt(query)) ?? (form.city.trim() ? await attempt(form.city.trim()) : undefined);
      if (hit) {
        setForm((f) => ({ ...f, lat: Number(hit.lat).toFixed(6), lng: Number(hit.lon).toFixed(6) }));
      } else {
        setError("Local não encontrado. Digite latitude e longitude manualmente.");
      }
    } catch {
      setError("Não foi possível consultar o mapa agora. Digite as coordenadas manualmente.");
    }
    setGeocoding(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Erro"); return; }
    await fetchData();
    setShowCreate(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/stores/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Erro"); return; }
    await fetchData();
    setShowEdit(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir loja "${name}"?`)) return;
    await fetch(`/api/stores/${id}`, { method: "DELETE" });
    if (selectedId === id) setSelectedId(null);
    await fetchData();
  }

  async function refreshManaging(storeId: string) {
    const fresh: StoreData[] = await fetch("/api/stores").then((r) => r.json());
    setStores(fresh);
    setManagingStore(fresh.find((s) => s.id === storeId) ?? null);
  }

  async function addUser(storeId: string, userId: string) {
    await fetch(`/api/stores/${storeId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await refreshManaging(storeId);
  }

  async function removeUser(storeId: string, userId: string) {
    await fetch(`/api/stores/${storeId}/users?userId=${userId}`, { method: "DELETE" });
    await refreshManaging(storeId);
  }

  function showOnMap(id: string) {
    setSelectedId(id);
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const inputCls = "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  const FormFields = (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja *</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required
            className={inputCls} placeholder="ex: SP001" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-3 space-y-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase">Localização no mapa</p>
          <button type="button" onClick={geocode} disabled={geocoding}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline disabled:opacity-50">
            {geocoding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
            Localizar pela cidade
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })}
            placeholder="Latitude" inputMode="decimal"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })}
            placeholder="Longitude" inputMode="decimal"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-3 space-y-3 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase">Contato individual da loja</p>
        <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          placeholder="Nome do responsável"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
          placeholder="Telefone / WhatsApp com DDD" inputMode="tel"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
          className="rounded" />
        <span className="text-sm text-gray-700">Ativa</span>
      </label>
    </div>
  );

  const filterBtn = (value: StatusFilter, label: string) => (
    <button
      key={value}
      onClick={() => setFilter(value)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
        filter === value ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Lojas</h1>
          <p className="text-gray-500 text-sm mt-1">Unidades da rede, contatos e localização no mapa</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-sm">
          <Plus className="h-4 w-4" />
          Nova Loja
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : stores.length === 0 ? (
        <div className="text-center py-16">
          <StoreIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Nenhuma loja cadastrada ainda</p>
        </div>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Lojas", value: stats.total, tone: "text-gray-900" },
              { label: "Ativas", value: stats.active, tone: "text-green-600" },
              { label: "No mapa", value: `${stats.mapped}/${stats.total}`, tone: "text-blue-600" },
            ].map((t) => (
              <div key={t.label} className="bg-white rounded-xl shadow-sm px-4 py-3">
                <p className={`text-xl font-bold ${t.tone}`}>{t.value}</p>
                <p className="text-xs text-gray-500">{t.label}</p>
              </div>
            ))}
          </div>

          {/* Mapa interativo */}
          <div ref={mapRef} className="mb-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
            {stats.mapped > 0 ? (
              <div className="h-[340px] sm:h-[420px]">
                <StoreMap stores={visible} selectedId={selectedId} onSelect={setSelectedId} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <MapPin className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-600">Nenhuma loja posicionada no mapa ainda</p>
                <p className="text-xs text-gray-400 mt-1">Edite uma loja e use &quot;Localizar pela cidade&quot; para criar o pin.</p>
              </div>
            )}
          </div>

          {/* Busca e filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, código, cidade ou responsável"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filterBtn("all", "Todas")}
              {filterBtn("active", "Ativas")}
              {filterBtn("inactive", "Inativas")}
              {filterBtn("nomap", "Sem mapa")}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-12">Nenhuma loja encontrada.</p>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {visible.map((store) => (
                <div
                  key={store.id}
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition ${
                    selectedId === store.id ? "border-blue-400 ring-2 ring-blue-100" : "border-transparent hover:shadow-md"
                  }`}
                >
                  <div className={`h-1.5 ${store.active ? "bg-green-500" : "bg-gray-300"}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{store.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {store.code}{store.city ? ` • ${store.city}` : ""}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${store.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {store.active ? "Ativa" : "Inativa"}
                      </span>
                    </div>

                    {store.contactPhone ? (
                      <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                        <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">
                          {store.contactName ? `${store.contactName} · ` : ""}{store.contactPhone}
                        </span>
                        <a href={whatsappLink(store.contactPhone)} target="_blank" rel="noopener noreferrer"
                          className="ml-auto text-xs font-medium text-green-600 hover:underline flex-shrink-0">
                          WhatsApp
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mb-3">Sem contato cadastrado</p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {store.users.length} franqueado{store.users.length !== 1 ? "s" : ""}
                      </span>
                      {hasCoords(store) ? (
                        <button onClick={() => showOnMap(store.id)} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                          <MapPin className="h-3.5 w-3.5" /> Ver no mapa
                        </button>
                      ) : (
                        <span className="text-xs text-amber-600">Sem localização</span>
                      )}
                    </div>

                    {store.users.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {store.users.slice(0, 3).map((su) => (
                          <span key={su.user.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {su.user.name}
                          </span>
                        ))}
                        {store.users.length > 3 && (
                          <span className="text-xs text-gray-400">+{store.users.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button onClick={() => setManagingStore(store)} title="Gerenciar franqueados"
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600">
                        <UserPlus className="h-3.5 w-3.5" />
                        Franqueados
                      </button>
                      <button onClick={() => openEdit(store)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(store.id, store.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-[1100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Nova Loja</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {FormFields}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-60 transition">
                  {saving ? "Salvando…" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEdit && editing && (
        <div className="fixed inset-0 bg-black/40 z-[1100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Editar Loja</h2>
              <button onClick={() => setShowEdit(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              {FormFields}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-60 transition">
                  {saving ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage franchisees modal */}
      {managingStore && (
        <div className="fixed inset-0 bg-black/40 z-[1100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Franqueados — {managingStore.name}
              </h2>
              <button onClick={() => setManagingStore(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            {/* Current members */}
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Associados</p>
            {managingStore.users.length === 0 ? (
              <p className="text-sm text-gray-400 mb-4">Nenhum franqueado associado</p>
            ) : (
              <div className="space-y-2 mb-4">
                {managingStore.users.map((su) => (
                  <div key={su.user.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{su.user.name}</p>
                      <p className="text-xs text-gray-500">{su.user.email}</p>
                    </div>
                    <button
                      onClick={() => removeUser(managingStore.id, su.user.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new members */}
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Adicionar</p>
            <div className="overflow-y-auto flex-1 space-y-1.5">
              {allUsers
                .filter((u) => !managingStore.users.some((su) => su.user.id === u.id))
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={() => addUser(managingStore.id, u.id)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-blue-50 rounded-xl transition text-left"
                  >
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
