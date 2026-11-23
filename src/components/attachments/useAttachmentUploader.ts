"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { uploadFiles } from "@/lib/uploadthing-components";
import type { OurFileRouter } from "@/lib/uploadthing";
import {
  type Attachment,
  MAX_ATTACHMENTS,
  captureVideoFrame,
  kindFromMime,
} from "@/lib/attachments";

export type AttachmentEndpoint = Exclude<keyof OurFileRouter, "videoCoverUploader">;

export interface UploadItem {
  id: string;
  fileName: string;
  status: "uploading" | "ready" | "error";
  progress: number;
  error?: string;
  /** Object URL do arquivo local (preview e captura da capa) */
  localUrl?: string;
  coverBusy?: boolean;
  attachment?: Attachment;
}

export type AttachmentUploader = ReturnType<typeof useAttachmentUploader>;

const DEFAULT_COVER_SECOND = 1;

let seq = 0;
const nextId = () => `att-${Date.now()}-${seq++}`;

function fromAttachments(list: Attachment[]): UploadItem[] {
  return list.map((a) => ({
    id: nextId(),
    fileName: a.name,
    status: "ready",
    progress: 100,
    attachment: a,
  }));
}

export function useAttachmentUploader(endpoint: AttachmentEndpoint, initial: Attachment[] = []) {
  const [items, setItems] = useState<UploadItem[]>(() => fromAttachments(initial));
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const patch = useCallback((id: string, update: Partial<UploadItem> | ((i: UploadItem) => Partial<UploadItem>)) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...(typeof update === "function" ? update(i) : update) } : i))
    );
  }, []);

  // Libera os object URLs ao desmontar
  useEffect(
    () => () => {
      itemsRef.current.forEach((i) => i.localUrl && URL.revokeObjectURL(i.localUrl));
    },
    []
  );

  const setCover = useCallback(
    async (id: string, seconds: number) => {
      const item = itemsRef.current.find((i) => i.id === id);
      if (!item?.attachment || item.attachment.kind !== "VIDEO") return;
      const second = Math.max(0, Math.round(seconds * 10) / 10);
      patch(id, (i) => ({
        coverBusy: true,
        attachment: i.attachment && { ...i.attachment, coverTime: second },
      }));

      let coverUrl: string | null = null;
      try {
        const blob = await captureVideoFrame(item.localUrl ?? item.attachment.url, second);
        if (blob) {
          const file = new File([blob], `capa-${second}s.jpg`, { type: "image/jpeg" });
          const [res] = await uploadFiles("videoCoverUploader", { files: [file] });
          coverUrl = res?.url ?? null;
        }
      } catch {
        coverUrl = null; // sem capa gerada → a miniatura usa o vídeo posicionado no segundo (#t=)
      }
      patch(id, (i) => ({
        coverBusy: false,
        attachment: i.attachment && { ...i.attachment, coverTime: second, coverUrl },
      }));
    },
    [patch]
  );

  const uploadOne = useCallback(
    async (id: string, file: File) => {
      try {
        const [res] = await uploadFiles(endpoint, {
          files: [file],
          onUploadProgress: ({ progress }) => patch(id, { progress }),
        });
        if (!res) throw new Error("Falha no upload");
        const mimeType = res.type || file.type || null;
        const attachment: Attachment = {
          url: res.url,
          key: res.key,
          name: res.name || file.name,
          kind: kindFromMime(mimeType, res.name || file.name),
          mimeType,
          size: res.size ?? file.size,
        };
        if (attachment.kind === "VIDEO") attachment.coverTime = DEFAULT_COVER_SECOND;
        patch(id, { status: "ready", progress: 100, attachment });
        if (attachment.kind === "VIDEO") await setCover(id, DEFAULT_COVER_SECOND);
      } catch (e) {
        patch(id, {
          status: "error",
          error: e instanceof Error ? e.message : "Erro no upload",
        });
      }
    },
    [endpoint, patch, setCover]
  );

  const addFiles = useCallback(
    (fileList: FileList | File[] | null) => {
      if (!fileList) return;
      const room = MAX_ATTACHMENTS - itemsRef.current.length;
      const files = Array.from(fileList).slice(0, Math.max(0, room));
      const created = files.map((file) => {
        const kind = kindFromMime(file.type, file.name);
        return {
          file,
          item: {
            id: nextId(),
            fileName: file.name,
            status: "uploading" as const,
            progress: 0,
            localUrl: kind === "VIDEO" || kind === "IMAGE" ? URL.createObjectURL(file) : undefined,
          },
        };
      });
      setItems((prev) => [...prev, ...created.map((c) => c.item)]);
      created.forEach(({ file, item }) => uploadOne(item.id, file));
    },
    [uploadOne]
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.localUrl) URL.revokeObjectURL(item.localUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const move = useCallback((id: string, dir: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      const to = idx + dir;
      if (idx < 0 || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
  }, []);

  const reset = useCallback((list: Attachment[] = []) => {
    itemsRef.current.forEach((i) => i.localUrl && URL.revokeObjectURL(i.localUrl));
    setItems(fromAttachments(list));
  }, []);

  const attachments = useMemo(
    () => items.filter((i) => i.status === "ready" && i.attachment).map((i) => i.attachment!),
    [items]
  );
  const busy = items.some((i) => i.status === "uploading" || i.coverBusy);

  return { items, attachments, busy, addFiles, remove, move, setCover, reset };
}

/**
 * Envia vários arquivos de uma vez (sem formulário), gerando a capa dos
 * vídeos no segundo padrão. Usado onde o anexo é salvo na hora (ex.: etapas
 * da inauguração).
 */
export async function uploadAttachments(endpoint: AttachmentEndpoint, files: File[]): Promise<Attachment[]> {
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const [res] = await uploadFiles(endpoint, { files: [file] });
        if (!res) return null;
        const mimeType = res.type || file.type || null;
        const attachment: Attachment = {
          url: res.url,
          key: res.key,
          name: res.name || file.name,
          kind: kindFromMime(mimeType, res.name || file.name),
          mimeType,
          size: res.size ?? file.size,
        };
        if (attachment.kind === "VIDEO") {
          attachment.coverTime = DEFAULT_COVER_SECOND;
          const local = URL.createObjectURL(file);
          try {
            const blob = await captureVideoFrame(local, DEFAULT_COVER_SECOND);
            if (blob) {
              const [cover] = await uploadFiles("videoCoverUploader", {
                files: [new File([blob], "capa.jpg", { type: "image/jpeg" })],
              });
              attachment.coverUrl = cover?.url ?? null;
            }
          } catch {
            /* sem capa: miniatura usa o vídeo em #t= */
          } finally {
            URL.revokeObjectURL(local);
          }
        }
        return attachment;
      } catch {
        return null;
      }
    })
  );
  return results.filter((a): a is Attachment => !!a);
}
