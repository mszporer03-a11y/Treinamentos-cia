"use client";

import { Play, FileText, File, Image as ImageIcon, Presentation } from "lucide-react";
import { type Attachment, attachmentLabel, videoAtSecond } from "@/lib/attachments";
import { cn } from "@/lib/utils";

const tileStyle: Record<string, { icon: React.ElementType; color: string }> = {
  VIDEO: { icon: Play, color: "bg-red-50 text-red-500" },
  PDF: { icon: FileText, color: "bg-orange-50 text-orange-500" },
  IMAGE: { icon: ImageIcon, color: "bg-sky-50 text-sky-500" },
  DOCUMENT: { icon: Presentation, color: "bg-blue-50 text-blue-500" },
  OTHER: { icon: File, color: "bg-gray-100 text-gray-500" },
};

/** Miniatura de um anexo ocupando todo o espaço do elemento pai. */
export function AttachmentThumb({
  attachment,
  localUrl,
  showName = true,
  className,
}: {
  attachment: Pick<Attachment, "url" | "name" | "kind" | "coverUrl" | "coverTime">;
  /** Object URL local (antes/durante o upload) */
  localUrl?: string;
  showName?: boolean;
  className?: string;
}) {
  const { kind } = attachment;
  const src = localUrl ?? attachment.url;

  if (kind === "IMAGE") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={attachment.name} loading="lazy" className={cn("w-full h-full object-cover", className)} />
    );
  }

  if (kind === "VIDEO") {
    return (
      <div className={cn("relative w-full h-full bg-black", className)}>
        {attachment.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={attachment.coverUrl} alt={attachment.name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <video
            src={videoAtSecond(src, attachment.coverTime)}
            preload="metadata"
            muted
            playsInline
            className="w-full h-full object-cover pointer-events-none"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-11 h-11 rounded-full bg-black/55 flex items-center justify-center ring-2 ring-white/70">
            <Play className="h-5 w-5 text-white fill-white ml-0.5" />
          </span>
        </div>
      </div>
    );
  }

  const { icon: Icon, color } = tileStyle[kind] ?? tileStyle.OTHER;
  return (
    <div className={cn("w-full h-full flex flex-col items-center justify-center gap-1.5 p-2 text-center", color, className)}>
      <Icon className="h-8 w-8 opacity-70" />
      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{attachmentLabel(kind)}</span>
      {showName && <span className="text-xs font-medium text-gray-700 line-clamp-2 break-all px-1">{attachment.name}</span>}
    </div>
  );
}

interface AttachmentMosaicProps {
  attachments: Attachment[];
  /** Clique no mosaico (abre a galeria) */
  onOpen: (index: number) => void;
  /** "feed" = cartões do feed; "chat" = balão de mensagem */
  variant?: "feed" | "chat";
  className?: string;
}

/**
 * Mosaico de anexos no estilo WhatsApp:
 * 1 anexo → imagem única · 2 → lado a lado · 3 → um grande + dois empilhados ·
 * 4+ → grade 2×2 com "+N" no último quadro.
 */
export function AttachmentMosaic({ attachments, onOpen, variant = "feed", className }: AttachmentMosaicProps) {
  const count = attachments.length;
  if (count === 0) return null;

  const shown = attachments.slice(0, 4);
  const extra = count - shown.length;

  const frame =
    count === 1
      ? variant === "chat"
        ? "aspect-[4/3]"
        : "aspect-video"
      : count === 2
        ? "aspect-[2/1] grid grid-cols-2"
        : variant === "chat"
          ? "aspect-square grid grid-cols-2 grid-rows-2"
          : "aspect-video grid grid-cols-2 grid-rows-2";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={count > 1 ? `Abrir galeria com ${count} anexos` : `Abrir ${attachments[0].name}`}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(0);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(0);
        }
      }}
      className={cn("relative w-full overflow-hidden rounded-xl bg-gray-100 gap-0.5 cursor-pointer group/mosaic", frame, className)}
    >
      {shown.map((att, i) => (
        <div
          key={`${att.url}-${i}`}
          className={cn("relative overflow-hidden bg-gray-200", count === 3 && i === 0 && "row-span-2", count === 1 && "w-full h-full")}
        >
          <AttachmentThumb
            attachment={att}
            showName={count <= 2}
            className="transition-transform duration-300 group-hover/mosaic:scale-[1.03]"
          />
          {i === shown.length - 1 && extra > 0 && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
              <span className="text-white text-2xl sm:text-3xl font-bold">+{extra}</span>
            </div>
          )}
        </div>
      ))}
      {count > 1 && (
        <span className="absolute top-2 right-2 bg-black/60 text-white text-[11px] font-medium px-2 py-0.5 rounded-full pointer-events-none">
          {count} anexos
        </span>
      )}
    </div>
  );
}
