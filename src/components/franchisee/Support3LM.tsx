"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Wrench } from "lucide-react";

// Passo 9 — atalho de suporte ao sistema 3LM (cartaz "Fique atento" + abrir chamado)
const CITIES = [
  { city: "RECIFE", phones: ["(81) 3127-9595", "(81) 4040-4040"] },
  { city: "SALVADOR", phones: ["(71) 3052-0787", "(71) 4040-4005"] },
];

function tel(phone: string) {
  return `tel:+55${phone.replace(/\D/g, "")}`;
}

export function Support3LMModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-[#0055a4] rounded-2xl border-4 border-red-700 p-5 text-white max-h-[95svh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="bg-[#004b87] rounded-xl p-5 text-center">
          <h2 className="text-3xl font-extrabold tracking-wider">
            FIQUE <span className="text-red-500">ATENTO</span>
          </h2>
          <p className="font-bold mt-2 text-sm">
            ADICIONE À SUA AGENDA, <span className="text-red-400">NOSSOS NÚMEROS:</span>
          </p>

          <div className="mt-5 flex items-start justify-between gap-4 text-left">
            <div>
              <p className="text-red-400 font-bold leading-tight">
                Suporte, plantão e<br />atendimento:
              </p>
              {CITIES.map(({ city, phones }) => (
                <div key={city} className="mt-4">
                  <p className="text-xl font-bold">{city}</p>
                  {phones.map((p) => (
                    <a key={p} href={tel(p)} className="block font-bold text-lg hover:underline">
                      {p}
                    </a>
                  ))}
                </div>
              ))}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-4xl font-extrabold">3Lm</p>
              <p className="text-xs">Informática</p>
              <p className="mt-16 text-xs font-bold leading-tight">
                COMPANHIA
                <br />
                DO
                <br />
                CHURRASCO
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-white/30 text-center">
          <p className="font-bold">⚠️ Não conseguiu resolver? Favor abrir solicitação!</p>
          <Link
            href="/suporte/suporte-sistema"
            onClick={onClose}
            className="inline-block mt-3 px-6 py-3 bg-red-700 hover:bg-red-800 rounded-lg font-semibold transition"
          >
            Abrir Solicitação (Chamado)
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Support3LMBanner() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl bg-[#004b87] hover:bg-[#003666] transition px-5 py-4 text-white text-center"
      >
        <span className="flex items-center justify-center gap-2 text-base sm:text-lg font-bold uppercase">
          <Wrench className="h-5 w-5" /> Resolva problemas no sistema 3LM
        </span>
        <span className="block text-xs sm:text-sm opacity-90 mt-0.5">
          Clique para visualizar os contatos de suporte
        </span>
      </button>
      {open && <Support3LMModal onClose={() => setOpen(false)} />}
    </>
  );
}
