"use client";

import { useEffect, useState } from "react";

// Passo 2 — saudação personalizada após o login (nome + loja vinculada).
// Exibida uma vez por sessão do navegador.
export function WelcomeModal({ userKey, name }: { userKey: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [storeNames, setStoreNames] = useState<string>("");

  useEffect(() => {
    const storageKey = `welcome-shown:${userKey}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // sem sessionStorage (modo privado etc.) → mostra mesmo assim
    }
    fetch("/api/stores")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setStoreNames(data.map((s: { name: string }) => s.name).join(", "));
      })
      .catch(() => {})
      .finally(() => setOpen(true));
  }, [userKey]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center border-t-4 border-red-700">
        <h2 className="text-2xl font-bold text-red-700">👋 Olá!</h2>
        <p className="mt-3 text-gray-600 text-lg leading-snug">
          Bem-vindo(a), <strong className="text-gray-900">{name}</strong>
          {storeNames && (
            <>
              {" "}da <strong className="text-gray-900">{storeNames}</strong>
            </>
          )}
          !
        </p>
        <button
          onClick={() => setOpen(false)}
          className="mt-6 px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg transition"
        >
          Acessar Intranet
        </button>
      </div>
    </div>
  );
}
