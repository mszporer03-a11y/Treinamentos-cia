"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2 } from "lucide-react";

type PdfDoc = any;

async function loadPdf(url: string): Promise<PdfDoc> {
  const pdfjs = await import("pdfjs-dist/build/pdf");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  return pdfjs.getDocument({ url: `/api/file-proxy?url=${encodeURIComponent(url)}` }).promise;
}

async function renderPage(pdf: PdfDoc, num: number, canvas: HTMLCanvasElement, targetWidth: number) {
  const page = await pdf.getPage(num);
  const base = page.getViewport({ scale: 1 });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const scale = (targetWidth / base.width) * dpr;
  const viewport = page.getViewport({ scale });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = "100%";
  canvas.style.height = "auto";
  await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
}

/** Primeira página do PDF como miniatura (evidência do card). */
export function PdfThumbnail({ url, className = "" }: { url: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdf = await loadPdf(url);
        if (cancelled || !canvasRef.current) return;
        await renderPage(pdf, 1, canvasRef.current, 480);
        if (!cancelled) setState("ok");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className={`relative bg-gray-100 overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className={`w-full object-top transition-opacity ${state === "ok" ? "opacity-100" : "opacity-0 h-0"}`}
      />
      {state !== "ok" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-orange-500">
          {state === "loading" ? (
            <Loader2 className="h-8 w-8 animate-spin opacity-60" />
          ) : (
            <>
              <FileText className="h-12 w-12 opacity-60" />
              <span className="text-xs font-medium opacity-70">PDF</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PageCanvas({ pdf, num }: { pdf: PdfDoc; num: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    const el = ref.current;
    if (!el) return;
    const width = Math.min(el.parentElement?.clientWidth || 800, 1000);
    renderPage(pdf, num, el, width).catch(() => {
      /* página ignorada */
      void cancelled;
    });
    return () => {
      cancelled = true;
    };
  }, [pdf, num]);
  return <canvas ref={ref} className="w-full h-auto shadow-md bg-white rounded" />;
}

/** Todas as páginas do PDF, roláveis. */
export function PdfPages({ url }: { url: string }) {
  const [pdf, setPdf] = useState<PdfDoc | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadPdf(url)
      .then((doc) => !cancelled && setPdf(doc))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error)
    return (
      <p className="text-center text-sm text-gray-500 py-16">
        Não foi possível exibir o PDF. Use o botão de download.
      </p>
    );
  if (!pdf)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );

  return (
    <div className="space-y-3 bg-gray-100 p-2 sm:p-4 rounded-lg">
      {Array.from({ length: pdf.numPages }, (_, i) => (
        <PageCanvas key={i} pdf={pdf} num={i + 1} />
      ))}
    </div>
  );
}
