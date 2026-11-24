"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Store as StoreIcon } from "lucide-react";

export type StoreOption = { id: string; name: string; code: string; city: string | null };

/**
 * Seletor da loja ativa. Com uma única loja mostra só o nome; com várias,
 * abre uma lista para trocar sem sair do portal.
 * variant "sidebar" = menu lateral escuro (desktop); "header" = barra do celular.
 */
export function StoreSwitcher({
  stores,
  activeStoreId,
  variant,
}: {
  stores: StoreOption[];
  activeStoreId: string | null;
  variant: "sidebar" | "header";
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (stores.length === 0) return null;

  const active = stores.find((s) => s.id === activeStoreId) ?? null;
  const canSwitch = stores.length > 1;
  const label = active?.name ?? (canSwitch ? "Selecionar loja" : stores[0].name);

  async function choose(storeId: string) {
    if (storeId === activeStoreId) {
      setOpen(false);
      return;
    }
    setSaving(storeId);
    const res = await fetch("/api/active-store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId }),
    }).catch(() => null);
    if (res?.ok) {
      // Recarrega a página para que todo o conteúdo reflita a nova loja
      window.location.reload();
    } else {
      setSaving(null);
      alert("Não foi possível trocar de loja. Tente novamente.");
    }
  }

  const isSidebar = variant === "sidebar";

  return (
    <div ref={ref} className="relative" data-tutorial="store-switcher">
      <button
        type="button"
        onClick={() => canSwitch && setOpen((o) => !o)}
        disabled={!canSwitch}
        title={canSwitch ? "Trocar de loja" : "Sua loja"}
        aria-haspopup={canSwitch ? "listbox" : undefined}
        aria-expanded={canSwitch ? open : undefined}
        className={
          isSidebar
            ? "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-left transition disabled:hover:bg-white/5 disabled:cursor-default"
            : "flex items-center gap-1.5 max-w-[150px] px-2 py-1.5 rounded-lg bg-orange-50 text-orange-700 text-xs font-semibold disabled:cursor-default"
        }
      >
        <StoreIcon className={isSidebar ? "h-4 w-4 text-orange-400 flex-shrink-0" : "h-3.5 w-3.5 flex-shrink-0"} />
        {isSidebar ? (
          <span className="flex-1 min-w-0">
            <span className="block text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Loja ativa</span>
            <span className="block text-sm font-medium text-white truncate">{label}</span>
          </span>
        ) : (
          <span className="truncate">{label}</span>
        )}
        {canSwitch && (
          <ChevronDown className={`h-3.5 w-3.5 flex-shrink-0 transition ${open ? "rotate-180" : ""} ${isSidebar ? "text-gray-400" : ""}`} />
        )}
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute z-50 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-1 max-h-80 overflow-y-auto ${
            isSidebar ? "left-0 right-0" : "left-0 w-64 max-w-[calc(100vw-2rem)]"
          }`}
        >
          <p className="px-3 pt-1.5 pb-1 text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Trocar de loja</p>
          {stores.map((store) => {
            const isActive = store.id === activeStoreId;
            return (
              <button
                key={store.id}
                role="option"
                aria-selected={isActive}
                onClick={() => choose(store.id)}
                disabled={saving !== null}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition disabled:opacity-60 ${
                  isActive ? "bg-orange-50 text-orange-700" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="flex-1 min-w-0">
                  <span className="block font-medium truncate">{store.name}</span>
                  <span className="block text-xs text-gray-400 truncate">
                    {store.code}
                    {store.city ? ` · ${store.city}` : ""}
                  </span>
                </span>
                {saving === store.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isActive ? (
                  <Check className="h-4 w-4" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
