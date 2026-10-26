"use client";

import { Megaphone, FileText, Play, File } from "lucide-react";
import { PdfThumbnail } from "@/components/PdfPreview";
import { formatDate } from "@/lib/utils";

export interface ComunicadoItem {
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

/** Tipo do arquivo (PDF, IMAGE, VIDEO, DOCUMENT) a partir da extensão/tipo salvo. */
export function comunicadoFileKind(item: Pick<ComunicadoItem, "fileUrl" | "fileName" | "fileType">) {
  if (!item.fileUrl) return null;
  const ext = (item.fileName ?? item.fileUrl).split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf" || item.fileType === "pdf") return "PDF";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext) || item.fileType === "image") return "IMAGE";
  if (["mp4", "mov", "webm", "m4v"].includes(ext) || item.fileType === "video") return "VIDEO";
  if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext)) return "DOCUMENT";
  return "OTHER";
}

/** Converte um comunicado para o formato do MaterialViewer. */
export function comunicadoToViewer(item: ComunicadoItem) {
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileType: comunicadoFileKind(item) ?? "NOTICE",
  };
}

const TONES = {
  sky: {
    ring: "border-sky-300 ring-1 ring-sky-200",
    fallback: "from-sky-600 to-sky-500",
    badge: "bg-sky-600",
    hover: "group-hover:text-sky-700",
    link: "text-sky-600",
  },
  orange: {
    ring: "border-orange-300 ring-1 ring-orange-200",
    fallback: "from-orange-600 to-orange-500",
    badge: "bg-orange-600",
    hover: "group-hover:text-orange-700",
    link: "text-orange-600",
  },
} as const;

export function ComunicadoCard({
  item,
  onOpen,
  isNew,
  featured,
  tone = "sky",
  icon: FallbackIcon = Megaphone,
}: {
  item: ComunicadoItem;
  onOpen: () => void;
  isNew?: boolean;
  featured?: boolean;
  tone?: keyof typeof TONES;
  /** Ícone exibido quando não há anexo */
  icon?: React.ElementType;
}) {
  const kind = comunicadoFileKind(item);
  const t = TONES[tone];

  return (
    <button
      onClick={onOpen}
      className={`w-full text-left bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all group focus:outline-none ${
        isNew ? t.ring : "border-gray-100"
      }`}
    >
      {/* Destaque visual: imagem, 1ª página do PDF ou ícone */}
      {kind === "IMAGE" && item.fileUrl ? (
        <div className={`bg-gray-100 overflow-hidden ${featured ? "aspect-[16/9]" : "aspect-video"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.fileUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : kind === "PDF" && item.fileUrl ? (
        <PdfThumbnail url={item.fileUrl} className={featured ? "aspect-[16/9]" : "aspect-video"} />
      ) : (
        <div
          className={`bg-gradient-to-br ${t.fallback} flex items-center justify-center text-white/90 ${
            featured ? "aspect-[16/9]" : "aspect-video"
          }`}
        >
          {kind === "VIDEO" ? (
            <Play className="h-14 w-14" />
          ) : kind ? (
            kind === "DOCUMENT" ? <FileText className="h-14 w-14" /> : <File className="h-14 w-14" />
          ) : (
            <FallbackIcon className="h-14 w-14" />
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-2 mb-1.5">
          {isNew && (
            <span className={`text-[10px] font-bold uppercase tracking-wide ${t.badge} text-white px-2 py-0.5 rounded-full`}>
              Novo
            </span>
          )}
          <span className="text-xs text-gray-400">
            {item.createdBy?.name ?? "Companhia do Churrasco"} · {formatDate(item.createdAt)}
          </span>
        </div>
        <p
          className={`font-bold text-gray-900 leading-snug ${t.hover} transition-colors ${
            featured ? "text-lg" : "text-base"
          }`}
        >
          {item.title}
        </p>
        <p className="text-sm text-gray-600 mt-1 line-clamp-3 whitespace-pre-wrap">{item.body}</p>
        <p className={`text-xs ${t.link} font-medium mt-3`}>
          {kind ? "Abrir e visualizar anexo →" : "Ler completo →"}
        </p>
      </div>
    </button>
  );
}
