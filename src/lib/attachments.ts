import { z } from "zod";

// ── Anexos múltiplos (mosaico estilo WhatsApp) ──────────────────────────
// Usado em materiais/comunicados, mensagens do chat, campanhas e alertas.

export type AttachmentKind = "VIDEO" | "PDF" | "IMAGE" | "DOCUMENT" | "OTHER";

export interface Attachment {
  url: string;
  key?: string | null;
  name: string;
  kind: AttachmentKind;
  mimeType?: string | null;
  size?: number | null;
  /** Segundo do vídeo usado como capa da miniatura */
  coverTime?: number | null;
  /** Imagem (JPEG) gerada a partir do segundo escolhido */
  coverUrl?: string | null;
}

export const MAX_ATTACHMENTS = 30;

export const attachmentSchema = z.object({
  url: z.string().url(),
  key: z.string().nullish(),
  name: z.string().min(1).max(300),
  kind: z.enum(["VIDEO", "PDF", "IMAGE", "DOCUMENT", "OTHER"]),
  mimeType: z.string().nullish(),
  size: z.number().nonnegative().nullish(),
  coverTime: z.number().min(0).nullish(),
  coverUrl: z.string().url().nullish(),
});

export const attachmentsSchema = z.array(attachmentSchema).max(MAX_ATTACHMENTS);

export function kindFromMime(mimeType: string | null | undefined, name?: string | null): AttachmentKind {
  const mime = (mimeType ?? "").toLowerCase();
  const ext = (name ?? "").split(".").pop()?.toLowerCase() ?? "";
  if (mime.startsWith("video/") || ["mp4", "mov", "webm", "m4v"].includes(ext)) return "VIDEO";
  if (mime === "application/pdf" || ext === "pdf") return "PDF";
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "IMAGE";
  if (
    mime.includes("word") ||
    mime.includes("powerpoint") ||
    mime.includes("presentation") ||
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext)
  )
    return "DOCUMENT";
  return "OTHER";
}

function parseList(value: unknown): Attachment[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (a): a is Attachment => !!a && typeof a === "object" && typeof (a as Attachment).url === "string"
  );
}

/** Anexos de um material, incluindo materiais antigos com um único fileUrl. */
export function materialAttachments(m: {
  attachments?: unknown;
  fileUrl?: string | null;
  fileKey?: string | null;
  fileType?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  fileName?: string | null;
  title?: string;
}): Attachment[] {
  const list = parseList(m.attachments);
  if (list.length > 0) return list;
  if (!m.fileUrl) return [];
  const upper = (m.fileType ?? "").toUpperCase();
  const kind = ["VIDEO", "PDF", "IMAGE", "DOCUMENT", "OTHER"].includes(upper)
    ? (upper as AttachmentKind)
    : kindFromMime(m.mimeType, m.fileName ?? m.fileUrl);
  return [
    {
      url: m.fileUrl,
      key: m.fileKey ?? null,
      name: m.fileName ?? m.title ?? "Arquivo",
      kind,
      mimeType: m.mimeType ?? null,
      size: m.fileSize ?? null,
    },
  ];
}

/** Anexos de uma mensagem do chat, incluindo mensagens antigas com um único arquivo. */
export function messageAttachments(msg: {
  attachments?: unknown;
  fileUrl?: string | null;
  fileKey?: string | null;
  fileType?: string | null;
  fileName?: string | null;
}): Attachment[] {
  const list = parseList(msg.attachments);
  if (list.length > 0) return list;
  if (!msg.fileUrl) return [];
  const kind = msg.fileType === "image" ? "IMAGE" : kindFromMime(null, msg.fileName ?? msg.fileUrl);
  return [{ url: msg.fileUrl, key: msg.fileKey ?? null, name: msg.fileName ?? "arquivo", kind }];
}

/** Tipo legado salvo em texto ("image", "pdf", "video", "document") → kind */
function kindFromLegacy(fileType: string | null | undefined, name: string): AttachmentKind {
  const t = (fileType ?? "").toLowerCase();
  if (t === "image") return "IMAGE";
  if (t === "pdf") return "PDF";
  if (t === "video") return "VIDEO";
  const byName = kindFromMime(null, name.split("?")[0]);
  if (byName !== "OTHER") return byName;
  return t === "document" ? "DOCUMENT" : "OTHER";
}

/**
 * Anexos de um post com arquivo único legado (fileUrl/fileName/fileType):
 * comunicados, registros, etapas de inauguração, solicitações.
 */
export function postAttachments(item: {
  attachments?: unknown;
  fileUrl?: string | null;
  fileKey?: string | null;
  fileName?: string | null;
  fileType?: string | null;
}): Attachment[] {
  const list = parseList(item.attachments);
  if (list.length > 0) return list;
  if (!item.fileUrl) return [];
  const name = item.fileName ?? item.fileUrl.split("?")[0].split("/").pop() ?? "arquivo";
  return [{ url: item.fileUrl, key: item.fileKey ?? null, name, kind: kindFromLegacy(item.fileType, name) }];
}

/** Campos legados com nome/tipo em texto, preenchidos a partir do 1º anexo. */
export function legacyNamedFileFields(attachments: Attachment[]) {
  const first = attachments[0];
  if (!first) return { fileUrl: null, fileKey: null, fileName: null, fileType: null };
  const map: Record<AttachmentKind, string> = {
    IMAGE: "image",
    PDF: "pdf",
    VIDEO: "video",
    DOCUMENT: "document",
    OTHER: "document",
  };
  return { fileUrl: first.url, fileKey: first.key ?? null, fileName: first.name, fileType: map[first.kind] };
}

/** Anexos genéricos (campanhas, alertas), com fallback para uma lista legada. */
export function genericAttachments(
  value: unknown,
  legacy: { fileUrl: string; fileKey?: string | null; fileName: string; fileType?: string | null }[] = []
): Attachment[] {
  const list = parseList(value);
  if (list.length > 0) return list;
  return legacy.map((a) => ({
    url: a.fileUrl,
    key: a.fileKey ?? null,
    name: a.fileName,
    kind: a.fileType === "image" ? "IMAGE" : kindFromMime(a.fileType, a.fileName),
  }));
}

/** Campos legados (fileUrl, fileType…) preenchidos a partir do primeiro anexo. */
export function legacyFileFields(attachments: Attachment[]) {
  const first = attachments[0];
  if (!first) {
    return { fileUrl: null, fileKey: null, mimeType: null, fileSize: null };
  }
  const total = attachments.reduce((sum, a) => sum + (a.size ?? 0), 0);
  return {
    fileUrl: first.url,
    fileKey: first.key ?? null,
    mimeType: first.mimeType ?? null,
    fileSize: total > 0 ? Math.round(total) : null,
  };
}

export function attachmentLabel(kind: AttachmentKind): string {
  switch (kind) {
    case "VIDEO":
      return "Vídeo";
    case "PDF":
      return "PDF";
    case "IMAGE":
      return "Imagem";
    case "DOCUMENT":
      return "Documento";
    default:
      return "Arquivo";
  }
}

export function attachmentsSummary(attachments: Attachment[]): string {
  if (attachments.length === 0) return "";
  if (attachments.length === 1) return `📎 ${attachments[0].name}`;
  return `📎 ${attachments.length} anexos`;
}

/** Fonte de vídeo posicionada no segundo da capa (fallback quando não há coverUrl). */
export function videoAtSecond(url: string, seconds?: number | null): string {
  const t = seconds && seconds > 0 ? seconds : 0.1;
  return `${url.split("#")[0]}#t=${t}`;
}

export function formatSeconds(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Captura o quadro do vídeo no segundo informado e devolve um JPEG.
 * Funciona com arquivos locais (object URL) e com URLs remotas que permitem CORS.
 * Devolve null se o navegador não conseguir capturar (ex.: CORS bloqueado).
 */
export function captureVideoFrame(src: string, seconds: number, maxWidth = 960): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve(null);
    const video = document.createElement("video");
    let settled = false;
    const finish = (blob: Blob | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      resolve(blob);
    };
    const timer = setTimeout(() => finish(null), 20000);

    if (!src.startsWith("blob:")) video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    video.onloadedmetadata = () => {
      const duration = isFinite(video.duration) ? video.duration : seconds;
      video.currentTime = Math.min(Math.max(0, seconds), Math.max(0, duration - 0.05));
    };
    video.onseeked = () => {
      try {
        const ratio = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(video.videoWidth * ratio));
        canvas.height = Math.max(1, Math.round(video.videoHeight * ratio));
        const ctx = canvas.getContext("2d");
        if (!ctx) return finish(null);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => finish(blob), "image/jpeg", 0.82);
      } catch {
        finish(null);
      }
    };
    video.onerror = () => finish(null);
    video.src = src;
  });
}
