"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MaterialViewer } from "@/components/franchisee/MaterialViewer";
import {
  Play,
  FileText,
  Image as ImageIcon,
  File,
  ChevronRight,
  ChevronLeft,
  Megaphone,
  Search,
  X,
  Newspaper,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  slug: string;
}

interface Material {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string | null;
  fileType: string;
  fileSize?: number | null;
  mimeType?: string | null;
  createdAt: string;
  category: Category;
  createdBy?: { name: string } | null;
}

const typeIcon: Record<string, React.ElementType> = {
  VIDEO: Play,
  PDF: FileText,
  IMAGE: ImageIcon,
  DOCUMENT: FileText,
  OTHER: File,
  NOTICE: Megaphone,
};

const typeLabel: Record<string, string> = {
  VIDEO: "Vídeo",
  PDF: "PDF",
  IMAGE: "Imagem",
  DOCUMENT: "Documento",
  OTHER: "Arquivo",
  NOTICE: "Aviso",
};

const typeColor: Record<string, string> = {
  VIDEO: "bg-rose-50 text-rose-500",
  PDF: "bg-orange-50 text-orange-500",
  IMAGE: "bg-sky-50 text-sky-500",
  DOCUMENT: "bg-blue-50 text-blue-500",
  OTHER: "bg-gray-50 text-gray-400",
  NOTICE: "bg-amber-50 text-amber-600",
};

function isCiaNews(cat: { name: string; slug: string }) {
  const n = cat.name.toLowerCase();
  const s = cat.slug.toLowerCase();
  return s === "cia-news" || n.includes("cia news");
}

function FeedCard({ material, onOpen }: { material: Material; onOpen: () => void }) {
  const Icon = typeIcon[material.fileType] ?? File;
  const color = typeColor[material.fileType] ?? typeColor.OTHER;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-md transition-all group">
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
        <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">
            {(material.createdBy?.name ?? "A").charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {material.createdBy?.name ?? "Admin"}
          </p>
          <p className="text-xs text-gray-400">
            {material.category.icon} {material.category.name} · {formatDate(material.createdAt)}
          </p>
        </div>
      </div>

      <button onClick={onOpen} className="w-full text-left focus:outline-none">
        {material.fileType === "IMAGE" ? (
          <div className="mx-3 rounded-xl overflow-hidden bg-gray-100 aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={material.fileUrl ?? ""}
              alt={material.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div
            className={`mx-3 rounded-xl aspect-video flex flex-col items-center justify-center gap-2 ${color} group-hover:opacity-80 transition-opacity`}
          >
            <Icon className="h-10 w-10 sm:h-14 sm:w-14 opacity-60" />
            <span className="text-xs sm:text-sm font-medium opacity-70">
              {typeLabel[material.fileType] ?? "Arquivo"}
            </span>
          </div>
        )}
        <div className="px-4 pt-2.5 pb-4">
          <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-rose-600 transition-colors">
            {material.title}
          </p>
          {material.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{material.description}</p>
          )}
          <p className="text-xs text-rose-600 font-medium mt-2 flex items-center gap-0.5">
            Abrir <ChevronRight className="h-3 w-3" />
          </p>
        </div>
      </button>
    </div>
  );
}

export default function CiaNewsPage() {
  const { data: session } = useSession();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then((mats: Material[]) => {
        setMaterials(Array.isArray(mats) ? mats.filter((m) => isCiaNews(m.category)) : []);
        setLoading(false);
      });
  }, []);

  const filtered = search.trim()
    ? materials.filter((m) => {
        const q = search.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q)
        );
      })
    : materials;

  if (!session?.user) return null;

  return (
    <div className="p-4 sm:p-6">
      {/* Back link */}
      <Link
        href="/gallery"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-5"
      >
        <ChevronLeft className="h-4 w-4" /> Menu Principal
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-rose-500 flex items-center justify-center shadow-sm">
          <Newspaper className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">CIA News</h1>
          <p className="text-sm text-gray-500">
            {loading
              ? "Carregando..."
              : `${filtered.length} de ${materials.length} publicaç${materials.length !== 1 ? "ões" : "ão"}`}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-5 max-w-2xl">
        Notícias e novidades da Companhia do Churrasco.
      </p>

      {/* Search bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Pesquisar publicação por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white transition"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl">📰</span>
          <p className="text-gray-500 mt-4 font-medium">Nenhuma publicação ainda.</p>
          <p className="text-sm text-gray-400 mt-1">
            As novidades da rede aparecerão aqui quando publicadas.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl">🔍</span>
          <p className="text-gray-500 mt-4 font-medium">
            Nenhum resultado para &quot;{search}&quot;.
          </p>
          <button
            onClick={() => setSearch("")}
            className="mt-2 text-sm text-rose-600 hover:underline"
          >
            Limpar pesquisa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((mat) => (
            <FeedCard
              key={mat.id}
              material={mat}
              onOpen={() => {
                setViewing(mat);
                fetch(`/api/materials/${mat.id}/view`, { method: "POST" });
              }}
            />
          ))}
        </div>
      )}

      {viewing && <MaterialViewer material={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
