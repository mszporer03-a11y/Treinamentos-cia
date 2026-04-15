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
} from "lucide-react";

interface AdminSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/admin/categories", label: "Categorias", icon: FolderOpen },
  { href: "/admin/materials", label: "Materiais", icon: FileText },
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/perfil", label: "Meu Perfil", icon: UserCircle2 },
];

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-blue-950 text-white flex flex-col h-screen sticky top-0 flex-shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-blue-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Portal Admin</h1>
            <p className="text-xs text-blue-400">Treinamentos</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? "bg-blue-700 text-white"
                  : "text-blue-300 hover:bg-blue-900 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-blue-900">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
          <p className="text-xs text-blue-400 truncate">{user.email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-sm text-blue-300 hover:bg-blue-900 hover:text-white rounded-xl transition"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  );
}
