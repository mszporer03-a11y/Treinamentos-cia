"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ClipboardList, ChevronLeft } from "lucide-react";
import { MaterialViewer } from "@/components/franchisee/MaterialViewer";
import { ComunicadoCard, comunicadoToViewer, type ComunicadoItem } from "@/components/franchisee/ComunicadoCard";

interface Alert {
  id: string;
  title: string;
  description: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  attachments?: unknown;
  createdAt: string;
  store: { id: string; name: string; code: string };
  views?: { id: string }[];
}

export default function RegistrosPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<Alert[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<ComunicadoItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((data: Alert[]) => {
        const list = Array.isArray(data) ? data : [];
        setItems(list);
        setLoading(false);
        // Registra visualização dos ainda não vistos (o selo "Novo" some na próxima visita)
        const unseen = list.filter((a) => !a.views || a.views.length === 0);
        setNewIds(new Set(unseen.map((a) => a.id)));
        unseen.forEach((a) => fetch(`/api/alerts/${a.id}/view`, { method: "POST" }));
      });
  }, []);

  if (!session?.user) return null;

  // Registro no formato post-card (título + descrição + imagem/anexo)
  const toCard = (a: Alert): ComunicadoItem => ({
    id: a.id,
    title: a.title,
    body: a.description,
    fileUrl: a.fileUrl,
    fileName: a.fileName,
    fileType: a.fileType,
    attachments: a.attachments,
    createdAt: a.createdAt,
    createdBy: { name: a.store.name },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ComunicadoCard
              key={item.id}
              item={toCard(item)}
              tone="orange"
              icon={ClipboardList}
              isNew={newIds.has(item.id)}
              onOpen={() => setViewing(toCard(item))}
            />
          ))}
        </div>
      )}

      {viewing && <MaterialViewer material={comunicadoToViewer(viewing)} onClose={() => setViewing(null)} />}
    </div>
  );
}
