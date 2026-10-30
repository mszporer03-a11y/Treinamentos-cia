"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Wrench, X, Phone, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const CONTACTS = [
  { city: "Recife", phones: ["(81) 3127-9595", "(81) 4040-4040"] },
  { city: "Salvador", phones: ["(71) 3052-0787", "(71) 4040-4005"] },
];

const telHref = (phone: string) => `tel:+55${phone.replace(/\D/g, "")}`;

// Cartaz "Fique Atento" com os contatos oficiais de suporte da 3LM Informática
function Support3LMModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-2xl bg-[#0055a4] sm:border-4 border-red-600 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-y-auto"
        style={{ maxHeight: "100svh" }}
      >
        <div className="flex items-center justify-between px-4 py-3 text-white">
          <p className="font-bold text-sm uppercase tracking-wide">Suporte Sistema 3LM</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10" title="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4">
          <Image
            src="/suporte-3lm.webp"
            alt="Fique atento: suporte, plantão e atendimento 3LM Informática — Recife (81) 3127-9595 e (81) 4040-4040; Salvador (71) 3052-0787 e (71) 4040-4005"
            width={1600}
            height={1131}
            className="w-full h-auto rounded-lg border-2 border-white"
            priority
          />
        </div>

        {/* Números clicáveis (ligação direta no celular) */}
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {CONTACTS.map(({ city, phones }) => (
            <div key={city} className="bg-white/10 rounded-xl p-3">
              <p className="text-white font-bold text-sm uppercase mb-1.5">{city}</p>
              {phones.map((phone) => (
                <a
                  key={phone}
                  href={telHref(phone)}
                  className="flex items-center gap-2 text-white hover:text-yellow-200 text-sm font-semibold py-0.5"
                >
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  {phone}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-4 mx-4 mb-4 pt-4 border-t border-white/30 text-center">
          <p className="text-white font-bold mb-3 flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-300" />
            Não conseguiu resolver? Favor abrir solicitação!
          </p>
          <Link
            href="/suporte/suporte-sistema"
            onClick={onClose}
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Abrir Solicitação (Chamado)
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Atalho fixo "Resolva problemas no sistema 3LM" */
export function Support3LMButton({
  variant = "banner",
  className,
}: {
  variant?: "banner" | "sidebar" | "icon";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "banner" && (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "w-full bg-[#004b87] hover:bg-[#003666] text-white rounded-2xl px-5 py-4 text-center transition shadow-sm",
            className
          )}
        >
          <span className="flex items-center justify-center gap-2 text-base sm:text-lg font-bold uppercase">
            <Wrench className="h-5 w-5" /> Resolva problemas no sistema 3LM
          </span>
          <span className="block text-xs sm:text-sm opacity-90 mt-0.5">Clique para visualizar os contatos de suporte</span>
        </button>
      )}
      {variant === "sidebar" && (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-semibold bg-[#004b87] hover:bg-[#003666] text-white transition text-left",
            className
          )}
        >
          <Wrench className="h-4 w-4 flex-shrink-0" />
          <span className="leading-tight">Resolva problemas no sistema 3LM</span>
        </button>
      )}
      {variant === "icon" && (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-lg text-white bg-[#004b87] hover:bg-[#003666] transition",
            className
          )}
          title="Resolva problemas no sistema 3LM"
          aria-label="Resolva problemas no sistema 3LM"
        >
          <Wrench className="h-4 w-4" />
        </button>
      )}
      {open && <Support3LMModal onClose={() => setOpen(false)} />}
    </>
  );
}
