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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/materials/${materialId}/views`)
      .then((r) => r.json())
      .then((data) => {
        setViews(data);
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
          ) : views.length === 0 ? (
            <div className="text-center py-10">
              <Eye className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Nenhuma visualização registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 font-medium">{views.length} visualização{views.length !== 1 ? "ções" : ""}</p>
              {views.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                      {v.user.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{v.user.name}</p>
                      <div className="flex gap-2">
                        <p className="text-xs text-gray-500">{v.user.email}</p>
                        {v.user.stores.length > 0 && (
                          <p className="text-xs text-blue-600">
                            {v.user.stores.map((s) => s.store.name).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-right flex-shrink-0 ml-3">
                    {new Date(v.viewedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                    <br />
                    {new Date(v.viewedAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
