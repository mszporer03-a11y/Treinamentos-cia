"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, X, Loader2, AlertCircle, Clapperboard, ChevronLeft, ChevronRight } from "lucide-react";
import { formatFileSize, cn } from "@/lib/utils";
import { type Attachment, MAX_ATTACHMENTS, attachmentLabel, formatSeconds } from "@/lib/attachments";
import { AttachmentThumb } from "./AttachmentMosaic";
import type { AttachmentUploader, UploadItem } from "./useAttachmentUploader";

// ── Seletor do segundo usado como capa do vídeo ─────────────────────────
function VideoCoverModal({
  item,
  onConfirm,
  onClose,
}: {
  item: UploadItem;
  onConfirm: (seconds: number) => void;
  onClose: () => void;
}) {
  const att = item.attachment as Attachment;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [second, setSecond] = useState(att.coverTime ?? 1);

  function seek(value: number) {
    const max = duration > 0 ? duration : value;
    const v = Math.min(Math.max(0, value), max);
    setSecond(v);
    if (videoRef.current) videoRef.current.currentTime = v;
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900">Capa da miniatura</h3>
            <p className="text-xs text-gray-500 truncate">{att.name}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <video
          ref={videoRef}
          src={item.localUrl ?? att.url}
          muted
          playsInline
          preload="auto"
          className="w-full aspect-video bg-black rounded-lg object-contain"
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (isFinite(d)) setDuration(d);
            e.currentTarget.currentTime = Math.min(second, isFinite(d) ? d : second);
          }}
        />

        <input
          type="range"
          min={0}
          max={duration || Math.max(second, 1)}
          step={0.1}
          value={second}
          onChange={(e) => seek(Number(e.target.value))}
          className="w-full mt-3 accent-orange-600"
        />

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <label className="text-sm text-gray-700">Segundo da capa:</label>
          <button type="button" onClick={() => seek(second - 1)} className="p-1 rounded border border-gray-200 hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            type="number"
            min={0}
            max={duration || undefined}
            step={0.1}
            value={Number(second.toFixed(1))}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center"
          />
          <button type="button" onClick={() => seek(second + 1)} className="p-1 rounded border border-gray-200 hover:bg-gray-50">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-400">
            {formatSeconds(second)}
            {duration > 0 && ` / ${formatSeconds(duration)}`}
          </span>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(second)}
            className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition text-sm"
          >
            Usar este segundo como capa
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lista de anexos pendentes/enviados ──────────────────────────────────
export function AttachmentPickerList({
  uploader,
  compact = false,
}: {
  uploader: AttachmentUploader;
  compact?: boolean;
}) {
  const [coverItemId, setCoverItemId] = useState<string | null>(null);
  const coverItem = uploader.items.find((i) => i.id === coverItemId);

  // Fecha o seletor se o item foi removido
  useEffect(() => {
    if (coverItemId && !coverItem) setCoverItemId(null);
  }, [coverItemId, coverItem]);

  if (uploader.items.length === 0) return null;

  return (
    <>
      <ul className={cn("grid gap-2", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
        {uploader.items.map((item, idx) => {
          const att = item.attachment;
          const isVideo = att?.kind === "VIDEO";
          return (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-xl border bg-white",
                item.status === "error" ? "border-red-200 bg-red-50" : "border-gray-200"
              )}
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
                {att ? (
                  <AttachmentThumb attachment={att} localUrl={item.localUrl} showName={false} />
                ) : item.localUrl && /\.(jpe?g|png|gif|webp)$/i.test(item.fileName) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.localUrl} alt="" className="w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Upload className="h-5 w-5 text-gray-300" />
                  </div>
                )}
                {(item.status === "uploading" || item.coverBusy) && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{att?.name ?? item.fileName}</p>
                {item.status === "uploading" && (
                  <div className="mt-1">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 transition-all" style={{ width: `${item.progress}%` }} />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">Enviando… {Math.round(item.progress)}%</p>
                  </div>
                )}
                {item.status === "error" && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="h-3 w-3" /> {item.error ?? "Erro no upload"}
                  </p>
                )}
                {item.status === "ready" && att && (
                  <p className="text-xs text-gray-500">
                    {attachmentLabel(att.kind)}
                    {att.size ? ` · ${formatFileSize(att.size)}` : ""}
                  </p>
                )}
                {isVideo && item.status === "ready" && (
                  <button
                    type="button"
                    disabled={item.coverBusy}
                    onClick={() => setCoverItemId(item.id)}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 disabled:opacity-50"
                  >
                    <Clapperboard className="h-3.5 w-3.5" />
                    {item.coverBusy
                      ? "Gerando capa…"
                      : `Capa: ${formatSeconds(att?.coverTime ?? 0)} (${att?.coverTime ?? 0}s) · alterar`}
                  </button>
                )}
              </div>

              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                {!compact && uploader.items.length > 1 && (
                  <div className="flex">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => uploader.move(item.id, -1)}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      title="Mover para trás"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === uploader.items.length - 1}
                      onClick={() => uploader.move(item.id, 1)}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      title="Mover para frente"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => uploader.remove(item.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition"
                  title="Remover anexo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {coverItem && coverItem.attachment && (
        <VideoCoverModal
          item={coverItem}
          onClose={() => setCoverItemId(null)}
          onConfirm={(seconds) => {
            setCoverItemId(null);
            uploader.setCover(coverItem.id, seconds);
          }}
        />
      )}
    </>
  );
}

// ── Campo completo: área de seleção + lista ─────────────────────────────
export function AttachmentPicker({
  uploader,
  accept,
  hint = "Selecione um ou vários arquivos (vídeos, PDFs, imagens, documentos)",
}: {
  uploader: AttachmentUploader;
  accept?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const full = uploader.items.length >= MAX_ATTACHMENTS;

  return (
    <div className="space-y-3">
      <AttachmentPickerList uploader={uploader} />

      {!full && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            uploader.addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "border-2 border-dashed rounded-xl p-4 flex flex-col items-center text-center cursor-pointer transition",
            dragging ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/40"
          )}
        >
          <Upload className="h-7 w-7 text-gray-300 mb-1.5" />
          <p className="text-sm font-medium text-gray-700">
            {uploader.items.length > 0 ? "Adicionar mais arquivos" : "Clique ou arraste os arquivos aqui"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            Vários anexos aparecem em mosaico no feed. Em vídeos, escolha o segundo usado como capa.
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          uploader.addFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
