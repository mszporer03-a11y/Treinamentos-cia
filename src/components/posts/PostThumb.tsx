"use client";

import { useEffect, useRef, useState } from "react";
import { Play, FileText, File, Megaphone, Image as ImageIcon, Loader2 } from "lucide-react";
import { pdfThumbnailUrl, fileExtension } from "@/lib/media-client";

export interface ThumbMaterial {
  title: string;
  description?: string | null;
  fileUrl: string | null;
  fileType: string;
  mimeType?: string | null;
  coverUrl?: string | null;
}

const gradients: Record<string, string> = {
  VIDEO: "from-rose-600 to-red-500",
  PDF: "from-orange-600 to-amber-500",
  IMAGE: "from-sky-600 to-cyan-500",
  DOCUMENT: "from-blue-700 to-indigo-500",
  OTHER: "from-gray-700 to-gray-500",
  NOTICE: "from-gray-900 via-gray-800 to-orange-900",
};

const typeIcon: Record<string, React.ElementType> = {
  VIDEO: Play,
  PDF: FileText,
  IMAGE: ImageIcon,
  DOCUMENT: FileText,
  OTHER: File,
  NOTICE: Megaphone,
};

export const typeLabel: Record<string, string> = {
  VIDEO: "Vídeo",
  PDF: "PDF",
  IMAGE: "Imagem",
  DOCUMENT: "Documento",
  OTHER: "Arquivo",
  NOTICE: "Comunicado",
};

/** Hook: true quando o elemento entra na tela (para carregar miniaturas sob demanda). */
function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView]);
  return { ref, inView };
}

function PdfFirstPage({ url, title }: { url: string; title: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!inView) return;
    let alive = true;
    pdfThumbnailUrl(url)
      .then((s) => alive && setSrc(s))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [inView, url]);

  return (
    <div ref={ref} className="absolute inset-0">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`1ª página de ${title}`} className="w-full h-full object-cover object-top" />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${gradients.PDF} flex items-center justify-center`}>
          {failed ? (
            <FileText className="h-12 w-12 text-white/70" />
          ) : (
            <Loader2 className="h-6 w-6 text-white/80 animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Área visual do post-card. Ordem de prioridade:
 * capa enviada → própria imagem → 1ª página do PDF → quadro do vídeo → arte com título.
 */
export function PostThumb({ material, className = "" }: { material: ThumbMaterial; className?: string }) {
  const Icon = typeIcon[material.fileType] ?? File;
  const gradient = gradients[material.fileType] ?? gradients.OTHER;
  const ext = fileExtension(material.fileUrl, material.mimeType);

  let content: React.ReactNode;
  if (material.coverUrl || (material.fileType === "IMAGE" && material.fileUrl)) {
    content = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={(material.coverUrl || material.fileUrl) ?? ""}
        alt={material.title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
      />
    );
  } else if (material.fileType === "PDF" && material.fileUrl) {
    content = <PdfFirstPage url={material.fileUrl} title={material.title} />;
  } else if (material.fileType === "VIDEO" && material.fileUrl) {
    content = (
      <video
        src={`${material.fileUrl}#t=0.5`}
        preload="metadata"
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover bg-black"
      />
    );
  } else {
    // Sem mídia visual: arte com título em destaque (comunicado / documento / arquivo)
    content = (
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} p-4 sm:p-5 flex flex-col justify-between`}>
        <Icon className="h-7 w-7 text-white/80" />
        <p className="text-white font-bold text-base sm:text-lg leading-snug line-clamp-3 drop-shadow">
          {material.title}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video overflow-hidden bg-gray-100 ${className}`}>
      {content}
      {material.fileType === "VIDEO" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="w-12 h-12 rounded-full bg-black/55 flex items-center justify-center backdrop-blur-sm">
            <Play className="h-5 w-5 text-white fill-white ml-0.5" />
          </span>
        </div>
      )}
      <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-black/60 text-white backdrop-blur-sm pointer-events-none">
        <Icon className="h-3 w-3" />
        {material.fileType === "PDF" ? "PDF" : typeLabel[material.fileType] ?? "Arquivo"}
        {material.fileType === "DOCUMENT" && ext ? ` · ${ext}` : ""}
      </span>
    </div>
  );
}
