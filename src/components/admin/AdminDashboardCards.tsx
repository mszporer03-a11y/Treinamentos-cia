"use client";

import Link from "next/link";
import { ChevronRight, MessageSquare, Inbox, Bell, FileText, ClipboardList, Store, Users, Megaphone, CheckSquare, MapPin, UtensilsCrossed } from "lucide-react";
import { useBadges, BADGE_KEY } from "@/hooks/useBadges";

const ADMIN_NAV = [
  { href: "/admin/chat",         icon: MessageSquare, label: "Suporte",            desc: "Mensagens de franqueados e gerentes", bg: "from-sky-600 to-sky-500" },
  { href: "/admin/solicitacoes", icon: Inbox,         label: "Solicitações",       desc: "Solicitações pendentes da rede", bg: "from-indigo-600 to-indigo-500" },
  { href: "/admin/notificacoes", icon: Bell,          label: "Notificações",       desc: "Alertas e campanhas",            bg: "from-rose-600 to-rose-500" },
  { href: "/admin/materials",    icon: FileText,      label: "Materiais",          desc: "Publicar e gerenciar conteúdos", bg: "from-purple-600 to-purple-500" },
  { href: "/admin/cardapios",    icon: UtensilsCrossed, label: "Cardápios do Mês", desc: "Anexar e gerenciar cardápios",   bg: "from-amber-600 to-amber-500" },
  { href: "/admin/checklists",   icon: ClipboardList, label: "Planilhas de controle", desc: "Gerenciar planilhas operacionais", bg: "from-orange-600 to-orange-500" },
  { href: "/admin/stores",       icon: Store,         label: "Lojas",              desc: "Gerenciar lojas da rede",        bg: "from-emerald-600 to-emerald-500" },
  { href: "/admin/users",        icon: Users,         label: "Usuários",           desc: "Franqueados e administradores",  bg: "from-blue-600 to-blue-500" },
  { href: "/admin/campaigns",    icon: Megaphone,     label: "Campanhas",          desc: "Campanhas de marketing",         bg: "from-pink-600 to-pink-500" },
  { href: "/admin/onboarding",   icon: CheckSquare,   label: "Inauguração",        desc: "Onboarding de novas lojas",      bg: "from-cyan-600 to-cyan-500" },
  { href: "/admin/map",          icon: MapPin,        label: "Mapa de Lojas",      desc: "Visualizar lojas no mapa",       bg: "from-teal-600 to-teal-500" },
  { href: "/admin/documents",    icon: FileText,      label: "Documentos",         desc: "Documentos dos franqueados",     bg: "from-slate-600 to-slate-500" },
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
