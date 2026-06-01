"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart2, CheckCircle2, ChevronLeft, Clock } from "lucide-react";
import { useSession } from "next-auth/react";

type SurveyOption = { id: string; text: string; _count?: { responses: number } };
type Survey = {
  id: string;
  question: string;
  active: boolean;
  endsAt: string | null;
  createdAt: string;
  options: SurveyOption[];
  myAnswer?: string | null;
  totalResponses?: number;
};

export default function SurveysPage() {
  const { data: session } = useSession();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/surveys").then((r) => r.json()).then((d) => {
      setSurveys(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  async function respond(surveyId: string) {
    const optionId = selected[surveyId];
    if (!optionId) return;
    setSubmitting(surveyId);
    await fetch(`/api/surveys/${surveyId}/respond`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    setSurveys((prev) => prev.map((s) => s.id === surveyId ? { ...s, myAnswer: optionId } : s));
    setSubmitting(null);
  }

  if (!session?.user) return null;

  const active = surveys.filter((s) => s.active);
  const closed = surveys.filter((s) => !s.active);

  return (
    <div className="p-4 sm:p-6">
      <Link href="/gallery" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-5">
        <ChevronLeft className="h-4 w-4" /> Voltar ao início
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart2 className="h-7 w-7 text-violet-500" /> Pesquisas
        </h1>
        <p className="text-gray-500 text-sm mt-1">Responda às pesquisas da Cia do Churrasco.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BarChart2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma pesquisa disponível no momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <>
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-green-500" /> Abertas
              </p>
              {active.map((survey) => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  selected={selected[survey.id]}
                  onSelect={(optId) => setSelected((prev) => ({ ...prev, [survey.id]: optId }))}
                  onSubmit={() => respond(survey.id)}
                  submitting={submitting === survey.id}
                />
              ))}
            </>
          )}
          {closed.length > 0 && (
            <>
              <p className="text-sm font-semibold text-gray-500 flex items-center gap-1.5 mt-6">
                <CheckCircle2 className="h-4 w-4" /> Encerradas
              </p>
              {closed.map((survey) => (
                <SurveyCard key={survey.id} survey={survey} closed />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SurveyCard({
  survey, selected, onSelect, onSubmit, submitting, closed,
}: {
  survey: Survey;
  selected?: string;
  onSelect?: (id: string) => void;
  onSubmit?: () => void;
  submitting?: boolean;
  closed?: boolean;
}) {
  const answered = !!survey.myAnswer;
  const total = survey.totalResponses ?? survey.options.reduce((s, o) => s + (o._count?.responses ?? 0), 0);

  return (
    <div className={`bg-white border rounded-xl p-5 ${closed ? "opacity-70 border-gray-100" : "border-violet-100 shadow-sm"}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="font-semibold text-gray-900">{survey.question}</h3>
        {answered && !closed && (
          <span className="shrink-0 flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" /> Respondida
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {survey.options.map((opt) => {
          const count = opt._count?.responses ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isMyAnswer = survey.myAnswer === opt.id;
          const showResults = answered || closed;

          if (showResults) {
            return (
              <div key={opt.id} className={`relative rounded-lg overflow-hidden border ${isMyAnswer ? "border-violet-400" : "border-gray-100"}`}>
                <div className={`absolute inset-y-0 left-0 ${isMyAnswer ? "bg-violet-100" : "bg-gray-50"}`} style={{ width: `${pct}%` }} />
                <div className="relative flex items-center justify-between px-3 py-2.5">
                  <span className={`text-sm ${isMyAnswer ? "font-semibold text-violet-800" : "text-gray-700"}`}>
                    {isMyAnswer && "✓ "}{opt.text}
                  </span>
                  <span className="text-xs font-mono text-gray-500">{pct}%</span>
                </div>
              </div>
            );
          }

          return (
            <label key={opt.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                selected === opt.id
                  ? "border-violet-500 bg-violet-50"
                  : "border-gray-200 hover:border-violet-300"
              }`}>
              <input type="radio" name={`survey-${survey.id}`} value={opt.id}
                checked={selected === opt.id}
                onChange={() => onSelect?.(opt.id)}
                className="accent-violet-600" />
              <span className="text-sm text-gray-800">{opt.text}</span>
            </label>
          );
        })}
      </div>

      {!answered && !closed && (
        <button disabled={!selected || submitting} onClick={onSubmit}
          className="w-full py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-40 transition">
          {submitting ? "Enviando..." : "Enviar Resposta"}
        </button>
      )}

      {(answered || closed) && total > 0 && (
        <p className="text-xs text-gray-400 text-right">{total} resposta{total !== 1 ? "s" : ""}</p>
      )}
    </div>
  );
}
