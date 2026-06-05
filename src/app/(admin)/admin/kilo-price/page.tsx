"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DollarSign, TrendingUp } from "lucide-react";

type KiloPrice = { id: string; price: number; confirmedAt: string | null; effectiveFrom: string; createdAt: string; suggestedNote: string | null };
type Store = { id: string; name: string; code: string; city: string | null; active: boolean; kiloPrices: KiloPrice[] };

export default function KiloPricePage() {
  const { data: session } = useSession();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/kilo-prices").then((r) => r.json()).then((d) => { setStores(d); setLoading(false); });
  }, []);

  if (!session?.user) return null;

  const avg = stores.length
    ? stores.filter((s) => s.kiloPrices[0]).reduce((acc, s) => acc + s.kiloPrices[0].price, 0) / stores.filter((s) => s.kiloPrices[0]).length
    : 0;

  return (
    <>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-7 w-7 text-emerald-500" /> Monitor do Preço do Quilo
            </h1>
            <p className="text-gray-500 mt-1">Acompanhe o preço do quilo para cada loja.</p>
          </div>
        </div>

        {avg > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 col-span-2 sm:col-span-1">
              <p className="text-xs text-emerald-600 font-medium mb-1">Preço médio da rede</p>
              <p className="text-3xl font-bold text-emerald-700">R$ {avg.toFixed(2).replace(".", ",")}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-medium mb-1">Lojas monitoradas</p>
              <p className="text-3xl font-bold text-gray-900">{stores.filter((s) => s.kiloPrices[0]).length}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-medium mb-1">Confirmados</p>
              <p className="text-3xl font-bold text-gray-900">{stores.filter((s) => s.kiloPrices[0]?.confirmedAt).length}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando...</div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Loja</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cidade</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Preço Atual</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Atualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stores.map((s) => {
                  const kp = s.kiloPrices[0];
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">{s.name} <span className="text-gray-400 font-normal text-xs">({s.code})</span></td>
                      <td className="px-4 py-3 text-gray-500">{s.city ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {kp ? (
                          <span className="font-bold text-emerald-700 font-mono">R$ {kp.price.toFixed(2).replace(".", ",")}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {kp ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${kp.confirmedAt ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {kp.confirmedAt ? "Confirmado" : "Sugerido"}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Sem preço</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 text-xs">
                        {kp ? new Date(kp.createdAt).toLocaleDateString("pt-BR") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
