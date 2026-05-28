"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PackageSearch, Clock, CheckCircle2, XCircle, Truck, ChevronDown, ChevronUp } from "lucide-react";

type SupplyItem = { id: string; category: string; name: string; quantity: number; unit: string };
type SupplyRequest = {
  id: string;
  status: string;
  notes: string | null;
  adminNotes: string | null;
  createdAt: string;
  store: { id: string; name: string; code: string };
  requester: { id: string; name: string };
  items: SupplyItem[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING:   { label: "Pendente",   color: "bg-yellow-100 text-yellow-700", icon: Clock },
  APPROVED:  { label: "Aprovado",   color: "bg-green-100 text-green-700",  icon: CheckCircle2 },
  REJECTED:  { label: "Rejeitado",  color: "bg-red-100 text-red-700",      icon: XCircle },
  DELIVERED: { label: "Entregue",   color: "bg-blue-100 text-blue-700",    icon: Truck },
};

const CATEGORY_LABEL: Record<string, string> = {
  INSUMOS: "Insumos", UNIFORMES: "Uniformes", TALHERES: "Talheres",
  DESCARTAVEIS: "Descartáveis", OUTROS: "Outros",
};

export default function SupplyRequestsPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/supply-requests")
      .then((r) => r.json())
      .then((d) => { setRequests(d); setLoading(false); });
  }, []);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    const res = await fetch(`/api/supply-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
    setUpdating(null);
  }

  const grouped = {
    PENDING:   requests.filter((r) => r.status === "PENDING"),
    APPROVED:  requests.filter((r) => r.status === "APPROVED"),
    DELIVERED: requests.filter((r) => r.status === "DELIVERED"),
    REJECTED:  requests.filter((r) => r.status === "REJECTED"),
  };

  if (!session?.user) return null;

  return (
    <>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PackageSearch className="h-7 w-7 text-orange-500" /> Pedidos de Insumos
          </h1>
          <p className="text-gray-500 mt-1">Gerencie os pedidos de insumos, uniformes, talheres e descartáveis das lojas.</p>
        </div>

        {/* KPI bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(["PENDING", "APPROVED", "DELIVERED", "REJECTED"] as const).map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <div key={s} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${cfg.color}`}>
                  <cfg.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{grouped[s].length}</p>
                  <p className="text-xs text-gray-500">{cfg.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Nenhum pedido encontrado.</div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const cfg = STATUS_CONFIG[req.status];
              const isOpen = expanded === req.id;
              return (
                <div key={req.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => setExpanded(isOpen ? null : req.id)}
                  >
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color} flex items-center gap-1 shrink-0`}>
                      <cfg.icon className="h-3 w-3" />{cfg.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{req.store.name} <span className="text-gray-400 font-normal text-sm">({req.store.code})</span></p>
                      <p className="text-xs text-gray-500">{req.requester.name} · {new Date(req.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{req.items.length} {req.items.length === 1 ? "item" : "itens"}</span>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
                  </div>

                  {isOpen && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 text-xs">
                            <th className="pb-2">Categoria</th><th className="pb-2">Item</th><th className="pb-2">Qtd</th><th className="pb-2">Un.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {req.items.map((item) => (
                            <tr key={item.id} className="text-gray-700">
                              <td className="py-1.5 pr-3"><span className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">{CATEGORY_LABEL[item.category]}</span></td>
                              <td className="py-1.5 pr-3">{item.name}</td>
                              <td className="py-1.5 pr-3 font-mono">{item.quantity}</td>
                              <td className="py-1.5 text-gray-500">{item.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {req.notes && <p className="text-sm text-gray-600 italic">&ldquo;{req.notes}&rdquo;</p>}
                      {req.status === "PENDING" && (
                        <div className="flex gap-2 pt-1">
                          <button
                            disabled={!!updating}
                            onClick={() => updateStatus(req.id, "APPROVED")}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                          >Aprovar</button>
                          <button
                            disabled={!!updating}
                            onClick={() => updateStatus(req.id, "REJECTED")}
                            className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 disabled:opacity-50 transition"
                          >Rejeitar</button>
                        </div>
                      )}
                      {req.status === "APPROVED" && (
                        <button
                          disabled={!!updating}
                          onClick={() => updateStatus(req.id, "DELIVERED")}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                        >Marcar como Entregue</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
