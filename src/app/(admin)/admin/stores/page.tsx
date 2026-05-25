"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Store as StoreIcon, Users, X, UserPlus } from "lucide-react";

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
  active: boolean;
  users: StoreUser[];
}

interface AllUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const DEFAULT_FORM = { name: "", code: "", city: "", active: true };

export default function StoresPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<StoreData | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [managingStore, setManagingStore] = useState<StoreData | null>(null);

  const fetchData = useCallback(async () => {
    const [stRes, usRes] = await Promise.all([
      fetch("/api/stores"),
      fetch("/api/users"),
    ]);
    const [sts, us] = await Promise.all([stRes.json(), usRes.json()]);
    setStores(sts);
    setAllUsers(us.filter((u: AllUser) => u.role === "FRANCHISEE"));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openCreate() {
    setForm(DEFAULT_FORM);
    setError("");
    setShowCreate(true);
  }

  function openEdit(s: StoreData) {
    setEditing(s);
    setForm({ name: s.name, code: s.code, city: s.city ?? "", active: s.active });
    setError("");
    setShowEdit(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, city: form.city || undefined }),
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
      body: JSON.stringify({ ...form, city: form.city || undefined }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Erro"); return; }
    await fetchData();
    setShowEdit(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir loja "${name}"?`)) return;
    await fetch(`/api/stores/${id}`, { method: "DELETE" });
    await fetchData();
  }

  async function addUser(storeId: string, userId: string) {
    await fetch(`/api/stores/${storeId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await fetchData();
    const updated = stores.find((s) => s.id === storeId);
    if (updated) {
      const fresh = await fetch("/api/stores").then((r) => r.json());
      setStores(fresh);
      setManagingStore(fresh.find((s: StoreData) => s.id === storeId) ?? null);
    }
  }

  async function removeUser(storeId: string, userId: string) {
    await fetch(`/api/stores/${storeId}/users?userId=${userId}`, { method: "DELETE" });
    const fresh: StoreData[] = await fetch("/api/stores").then((r) => r.json());
    setStores(fresh);
    setManagingStore(fresh.find((s) => s.id === storeId) ?? null);
  }

  const FormFields = (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja *</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
        <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ex: SP001" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
        <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
          className="rounded" />
        <span className="text-sm text-gray-700">Ativa</span>
      </label>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Lojas</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie as lojas e seus franqueados</p>
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => (
            <div key={store.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{store.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {store.code}{store.city ? ` • ${store.city}` : ""}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${store.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {store.active ? "Ativa" : "Inativa"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                <Users className="h-4 w-4" />
                <span>{store.users.length} franqueado{store.users.length !== 1 ? "s" : ""}</span>
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
                <button onClick={() => { setManagingStore(store); }} title="Gerenciar franqueados"
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
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
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
