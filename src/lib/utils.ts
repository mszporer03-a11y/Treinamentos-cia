import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getFileType(
  mimeType: string
): "VIDEO" | "PDF" | "IMAGE" | "DOCUMENT" | "OTHER" {
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (
    mimeType.includes("word") ||
    mimeType.includes("powerpoint") ||
    mimeType.includes("presentation") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel")
  )
    return "DOCUMENT";
  return "OTHER";
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function fileTypeIcon(fileType: string): string {
  switch (fileType) {
    case "VIDEO":
      return "🎬";
    case "PDF":
      return "📄";
    case "IMAGE":
      return "🖼️";
    case "DOCUMENT":
      return "📝";
    case "NOTICE":
      return "📢";
    default:
      return "📁";
  }
}
