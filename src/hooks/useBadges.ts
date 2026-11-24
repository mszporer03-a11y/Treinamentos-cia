"use client";

import { useState, useEffect, useCallback } from "react";

export type BadgeCounts = Partial<{
  solicitacoes: number;
  comunicados: number;
  registros: number;
  cianews: number;
  materiais: number;
  cardapios: number;
  universidade: number;
}>;

/** Maps href paths to badge keys returned by /api/badges */
export const BADGE_KEY: Record<string, keyof BadgeCounts> = {
  "/solicitacoes":  "solicitacoes",
  "/comunicados":   "comunicados",
  "/registros":     "registros",
  "/cia-news":      "cianews",
  "/materiais":     "materiais",
  "/cardapios":     "cardapios",
  "/universidade":  "universidade",
  // Admin routes
  "/admin/solicitacoes":   "solicitacoes",
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
