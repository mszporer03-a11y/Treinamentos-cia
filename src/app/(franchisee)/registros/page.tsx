"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ClipboardList, ChevronLeft, Paperclip, Image as ImageIcon, Store as StoreIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Alert {
  id: string;
  title: string;
  description: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  createdAt: string;
  store: { id: string; name: string; code: string };
  views?: { id: string }[];
}

export default function RegistrosPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((data: Alert[]) => {
        const list = Array.isArray(data) ? data : [];
        setItems(list);
        setLoading(false);
        // Registra visualização dos ainda não vistos
        list
          .filter((a) => !a.views || a.views.length === 0)
          .forEach((a) => fetch(`/api/alerts/${a.id}/view`, { method: "POST" }));
      });
  }, []);

  if (!session?.user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link
        href="/gallery"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-5"
      >
        <ChevronLeft className="h-4 w-4" /> Menu Principal
      </Link>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center shadow-sm">
          <ClipboardList className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Registros</h1>
          <p className="text-sm text-gray-500">Ocorrências registradas para a sua loja</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum registro ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <span className="inline-flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                  <StoreIcon className="h-3 w-3" /> {item.store.name}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.description}</p>
              {item.fileUrl && (
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-700 hover:bg-orange-100 transition"
                >
                  {item.fileType === "image" ? <ImageIcon className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}
                  {item.fileName ?? "Anexo"}
                </a>
              )}
              <p className="text-xs text-gray-400 mt-2">{formatDate(item.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
