"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Support3LMBanner } from "@/components/franchisee/Support3LM";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { MaterialViewer } from "@/components/franchisee/MaterialViewer";
import { Play, FileText, Image as ImageIcon, File, MessageSquare, BarChart2, ClipboardList, ChevronRight, SlidersHorizontal, Megaphone } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  slug: string;
}

interface Material {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string | null;
  fileType: string;
  fileSize?: number | null;
  mimeType?: string | null;
  createdAt: string;
  category: Category;
  createdBy?: { name: string } | null;
}

const typeIcon: Record<string, React.ElementType> = {
  VIDEO: Play,
  PDF: FileText,
  IMAGE: ImageIcon,
  DOCUMENT: FileText,
  OTHER: File,
  NOTICE: Megaphone,
};

const typeLabel: Record<string, string> = {
  VIDEO: "Video",
  PDF: "PDF",
  IMAGE: "Imagem",
  DOCUMENT: "Documento",
  OTHER: "Arquivo",
  NOTICE: "Aviso",
};

const typeColor: Record<string, string> = {
  VIDEO: "bg-red-50 text-red-500",
  PDF: "bg-orange-50 text-orange-500",
  IMAGE: "bg-sky-50 text-sky-500",
  DOCUMENT: "bg-blue-50 text-blue-500",
  OTHER: "bg-gray-50 text-gray-400",
  NOTICE: "bg-amber-50 text-amber-600",
};

// Passo 6 — post-card no estilo feed (similar ao Facebook)
function FeedCard({
  material,
  onOpen,
  onView,
}: {
  material: Material;
  onOpen: () => void;
  onView: () => void;
}) {
  const Icon = typeIcon[material.fileType] ?? File;
  const color = typeColor[material.fileType] ?? typeColor.OTHER;
  const cardRef = useRef<HTMLDivElement>(null);
  const isNotice = material.fileType === "NOTICE";

  // Aviso é lido direto no feed: registra a visualização quando o card aparece na tela
  useEffect(() => {
    if (!isNotice || !cardRef.current || typeof IntersectionObserver === "undefined") return;
    const el = cardRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onView();
          obs.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isNotice, onView]);

  return (
    <div ref={cardRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-gray-50">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-red-700 text-white text-[11px] font-bold px-2 py-0.5 rounded">
              {material.category.icon} {material.category.name}
            </span>
            <span className="text-xs text-gray-400">por {material.createdBy?.name ?? "Franquia"}</span>
          </div>
          <p className="font-bold text-gray-900 mt-1.5 leading-snug">{material.title}</p>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{formatDate(material.createdAt)}</span>
      </div>

      <div className="px-4 py-3">
        {material.description && (
          <p className={`text-sm text-gray-700 whitespace-pre-wrap ${isNotice ? "" : "mb-3"}`}>
            {material.description}
          </p>
        )}

        {material.fileType === "VIDEO" && material.fileUrl ? (
          <video
            src={material.fileUrl}
            controls
            playsInline
            preload="metadata"
            onPlay={onView}
            className="w-full rounded-xl bg-black max-h-[70vh]"
          />
        ) : material.fileType === "IMAGE" && material.fileUrl ? (
          <button onClick={onOpen} className="block w-full rounded-xl overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={material.fileUrl} alt={material.title} className="w-full max-h-[70vh] object-contain" />
          </button>
        ) : !isNotice ? (
          <button
            onClick={onOpen}
            className={`w-full rounded-xl py-10 flex flex-col items-center justify-center gap-2 ${color} hover:opacity-80 transition-opacity`}
          >
            <Icon className="h-12 w-12 opacity-60" />
            <span className="text-sm font-medium opacity-80">
              Abrir {typeLabel[material.fileType] ?? "Arquivo"}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  {
    href: "/surveys",
    icon: BarChart2,
    label: "Pesquisas",
    desc: "Responda as pesquisas da rede",
    bg: "from-violet-600 to-violet-500",
    tutorialId: "nav-surveys",
  },
  {
    href: "/checklists",
    icon: ClipboardList,
    label: "Checklists",
    desc: "Visualize e preencha checklists operacionais",
    bg: "from-orange-600 to-orange-500",
    tutorialId: "nav-checklists",
  },
  {
    href: "/chat",
    icon: MessageSquare,
    label: "Chat Emergencial",
    desc: "Contato individual aberto pela Franquia",
    bg: "from-sky-600 to-sky-500",
    tutorialId: "nav-chat",
  },
];

export default function GalleryPage() {
  const { data: session } = useSession();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewing, setViewing] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const viewedRef = useRef<Set<string>>(new Set());

  // Passo 5 — abrir/assistir/ler o material registra a visualização automaticamente
  const registerView = useCallback((id: string) => {
    if (viewedRef.current.has(id)) return;
    viewedRef.current.add(id);
    fetch(`/api/materials/${id}/view`, { method: "POST" }).catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      const [matRes, catRes] = await Promise.all([
        fetch("/api/materials"),
        fetch("/api/categories"),
      ]);
      const [mats, cats] = await Promise.all([matRes.json(), catRes.json()]);
      setMaterials(mats);
      setCategories(cats);
      setLoading(false);
    }
    load();
  }, []);

  const filtered =
    activeCategory === "all"
      ? materials
      : materials.filter((m) => m.category.id === activeCategory);

  // Only show categories that have at least one material available to this user
  const visibleCategories = categories.filter((cat) =>
    materials.some((m) => m.category.id === cat.id)
  );

  const firstName = session?.user?.name?.split(" ")[0] ?? "Franqueado";

  return (
    <div className="p-4 sm:p-6">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl px-6 py-8 mb-8 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #EA580C 0%, transparent 60%)" }}
        />
        <div className="relative">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Olá, {firstName} 👋
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Bem-vindo ao painel. Acesse suas ferramentas abaixo.
              </p>
            </div>
            <Image src="/logo.png" alt="Companhia do Churrasco" width={140} height={50} className="invert brightness-0 invert opacity-90 flex-shrink-0 hidden sm:block" />
          </div>
        </div>
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {NAV_ITEMS.map(({ href, icon: Icon, label, desc, bg, tutorialId }) => (
          <Link
            key={href}
            href={href}
            data-tutorial={tutorialId}
            className="group relative overflow-hidden rounded-2xl p-5 flex items-center gap-4 bg-white border border-gray-100 hover:shadow-lg hover:border-transparent transition-all duration-200"
          >
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}
            >
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

      {/* Passo 9 — atalho de suporte 3LM */}
      <div className="mb-10">
        <Support3LMBanner />
      </div>

      {/* Materials section */}
      <div data-tutorial="materials-section" className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Feed da Universidade</h2>
        {visibleCategories.length > 0 && (
          <button
            data-tutorial="filter-btn"
            onClick={() => { setShowFilters((v) => !v); if (showFilters) setActiveCategory("all"); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition ${
              showFilters || activeCategory !== "all"
                ? "bg-orange-600 text-white border-orange-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {activeCategory !== "all"
              ? visibleCategories.find((c) => c.id === activeCategory)?.name ?? "Filtro"
              : "Filtrar"}
          </button>
        )}
      </div>

      {showFilters && visibleCategories.length > 0 && (
        <div className="flex flex-col gap-1 mb-5 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
          <button
            onClick={() => { setActiveCategory("all"); setShowFilters(false); }}
            className={`flex items-center gap-2 w-full px-4 py-2 rounded-xl text-sm font-medium transition-all text-left ${
              activeCategory === "all"
                ? "bg-orange-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-orange-50"
            }`}
          >
            Todos
          </button>
          {visibleCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setShowFilters(false); }}
              className={`flex items-center gap-2 w-full px-4 py-2 rounded-xl text-sm font-medium transition-all text-left ${
                activeCategory === cat.id
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-orange-50"
              }`}
            >
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl">📭</span>
          <p className="text-gray-500 mt-4 font-medium">Nenhum material nesta categoria ainda.</p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-5">
          {filtered.map((mat) => (
            <FeedCard
              key={mat.id}
              material={mat}
              onView={() => registerView(mat.id)}
              onOpen={() => {
                setViewing(mat);
                registerView(mat.id);
              }}
            />
          ))}
        </div>
      )}

      {viewing && <MaterialViewer material={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}