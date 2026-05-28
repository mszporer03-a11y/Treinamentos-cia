"use client";

import { useEffect, useState } from "react";
import { TrendingUp, CheckCircle, Clock, History } from "lucide-react";
import { useSession } from "next-auth/react";

type KiloPrice = {
  id: string;
  storeId: string;
  suggestedPrice: number;
  confirmedAt: string | null;
  createdAt: string;
  notes: string | null;
};

export default function KiloPricePage() {
  const { data: session } = useSession();
  const [prices, setPrices] = useState<KiloPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/kilo-prices").then((r) => r.json()).then((d) => { setPrices(d); setLoading(false); });
  }, []);

  async function confirmPrice(id: string) {
    setConfirming(id);
    await fetch(`/api/kilo-prices/${id}`, { method: "PATCH" });
    setPrices((prev) => prev.map((p) => p.id === id ? { ...p, confirmedAt: new Date().toISOString() } : p));
    setConfirming(null);
  }

  if (!session?.user) return null;

  const latest = prices[0];
  const history = prices.slice(1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-7 w-7 text-green-500" /> Preço do Quilo
        </h1>
        <p className="text-gray-500 text-sm mt-1">Acompanhe e confirme o preço do quilo sugerido pela Cia do Churrasco.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : !latest ? (
        <div className="text-center py-16 text-gray-400">
          <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma sugestão de preço disponível.</p>
        </div>
      ) : (
        <>
          {/* Current suggestion card */}
          <div className={`p-6 rounded-2xl border-2 mb-6 ${latest.confirmedAt ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Preço Sugerido Atual</p>
                <p className="text-5xl font-bold text-gray-900">
                  R$ {latest.suggestedPrice.toFixed(2).replace(".", ",")}
                  <span className="text-lg font-normal text-gray-500 ml-2">/ kg</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">Sugerido em {new Date(latest.createdAt).toLocaleDateString("pt-BR")}</p>
                {latest.notes && <p className="text-sm text-gray-600 mt-2 italic">"{latest.notes}"</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                {latest.confirmedAt ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-xl text-sm font-medium">
                    <CheckCircle className="h-4 w-4" /> Confirmado
                  </div>
                ) : (
                  <button disabled={confirming === latest.id} onClick={() => confirmPrice(latest.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition">
                    <CheckCircle className="h-4 w-4" />
                    {confirming === latest.id ? "Confirmando..." : "Confirmar Preço"}
                  </button>
                )}
                {latest.confirmedAt && (
                  <p className="text-xs text-green-700">em {new Date(latest.confirmedAt).toLocaleDateString("pt-BR")}</p>
                )}
              </div>
            </div>
            {!latest.confirmedAt && (
              <div className="mt-4 flex items-center gap-2 text-sm text-orange-700">
                <Clock className="h-4 w-4" />
                Aguardando sua confirmação. Confirme para alinhar com a rede.
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <History className="h-4 w-4" /> Histórico de Preços
              </h2>
              <div className="space-y-2">
                {history.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
                    <p className="font-semibold text-gray-700 text-lg tabular-nums">R$ {p.suggestedPrice.toFixed(2).replace(".", ",")}</p>
                    <span className="text-gray-300">·</span>
                    <p className="text-sm text-gray-500 flex-1">{new Date(p.createdAt).toLocaleDateString("pt-BR")}</p>
                    {p.confirmedAt
                      ? <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Confirmado</span>
                      : <span className="text-xs text-gray-400">Não confirmado</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
