"use client";

import { X } from "lucide-react";

interface Material {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string | null;
  fileType: string;
  mimeType?: string | null;
}

interface MaterialViewerProps {
  material: Material;
  onClose: () => void;
}

export function MaterialViewer({ material, onClose }: MaterialViewerProps) {
  function renderContent() {
    switch (material.fileType) {
      case "NOTICE":
        return (
          <div className="px-1 py-2 sm:px-4">
            <div className="flex items-center gap-2 mb-4 text-orange-600">
              <span className="text-2xl">📢</span>
              <span className="text-sm font-semibold uppercase tracking-wide">Aviso</span>
            </div>
            <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
              {material.description || "Sem conteúdo."}
            </p>
          </div>
        );

      case "VIDEO":
        return (
          <video
            src={material.fileUrl ?? ""}
            controls
            autoPlay
            className="w-full max-h-[calc(100svh-120px)] sm:max-h-[70vh] rounded-lg bg-black"
            preload="metadata"
            playsInline
          >
            Seu navegador não suporta reprodução de vídeo.
          </video>
        );

      case "PDF":
        return (
          <iframe
            src={material.fileUrl ?? ""}
            className="w-full h-[calc(100svh-120px)] sm:h-[70vh] rounded-lg border-0"
            title={material.title}
          />
        );

      case "IMAGE":
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={material.fileUrl ?? ""}
            alt={material.title}
            className="max-w-full max-h-[calc(100svh-120px)] sm:max-h-[70vh] object-contain mx-auto rounded-lg"
          />
        );

      case "DOCUMENT": {
        // Use Google Docs Viewer for Word/PowerPoint files
        const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(material.fileUrl ?? "")}&embedded=true`;
        return (
          <iframe
            src={viewerUrl}
            className="w-full h-[calc(100svh-120px)] sm:h-[70vh] rounded-lg border-0"
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
          </div>
        );
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-5xl flex flex-col" style={{ maxHeight: "100svh" }}>
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0 pr-4">
            <h2 className="font-bold text-gray-900 text-lg leading-tight truncate">
              {material.title}
            </h2>
            {material.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                {material.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
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
