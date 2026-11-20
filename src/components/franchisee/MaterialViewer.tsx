"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download, ExternalLink, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { downloadFile, openPdf, fileExtension } from "@/lib/media-client";

interface Material {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string | null;
  fileType: string;
  mimeType?: string | null;
  coverUrl?: string | null;
}

interface MaterialViewerProps {
  material: Material;
  onClose: () => void;
}

/** Visualizador de PDF completo (todas as páginas) com pdf.js — funciona também no celular. */
function PdfViewer({ url, title }: { url: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pages, setPages] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;
    let doc: Awaited<ReturnType<typeof openPdf>> | null = null;
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";
    setStatus("loading");

    (async () => {
      try {
        doc = await openPdf(url);
        if (cancelled) return;
        setPages(doc.numPages);
        const width = Math.min(container.clientWidth || 800, 1000) * zoom;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        for (let i = 1; i <= doc.numPages; i++) {
          if (cancelled) return;
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * dpr });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
          canvas.style.maxWidth = zoom > 1 ? "none" : "100%";
          canvas.className = "mx-auto mb-3 rounded-md shadow bg-white";
          canvas.setAttribute("aria-label", `${title} — página ${i}`);
          container.appendChild(canvas);
          const ctx = canvas.getContext("2d");
          if (ctx) await page.render({ canvasContext: ctx, viewport }).promise;
          if (i === 1 && !cancelled) setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      doc?.destroy();
    };
  }, [url, zoom, title]);

  return (
    <div className="relative">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 mb-2 px-1 py-1 bg-white/90 backdrop-blur">
        <span className="text-xs text-gray-500">
          {status === "loading" && "Carregando documento…"}
          {status === "ready" && `${pages} página${pages !== 1 ? "s" : ""}`}
          {status === "error" && "Não foi possível pré-visualizar."}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(1, z - 0.5))} disabled={zoom <= 1}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30" title="Diminuir zoom">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.5))} disabled={zoom >= 3}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30" title="Aumentar zoom">
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>
      {status === "loading" && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
      {status === "error" && (
        <iframe src={url} className="w-full h-[70vh] rounded-lg border-0" title={title} />
      )}
      <div ref={containerRef} className="bg-gray-100 rounded-lg p-2 sm:p-4 overflow-x-auto" style={{ display: status === "error" ? "none" : undefined }} />
    </div>
  );
}

export function MaterialViewer({ material, onClose }: MaterialViewerProps) {
  const hasFile = !!material.fileUrl && material.fileType !== "NOTICE";
  const ext = fileExtension(material.fileUrl, material.mimeType);
  const filename = ext ? `${material.title}.${ext}` : material.title;
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleDownload() {
    if (!material.fileUrl) return;
    setDownloading(true);
    await downloadFile(material.fileUrl, filename);
    setDownloading(false);
  }

  function renderContent() {
    switch (material.fileType) {
      case "NOTICE":
        return (
          <div className="px-1 py-2 sm:px-4">
            {material.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={material.coverUrl} alt={material.title} className="w-full max-h-[50vh] object-contain rounded-xl mb-4 bg-gray-50" />
            )}
            <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
              {material.description || "Sem conteúdo."}
            </p>
          </div>
        );

      case "VIDEO":
        return (
          <video
            src={material.fileUrl ?? ""}
            poster={material.coverUrl ?? undefined}
            controls
            autoPlay
            className="w-full max-h-[calc(100svh-160px)] sm:max-h-[70vh] rounded-lg bg-black"
            preload="metadata"
            playsInline
          >
            Seu navegador não suporta reprodução de vídeo.
          </video>
        );

      case "PDF":
        return <PdfViewer url={material.fileUrl ?? ""} title={material.title} />;

      case "IMAGE":
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={material.fileUrl ?? ""}
            alt={material.title}
            className="max-w-full max-h-[calc(100svh-160px)] sm:max-h-[70vh] object-contain mx-auto rounded-lg"
          />
        );

      case "DOCUMENT": {
        // Word / PowerPoint / Excel — visualizador do Office Online
        const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(material.fileUrl ?? "")}`;
        return (
          <iframe
            src={viewerUrl}
            className="w-full h-[calc(100svh-160px)] sm:h-[70vh] rounded-lg border-0"
            title={material.title}
          />
        );
      }

      default:
        return (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <span className="text-6xl">📁</span>
            <p className="text-gray-600 text-center">
              Pré-visualização não disponível para este tipo de arquivo.
            </p>
            {hasFile && (
              <button onClick={handleDownload} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium">
                Baixar arquivo
              </button>
            )}
          </div>
        );
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={material.title}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-5xl flex flex-col" style={{ maxHeight: "100svh" }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="font-extrabold text-gray-900 text-lg leading-tight">{material.title}</h2>
            {material.description && material.fileType !== "NOTICE" && (
              <p className="text-sm text-gray-500 mt-1 whitespace-pre-line line-clamp-3">{material.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasFile && (
              <>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition"
                  title="Baixar arquivo"
                >
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  <span className="hidden sm:inline">Baixar</span>
                </button>
                <a
                  href={material.fileUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  title="Abrir em nova aba"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              </>
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
        <div className="p-4 overflow-auto flex-1">{renderContent()}</div>
      </div>
    </div>
  );
}
