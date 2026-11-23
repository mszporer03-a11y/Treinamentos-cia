"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Megaphone, ChevronLeft } from "lucide-react";
import { MaterialViewer } from "@/components/franchisee/MaterialViewer";
import {
  ComunicadoCard,
  comunicadoToViewer,
  type ComunicadoItem,
} from "@/components/franchisee/ComunicadoCard";

export default function ComunicadosPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<ComunicadoItem[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<ComunicadoItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/comunicados")
      .then((r) => r.json())
      .then((data: ComunicadoItem[]) => {
        const list = Array.isArray(data) ? data : [];
        setItems(list);
        setLoading(false);
        // Marca como lidos os ainda não vistos (o selo "Novo" some na próxima visita)
        const unseen = list.filter((c) => !c.views || c.views.length === 0);
        setNewIds(new Set(unseen.map((c) => c.id)));
        unseen.forEach((c) => fetch(`/api/comunicados/${c.id}/view`, { method: "POST" }));
      });
  }, []);

  if (!session?.user) return null;

  const [first, ...rest] = items;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
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
          <h1 className="text-xl font-bold text-gray-900">Novidades e Comunicados</h1>
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
        <div className="space-y-5">
          {/* Último comunicado em destaque */}
          <div className="max-w-2xl">
            <ComunicadoCard item={first} featured isNew={newIds.has(first.id)} onOpen={() => setViewing(first)} />
          </div>
          {rest.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide pt-2">Anteriores</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rest.map((item) => (
                  <ComunicadoCard
                    key={item.id}
                    item={item}
                    isNew={newIds.has(item.id)}
                    onOpen={() => setViewing(item)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {viewing && <MaterialViewer material={comunicadoToViewer(viewing)} onClose={() => setViewing(null)} />}
    </div>
  );
}
