"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { BookOpen, LogOut, ChevronDown, UserCircle2, MessageSquare } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface FranchiseeNavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function FranchiseeNavbar({ user }: FranchiseeNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        <Link
          href="/gallery"
          className="flex items-center gap-2.5 font-bold text-gray-900"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span className="hidden sm:inline">Portal de Treinamentos</span>
        </Link>

        {/* Chat link */}
        <Link
          href="/chat"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-100 transition text-sm text-gray-600"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline text-sm font-medium">Chat</span>
        </Link>

        {/* User Menu */}        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition text-sm"
          >
            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <span className="hidden sm:inline font-medium text-gray-700 max-w-[120px] truncate">
              {user.name}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <Link
                href="/perfil"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                <UserCircle2 className="h-4 w-4" />
                Meu Perfil
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600 transition"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
