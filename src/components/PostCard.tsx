"use client";

import { Play, FileText, Image as ImageIcon, File, Megaphone, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PdfThumb } from "@/components/PdfThumb";

export interface PostMaterial {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string | null;
  fileType: string;
  fileSize?: number | null;
  mimeType?: string | null;
  published?: boolean;
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
  VIDEO: "bg-red-50 text-red-500",
  PDF: "bg-orange-50 text-orange-500",
  IMAGE: "bg-sky-50 text-sky-500",
  DOCUMENT: "bg-blue-50 text-blue-500",
  OTHER: "bg-gray-50 text-gray-400",
  NOTICE: "bg-amber-50 text-amber-600",
};

const typeLabel: Record<string, string> = {
  VIDEO: "Vídeo",
  PDF: "PDF",
  IMAGE: "Imagem",
  DOCUMENT: "Documento",
  OTHER: "Arquivo",
  NOTICE: "Aviso",
};

/** Card único de post: autor/categoria + mídia renderizada + título + descrição. */
export function PostCard({
  material,
  onOpen,
  showStatus = false,
}: {
  material: PostMaterial;
  onOpen: () => void;
  showStatus?: boolean;
}) {
  const Icon = typeIcon[material.fileType] ?? File;
  const color = typeColor[material.fileType] ?? typeColor.OTHER;
  const url = material.fileUrl;

  let media: React.ReactNode;
  if (material.fileType === "IMAGE" && url) {
    media = (
      <div className="mx-3 rounded-xl overflow-hidden bg-gray-100 aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={material.title} loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
    );
  } else if (material.fileType === "PDF" && url) {
    media = <PdfThumb url={url} className="mx-3 rounded-xl aspect-video group-hover:opacity-80 transition-opacity" />;
  } else if (material.fileType === "VIDEO" && url) {
    media = (
      <div className="mx-3 rounded-xl overflow-hidden bg-black aspect-video relative">
        <video src={`${url}#t=0.5`} preload="metadata" muted playsInline className="w-full h-full object-cover pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="h-6 w-6 text-red-500 ml-0.5" />
          </div>
        </div>
      </div>
    );
  } else if (material.fileType === "NOTICE") {
    media = (
      <div className={`mx-3 rounded-xl aspect-video p-4 flex flex-col justify-center gap-1.5 overflow-hidden ${color} group-hover:opacity-80 transition-opacity`}>
        <Megaphone className="h-6 w-6 opacity-70" />
        <p className="text-sm leading-snug line-clamp-4 text-gray-700">{material.description || material.title}</p>
      </div>
    );
  } else {
    media = (
      <div className={`mx-3 rounded-xl aspect-video flex flex-col items-center justify-center gap-2 ${color} group-hover:opacity-80 transition-opacity`}>
        <Icon className="h-10 w-10 sm:h-14 sm:w-14 opacity-60" />
        <span className="text-xs sm:text-sm font-medium opacity-70">{typeLabel[material.fileType] ?? "Arquivo"}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-md transition-all group">
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
        <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">
            {(material.createdBy?.name ?? "A").charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{material.createdBy?.name ?? "Admin"}</p>
          <p className="text-xs text-gray-400">
            {material.category.icon} {material.category.name} · {formatDate(material.createdAt)}
          </p>
        </div>
        {showStatus && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
            material.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {material.published ? "Publicado" : "Rascunho"}
          </span>
        )}
      </div>

      <button onClick={onOpen} className="w-full text-left focus:outline-none">
        {media}
        <div className="px-4 pt-2.5 pb-4">
          <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
            {material.title}
          </p>
          {material.description && material.fileType !== "NOTICE" && (
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
