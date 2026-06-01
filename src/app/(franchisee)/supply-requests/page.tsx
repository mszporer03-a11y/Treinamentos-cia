"use client";

import { useEffect, useState } from "react";
import { PackageSearch, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { useSession } from "next-auth/react";

type Store = { id: string; name: string; code: string };
type Item = { category: string; name: string; quantity: number; unit: string };
type SupplyRequest = {
  id: string;
  status: string;
  notes: string | null;
  adminNotes: string | null;
  createdAt: string;
  store: Store;
  items: Item[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "Pendente",  color: "bg-yellow-100 text-yellow-700" },
  APPROVED:  { label: "Aprovado",  color: "bg-green-100 text-green-700" },
  REJECTED:  { label: "Rejeitado", color: "bg-red-100 text-red-700" },
  DELIVERED: { label: "Entregue",  color: "bg-blue-100 text-blue-700" },
};

const SUPPLY_CATEGORIES = [
  { value: "INSUMOS",     label: "Insumos",      emoji: "🥩" },
  { value: "UNIFORMES",   label: "Uniformes",    emoji: "👕" },
  { value: "TALHERES",    label: "Talheres",     emoji: "🍴" },
  { value: "DESCARTAVEIS",label: "Descartáveis", emoji: "🥤" },
  { value: "OUTROS",      label: "Outros",       emoji: "📦" },
];

const EMPTY_ITEM = { category: "INSUMOS", name: "", quantity: 1, unit: "un" };

export default function SupplyRequestsPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [storeId, setStoreId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/supply-requests").then((r) => r.json()),
      fetch("/api/stores").then((r) => r.json()).catch(() => []),
    ]).then(([reqs, sts]) => {
      setRequests(reqs);
      setStores(sts);
      if (sts.length === 1) setStoreId(sts[0].id);
      setLoading(false);
    });
  }, []);

  function updateItem(i: number, field: string, value: string | number) {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  async function submit() {
    const validItems = items.filter((i) => i.name.trim());
    if (!storeId || validItems.length === 0) return;
    setSaving(true);
    const res = await fetch("/api/supply-requests", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, notes: notes || undefined, items: validItems }),
    });
    const r = await res.json();
    setRequests((prev) => [r, ...prev]);
    setStoreId(""); setNotes(""); setItems([{ ...EMPTY_ITEM }]);
    setShowForm(false); setSaving(false);
  }

  if (!session?.user) return null;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PackageSearch className="h-7 w-7 text-orange-500" /> Pedido de Insumos
          </h1>
          <p className="text-gray-500 text-sm mt-1">Solicite insumos, uniformes, talheres e descartáveis.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-xl hover:bg-orange-700 transition">
          <Plus className="h-4 w-4" /> Novo Pedido
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Novo Pedido</h2>
            <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-gray-400" /></button>
          </div>
          <div className="space-y-4">
            {stores.length > 1 && (
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={storeId} onChange={(e) => setStoreId(e.target.value)}>
                <option value="">Selecionar loja...</option>
                {stores.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Itens</p>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <select className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
                      value={item.category} onChange={(e) => updateItem(i, "category", e.target.value)}>
                      {SUPPLY_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-5">
                    <input className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="Nome do item" value={item.name} onChange={(e) => updateItem(i, "name", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="1" className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="col-span-1">
                    <input className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none" placeholder="un"
                      value={item.unit} onChange={(e) => updateItem(i, "unit", e.target.value)} />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {items.length > 1 && (
                      <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500 transition">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={() => setItems([...items, { ...EMPTY_ITEM }])} className="text-sm text-orange-600 hover:underline">+ Adicionar item</button>
            </div>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              rows={2} placeholder="Observações (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button disabled={saving || !storeId || items.filter((i) => i.name.trim()).length === 0} onClick={submit}
              className="w-full py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 transition">
              {saving ? "Enviando..." : "Enviar Pedido"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <PackageSearch className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum pedido realizado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const cfg = STATUS_CONFIG[req.status];
            const isOpen = expanded === req.id;
            return (
              <div key={req.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition" onClick={() => setExpanded(isOpen ? null : req.id)}>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{req.store.name}</p>
                    <p className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString("pt-BR")} · {req.items.length} {req.items.length === 1 ? "item" : "itens"}</p>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
                </div>
                {isOpen && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-2">
                    {req.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-gray-400">{SUPPLY_CATEGORIES.find((c) => c.value === item.category)?.emoji}</span>
                        <span className="flex-1">{item.name}</span>
                        <span className="text-gray-500 font-mono">{item.quantity} {item.unit}</span>
                      </div>
                    ))}
                    {req.adminNotes && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                        <p className="font-medium text-xs text-blue-600 mb-1">Resposta do administrador:</p>
                        {req.adminNotes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
