"use client";

import { useState } from "react";
import { Play, FileText, Image as ImageIcon, File, Megaphone } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { MaterialViewer } from "@/components/franchisee/MaterialViewer";

interface Material {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string | null;
  fileType: string;
  fileSize?: number | null;
  mimeType?: string | null;
  published: boolean;
  createdAt: Date | string;
  category: { id: string; name: string; icon: string | null };
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

const typeColor: Record<string, string> = {
  VIDEO: "bg-red-100 text-red-500",
  PDF: "bg-orange-100 text-orange-500",
  IMAGE: "bg-green-100 text-green-500",
  DOCUMENT: "bg-blue-100 text-blue-500",
  OTHER: "bg-gray-100 text-gray-500",
  NOTICE: "bg-amber-100 text-amber-600",
};

const typeLabel: Record<string, string> = {
  VIDEO: "Vídeo",
  PDF: "PDF",
  IMAGE: "Imagem",
  DOCUMENT: "Documento",
  OTHER: "Arquivo",
  NOTICE: "Aviso",
};

function FeedCard({ material, onOpen }: { material: Material; onOpen: () => void }) {
  const Icon = typeIcon[material.fileType] ?? File;
  const color = typeColor[material.fileType] ?? typeColor.OTHER;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
      {/* Header */}
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
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
            material.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {material.published ? "Publicado" : "Rascunho"}
        </span>
      </div>

      {/* Preview */}
      <button onClick={onOpen} className="w-full text-left focus:outline-none group">
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
          <div className={`mx-3 rounded-xl aspect-video flex flex-col items-center justify-center gap-2 ${color} group-hover:opacity-80 transition-opacity`}>
            <Icon className="h-10 w-10 sm:h-14 sm:w-14 opacity-70" />
            <span className="text-xs sm:text-sm font-medium opacity-80">{typeLabel[material.fileType] ?? "Arquivo"}</span>
          </div>
        )}

        <div className="px-4 pt-2.5 pb-3">
          <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {material.title}
          </p>
          {material.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{material.description}</p>
          )}
          <p className="text-xs text-blue-600 font-medium mt-2">Clique para abrir →</p>
        </div>
      </button>
    </div>
  );
}

export function AdminFeed({ materials }: { materials: Material[] }) {
  const [viewing, setViewing] = useState<Material | null>(null);

  if (materials.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl">
        <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Nenhum material cadastrado ainda</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {materials.map((mat) => (
          <FeedCard key={mat.id} material={mat} onOpen={() => setViewing(mat)} />
        ))}
      </div>

      {viewing && (
        <MaterialViewer material={viewing} onClose={() => setViewing(null)} />
      )}
    </>
  );
}
