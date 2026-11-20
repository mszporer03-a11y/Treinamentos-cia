"use client";

// Utilitários de mídia que rodam só no navegador:
// - renderização da 1ª página de PDFs (miniatura) com pdf.js
// - captura de um quadro de vídeo para servir de capa
// - download forçado de arquivos hospedados em outro domínio

type PdfJs = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfJs> | null = null;

export function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf").then((mod) => {
      const pdfjs = mod as unknown as PdfJs;
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
      return pdfjs;
    });
    pdfjsPromise.catch(() => {
      pdfjsPromise = null;
    });
  }
  return pdfjsPromise;
}

export async function openPdf(source: string | ArrayBuffer) {
  const pdfjs = await loadPdfJs();
  const task = pdfjs.getDocument(
    typeof source === "string"
      ? { url: source, disableAutoFetch: true, disableStream: false }
      : { data: new Uint8Array(source) }
  );
  return task.promise;
}

/** Renderiza a 1ª página do PDF em um canvas com a largura indicada. */
export async function renderPdfFirstPage(
  source: string | ArrayBuffer,
  targetWidth = 640
): Promise<HTMLCanvasElement> {
  const doc = await openPdf(source);
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: targetWidth / base.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas;
  } finally {
    doc.destroy();
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao gerar imagem"))), type, quality)
  );
}

// Cache em memória das miniaturas de PDFs antigos (sem capa salva).
const thumbCache = new Map<string, Promise<string>>();

export function pdfThumbnailUrl(url: string): Promise<string> {
  let p = thumbCache.get(url);
  if (!p) {
    p = renderPdfFirstPage(url, 560).then((c) => c.toDataURL("image/jpeg", 0.8));
    p.catch(() => thumbCache.delete(url));
    thumbCache.set(url, p);
  }
  return p;
}

/** Captura um quadro do vídeo (local) para servir de capa. */
export function captureVideoFrame(file: File, atSeconds = 1): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    const cleanup = () => URL.revokeObjectURL(url);
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Tempo esgotado ao ler o vídeo"));
    }, 15000);
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(atSeconds, Math.max(0, (video.duration || 1) / 3));
    };
    video.onseeked = async () => {
      try {
        const w = Math.min(960, video.videoWidth || 960);
        const h = Math.round(((video.videoHeight || 540) / (video.videoWidth || 960)) * w);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")?.drawImage(video, 0, 0, w, h);
        resolve(await canvasToBlob(canvas));
      } catch (e) {
        reject(e);
      } finally {
        clearTimeout(timer);
        cleanup();
      }
    };
    video.onerror = () => {
      clearTimeout(timer);
      cleanup();
      reject(new Error("Não foi possível ler o vídeo"));
    };
  });
}

/**
 * Gera automaticamente uma imagem de capa a partir do arquivo enviado:
 * 1ª página para PDFs, um quadro para vídeos. Retorna null quando não se aplica.
 */
export async function generateCoverFromFile(file: File): Promise<File | null> {
  try {
    let blob: Blob | null = null;
    if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
      const canvas = await renderPdfFirstPage(await file.arrayBuffer(), 900);
      blob = await canvasToBlob(canvas);
    } else if (file.type.startsWith("video/")) {
      blob = await captureVideoFrame(file);
    }
    if (!blob) return null;
    const base = file.name.replace(/\.[^/.]+$/, "");
    return new File([blob], `capa-${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return null;
  }
}

/** Faz o download do arquivo com o nome informado (fallback: abre em nova aba). */
export async function downloadFile(url: string, filename?: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    // Sem acentos/caracteres especiais: alguns navegadores ignoram o nome nesses casos
    a.download =
      (filename || url.split("/").pop() || "arquivo")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^\w.\- ]+/g, "_")
        .trim() || "arquivo";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function fileExtension(url?: string | null, mime?: string | null): string {
  const fromUrl = url?.split("?")[0].split(".").pop();
  if (fromUrl && fromUrl.length <= 5 && !fromUrl.includes("/")) return fromUrl.toLowerCase();
  if (mime?.includes("pdf")) return "pdf";
  if (mime?.includes("word")) return "docx";
  if (mime?.includes("presentation") || mime?.includes("powerpoint")) return "pptx";
  if (mime?.includes("sheet") || mime?.includes("excel")) return "xlsx";
  if (mime?.startsWith("video/")) return mime.split("/")[1];
  if (mime?.startsWith("image/")) return mime.split("/")[1];
  return "";
}
