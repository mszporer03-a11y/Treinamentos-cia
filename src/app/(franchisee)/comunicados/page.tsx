"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Megaphone, ChevronLeft, Paperclip, Image as ImageIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Comunicado {
  id: string;
  title: string;
  body: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  createdAt: string;
  createdBy?: { name: string } | null;
  views?: { id: string }[];
}

export default function ComunicadosPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/comunicados")
      .then((r) => r.json())
      .then((data: Comunicado[]) => {
        const list = Array.isArray(data) ? data : [];
        setItems(list);
        setLoading(false);
        // Marca como lidos os ainda não vistos
        list
          .filter((c) => !c.views || c.views.length === 0)
          .forEach((c) => fetch(`/api/comunicados/${c.id}/view`, { method: "POST" }));
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-sky-500 flex items-center justify-center shadow-sm">
          <Megaphone className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Comunicados</h1>
          <p className="text-sm text-gray-500">Avisos da Companhia do Churrasco</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum comunicado ainda.</p>
          <p className="text-sm text-gray-400 mt-1">Os avisos da rede aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-400">
                    {item.createdBy?.name ?? "Admin"} · {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.body}</p>
              {item.fileUrl && (
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 px-3 py-2 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-700 hover:bg-sky-100 transition"
                >
                  {item.fileType === "image" ? <ImageIcon className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}
                  {item.fileName ?? "Anexo"}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
