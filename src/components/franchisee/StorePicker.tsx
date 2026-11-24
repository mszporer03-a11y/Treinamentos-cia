"use client";

import { useState } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { Check, ChevronRight, Loader2, Store as StoreIcon } from "lucide-react";

type StoreOption = { id: string; name: string; code: string; city: string | null };

/** Tela cheia de escolha de loja exibida após o login. */
export function StorePicker({
  userName,
  stores,
  activeStoreId,
  next,
}: {
  userName: string;
  stores: StoreOption[];
  activeStoreId: string | null;
  next: string;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function choose(storeId: string) {
    setSaving(storeId);
    setError("");
    try {
      const res = await fetch("/api/active-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Não foi possível selecionar a loja");
      }
      // Recarrega por completo para que todo o portal use a nova loja
      window.location.href = next;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao selecionar a loja");
      setSaving(null);
    }
  }

  const firstName = userName.split(" ")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-5">
            <Image src="/logo.png" alt="Companhia do Churrasco — Intranet" width={220} height={78} className="w-40" priority />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {firstName ? `Olá, ${firstName}!` : "Olá!"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Você tem acesso a {stores.length} lojas. Escolha em qual loja deseja entrar.
          </p>
        </div>

        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {stores.map((store) => {
            const isActive = store.id === activeStoreId;
            return (
              <button
                key={store.id}
                onClick={() => choose(store.id)}
                disabled={saving !== null}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition disabled:opacity-60 ${
                  isActive
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-orange-400 hover:bg-orange-50/50"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center flex-shrink-0">
                  <StoreIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{store.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {store.code}
                    {store.city ? ` · ${store.city}` : ""}
                  </p>
                </div>
                {saving === store.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                ) : isActive ? (
                  <Check className="h-4 w-4 text-orange-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg p-3">{error}</div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Você pode trocar de loja a qualquer momento pelo menu do portal.
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="block mx-auto mt-3 text-sm text-gray-500 hover:text-red-600"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
