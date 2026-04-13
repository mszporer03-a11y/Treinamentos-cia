"use client";

import { useState } from "react";
import { Play, FileText, Image, File } from "lucide-react";
import { formatFileSize, formatDate } from "@/lib/utils";
import { MaterialViewer } from "./MaterialViewer";

interface Material {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileType: string;
  fileSize?: number | null;
  mimeType?: string | null;
  createdAt: Date | string;
}

interface MaterialCardProps {
  material: Material;
}

const fileTypeConfig: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  VIDEO: { icon: Play, color: "text-red-500 bg-red-50", label: "Vídeo" },
  PDF: {
    icon: FileText,
    color: "text-orange-500 bg-orange-50",
    label: "PDF",
  },
  IMAGE: { icon: Image, color: "text-green-500 bg-green-50", label: "Imagem" },
  DOCUMENT: {
    icon: FileText,
    color: "text-blue-500 bg-blue-50",
    label: "Documento",
  },
  OTHER: { icon: File, color: "text-gray-500 bg-gray-50", label: "Arquivo" },
};

export function MaterialCard({ material }: MaterialCardProps) {
  const [showViewer, setShowViewer] = useState(false);

  const config = fileTypeConfig[material.fileType] ?? fileTypeConfig.OTHER;
  const Icon = config.icon;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-transparent hover:border-blue-100 flex flex-col">
        {/* Thumbnail / Icon area */}
        {material.fileType === "IMAGE" ? (
          <div
            className="h-36 rounded-t-2xl bg-gray-100 overflow-hidden cursor-pointer"
            onClick={() => setShowViewer(true)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={material.fileUrl}
              alt={material.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          </div>
        ) : (
          <div
            className={`h-36 rounded-t-2xl flex items-center justify-center cursor-pointer ${config.color}`}
            onClick={() => setShowViewer(true)}
          >
            <Icon className="h-14 w-14 opacity-60" />
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit mb-2 ${config.color}`}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </span>

          <h3
            className="font-semibold text-gray-900 text-sm leading-snug mb-1 cursor-pointer hover:text-blue-600 transition line-clamp-2"
            onClick={() => setShowViewer(true)}
          >
            {material.title}
          </h3>

          {material.description && (
            <p className="text-xs text-gray-500 line-clamp-2 flex-1">
              {material.description}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {material.fileSize ? formatFileSize(material.fileSize) : formatDate(material.createdAt)}
            </span>
            <button
              onClick={() => setShowViewer(true)}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              Abrir
            </button>
          </div>
        </div>
      </div>

      {/* Viewer Modal */}
      {showViewer && (
        <MaterialViewer
          material={material}
          onClose={() => setShowViewer(false)}
        />
      )}
    </>
  );
}
