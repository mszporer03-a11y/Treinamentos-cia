"use client";

import { useState, useEffect, useCallback } from "react";

export type BadgeCounts = Partial<{
  surveys: number;
  chat: number;
  solicitacoes: number;
  materiais: number;
  cardapios: number;
  documentos: number;
  notificacoes: number;
}>;

/** Maps href paths to badge keys returned by /api/badges */
export const BADGE_KEY: Record<string, keyof BadgeCounts> = {
  "/surveys":       "surveys",
  "/chat":          "chat",
  "/solicitacoes":  "solicitacoes",
  "/materiais":     "materiais",
  "/cardapios":     "cardapios",
  "/documents":     "documentos",
  "/notificacoes":  "notificacoes",
  // Admin routes
  "/admin/chat":           "chat",
  "/admin/solicitacoes":   "solicitacoes",
  "/admin/notificacoes":   "notificacoes",
};

/** Fetch badge counts, refresh every 60 s */
export function useBadges(): BadgeCounts {
  const [badges, setBadges] = useState<BadgeCounts>({});

  const refresh = useCallback(() => {
    fetch("/api/badges")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => setBadges(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  return badges;
}
