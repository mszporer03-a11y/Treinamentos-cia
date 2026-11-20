"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { MaterialViewer } from "@/components/franchisee/MaterialViewer";
import { PostCard, type PostMaterial } from "@/components/posts/PostCard";
import { MessageSquare, BarChart2, ClipboardList, ChevronRight, LayoutGrid, ArrowLeft, Search } from "lucide-react";
import { PORTAL_TABS } from "@/lib/portal-tabs";

export const dynamic = "force-dynamic";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  slug: string;
  description?: string | null;
}

interface Material extends PostMaterial {
  category: Category;
}

const NAV_ITEMS = [
  { href: "/surveys", icon: BarChart2, label: "Pesquisas", desc: "Responda as pesquisas da rede", bg: "from-violet-600 to-violet-500", tutorialId: "nav-surveys" },
  { href: "/checklists", icon: ClipboardList, label: "Checklists", desc: "Visualize e preencha checklists operacionais", bg: "from-orange-600 to-orange-500", tutorialId: "nav-checklists" },
  { href: "/chat", icon: MessageSquare, label: "Suporte", desc: "Canal direto com a Cia do Churrasco", bg: "from-sky-600 to-sky-500", tutorialId: "nav-chat" },
];

type TabKey = "all" | "categorias" | (typeof PORTAL_TABS)[number]["key"];

export default function GalleryPage() {
  const { data: session } = useSession();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tab, setTab] = useState<TabKey>("all");
  const [categoryId, setCategoryId] = useState<string | null>(null); // usado na aba "Categorias"
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [matRes, catRes] = await Promise.all([fetch("/api/materials"), fetch("/api/categories")]);
        const [mats, cats] = await Promise.all([matRes.json(), catRes.json()]);
        setMaterials(Array.isArray(mats) ? mats : []);
        setCategories(Array.isArray(cats) ? cats : []);
      } finally {
        setLoading(false);
      }
    }
    load();
    // Abre a aba indicada na URL (?aba=cia-news)
    const aba = new URLSearchParams(window.location.search).get("aba");
    if (aba && (aba === "categorias" || PORTAL_TABS.some((t) => t.key === aba))) setTab(aba as TabKey);
  }, []);

  const countBySlug = useMemo(() => {
    const m = new Map<string, number>();
    for (const mat of materials) m.set(mat.category.slug, (m.get(mat.category.slug) ?? 0) + 1);
    return m;
  }, [materials]);

  const tabCount = (slugs: string[]) => slugs.reduce((a, s) => a + (countBySlug.get(s) ?? 0), 0);

  const filtered = useMemo(() => {
    let list = materials;
    if (tab === "categorias") {
      list = categoryId ? list.filter((m) => m.category.id === categoryId) : [];
    } else if (tab !== "all") {
      const def = PORTAL_TABS.find((t) => t.key === tab);
      list = def ? list.filter((m) => def.slugs.includes(m.category.slug)) : list;
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) => m.title.toLowerCase().includes(q) || (m.description ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [materials, tab, categoryId, query]);

  const visibleCategories = categories.filter((c) => (countBySlug.get(c.slug) ?? 0) > 0);
  const activeTab = PORTAL_TABS.find((t) => t.key === tab);
  const activeCategory = categories.find((c) => c.id === categoryId);
  const firstName = session?.user?.name?.split(" ")[0] ?? "Franqueado";

  function selectTab(key: TabKey) {
    setTab(key);
    setCategoryId(null);
    const url = new URL(window.location.href);
    if (key === "all") url.searchParams.delete("aba");
    else url.searchParams.set("aba", key);
    window.history.replaceState(null, "", url.toString());
  }

  const tabBtn = (active: boolean) =>
    `shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border transition whitespace-nowrap ${
      active
        ? "bg-orange-600 text-white border-orange-600 shadow-sm"
        : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-700"
    }`;

  const showGrid = tab !== "categorias" || categoryId;

  return (
    <div className="p-4 sm:p-6">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl px-6 py-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #EA580C 0%, transparent 60%)" }} />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Olá, {firstName} 👋</h1>
            <p className="text-gray-400 text-sm mt-1">Bem-vindo ao painel. Acesse suas ferramentas abaixo.</p>
          </div>
          <Image src="/logo.png" alt="Companhia do Churrasco" width={140} height={50} className="invert brightness-0 invert opacity-90 flex-shrink-0 hidden sm:block" />
        </div>
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {NAV_ITEMS.map(({ href, icon: Icon, label, desc, bg, tutorialId }) => (
          <Link key={href} href={href} data-tutorial={tutorialId}
            className="group relative overflow-hidden rounded-2xl p-5 flex items-center gap-4 bg-white border border-gray-100 hover:shadow-lg hover:border-transparent transition-all duration-200">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-base">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Feed de novidades */}
      <div data-tutorial="materials-section" className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Feed de Novidades</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {activeTab ? activeTab.description : tab === "categorias" ? "Navegue por todas as categorias" : "Tudo o que a Franqueadora publicou para você"}
          </p>
        </div>
        <label className="relative sm:w-64">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar no feed…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </label>
      </div>

      {/* Abas */}
      <nav data-tutorial="filter-btn" className="flex items-center gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 sm:mx-0 sm:px-0" aria-label="Abas do feed">
        <button onClick={() => selectTab("all")} className={tabBtn(tab === "all")}>
          Todos <span className="opacity-70 text-xs">{materials.length}</span>
        </button>
        {PORTAL_TABS.map((t) => (
          <button key={t.key} onClick={() => selectTab(t.key)} className={tabBtn(tab === t.key)}>
            <span>{t.icon}</span> {t.label}
            <span className="opacity-70 text-xs">{tabCount(t.slugs)}</span>
          </button>
        ))}
        <button onClick={() => selectTab("categorias")} className={tabBtn(tab === "categorias")}>
          <LayoutGrid className="h-4 w-4" /> Categorias
        </button>
      </nav>

      {/* Aba Categorias: grade de categorias */}
      {tab === "categorias" && !categoryId && !loading && (
        visibleCategories.length === 0 ? (
          <div className="text-center py-16 text-gray-500">Nenhuma categoria com publicações ainda.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleCategories.map((c) => (
              <button key={c.id} onClick={() => setCategoryId(c.id)}
                className="text-left bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-orange-200 transition group">
                <span className="text-3xl">{c.icon ?? "📁"}</span>
                <p className="font-bold text-gray-900 mt-2 group-hover:text-orange-600 transition-colors">{c.name}</p>
                {c.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.description}</p>}
                <p className="text-xs text-orange-600 font-semibold mt-2">
                  {countBySlug.get(c.slug)} publicaç{countBySlug.get(c.slug) === 1 ? "ão" : "ões"}
                </p>
              </button>
            ))}
          </div>
        )
      )}

      {tab === "categorias" && activeCategory && (
        <button onClick={() => setCategoryId(null)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" /> Todas as categorias
          <span className="font-semibold text-gray-900 ml-1">· {activeCategory.icon} {activeCategory.name}</span>
        </button>
      )}

      {showGrid && (
        loading ? (
          <div className="text-center py-16 text-gray-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl">📭</span>
            <p className="text-gray-500 mt-4 font-medium">
              {query ? "Nada encontrado para essa busca." : "Nenhuma publicação nesta aba ainda."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((mat) => (
              <PostCard
                key={mat.id}
                material={mat}
                onOpen={() => {
                  setViewing(mat);
                  fetch(`/api/materials/${mat.id}/view`, { method: "POST" });
                }}
              />
            ))}
          </div>
        )
      )}

      {viewing && <MaterialViewer material={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
