"use client";

import { useEffect, useState } from "react";

/**
 * Saudação personalizada exibida uma vez logo após o login,
 * identificando o usuário e a(s) loja(s) vinculada(s).
 */
export function WelcomeModal({ name, storeNames }: { name: string; storeNames: string[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("cia:welcome")) {
        sessionStorage.removeItem("cia:welcome");
        setOpen(true);
      }
    } catch {}
  }, []);

  if (!open) return null;

  const stores =
    storeNames.length > 1
      ? `${storeNames.slice(0, -1).join(", ")} e ${storeNames[storeNames.length - 1]}`
      : storeNames[0];

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border-t-[6px] border-red-700 w-full max-w-sm p-8 text-center">
        <h2 className="text-2xl font-bold text-red-700 mb-2">👋 Olá!</h2>
        <p className="text-gray-600 text-lg leading-snug">
          Bem-vindo(a), <strong className="text-gray-900">{name}</strong>
          {stores && (
            <>
              {" "}da <strong className="text-gray-900">{stores}</strong>
            </>
          )}
          !
        </p>
        <button
          onClick={() => setOpen(false)}
          autoFocus
          className="mt-6 w-full py-3 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-xl transition"
        >
          Acessar Intranet
        </button>
      </div>
    </div>
  );
}
