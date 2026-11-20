"use client";

import { ChevronRight, Download, Paperclip } from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils";
import { downloadFile, fileExtension } from "@/lib/media-client";
import { PostThumb, typeLabel, type ThumbMaterial } from "./PostThumb";

export interface PostMaterial extends ThumbMaterial {
  id: string;
  fileSize?: number | null;
  published?: boolean;
  createdAt: string | Date;
  category?: { id: string; name: string; icon: string | null } | null;
  createdBy?: { name: string } | null;
}

export function downloadName(m: { title: string; fileUrl: string | null; mimeType?: string | null }) {
  const ext = fileExtension(m.fileUrl, m.mimeType);
  return ext ? `${m.title}.${ext}` : m.title;
}

/**
 * Post-card padrão do portal: Título em destaque + Descrição + Imagem/Anexo.
 * Usado no feed, nas abas e no dashboard do admin.
 */
export function PostCard({
  material,
  onOpen,
  showStatus = false,
  accent = "orange",
}: {
  material: PostMaterial;
  onOpen: () => void;
  showStatus?: boolean;
  accent?: "orange" | "blue";
}) {
  const hasFile = !!material.fileUrl && material.fileType !== "NOTICE";
  const accentText = accent === "blue" ? "text-blue-600" : "text-orange-600";
  const accentHover = accent === "blue" ? "group-hover:text-blue-600" : "group-hover:text-orange-600";
  const avatarBg = accent === "blue" ? "bg-blue-600" : "bg-orange-600";

  return (
    <article className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-lg transition-all group flex flex-col">
      {/* Autor / categoria */}
      <header className="flex items-center gap-2.5 px-4 pt-3 pb-2.5">
        <div className={`w-8 h-8 rounded-full ${avatarBg} flex items-center justify-center flex-shrink-0`}>
          <span className="text-white text-xs font-bold">
            {(material.createdBy?.name ?? "C").charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {material.createdBy?.name ?? "Cia do Churrasco"}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {material.category ? `${material.category.icon ?? ""} ${material.category.name} · ` : ""}
            {formatDate(material.createdAt)}
          </p>
        </div>
        {showStatus && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
              material.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {material.published ? "Publicado" : "Rascunho"}
          </span>
        )}
      </header>

      {/* Imagem */}
      <button onClick={onOpen} className="block w-full text-left focus:outline-none" aria-label={`Abrir ${material.title}`}>
        <PostThumb material={material} />
      </button>

      {/* Título + descrição */}
      <div className="px-4 pt-3 pb-3 flex-1 flex flex-col">
        <button onClick={onOpen} className="text-left focus:outline-none">
          <h3 className={`font-extrabold text-gray-900 text-[15px] leading-snug line-clamp-2 ${accentHover} transition-colors`}>
            {material.title}
          </h3>
        </button>
        {material.description && (
          <p className="text-[13px] text-gray-600 mt-1.5 line-clamp-3 whitespace-pre-line">{material.description}</p>
        )}

        {/* Anexo */}
        <div className="mt-auto pt-3 flex items-center gap-2">
          {hasFile ? (
            <>
              <span className="flex-1 min-w-0 inline-flex items-center gap-1.5 text-xs text-gray-500">
                <Paperclip className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">
                  {typeLabel[material.fileType] ?? "Arquivo"}
                  {material.fileSize ? ` · ${formatFileSize(material.fileSize)}` : ""}
                </span>
              </span>
              <button
                onClick={() => downloadFile(material.fileUrl!, downloadName(material))}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                title="Baixar"
                aria-label="Baixar arquivo"
              >
                <Download className="h-4 w-4" />
              </button>
            </>
          ) : (
            <span className="flex-1" />
          )}
          <button onClick={onOpen} className={`text-xs ${accentText} font-semibold inline-flex items-center gap-0.5`}>
            {material.fileType === "NOTICE" ? "Ler" : "Abrir"} <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
