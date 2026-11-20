// Abas do Portal do Franqueado (item 2 do plano de ação).
// Cada aba agrupa uma ou mais categorias (por slug). O primeiro slug é o
// "oficial", criado pelo seed caso nenhum dos aliases exista no banco.
export interface PortalTab {
  key: string;
  label: string;
  icon: string;
  description: string;
  slugs: string[];
}

export const PORTAL_TABS: PortalTab[] = [
  { key: "comunicados", label: "Comunicados", icon: "📢", description: "Comunicados oficiais e avisos da Franqueadora", slugs: ["comunicados", "avisos"] },
  { key: "registros", label: "Registros", icon: "🗂️", description: "Registros, atas e documentos de referência da rede", slugs: ["registros"] },
  { key: "cia-news", label: "CIA News", icon: "📰", description: "Novidades e notícias internas da Cia do Churrasco", slugs: ["cia-news"] },
  { key: "treinamentos", label: "Treinamentos", icon: "🎓", description: "Vídeos, manuais e materiais de capacitação", slugs: ["treinamentos"] },
  { key: "cardapios", label: "Cardápios do Mês", icon: "🍖", description: "Cardápios, promoções e novidades mensais", slugs: ["cardapios-do-mes", "cardapio-do-mes"] },
  { key: "universidade", label: "Universidade", icon: "🏛️", description: "Universidade Cia — trilhas e cursos de formação", slugs: ["universidade"] },
  { key: "inauguracao", label: "Inauguração", icon: "🏪", description: "Inaugurações de lojas e materiais de abertura", slugs: ["inauguracao", "inauguracoes"] },
];

export function tabForSlug(slug: string): PortalTab | undefined {
  return PORTAL_TABS.find((t) => t.slugs.includes(slug));
}
