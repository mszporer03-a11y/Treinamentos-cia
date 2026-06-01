"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BookOpen,
  MessageSquare,
  BarChart2,
  ClipboardList,
  FileText,
  UserCircle2,
  LogOut,
  DollarSign,
  Package,
  Users,
} from "lucide-react";

interface FranchiseeSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

const sections: { label: string; items: { href: string; label: string; icon: React.ElementType; exact?: boolean }[] }[] = [
  {
    label: "Treinamentos",
    items: [
      { href: "/gallery", label: "Materiais", icon: BookOpen, exact: true },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { href: "/chat", label: "Chat", icon: MessageSquare },
    ],
  },
  {
    label: "Operações",
    items: [
      { href: "/surveys", label: "Pesquisas", icon: BarChart2 },
      { href: "/checklists", label: "Checklists", icon: ClipboardList },
      { href: "/documents", label: "Documentos", icon: FileText },
      { href: "/kilo-price", label: "Preço do Quilo", icon: DollarSign },
      { href: "/supply-requests", label: "Pedidos de Suprimentos", icon: Package },
    ],
  },
  {
    label: "Equipe",
    items: [
      { href: "/employees", label: "Funcionários", icon: Users },
    ],
  },
  {
    label: "Conta",
    items: [
      { href: "/perfil", label: "Meu Perfil", icon: UserCircle2, exact: true },
    ],
  },
];

export function FranchiseeSidebar({ user }: FranchiseeSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-gray-950 text-white flex flex-col h-screen sticky top-0 flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800 flex items-center justify-center">
        <Image
          src="/logo.png"
          alt="Companhia do Churrasco"
          width={148}
          height={52}
          className="invert brightness-0 invert"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
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
