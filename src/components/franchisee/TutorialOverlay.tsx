"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface TutorialStep {
  icon: string;
  title: string;
  description: string;
  hint?: string | null;
  target?: string | null; // valor do atributo data-tutorial no elemento
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  current: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

const HIGHLIGHT_CLASSES = [
  "outline",
  "outline-4",
  "outline-orange-400",
  "outline-offset-4",
  "relative",
  "z-[1001]",
  "rounded-2xl",
];

function applyHighlight(target: string | null | undefined) {
  // remove any existing
  document.querySelectorAll("[data-tutorial-active]").forEach((el) => {
    el.removeAttribute("data-tutorial-active");
    HIGHLIGHT_CLASSES.forEach((c) => el.classList.remove(c));
  });

  if (!target) return;
  const el = document.querySelector(`[data-tutorial="${target}"]`);
  if (!el) return;

  el.setAttribute("data-tutorial-active", "true");
  HIGHLIGHT_CLASSES.forEach((c) => el.classList.add(c));
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function TutorialOverlay({
  steps,
  current,
  onNext,
  onPrev,
  onClose,
}: TutorialOverlayProps) {
  const step = steps[current];
  const isFirst = current === 0;
  const isLast = current === steps.length - 1;

  // Highlight target element when step changes
  useEffect(() => {
    applyHighlight(step.target);
    return () => {
      document.querySelectorAll("[data-tutorial-active]").forEach((el) => {
        el.removeAttribute("data-tutorial-active");
        HIGHLIGHT_CLASSES.forEach((c) => el.classList.remove(c));
      });
    };
  }, [current, step.target]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "Enter") onNext();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onNext, onPrev, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-[1px] z-[1000]"
        onClick={onClose}
      />

      {/* Tutorial card — fixed bottom-center, above mobile tab bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[1002] px-3 pb-20 sm:pb-6 sm:px-6 pointer-events-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-lg mx-auto pointer-events-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
              <div
                className="h-full bg-orange-500 transition-all duration-500 ease-out"
                style={{ width: `${((current + 1) / steps.length) * 100}%` }}
              />
            </div>

            <div className="p-5 sm:p-6">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-400 font-medium">
                  Passo {current + 1} de {steps.length}
                </span>
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  title="Fechar tutorial"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex items-start gap-4 mb-5">
                <span className="text-4xl flex-shrink-0 leading-none mt-0.5 select-none">
                  {step.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.description}
                  </p>
                  {step.hint && (
                    <span className="mt-2.5 inline-block text-xs font-medium text-orange-700 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-lg">
                      📍 {step.hint}
                    </span>
                  )}
                </div>
              </div>

              {/* Step dots + navigation */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={onPrev}
                  disabled={isFirst}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>

                {/* Dots */}
                <div className="flex items-center gap-1.5">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all duration-300 ${
                        i === current
                          ? "w-4 h-2 bg-orange-500"
                          : i < current
                          ? "w-2 h-2 bg-orange-300"
                          : "w-2 h-2 bg-gray-200"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={onNext}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition shadow-sm"
                >
                  {isLast ? (
                    "Concluir ✓"
                  ) : (
                    <>
                      Próximo
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Tutorial steps definition ────────────────────────────────────────────────
export const PORTAL_TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: "👋",
    title: "Bem-vindo ao Portal!",
    description:
      "Olá! Este é o Portal do Franqueado da Companhia do Churrasco. Vamos te guiar pelas principais funcionalidades em poucos passos.",
    hint: null,
    target: null,
  },
  {
    icon: "📚",
    title: "Materiais de Treinamento",
    description:
      "Aqui você encontra todos os materiais publicados pela franquia: vídeos, PDFs, documentos, imagens e comunicados organizados por categoria.",
    hint: "Início → seção Materiais de Treinamento",
    target: "materials-section",
  },
  {
    icon: "🔍",
    title: "Filtrar por Categoria",
    description:
      "Use o botão 'Filtrar' para ver somente os materiais de uma categoria específica — Vendas, Operações, Avisos, etc.",
    hint: "Clique em 'Filtrar' acima dos materiais",
    target: "filter-btn",
  },
  {
    icon: "📢",
    title: "Avisos",
    description:
      "Comunicados importantes da franquia são publicados como Avisos. Fique de olho nessa categoria para não perder nenhuma informação.",
    hint: "Filtrar → Avisos",
    target: null,
  },
  {
    icon: "📊",
    title: "Pesquisas",
    description:
      "Responda às pesquisas enviadas pela Companhia do Churrasco. Sua participação é essencial para a melhoria contínua de toda a rede.",
    hint: "Menu → Pesquisas",
    target: "nav-surveys",
  },
  {
    icon: "✅",
    title: "Checklists Operacionais",
    description:
      "Preencha os checklists de operação da sua loja para garantir que os padrões de qualidade e conformidade da franquia sejam seguidos.",
    hint: "Menu → Checklists",
    target: "nav-checklists",
  },
  {
    icon: "💬",
    title: "Suporte (Chat)",
    description:
      "Precisa de ajuda? Use o chat para entrar em contato diretamente com a equipe da Companhia do Churrasco e resolver qualquer dúvida rapidamente.",
    hint: "Menu → Suporte",
    target: "nav-chat",
  },
  {
    icon: "📄",
    title: "Documentos",
    description:
      "Acesse seus contratos, aditivos, procurações e demais documentos da sua franquia — organizados e disponíveis a qualquer momento.",
    hint: "Menu lateral → Documentos",
    target: null,
  },
  {
    icon: "📦",
    title: "Solicitações Rápidas",
    description:
      "Envie solicitações de suporte, marketing, senhas de usuários, suporte ao sistema e outras demandas diretamente pelo portal.",
    hint: "Menu lateral → Solicitações",
    target: null,
  },
  {
    icon: "📬",
    title: "Minhas Solicitações",
    description:
      "Acompanhe o status de todas as solicitações que você enviou. Cada solicitação é atualizada pela equipe com os status: Visto 🟡, Em Preparo 🔵 e Pronto 🟢.",
    hint: "Início → card Minhas Solicitações",
    target: "nav-solicitacoes",
  },
  {
    icon: "🎉",
    title: "Tudo pronto!",
    description:
      "Você já conhece as principais funcionalidades do portal. Clique no ícone '?' a qualquer momento para ver este guia novamente. Bom trabalho!",
    hint: null,
    target: null,
  },
];
