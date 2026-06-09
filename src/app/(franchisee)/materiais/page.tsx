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
  BookOpen,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Megaphone,
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
  VIDEO: "Video",
  PDF: "PDF",
  IMAGE: "Imagem",
  DOCUMENT: "Documento",
  OTHER: "Arquivo",
  NOTICE: "Aviso",
};

const typeColor: Record<string, string> = {
  VIDEO: "bg-red-50 text-red-500",
  PDF: "bg-orange-50 text-orange-500",
  IMAGE: "bg-sky-50 text-sky-500",
  DOCUMENT: "bg-blue-50 text-blue-500",
  OTHER: "bg-gray-50 text-gray-400",
  NOTICE: "bg-amber-50 text-amber-600",
};

function FeedCard({ material, onOpen }: { material: Material; onOpen: () => void }) {
  const Icon = typeIcon[material.fileType] ?? File;
  const color = typeColor[material.fileType] ?? typeColor.OTHER;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-md transition-all group">
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
        <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0">
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
          <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
            {material.title}
          </p>
          {material.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{material.description}</p>
          )}
          <p className="text-xs text-orange-600 font-medium mt-2 flex items-center gap-0.5">
            Abrir <ChevronRight className="h-3 w-3" />
          </p>
        </div>
      </button>
    </div>
  );
}

export default function MateriaisPage() {
  const { data: session } = useSession();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewing, setViewing] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [matRes, catRes] = await Promise.all([
        fetch("/api/materials"),
        fetch("/api/categories"),
      ]);
      const [mats, cats] = await Promise.all([matRes.json(), catRes.json()]);
      setMaterials(mats);
      setCategories(cats);
      setLoading(false);
    }
    load();
  }, []);

  const filtered =
    activeCategory === "all"
      ? materials
      : materials.filter((m) => m.category.id === activeCategory);

  const visibleCategories = categories.filter((cat) =>
    materials.some((m) => m.category.id === cat.id)
  );

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center shadow-sm">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Materiais de Treinamento</h1>
            <p className="text-sm text-gray-500">
              {loading ? "Carregando..." : `${materials.length} material${materials.length !== 1 ? "is" : ""} disponível${materials.length !== 1 ? "is" : ""}`}
            </p>
          </div>
        </div>

        {/* Filter button */}
        {visibleCategories.length > 0 && (
          <button
            onClick={() => {
              setShowFilters((v) => !v);
              if (showFilters) setActiveCategory("all");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              showFilters || activeCategory !== "all"
                ? "bg-orange-600 text-white border-orange-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {activeCategory !== "all"
              ? visibleCategories.find((c) => c.id === activeCategory)?.name ?? "Filtro"
              : "Filtrar"}
          </button>
        )}
      </div>

      {/* Filter drawer */}
      {showFilters && visibleCategories.length > 0 && (
        <div className="flex flex-col gap-1 mb-5 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
          <button
            onClick={() => {
              setActiveCategory("all");
              setShowFilters(false);
            }}
            className={`flex items-center gap-2 w-full px-4 py-2 rounded-xl text-sm font-medium transition-all text-left ${
              activeCategory === "all"
                ? "bg-orange-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-orange-50"
            }`}
          >
            Todos
          </button>
          {visibleCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setShowFilters(false);
              }}
              className={`flex items-center gap-2 w-full px-4 py-2 rounded-xl text-sm font-medium transition-all text-left ${
                activeCategory === cat.id
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-orange-50"
              }`}
            >
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl">📭</span>
          <p className="text-gray-500 mt-4 font-medium">Nenhum material nesta categoria ainda.</p>
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
