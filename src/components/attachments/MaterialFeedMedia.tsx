"use client";

import { Play, FileText, Image as ImageIcon, File, Megaphone } from "lucide-react";
import { materialAttachments } from "@/lib/attachments";
import { cn } from "@/lib/utils";
import { AttachmentMosaic } from "./AttachmentMosaic";

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

export interface FeedMaterial {
  title: string;
  description?: string | null;
  fileUrl: string | null;
  fileType: string;
  mimeType?: string | null;
  fileSize?: number | null;
  fileName?: string | null;
  attachments?: unknown;
}

/** Usa o mosaico quando há vários anexos ou um vídeo (miniatura no segundo da capa). */
export function materialUsesMosaic(material: FeedMaterial): boolean {
  const list = materialAttachments(material);
  return list.length > 1 || list[0]?.kind === "VIDEO";
}

/**
 * Área de mídia de um post do feed: mosaico de anexos (estilo WhatsApp),
 * cartão de aviso, ou ícone do tipo de arquivo.
 */
export function MaterialFeedMedia({
  material,
  onOpen,
  className,
}: {
  material: FeedMaterial;
  onOpen: (index?: number) => void;
  className?: string;
}) {
  const attachments = materialAttachments(material);

  if (attachments.length > 0) {
    return <AttachmentMosaic attachments={attachments} onOpen={() => onOpen()} className={className} />;
  }

  const Icon = typeIcon[material.fileType] ?? File;
  const color = typeColor[material.fileType] ?? typeColor.OTHER;

  return (
    <button
      type="button"
      onClick={() => onOpen()}
      className={cn(
        "w-full rounded-xl aspect-video flex flex-col items-center justify-center gap-2 hover:opacity-80 transition-opacity px-4",
        color,
        className
      )}
    >
      <Icon className="h-10 w-10 sm:h-14 sm:w-14 opacity-60" />
      {material.fileType === "NOTICE" && material.description ? (
        <span className="text-xs sm:text-sm text-amber-900/80 line-clamp-3 text-center">{material.description}</span>
      ) : (
        <span className="text-xs sm:text-sm font-medium opacity-70">{typeLabel[material.fileType] ?? "Arquivo"}</span>
      )}
    </button>
  );
}
