"use client";

import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";

const PDFJS_VERSION = "3.11.174";
const PDFJS_BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

type PdfJsLib = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: { url: string }) => {
    promise: Promise<{
      getPage: (n: number) => Promise<{
        getViewport: (o: { scale: number }) => { width: number; height: number };
        render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
      }>;
      destroy: () => void;
    }>;
  };
};

let loader: Promise<PdfJsLib> | null = null;

function loadPdfJs(): Promise<PdfJsLib> {
  const w = window as unknown as { pdfjsLib?: PdfJsLib };
  if (w.pdfjsLib) return Promise.resolve(w.pdfjsLib);
  if (!loader) {
    loader = new Promise<PdfJsLib>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `${PDFJS_BASE}/pdf.min.js`;
      s.onload = () => {
        if (!w.pdfjsLib) return reject(new Error("pdf.js indisponível"));
        w.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.js`;
        resolve(w.pdfjsLib);
      };
      s.onerror = () => { loader = null; reject(new Error("falha ao carregar pdf.js")); };
      document.head.appendChild(s);
    });
  }
  return loader;
}

/** Renderiza a 1ª página de um PDF como miniatura. Em caso de falha mostra um ícone. */
export function PdfThumb({ url, className = "" }: { url: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    let doc: { destroy: () => void } | null = null;

    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        const pdf = await pdfjs.getDocument({ url }).promise;
        doc = pdf;
        const page = await pdf.getPage(1);
        if (cancelled || !canvasRef.current) return;
        const base = page.getViewport({ scale: 1 });
        const scale = 640 / base.width;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas");
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) setState("ok");
      } catch {
        if (!cancelled) setState("error");
      }
    })();

    return () => {
      cancelled = true;
      doc?.destroy();
    };
  }, [url]);

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-cover object-top ${state === "ok" ? "" : "invisible"}`}
      />
      {state !== "ok" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-orange-50 text-orange-500">
          <FileText className={`h-10 w-10 sm:h-14 sm:w-14 opacity-60 ${state === "loading" ? "animate-pulse" : ""}`} />
          <span className="text-xs sm:text-sm font-medium opacity-70">PDF</span>
        </div>
      )}
    </div>
  );
}
