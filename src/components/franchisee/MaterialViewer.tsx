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
  fileName?: string | null;
  attachments?: unknown;
  /** Texto completo exibido acima dos anexos (ex.: corpo do comunicado) */
  body?: string | null;
}

interface MaterialViewerProps {
  material: Material;
  onClose: () => void;
  /** Anexo a abrir diretamente; por padrão mostra a galeria */
  initialIndex?: number | null;
}

/** Post aberto: texto + galeria com todos os anexos (seleciona qual abrir). */
export function MaterialViewer({ material, onClose, initialIndex = null }: MaterialViewerProps) {
  const attachments = materialAttachments(material);
  const isNotice = material.fileType === "NOTICE";
  const text = material.body ?? (isNotice ? material.description : null);

  return (
    <AttachmentGallery
      attachments={attachments}
      title={material.title}
      subtitle={isNotice || material.body ? null : material.description}
      initialIndex={initialIndex}
      onClose={onClose}
    >
      {isNotice && !material.body && (
        <div className="flex items-center gap-2 mb-4 text-orange-600 px-1 sm:px-4 pt-2">
          <span className="text-2xl">📢</span>
          <span className="text-sm font-semibold uppercase tracking-wide">Aviso</span>
        </div>
      )}
      {text && (
        <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap px-1 sm:px-4">{text}</p>
      )}
      {!text && attachments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <span className="text-6xl">📁</span>
          <p className="text-gray-600 text-center">Este post não possui anexos.</p>
        </div>
      )}
    </AttachmentGallery>
  );
}
