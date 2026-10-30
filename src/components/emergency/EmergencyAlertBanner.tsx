"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Siren } from "lucide-react";

/** Faixa de alerta exibida ao franqueado enquanto houver um chat emergencial aberto. */
export function EmergencyAlertBanner() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    async function check() {
      try {
        const res = await fetch("/api/emergency?status=OPEN");
        if (res.ok && alive) setOpen((await res.json()).length > 0);
      } catch {}
    }
    check();
    const id = setInterval(check, 20000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!open || pathname.startsWith("/emergencia")) return null;

  return (
    <Link
      href="/emergencia"
      className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 animate-pulse hover:animate-none flex-shrink-0"
    >
      <Siren className="h-4 w-4 flex-shrink-0" />
      A Franquia abriu um CHAT EMERGENCIAL com você — responder agora
    </Link>
  );
}
