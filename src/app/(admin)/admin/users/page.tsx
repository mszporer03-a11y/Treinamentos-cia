"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2, Users, ShieldCheck, User, Search, X, Store as StoreIcon, Power, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface StoreRef {
  id: string;
  name: string;
  code: string;
  city?: string | null;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "FRANCHISEE";
  active: boolean;
  createdAt: string;
  stores: { store: StoreRef }[];
}

type Role = "ADMIN" | "FRANCHISEE";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "FRANCHISEE" as Role,
  active: true,
  storeIds: [] as string[],
};

/** Seletor múltiplo de lojas (item 5 — usuário multiloja). */
function StoreMultiSelect({
  stores,
  value,
  onChange,
}: {
  stores: StoreRef[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const list = stores.filter(
    (s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.code.toLowerCase().includes(q.toLowerCase()) || (s.city ?? "").toLowerCase().includes(q.toLowerCase())
  );
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  if (stores.length === 0) {
    return <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg p-3">Nenhuma loja cadastrada. Cadastre lojas na aba Lojas.</p>;
  }

  return (
    <div className="border border-gray-200 rounded-lg">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 border-b border-gray-100">
          {value.map((id) => {
            const s = stores.find((x) => x.id === id);
            if (!s) return null;
            return (
              <span key={id} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-blue-600 text-white text-xs font-medium">
                {s.name}
                <button type="button" onClick={() => toggle(id)} className="p-0.5 rounded-full hover:bg-white/20" aria-label={`Remover ${s.name}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
      <div className="p-2">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar loja..."
              className="w-full pl-8 pr-2 py-1.5 text-sm bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="button" onClick={() => onChange(value.length === stores.length ? [] : stores.map((s) => s.id))}
            className="text-xs text-blue-600 hover:underline whitespace-nowrap">
            {value.length === stores.length ? "Limpar" : "Todas"}
          </button>
        </div>
        <div className="max-h-40 overflow-y-auto space-y-0.5">
          {list.map((s) => {
            const on = value.includes(s.id);
            return (
              <button type="button" key={s.id} onClick={() => toggle(s.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition ${on ? "bg-blue-50 text-blue-800" : "hover:bg-gray-50 text-gray-700"}`}>
                <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${on ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                  {on && <Check className="h-3 w-3 text-white" />}
                </span>
                <span className="flex-1 truncate">{s.name}</span>
                <span className="text-xs text-gray-400">{s.code}{s.city ? ` · ${s.city}` : ""}</span>
              </button>
            );
          })}
          {list.length === 0 && <p className="text-xs text-gray-400 px-2 py-1.5">Nenhuma loja encontrada</p>}
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stores, setStores] = useState<StoreRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UserData | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | Role>("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [storeFilter, setStoreFilter] = useState("");

  const fetchData = useCallback(async () => {
    const [uRes, sRes] = await Promise.all([fetch("/api/users"), fetch("/api/stores")]);
    const [u, s] = await Promise.all([uRes.json(), sRes.json()]);
    setUsers(Array.isArray(u) ? u : []);
    setStores(Array.isArray(s) ? s : []);
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

  function openEdit(user: UserData) {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      active: user.active,
      storeIds: user.stores.map((s) => s.store.id),
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      role: form.role,
      active: form.active,
      storeIds: form.storeIds,
    };
    if (form.password || !editing) payload.password = form.password;

    const res = await fetch(editing ? `/api/users/${editing.id}` : "/api/users", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao salvar");
      return;
    }
    await fetchData();
    setShowModal(false);
  }

  async function toggleActive(user: UserData) {
    const verb = user.active ? "Inativar" : "Reativar";
    if (!confirm(`${verb} o acesso de "${user.name}"?`)) return;
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Erro ao atualizar");
      return;
    }
    await fetchData();
  }

  async function handleDelete(user: UserData) {
    if (
      !confirm(
        `Excluir definitivamente o usuário "${user.name}"?\n\nO histórico de chat, checklists e solicitações dele também será removido. Para apenas bloquear o acesso, use "Inativar".`
      )
    )
      return;
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Erro ao excluir usuário");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.stores.some((s) => s.store.name.toLowerCase().includes(q))) &&
        (!roleFilter || u.role === roleFilter) &&
        (!statusFilter || (statusFilter === "active" ? u.active : !u.active)) &&
        (!storeFilter || u.stores.some((s) => s.store.id === storeFilter))
    );
  }, [users, search, roleFilter, statusFilter, storeFilter]);

  const counts = {
    total: users.length,
    admins: users.filter((u) => u.role === "ADMIN").length,
    franchisees: users.filter((u) => u.role === "FRANCHISEE").length,
    inactive: users.filter((u) => !u.active).length,
  };

  const storeChips = (u: UserData) =>
    u.stores.length === 0 ? (
      <span className="text-xs text-gray-400">{u.role === "ADMIN" ? "Todas (admin)" : "Sem loja"}</span>
    ) : (
      <div className="flex flex-wrap gap-1">
        {u.stores.slice(0, 3).map((s) => (
          <span key={s.store.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            <StoreIcon className="h-3 w-3" /> {s.store.name}
          </span>
        ))}
        {u.stores.length > 3 && <span className="text-[11px] text-gray-400">+{u.stores.length - 3}</span>}
      </div>
    );

  const actionButtons = (u: UserData) => (
    <div className="flex items-center gap-1">
      <button onClick={() => toggleActive(u)} title={u.active ? "Inativar acesso" : "Reativar acesso"}
        className={`p-1.5 rounded-lg transition ${u.active ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50" : "text-amber-600 hover:text-green-600 hover:bg-green-50"}`}>
        <Power className="h-4 w-4" />
      </button>
      <button onClick={() => openEdit(u)} title="Editar" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={() => handleDelete(u)} title="Excluir" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const badge = (cond: boolean, yes: [string, string], no: [string, string]) => (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cond ? yes[1] : no[1]}`}>{cond ? yes[0] : no[0]}</span>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
          <p className="text-gray-500 text-sm mt-1">Cadastre, edite, inative ou exclua acessos e vincule cada usuário às suas lojas</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Usuário</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          ["Usuários", counts.total, "text-gray-900"],
          ["Administradores", counts.admins, "text-blue-700"],
          ["Franqueados", counts.franchisees, "text-emerald-700"],
          ["Inativos", counts.inactive, "text-red-600"],
        ].map(([label, value, color]) => (
          <div key={label as string} className="bg-white rounded-xl shadow-sm px-4 py-3">
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail ou loja..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as "" | Role)} className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg">
          <option value="">Todos os perfis</option>
          <option value="ADMIN">Administradores</option>
          <option value="FRANCHISEE">Franqueados</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "" | "active" | "inactive")} className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg">
          <option value="">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg">
          <option value="">Todas as lojas</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <>
          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {filtered.map((u) => (
              <div key={u.id} className={`bg-white rounded-xl shadow-sm p-4 ${u.active ? "" : "opacity-70"}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {u.role === "ADMIN" ? <ShieldCheck className="h-5 w-5 text-blue-600" /> : <User className="h-5 w-5 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {badge(u.role === "ADMIN", ["Admin", "bg-blue-100 text-blue-700"], ["Franqueado", "bg-gray-100 text-gray-600"])}
                      {badge(u.active, ["Ativo", "bg-green-100 text-green-700"], ["Inativo", "bg-red-100 text-red-700"])}
                    </div>
                    <div className="mt-2">{storeChips(u)}</div>
                  </div>
                  {actionButtons(u)}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Usuário</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Perfil</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Lojas</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Cadastrado</th>
                  <th className="px-5 py-3 text-right font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.id} className={`hover:bg-gray-50 transition ${u.active ? "" : "opacity-70"}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {u.role === "ADMIN" ? <ShieldCheck className="h-4 w-4 text-blue-600" /> : <User className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">{badge(u.role === "ADMIN", ["Admin", "bg-blue-100 text-blue-700"], ["Franqueado", "bg-gray-100 text-gray-600"])}</td>
                    <td className="px-5 py-4 max-w-xs">{storeChips(u)}</td>
                    <td className="px-5 py-4">{badge(u.active, ["Ativo", "bg-green-100 text-green-700"], ["Inativo", "bg-red-100 text-red-700"])}</td>
                    <td className="px-5 py-4 text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-4"><div className="flex justify-end">{actionButtons(u)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">{editing ? "Editar Usuário" : "Novo Usuário"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="João Silva" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (login) *</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="joao@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editing ? "Nova senha (deixe em branco para manter)" : "Senha *"}
                </label>
                <input type="password" required={!editing} minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de acesso</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["FRANCHISEE", "Franqueado", "Acessa o portal das lojas vinculadas"],
                    ["ADMIN", "Administrador", "Acesso total ao painel da Franqueadora"],
                  ] as const).map(([value, label, desc]) => (
                    <button type="button" key={value} onClick={() => setForm({ ...form, role: value })}
                      className={`text-left p-3 rounded-lg border transition ${form.role === value ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}>
                      <p className="text-sm font-semibold text-gray-900">{label}</p>
                      <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lojas vinculadas <span className="text-xs font-normal text-gray-400">(selecione uma ou várias — multiloja)</span>
                </label>
                <StoreMultiSelect stores={stores} value={form.storeIds} onChange={(storeIds) => setForm({ ...form, storeIds })} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded border-gray-300 text-blue-600" />
                <span className="text-sm text-gray-700">Usuário ativo (pode fazer login)</span>
              </label>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition text-sm">
                  {saving ? "Salvando..." : editing ? "Salvar" : "Criar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
