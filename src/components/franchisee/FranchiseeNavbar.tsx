"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { BookOpen, LogOut, ChevronDown, UserCircle2, MessageSquare, GalleryHorizontalEnd, PackageSearch, Calendar, GraduationCap, FileText, TrendingUp, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

interface FranchiseeNavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

const NAV_LINKS = [
  { href: "/gallery",          icon: GalleryHorizontalEnd, label: "Materiais" },
  { href: "/supply-requests",  icon: PackageSearch,        label: "Pedidos" },
  { href: "/schedule",         icon: Calendar,             label: "Escala" },
  { href: "/employees",        icon: GraduationCap,        label: "Treinamentos" },
  { href: "/documents",        icon: FileText,             label: "Documentos" },
  { href: "/kilo-price",       icon: TrendingUp,           label: "Preço do Quilo" },
  { href: "/chat",             icon: MessageSquare,        label: "Chat" },
];

export function FranchiseeNavbar({ user }: FranchiseeNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/gallery" className="flex items-center gap-2.5 font-bold text-gray-900 shrink-0">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span className="hidden md:inline text-sm">Cia do Churrasco</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV_LINKS.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href) && href !== "/gallery" ? true : pathname.startsWith("/gallery") && href === "/gallery";
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition text-sm font-medium ${active ? "bg-orange-50 text-orange-700" : "text-gray-600 hover:bg-gray-100"}`}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <button className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* User Menu */}
          <div className="relative" ref={ref}>
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition text-sm">
              <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-semibold text-xs shrink-0">
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <span className="hidden sm:inline font-medium text-gray-700 max-w-[120px] truncate">{user.name}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <Link href="/perfil" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition">
                  <UserCircle2 className="h-4 w-4" /> Meu Perfil
                </Link>
                <button onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600 transition">
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 grid grid-cols-2 gap-1">
          {NAV_LINKS.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition ${active ? "bg-orange-50 text-orange-700" : "text-gray-600 hover:bg-gray-100"}`}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
