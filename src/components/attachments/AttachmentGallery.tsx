"use client";

import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, LayoutGrid, Download } from "lucide-react";
import { PdfPages } from "@/components/PdfPreview";
import { type Attachment, attachmentLabel } from "@/lib/attachments";
import { formatFileSize, cn } from "@/lib/utils";
import { AttachmentThumb } from "./AttachmentMosaic";

/** Download com o nome original (via proxy do UploadThing) */
export function downloadUrl(attachment: Pick<Attachment, "url" | "name">): string {
  return `/api/file-proxy?url=${encodeURIComponent(attachment.url)}&download=${encodeURIComponent(attachment.name)}`;
}

/** Visualização de um único anexo (vídeo, imagem, PDF, documento). */
export function AttachmentView({ attachment }: { attachment: Attachment }) {
  switch (attachment.kind) {
    case "VIDEO":
      return (
        <video
          key={attachment.url}
          src={attachment.url}
          poster={attachment.coverUrl ?? undefined}
          controls
          autoPlay
          playsInline
          preload="metadata"
          className="w-full max-h-[calc(100svh-200px)] sm:max-h-[65vh] rounded-lg bg-black"
        >
          Seu navegador não suporta reprodução de vídeo.
        </video>
      );
    case "IMAGE":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={attachment.url}
          src={attachment.url}
          alt={attachment.name}
          className="max-w-full max-h-[calc(100svh-200px)] sm:max-h-[65vh] object-contain mx-auto rounded-lg"
        />
      );
    case "PDF":
      return <PdfPages key={attachment.url} url={attachment.url} />;
    case "DOCUMENT":
      return (
        <iframe
          key={attachment.url}
          src={`https://docs.google.com/viewer?url=${encodeURIComponent(attachment.url)}&embedded=true`}
          title={attachment.name}
          className="w-full h-[calc(100svh-200px)] sm:h-[65vh] rounded-lg border-0"
        />
      );
    default:
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <span className="text-6xl">📁</span>
          <p className="text-gray-600 text-center">Pré-visualização não disponível para este tipo de arquivo.</p>
          <a
            href={downloadUrl(attachment)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition"
          >
            <Download className="h-4 w-4" /> Baixar arquivo
          </a>
        </div>
      );
  }
}

interface AttachmentGalleryProps {
  attachments: Attachment[];
  title?: string;
  subtitle?: string | null;
  /** Conteúdo exibido acima da galeria (ex.: texto do aviso) */
  children?: React.ReactNode;
  /** Abre direto num anexo; por padrão abre a galeria (ou o anexo único) */
  initialIndex?: number | null;
  onClose: () => void;
}

/**
 * Modal de galeria: mostra todos os anexos do post em grade; o usuário
 * escolhe qual abrir e pode navegar entre eles (setas / miniaturas).
 */
export function AttachmentGallery({
  attachments,
  title,
  subtitle,
  children,
  initialIndex = null,
  onClose,
}: AttachmentGalleryProps) {
  const count = attachments.length;
  // Com conteúdo extra (ex.: texto do aviso) sempre há uma visão geral; senão, anexo único abre direto
  const hasOverview = count > 1 || !!children;
  const [index, setIndex] = useState<number | null>(hasOverview ? initialIndex : count === 1 ? 0 : null);

  const go = useCallback(
    (dir: -1 | 1) => setIndex((i) => (i === null ? i : (i + dir + count) % count)),
    [count]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (index !== null && hasOverview) setIndex(null);
        else onClose();
      } else if (index !== null && count > 1 && e.key === "ArrowRight") go(1);
      else if (index !== null && count > 1 && e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, count, hasOverview, go, onClose]);

  const current = index !== null ? attachments[index] : null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-5xl flex flex-col"
        style={{ maxHeight: "100svh" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="font-bold text-gray-900 text-lg leading-tight truncate">
              {current && count > 1 ? current.name : title ?? current?.name ?? "Anexos"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
              {current && count > 1
                ? `${index! + 1} de ${count} · ${attachmentLabel(current.kind)}${current.size ? ` · ${formatFileSize(current.size)}` : ""}`
                : subtitle ?? (count > 1 ? `${count} anexos — selecione qual abrir` : "")}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {current && hasOverview && (
              <button
                onClick={() => setIndex(null)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                title="Voltar à galeria"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Galeria</span>
              </button>
            )}
            {current && (
              <a
                href={downloadUrl(current)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-lg transition"
                title="Baixar arquivo"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Baixar</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto flex-1">
          {current ? (
            <div className="relative">
              <AttachmentView attachment={current} />
              {count > 1 && (
                <>
                  <button
                    onClick={() => go(-1)}
                    className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition"
                    title="Anterior"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => go(1)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition"
                    title="Próximo"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {children}
              {count > 0 && (
                <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3", children ? "mt-5" : "")}>
                  {attachments.map((att, i) => (
                    <button
                      key={`${att.url}-${i}`}
                      onClick={() => setIndex(i)}
                      className="group text-left rounded-xl overflow-hidden border border-gray-100 hover:border-gray-300 hover:shadow-md transition bg-white"
                    >
                      <div className="aspect-square overflow-hidden bg-gray-100">
                        <AttachmentThumb
                          attachment={att}
                          showName={false}
                          className="transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="px-2.5 py-2">
                        <p className="text-xs font-medium text-gray-800 truncate">{att.name}</p>
                        <p className="text-[11px] text-gray-400">
                          {attachmentLabel(att.kind)}
                          {att.size ? ` · ${formatFileSize(att.size)}` : ""}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Thumbnail strip while viewing */}
        {current && count > 1 && (
          <div className="flex gap-2 px-4 pb-4 overflow-x-auto flex-shrink-0">
            {attachments.map((att, i) => (
              <button
                key={`${att.url}-strip-${i}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition",
                  i === index ? "border-orange-500" : "border-transparent opacity-60 hover:opacity-100"
                )}
                title={att.name}
              >
                <AttachmentThumb attachment={att} showName={false} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
