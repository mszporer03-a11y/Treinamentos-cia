"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useBadges, BADGE_KEY } from "@/hooks/useBadges";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Users,
  LogOut,
  BookOpen,
  UserCircle2,
  MessageSquare,
  Store,
  Megaphone,
  AlertTriangle,
  MapPin,
  ClipboardCheck,
  CheckSquare,
  ClipboardList,
  Inbox,
  Bell,
  UtensilsCrossed,
  GraduationCap,
} from "lucide-react";

interface AdminSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

const sections: {
  label: string;
  items: { href: string; label: string; icon: React.ElementType; exact?: boolean }[];
}[] = [
  {
    label: "Geral",
    items: [
      { href: "/admin", label: "Menu Principal", icon: LayoutDashboard, exact: true },
      { href: "/admin/chat", label: "Suporte", icon: MessageSquare },
      { href: "/admin/solicitacoes", label: "Solicitações", icon: Inbox },
      { href: "/admin/notificacoes", label: "Notificações", icon: Bell },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { href: "/admin/materials", label: "Materiais", icon: FileText },
      { href: "/admin/universidade", label: "Universidade", icon: GraduationCap },
      { href: "/admin/cardapios", label: "Cardápios do Mês", icon: UtensilsCrossed },
      { href: "/admin/categories", label: "Categorias", icon: FolderOpen },
      { href: "/admin/campaigns", label: "Campanhas", icon: Megaphone },
    ],
  },
  {
    label: "Operações",
    items: [
      { href: "/admin/alerts", label: "Não Conformidades", icon: AlertTriangle },
    ],
  },
  {
    label: "Lojas",
    items: [
      { href: "/admin/stores", label: "Lojas", icon: Store },
      { href: "/admin/map", label: "Mapa de Lojas", icon: MapPin },
      { href: "/admin/onboarding", label: "Inauguração", icon: CheckSquare },
    ],
  },
  {
    label: "Engajamento",
    items: [
      { href: "/admin/documents", label: "Documentos", icon: ClipboardCheck },
      { href: "/admin/checklists", label: "Planilhas de controle", icon: ClipboardList },
    ],
  },
  {
    label: "Usuários",
    items: [
      { href: "/admin/users", label: "Usuários", icon: Users },
      { href: "/admin/perfil", label: "Meu Perfil", icon: UserCircle2 },
    ],
  },
];

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const badges = useBadges();

  return (
    <aside className="w-60 bg-gray-950 text-white flex flex-col h-screen sticky top-0 flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800 flex items-center justify-center">
        <Image src="/logo.png" alt="Companhia do Churrasco" width={148} height={52} className="invert brightness-0 invert" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                const badgeCount = badges[BADGE_KEY[item.href] ?? ""] ?? 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {badgeCount > 0 && (
                      <span className="ml-auto min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 flex-shrink-0">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-gray-800">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 px-3 py-2 w-full text-sm text-gray-400 hover:bg-white/5 hover:text-white rounded-lg transition"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  );
}
