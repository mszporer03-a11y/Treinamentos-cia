"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { MaterialViewer } from "@/components/franchisee/MaterialViewer";
import { Play, FileText, Image as ImageIcon, File, ClipboardList, BookOpen, ChevronRight, SlidersHorizontal, Megaphone, Inbox, UtensilsCrossed, Newspaper, GraduationCap, Send } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useBadges, BADGE_KEY } from "@/hooks/useBadges";

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

function FeedCard({ material, onOpen }: { material: Material; onOpen: () => void }) {
  const Icon = typeIcon[material.fileType] ?? File;
  const color = typeColor[material.fileType] ?? typeColor.OTHER;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-md transition-all group">
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
        <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">
            {(material.createdBy?.name ?? "A").charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {material.createdBy?.name ?? "Admin"}
          </p>
          <p className="text-xs text-gray-400">
            {material.category.icon} {material.category.name} · {formatDate(material.createdAt)}
          </p>
        </div>
      </div>

      <button onClick={onOpen} className="w-full text-left focus:outline-none">
        {material.fileType === "IMAGE" ? (
          <div className="mx-3 rounded-xl overflow-hidden bg-gray-100 aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={material.fileUrl ?? ""} alt={material.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        ) : (
          <div className={`mx-3 rounded-xl aspect-video flex flex-col items-center justify-center gap-2 ${color} group-hover:opacity-80 transition-opacity`}>
            <Icon className="h-10 w-10 sm:h-14 sm:w-14 opacity-60" />
            <span className="text-xs sm:text-sm font-medium opacity-70">{typeLabel[material.fileType] ?? "Arquivo"}</span>
          </div>
        )}
        <div className="px-4 pt-2.5 pb-4">
          <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
            {material.title}
          </p>
          {material.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{material.description}</p>
          )}
          <p className="text-xs text-orange-600 font-medium mt-2 flex items-center gap-0.5">
            Abrir <ChevronRight className="h-3 w-3" />
          </p>
        </div>
      </button>
    </div>
  );
}

type GalleryNavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  bg: string;
  tutorialId: string;
  /** Se definido, o card só aparece para estes papéis */
  roles?: string[];
};

const NAV_ITEMS: GalleryNavItem[] = [
  {
    href: "/solicitacoes",
    icon: Inbox,
    label: "Acompanhamento de solicitações",
    desc: "Acompanhe o andamento das suas solicitações",
    bg: "from-indigo-600 to-indigo-500",
    tutorialId: "nav-solicitacoes",
  },
  {
    href: "/solicitar",
    icon: Send,
    label: "Solicitações",
    desc: "Envie uma nova solicitação à Companhia do Churrasco",
    bg: "from-blue-600 to-blue-500",
    tutorialId: "nav-solicitar",
  },
  {
    href: "/comunicados",
    icon: Megaphone,
    label: "Comunicados",
    desc: "Avisos da Companhia do Churrasco",
    bg: "from-sky-600 to-sky-500",
    tutorialId: "nav-comunicados",
  },
  {
    href: "/registros",
    icon: ClipboardList,
    label: "Registros",
    desc: "Ocorrências registradas para a sua loja",
    bg: "from-orange-600 to-orange-500",
    tutorialId: "nav-registros",
  },
  {
    href: "/cia-news",
    icon: Newspaper,
    label: "CIA News",
    desc: "Notícias e novidades da rede",
    bg: "from-rose-600 to-rose-500",
    tutorialId: "nav-cia-news",
  },
  {
    href: "/materiais",
    icon: BookOpen,
    label: "Treinamentos",
    desc: "Acesse todos os materiais e conteúdos da rede",
    bg: "from-teal-600 to-teal-500",
    tutorialId: "nav-materiais",
  },
  {
    href: "/cardapios",
    icon: UtensilsCrossed,
    label: "Cardápios",
    desc: "Cardápios do mês disponíveis para a rede",
    bg: "from-amber-600 to-amber-500",
    tutorialId: "nav-cardapios",
  },
  {
    href: "/universidade",
    icon: GraduationCap,
    label: "Universidade",
    desc: "Vídeos e tutoriais de uso da plataforma",
    bg: "from-violet-600 to-violet-500",
    tutorialId: "nav-universidade",
  },
];

export default function GalleryPage() {
  const { data: session } = useSession();
  const badges = useBadges();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewing, setViewing] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {NAV_ITEMS.filter(
          (item) => !item.roles || item.roles.includes(session?.user?.role ?? "FRANCHISEE")
        ).map(({ href, icon: Icon, label, desc, bg, tutorialId }) => {
          const badgeCount = badges[BADGE_KEY[href] ?? ""] ?? 0;
          return (
            <Link
              key={href}
              href={href}
              data-tutorial={tutorialId}
              className="group relative overflow-hidden rounded-2xl p-5 flex items-center gap-4 bg-white border border-gray-100 hover:shadow-lg hover:border-transparent transition-all duration-200"
            >
              <div className="relative flex-shrink-0">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow ring-2 ring-white">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-base">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Materials section */}
      <div data-tutorial="materials-section" className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Materiais de Treinamento</h2>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((mat) => (
            <FeedCard
              key={mat.id}
              material={mat}
              onOpen={() => {
                setViewing(mat);
                fetch(`/api/materials/${mat.id}/view`, { method: "POST" });
              }}
            />
          ))}
        </div>
      )}

      {viewing && <MaterialViewer material={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}