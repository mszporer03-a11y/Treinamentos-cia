"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { MapPin, Edit2, X, Check } from "lucide-react";

// Leaflet must be loaded client-side only
const StoreMap = dynamic(() => import("@/components/admin/StoreMap"), { ssr: false, loading: () => <div className="h-96 bg-gray-100 rounded-xl animate-pulse" /> });

type Store = { id: string; name: string; code: string; city: string | null; active: boolean; lat: number | null; lng: number | null };

export default function MapPage() {
  const { data: session } = useSession();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [coords, setCoords] = useState({ lat: "", lng: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/stores").then((r) => r.json()).then((d) => { setStores(d); setLoading(false); });
  }, []);

  function startEdit(s: Store) {
    setEditingId(s.id);
    setCoords({ lat: s.lat?.toString() ?? "", lng: s.lng?.toString() ?? "" });
  }

  async function saveCoords(storeId: string) {
    const lat = parseFloat(coords.lat);
    const lng = parseFloat(coords.lng);
    if (isNaN(lat) || isNaN(lng)) return;
    setSaving(true);
    const res = await fetch(`/api/stores/${storeId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
    });
    const updated = await res.json();
    setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, lat: updated.lat, lng: updated.lng } : s)));
    setEditingId(null);
    setSaving(false);
  }

  if (!session?.user) return null;

  const mapped = stores.filter((s) => s.lat && s.lng);
  const unmapped = stores.filter((s) => !s.lat || !s.lng);

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-7 w-7 text-red-500" /> Mapa de Lojas
          </h1>
          <p className="text-gray-500 mt-1">{mapped.length} de {stores.length} lojas posicionadas no mapa.</p>
        </div>

        {!loading && mapped.length > 0 && (
          <div className="mb-6 rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 480 }}>
            <StoreMap stores={mapped} />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Carregando lojas...</div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Coordenadas das Lojas</p>
            </div>
            <div className="divide-y divide-gray-50">
              {stores.map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${s.lat && s.lng ? "bg-green-400" : "bg-gray-200"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{s.name} <span className="text-gray-400 font-normal">({s.code})</span></p>
                    {s.city && <p className="text-xs text-gray-500">{s.city}</p>}
                  </div>
                  {editingId === s.id ? (
                    <div className="flex items-center gap-2">
                      <input className="w-28 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Latitude" value={coords.lat} onChange={(e) => setCoords({ ...coords, lat: e.target.value })} />
                      <input className="w-28 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Longitude" value={coords.lng} onChange={(e) => setCoords({ ...coords, lng: e.target.value })} />
                      <button disabled={saving} onClick={() => saveCoords(s.id)}
                        className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition disabled:opacity-50">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 font-mono">
                        {s.lat && s.lng ? `${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}` : "Sem coordenadas"}
                      </span>
                      <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
