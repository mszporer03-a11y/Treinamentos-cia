"use client";

import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { materialAttachments } from "@/lib/attachments";

interface Material {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string | null;
  fileType: string;
  mimeType?: string | null;
  fileSize?: number | null;
  attachments?: unknown;
}

interface MaterialViewerProps {
  material: Material;
  onClose: () => void;
  /** Anexo a abrir diretamente; por padrão mostra a galeria */
  initialIndex?: number | null;
}

export function MaterialViewer({ material, onClose, initialIndex = null }: MaterialViewerProps) {
  const attachments = materialAttachments(material);
  const isNotice = material.fileType === "NOTICE";

  return (
    <AttachmentGallery
      attachments={attachments}
      title={material.title}
      subtitle={isNotice ? null : material.description}
      initialIndex={initialIndex}
      onClose={onClose}
    >
      {isNotice && (
        <div className="px-1 py-2 sm:px-4">
          <div className="flex items-center gap-2 mb-4 text-orange-600">
            <span className="text-2xl">📢</span>
            <span className="text-sm font-semibold uppercase tracking-wide">Aviso</span>
          </div>
          <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
            {material.description || "Sem conteúdo."}
          </p>
        </div>
      )}
      {!isNotice && attachments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <span className="text-6xl">📁</span>
          <p className="text-gray-600 text-center">Este material não possui anexos.</p>
        </div>
      )}
    </AttachmentGallery>
  );
}
