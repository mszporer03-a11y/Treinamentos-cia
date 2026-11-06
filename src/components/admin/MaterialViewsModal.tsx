"use client";

import { useState, useEffect } from "react";
import { X, Eye, Loader2 } from "lucide-react";

interface StoreRef {
  store: { name: string; code: string };
}

interface ViewUser {
  id: string;
  name: string;
  email: string;
  stores: StoreRef[];
}

interface ViewEntry {
  id: string;
  user: ViewUser;
  viewedAt: string;
}

interface MaterialViewsModalProps {
  materialId: string;
  materialTitle: string;
  onClose: () => void;
}

export function MaterialViewsModal({
  materialId,
  materialTitle,
  onClose,
}: MaterialViewsModalProps) {
  const [views, setViews] = useState<ViewEntry[]>([]);
  const [pending, setPending] = useState<ViewUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/materials/${materialId}/views`)
      .then((r) => r.json())
      .then((data) => {
        setViews(Array.isArray(data?.views) ? data.views : []);
        setPending(Array.isArray(data?.pending) ? data.pending : []);
        setLoading(false);
      });
  }, [materialId]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Visualizações</h2>
            <p className="text-xs text-gray-500 truncate max-w-[280px]">{materialTitle}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 font-medium">
                👁️ {views.length} visualizaç{views.length !== 1 ? "ões" : "ão"} · ❌ {pending.length} pendente{pending.length !== 1 ? "s" : ""}
              </p>
              {views.length === 0 && (
                <div className="text-center py-6">
                  <Eye className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Nenhuma visualização registrada</p>
                </div>
              )}
              {views.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-green-800">
                      👁️ {v.user.name}
                      {v.user.stores.length > 0 && (
                        <span className="font-normal"> ({v.user.stores.map((s) => s.store.name).join(", ")})</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{v.user.email}</p>
                  </div>
                  <p className="text-xs text-gray-500 text-right flex-shrink-0 ml-3">
                    visualizou em{" "}
                    {new Date(v.viewedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                    <br />
                    às{" "}
                    {new Date(v.viewedAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
              {pending.length > 0 && (
                <>
                  <p className="text-xs text-red-600 font-semibold pt-2">Pendentes de leitura</p>
                  {pending.map((u) => (
                    <div key={u.id} className="p-3 bg-red-50 rounded-xl">
                      <p className="text-sm text-red-700 italic">
                        ❌ {u.name}
                        {u.stores.length > 0 && <> ({u.stores.map((s) => s.store.name).join(", ")})</>} — Pendente de leitura
                      </p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
