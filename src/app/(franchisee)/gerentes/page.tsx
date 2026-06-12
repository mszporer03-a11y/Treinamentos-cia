"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Users, Phone, Store as StoreIcon, X } from "lucide-react";

interface StoreOption {
  id: string;
  name: string;
  code: string;
}

interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  active: boolean;
  createdAt: string;
  stores: { store: StoreOption }[];
}

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  phone: "",
  storeIds: [] as string[],
  active: true,
};

export default function GerentesPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Manager | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    const [mgrRes, storeRes] = await Promise.all([
      fetch("/api/managers"),
      fetch("/api/stores"),
    ]);
    if (mgrRes.ok) setManagers(await mgrRes.json());
    if (storeRes.ok) {
      const data = await storeRes.json();
      if (Array.isArray(data)) setStores(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  function openEdit(manager: Manager) {
    setEditing(manager);
    setForm({
      name: manager.name,
      email: manager.email,
      password: "",
      phone: manager.phone ?? "",
      storeIds: manager.stores.map((s) => s.store.id),
      active: manager.active,
    });
    setError("");
    setShowModal(true);
  }

  function toggleStore(id: string) {
    setForm((prev) => ({
      ...prev,
      storeIds: prev.storeIds.includes(id)
        ? prev.storeIds.filter((s) => s !== id)
        : [...prev.storeIds, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.phone.trim()) {
      setError("Informe o telefone de contato do gerente");
      return;
    }
    if (form.storeIds.length === 0) {
      setError("Vincule o gerente a pelo menos uma loja");
      return;
    }

    setSaving(true);

    let res: Response;
    if (editing) {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone.trim(),
        storeIds: form.storeIds,
        active: form.active,
      };
      if (form.password) payload.password = form.password;
      res = await fetch(`/api/users/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone.trim(),
          role: "MANAGER",
          storeIds: form.storeIds,
        }),
      });
    }

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao salvar");
      return;
    }

    setShowModal(false);
    await fetchData();
  }

  async function handleDelete(manager: Manager) {
    if (!confirm(`Excluir a conta do gerente "${manager.name}"?`)) return;
    const res = await fetch(`/api/users/${manager.id}`, { method: "DELETE" });
    if (res.ok) {
      setManagers((prev) => prev.filter((m) => m.id !== manager.id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Erro ao excluir gerente");
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-violet-500" /> Gerentes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Crie contas de gerente vinculadas às suas lojas
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition text-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Gerente</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 mb-6 text-sm text-violet-800">
        Gerentes têm acesso aos treinamentos, planilhas, suporte e notificações
        das lojas vinculadas — mas não aos documentos contratuais.
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : managers.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum gerente cadastrado ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {managers.map((manager) => (
            <div
              key={manager.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0 text-violet-700 font-bold">
                {manager.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate flex items-center gap-2">
                  {manager.name}
                  {!manager.active && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">
                      Inativo
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 truncate">{manager.email}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-400">
                  {manager.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {manager.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1 truncate">
                    <StoreIcon className="h-3 w-3" />
                    {manager.stores.map((s) => s.store.name).join(", ") || "Sem loja"}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(manager)}
                  className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(manager)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? "Editar Gerente" : "Novo Gerente"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  placeholder="Maria Souza"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  placeholder="maria@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone de contato *
                </label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  placeholder="(85) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editing ? "Nova senha (deixe em branco para manter)" : "Senha *"}
                </label>
                <input
                  required={!editing}
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lojas vinculadas *
                </label>
                <div className="flex flex-wrap gap-2">
                  {stores.map((store) => {
                    const sel = form.storeIds.includes(store.id);
                    return (
                      <button
                        key={store.id}
                        type="button"
                        onClick={() => toggleStore(store.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                          sel
                            ? "bg-violet-600 text-white border-violet-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-violet-300"
                        }`}
                      >
                        {store.name}
                      </button>
                    );
                  })}
                  {stores.length === 0 && (
                    <p className="text-xs text-gray-400">Nenhuma loja disponível</p>
                  )}
                </div>
              </div>
              {editing && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="manager-active"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="rounded border-gray-300 text-violet-600"
                  />
                  <label htmlFor="manager-active" className="text-sm text-gray-700">
                    Conta ativa
                  </label>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
              )}

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
                  disabled={saving}
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium rounded-lg transition text-sm"
                >
                  {saving ? "Salvando..." : editing ? "Salvar" : "Criar Gerente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
