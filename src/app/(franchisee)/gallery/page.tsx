"use client";

import { useState, useEffect } from "react";
import { MaterialViewer } from "@/components/franchisee/MaterialViewer";
import { Play, FileText, Image as ImageIcon, File } from "lucide-react";
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
  fileUrl: string;
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
};

const typeColor: Record<string, string> = {
  VIDEO: "bg-red-100 text-red-500",
  PDF: "bg-orange-100 text-orange-500",
  IMAGE: "bg-green-100 text-green-500",
  DOCUMENT: "bg-blue-100 text-blue-500",
  OTHER: "bg-gray-100 text-gray-500",
};

const typeLabel: Record<string, string> = {
  VIDEO: "Vídeo",
  PDF: "PDF",
  IMAGE: "Imagem",
  DOCUMENT: "Documento",
  OTHER: "Arquivo",
};

function FeedCard({ material, onOpen }: { material: Material; onOpen: () => void }) {
  const Icon = typeIcon[material.fileType] ?? File;
  const color = typeColor[material.fileType] ?? typeColor.OTHER;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
      {/* Header: uploader + category */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
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

      {/* Preview — clickable */}
      <button
        onClick={onOpen}
        className="w-full text-left focus:outline-none group"
      >
        {material.fileType === "IMAGE" ? (
          <div className="mx-3 rounded-xl overflow-hidden bg-gray-100 aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={material.fileUrl}
              alt={material.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className={`mx-3 rounded-xl aspect-video flex flex-col items-center justify-center gap-2 ${color} group-hover:opacity-80 transition-opacity`}>
            <Icon className="h-10 w-10 sm:h-14 sm:w-14 opacity-70" />
            <span className="text-xs sm:text-sm font-medium opacity-80">{typeLabel[material.fileType] ?? "Arquivo"}</span>
          </div>
        )}

        {/* Title */}
        <div className="px-4 pt-2.5 pb-3">
          <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {material.title}
          </p>
          {material.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{material.description}</p>
          )}
          <p className="text-xs text-blue-600 font-medium mt-2">Toque para abrir →</p>
        </div>
      </button>
    </div>
  );
}

export default function GalleryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
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

  const filtered = activeCategory === "all"
    ? materials
    : materials.filter((m) => m.category.id === activeCategory);

  return (
    <div>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Treinamentos</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Materiais publicados para sua equipe
        </p>
      </div>

      {/* Category filter pills */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          <button
            onClick={() => setActiveCategory("all")}
            className={`flex-shrink-0 px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeCategory === "all"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
              }`}
            >
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Feed */}
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

      {/* Viewer */}
      {viewing && (
        <MaterialViewer
          material={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
