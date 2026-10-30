"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Users, ShieldCheck, User, UserCog, Power, Search, Lock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { isMasterEmail } from "@/lib/masters";

type RoleValue = "ADMIN" | "FRANCHISEE" | "MANAGER";

interface StoreOption {
  id: string;
  name: string;
  code: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  role: RoleValue;
  phone?: string | null;
  active: boolean;
  createdAt: string;
  stores?: { store: StoreOption }[];
}

const ROLE_LABEL: Record<RoleValue, string> = {
  ADMIN: "Admin",
  FRANCHISEE: "Franqueado",
  MANAGER: "Gerente",
};

const ROLE_BADGE: Record<RoleValue, string> = {
  ADMIN: "bg-blue-100 text-blue-700",
  FRANCHISEE: "bg-gray-100 text-gray-600",
  MANAGER: "bg-violet-100 text-violet-700",
};

/** Seleção de uma ou várias lojas (acesso multi-loja). */
function StorePicker({
  stores,
  value,
  onChange,
  required,
}: {
  stores: StoreOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  required?: boolean;
}) {
  const [q, setQ] = useState("");
  const list = stores.filter((s) => `${s.name} ${s.code}`.toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Lojas vinculadas {required ? "*" : "(opcional)"}
          <span className="ml-1 text-xs font-normal text-gray-400">· {value.length} selecionada{value.length !== 1 ? "s" : ""}</span>
        </label>
        <div className="flex gap-3 text-xs">
          <button type="button" onClick={() => onChange(Array.from(new Set([...value, ...list.map((s) => s.id)])))} className="text-blue-600 hover:underline">
            Marcar todas
          </button>
          <button type="button" onClick={() => onChange([])} className="text-gray-500 hover:underline">
            Limpar
          </button>
        </div>
      </div>
      {stores.length > 6 && (
        <div className="relative mb-2">
          <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar loja"
            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
        {list.map((store) => {
          const sel = value.includes(store.id);
          return (
            <button
              key={store.id}
              type="button"
              onClick={() => toggle(store.id)}
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
        {list.length === 0 && <p className="text-xs text-gray-400">Nenhuma loja encontrada.</p>}
      </div>
    </div>
  );
}

const DEFAULT_FORM = {
  name: "",
  email: "",
  username: "",
  password: "",
  role: "FRANCHISEE" as RoleValue,
  phone: "",
  storeIds: [] as string[],
};

function StoreTags({ user }: { user: UserData }) {
  const list = user.stores ?? [];
  if (user.role === "ADMIN" || list.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {list.slice(0, 3).map((s) => (
        <span key={s.store.id} className="text-[11px] bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded-full">
          {s.store.name}
        </span>
      ))}
      {list.length > 3 && <span className="text-[11px] text-gray-400">+{list.length - 3}</span>}
    </div>
  );
}

/** Ações de linha: ativar/inativar, editar e excluir (contas master ficam protegidas). */
function RowActions({
  user,
  size,
  onToggle,
  onEdit,
  onDelete,
}: {
  user: UserData;
  size: "sm" | "md";
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const locked = isMasterEmail(user.email);
  const pad = size === "md" ? "p-2" : "p-1.5";
  return (
    <>
      {locked ? (
        <span className={`${pad} text-gray-300`} title="Conta master: protegida contra exclusão e inativação">
          <Lock className="h-4 w-4" />
        </span>
      ) : (
        <button
          onClick={onToggle}
          title={user.active ? "Inativar usuário" : "Reativar usuário"}
          className={`${pad} rounded-lg transition ${
            user.active ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"
          }`}
        >
          <Power className="h-4 w-4" />
        </button>
      )}
      <button onClick={onEdit} className={`${pad} text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition`}>
        <Pencil className="h-4 w-4" />
      </button>
      {!locked && (
        <button onClick={onDelete} className={`${pad} text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition`}>
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<UserData | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "FRANCHISEE" as RoleValue,
    phone: "",
    storeIds: [] as string[],
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetch("/api/stores")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStores(data.map((s: StoreOption) => ({ id: s.id, name: s.name, code: s.code })));
        }
      });
  }, [fetchUsers]);

  function openCreate() {
    setForm(DEFAULT_FORM);
    setError("");
    setShowCreateModal(true);
  }

  function openEdit(user: UserData) {
    setEditing(user);
    setEditForm({
      name: user.name,
      email: user.email,
      username: user.username ?? "",
      password: "",
      role: user.role,
      phone: user.phone ?? "",
      storeIds: user.stores?.map((s) => s.store.id) ?? [],
      active: user.active,
    });
    setError("");
    setShowEditModal(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    };
    if (form.username.trim()) payload.username = form.username.trim();
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.role !== "ADMIN") payload.storeIds = form.storeIds;

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao criar usuário");
      return;
    }

    await fetchUsers();
    setShowCreateModal(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      name: editForm.name,
      email: editForm.email,
      role: editForm.role,
      active: editForm.active,
    };
    if (editForm.password) payload.password = editForm.password;
    payload.phone = editForm.phone.trim() || null;
    payload.username = editForm.username.trim();
    payload.storeIds = editForm.role === "ADMIN" ? [] : editForm.storeIds;

    const res = await fetch(`/api/users/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao salvar");
      return;
    }

    await fetchUsers();
    setShowEditModal(false);
  }

  async function toggleActive(user: UserData) {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, active: !user.active } : u)));
    } else {
      const data = await res.json();
      alert(data.error ?? "Erro ao alterar status");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir o usuário "${name}"?`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } else {
      const data = await res.json();
      alert(data.error ?? "Erro ao excluir usuário");
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie os acessos ao portal
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Usuário</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum usuário cadastrado</p>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <div key={user.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {user.role === "ADMIN" ? (
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                  ) : user.role === "MANAGER" ? (
                    <UserCog className="h-5 w-5 text-violet-600" />
                  ) : (
                    <User className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  {user.phone && <p className="text-xs text-gray-400 truncate">📞 {user.phone}</p>}
                  <StoreTags user={user} />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[user.role]}`}>
                      {isMasterEmail(user.email) ? "Master" : ROLE_LABEL[user.role]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      user.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {user.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <RowActions
                    user={user}
                    size="md"
                    onToggle={() => toggleActive(user)}
                    onEdit={() => openEdit(user)}
                    onDelete={() => handleDelete(user.id, user.name)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Usuário
                </th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Perfil
                </th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Status
                </th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">
                  Cadastrado
                </th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {user.role === "ADMIN" ? (
                          <ShieldCheck className="h-4 w-4 text-blue-600" />
                        ) : user.role === "MANAGER" ? (
                          <UserCog className="h-4 w-4 text-violet-600" />
                        ) : (
                          <User className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">
                          {user.email}
                          {user.username ? ` · login: ${user.username}` : ""}
                          {user.phone ? ` · 📞 ${user.phone}` : ""}
                        </p>
                        <StoreTags user={user} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_BADGE[user.role]}`}
                    >
                      {isMasterEmail(user.email) ? "Master" : ROLE_LABEL[user.role]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <RowActions
                        user={user}
                        size="sm"
                        onToggle={() => toggleActive(user)}
                        onEdit={() => openEdit(user)}
                        onDelete={() => handleDelete(user.id, user.name)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6 max-h-[95vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              Novo Usuário
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="João Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="joao@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Login <span className="text-gray-400 font-normal">(opcional — entra com e-mail ou login)</span>
                </label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.trim() })}
                  autoCapitalize="none"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="joao.franqueado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha *
                </label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Perfil
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value as RoleValue,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="FRANCHISEE">Franqueado</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone {form.role === "MANAGER" ? "*" : "(opcional)"}
                </label>
                <input
                  required={form.role === "MANAGER"}
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="(85) 99999-9999"
                />
              </div>

              {form.role !== "ADMIN" && (
                <StorePicker
                  stores={stores}
                  value={form.storeIds}
                  onChange={(storeIds) => setForm({ ...form, storeIds })}
                  required={form.role === "MANAGER"}
                />
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition text-sm"
                >
                  {saving ? "Salvando..." : "Criar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editing && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6 max-h-[95vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              Editar Usuário
            </h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  required
                  type="email"
                  value={editForm.email}
                  disabled={isMasterEmail(editing.email)}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Login <span className="text-gray-400 font-normal">(opcional — entra com e-mail ou login)</span>
                </label>
                <input
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value.trim() })}
                  autoCapitalize="none"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="joao.franqueado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha (deixe em branco para manter)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Perfil
                </label>
                <select
                  value={editForm.role}
                  disabled={isMasterEmail(editing.email)}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      role: e.target.value as RoleValue,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="FRANCHISEE">Franqueado</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone {editForm.role === "MANAGER" ? "*" : "(opcional)"}
                </label>
                <input
                  required={editForm.role === "MANAGER"}
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="(85) 99999-9999"
                />
              </div>
              {editForm.role !== "ADMIN" && (
                <StorePicker
                  stores={stores}
                  value={editForm.storeIds}
                  onChange={(storeIds) => setEditForm({ ...editForm, storeIds })}
                  required={editForm.role === "MANAGER"}
                />
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={editForm.active}
                  disabled={isMasterEmail(editing.email)}
                  onChange={(e) =>
                    setEditForm({ ...editForm, active: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="active" className="text-sm text-gray-700">
                  Usuário ativo
                </label>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition text-sm"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
