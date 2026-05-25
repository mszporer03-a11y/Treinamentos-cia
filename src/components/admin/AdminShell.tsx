"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { AdminSidebar } from "./AdminSidebar";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Users,
  LogOut,
  BookOpen,
  UserCircle2,
  MessageSquare,
} from "lucide-react";

interface AdminShellProps {
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}

const navItems = [
  { href: "/admin", label: "Início", icon: LayoutDashboard, exact: true },
  { href: "/admin/categories", label: "Categorias", icon: FolderOpen },
  { href: "/admin/materials", label: "Materiais", icon: FileText },
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/chat", label: "Chat", icon: MessageSquare },
  { href: "/admin/perfil", label: "Perfil", icon: UserCircle2, exact: true },
];

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex flex-shrink-0">
        <AdminSidebar user={user} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">Portal Admin</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-xs font-medium">Sair</span>
          </button>
        </header>

        {/* Page content — extra bottom padding for the mobile nav */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40 flex">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition ${
                isActive ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
