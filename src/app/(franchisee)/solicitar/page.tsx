"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Megaphone,
  KeyRound,
  MonitorCog,
  HelpCircle,
  UserPlus,
  Inbox,
} from "lucide-react";

type Item = {
  slug: string;
  label: string;
  desc: string;
  Icon: React.ElementType;
  bg: string;
  roles?: string[];
};

const ITEMS: Item[] = [
  {
    slug: "solicitacoes",
    label: "Solicitações (Geral)",
    desc: "Qualquer suporte ou serviço da Companhia do Churrasco",
    Icon: MessageSquare,
    bg: "from-blue-600 to-indigo-500",
  },
  {
    slug: "marketing",
    label: "Mídia",
    desc: "Peças, artes, campanhas e materiais de divulgação",
    Icon: Megaphone,
    bg: "from-purple-600 to-violet-500",
  },
  {
    slug: "senhas-usuarios",
    label: "Senhas e usuários",
    desc: "Acessos, senhas e permissões no sistema",
    Icon: KeyRound,
    bg: "from-amber-600 to-orange-500",
  },
  {
    slug: "suporte-sistema",
    label: "Suporte Sistema",
    desc: "Problemas técnicos, erros ou lentidão",
    Icon: MonitorCog,
    bg: "from-cyan-600 to-teal-500",
  },
  {
    slug: "conta-gerente",
    label: "Conta de gerente",
    desc: "Peça a criação de uma conta de gerente para sua loja",
    Icon: UserPlus,
    bg: "from-violet-600 to-fuchsia-500",
    roles: ["FRANCHISEE"],
  },
  {
    slug: "outros",
    label: "Outros",
    desc: "Dúvidas gerais, sugestões ou outros assuntos",
    Icon: HelpCircle,
    bg: "from-gray-600 to-gray-500",
  },
];

export default function SolicitarPage() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "FRANCHISEE";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link
        href="/gallery"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-5"
      >
        <ChevronLeft className="h-4 w-4" /> Menu Principal
      </Link>

      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shadow-sm">
          <Inbox className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Solicitações</h1>
          <p className="text-sm text-gray-500">Escolha o tipo de solicitação</p>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 my-5 flex items-start gap-3">
        <span className="flex-shrink-0 mt-0.5">💡</span>
        <p className="text-sm text-indigo-700 leading-relaxed">
          Selecione abaixo a categoria que melhor descreve sua necessidade. Para acompanhar o
          andamento, acesse <Link href="/solicitacoes" className="font-semibold underline">Acompanhamento de solicitações</Link>.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ITEMS.filter((i) => !i.roles || i.roles.includes(role)).map(({ slug, label, desc, Icon, bg }) => (
          <Link
            key={slug}
            href={`/suporte/${slug}`}
            className="group relative overflow-hidden rounded-2xl p-4 flex items-center gap-3 bg-white border border-gray-100 hover:shadow-lg hover:border-transparent transition-all"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform flex-shrink-0`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
