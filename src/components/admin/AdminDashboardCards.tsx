"use client";

import Link from "next/link";
import { ChevronRight, Inbox, Megaphone, ClipboardList, Newspaper, FileText, UtensilsCrossed, GraduationCap } from "lucide-react";
import { useBadges, BADGE_KEY } from "@/hooks/useBadges";

const ADMIN_NAV = [
  { href: "/admin/solicitacoes", icon: Inbox,         label: "Acompanhamento de solicitações", desc: "Solicitações da rede e andamento", bg: "from-indigo-600 to-indigo-500" },
  { href: "/admin/comunicados",  icon: Megaphone,     label: "Comunicados",        desc: "Avisos gerais para toda a rede",  bg: "from-sky-600 to-sky-500" },
  { href: "/admin/registros",    icon: ClipboardList, label: "Registros",          desc: "Ocorrências por loja",            bg: "from-orange-600 to-orange-500" },
  { href: "/admin/cia-news",     icon: Newspaper,     label: "CIA News",           desc: "Notícias e novidades da rede",    bg: "from-rose-600 to-rose-500" },
  { href: "/admin/materials",    icon: FileText,      label: "Treinamentos",       desc: "Publicar e gerenciar conteúdos",  bg: "from-purple-600 to-purple-500" },
  { href: "/admin/cardapios",    icon: UtensilsCrossed, label: "Cardápios",        desc: "Anexar e gerenciar cardápios",    bg: "from-amber-600 to-amber-500" },
  { href: "/admin/universidade", icon: GraduationCap, label: "Universidade",       desc: "Tutoriais em vídeo da plataforma", bg: "from-violet-600 to-violet-500" },
];

export function AdminDashboardCards() {
  const badges = useBadges();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {ADMIN_NAV.map(({ href, icon: Icon, label, desc, bg }) => {
        const badgeCount = badges[BADGE_KEY[href] ?? ""] ?? 0;
        return (
          <Link
            key={href}
            href={href}
            className="group relative overflow-hidden rounded-2xl p-5 flex items-center gap-4 bg-white border border-gray-100 hover:shadow-lg hover:border-transparent transition-all duration-200"
          >
            <div className="relative flex-shrink-0">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              {badgeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow ring-2 ring-white">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-base">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}
