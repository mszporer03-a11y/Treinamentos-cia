"use client";

import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { FranchiseeSidebar } from "./FranchiseeSidebar";
import { TutorialOverlay, PORTAL_TUTORIAL_STEPS } from "./TutorialOverlay";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { useBadges, BADGE_KEY } from "@/hooks/useBadges";
import {
  BookOpen,
  MessageSquare,
  BarChart2,
  ClipboardList,
  FileText,
  UserCircle2,
  LogOut,
  HelpCircle,
} from "lucide-react";

interface FranchiseeShellProps {
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}

const mobileNavItems = [
  { href: "/gallery", label: "Início", icon: BookOpen, exact: true },
  { href: "/chat", label: "Suporte", icon: MessageSquare },
  { href: "/surveys", label: "Pesquisas", icon: BarChart2 },
  { href: "/checklists", label: "Checklists", icon: ClipboardList },
  { href: "/perfil", label: "Perfil", icon: UserCircle2, exact: true },
];

export function FranchiseeShell({ user, children }: FranchiseeShellProps) {
  const pathname = usePathname();
  const badges = useBadges();
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const openTutorial = useCallback(() => {
    setTutorialStep(0);
    setShowTutorial(true);
  }, []);

  const closeTutorial = useCallback(() => setShowTutorial(false), []);

  const nextStep = useCallback(() => {
    setTutorialStep((s) => {
      if (s >= PORTAL_TUTORIAL_STEPS.length - 1) {
        setShowTutorial(false);
        return 0;
      }
      return s + 1;
    });
  }, []);

  const prevStep = useCallback(() => {
    setTutorialStep((s) => Math.max(0, s - 1));
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex flex-shrink-0">
        <FranchiseeSidebar user={user} onOpenTutorial={openTutorial} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">Portal Franqueado</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Help / Tutorial button */}
            <button
              onClick={openTutorial}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition"
              title="Abrir tutorial"
              aria-label="Abrir tutorial"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-xs font-medium">Sair</span>
            </button>
          </div>
        </header>

        {/* Page content — extra bottom padding for the mobile nav */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40 flex">
        {mobileNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const badgeCount = badges[BADGE_KEY[item.href] ?? ""] ?? 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition relative ${
                isActive ? "text-orange-600" : "text-gray-400"
              }`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 ring-1 ring-white">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* PWA install / notification prompt */}
      <PwaInstallPrompt />

      {/* Tutorial overlay */}
      {showTutorial && (
        <TutorialOverlay
          steps={PORTAL_TUTORIAL_STEPS}
          current={tutorialStep}
          onNext={nextStep}
          onPrev={prevStep}
          onClose={closeTutorial}
        />
      )}
    </div>
  );
}
