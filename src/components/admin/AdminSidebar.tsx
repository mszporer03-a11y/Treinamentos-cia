"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
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
  BarChart2,
  DollarSign,
  MapPin,
  ClipboardCheck,
  CheckSquare,
  ClipboardList,
} from "lucide-react";

interface AdminSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

const sections = [
  {
    label: "Geral",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/chat", label: "Chat", icon: MessageSquare },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { href: "/admin/materials", label: "Materiais", icon: FileText },
      { href: "/admin/categories", label: "Categorias", icon: FolderOpen },
      { href: "/admin/campaigns", label: "Campanhas", icon: Megaphone },
    ],
  },
  {
    label: "Operações",
    items: [
      { href: "/admin/alerts", label: "Não Conformidades", icon: AlertTriangle },
      { href: "/admin/kilo-price", label: "Preço do Quilo", icon: DollarSign },
    ],
  },
  {
    label: "Lojas",
    items: [
      { href: "/admin/stores", label: "Lojas", icon: Store },
      { href: "/admin/map", label: "Mapa de Lojas", icon: MapPin },
      { href: "/admin/onboarding", label: "Onboarding", icon: CheckSquare },
    ],
  },
  {
    label: "Engajamento",
    items: [
      { href: "/admin/surveys", label: "Pesquisas", icon: BarChart2 },
      { href: "/admin/documents", label: "Documentos", icon: ClipboardCheck },
      { href: "/admin/checklists", label: "Checklists", icon: ClipboardList },
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

  return (
    <aside className="w-60 bg-gray-950 text-white flex flex-col h-screen sticky top-0 flex-shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-white">Cia do Churrasco</h1>
            <p className="text-xs text-gray-500">Portal Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
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
