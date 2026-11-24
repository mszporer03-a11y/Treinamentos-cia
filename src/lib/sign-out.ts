"use client";

import { signOut } from "next-auth/react";

/** Sai do portal e esquece a loja ativa escolhida neste aparelho. */
export async function signOutAndClearStore() {
  await fetch("/api/active-store", { method: "DELETE" }).catch(() => {});
  await signOut({ callbackUrl: "/login" });
}
