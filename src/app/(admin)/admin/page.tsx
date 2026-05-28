import { db } from "@/lib/db";
import { Users, FolderOpen, FileText, Eye, Store, PackageSearch, AlertTriangle, BarChart2, Plus, Map, ClipboardList } from "lucide-react";
import { AdminFeed } from "@/components/admin/AdminFeed";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [
    totalUsers, activeStores, totalCategories, totalMaterials, publishedMaterials,
    pendingSupply, openAlerts, activeSurveys, recentMaterials,
  ] = await Promise.all([
    db.user.count({ where: { role: "FRANCHISEE", active: true } }),
    db.store.count({ where: { active: true } }),
    db.category.count(),
    db.material.count(),
    db.material.count({ where: { published: true } }),
    db.supplyRequest.count({ where: { status: "PENDING" } }),
    db.nonComplianceAlert.count({ where: { status: { not: "RESOLVED" } } }),
    db.survey.count({ where: { active: true } }),
    db.material.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
      include: { category: true, createdBy: { select: { name: true } } },
    }),
  ]);

  return { totalUsers, activeStores, totalCategories, totalMaterials, publishedMaterials, pendingSupply, openAlerts, activeSurveys, recentMaterials };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const kpis = [
    { label: "Franqueados",    value: data.totalUsers,         icon: Users,      color: "bg-blue-500",    href: "/admin/users" },
    { label: "Lojas ativas",   value: data.activeStores,       icon: Store,      color: "bg-emerald-500", href: "/admin/stores" },
    { label: "Materiais",      value: data.totalMaterials,     icon: FileText,   color: "bg-purple-500",  href: "/admin/materials" },
    { label: "Publicados",     value: data.publishedMaterials, icon: Eye,        color: "bg-indigo-500",  href: "/admin/materials" },
  ];

  const alerts = [
    { label: "Pedidos aguardando", value: data.pendingSupply,  icon: PackageSearch, color: "text-orange-600 bg-orange-50 border-orange-100", href: "/admin/supply-requests", urgent: data.pendingSupply > 0 },
    { label: "Alertas abertos",    value: data.openAlerts,     icon: AlertTriangle, color: "text-red-600 bg-red-50 border-red-100",           href: "/admin/alerts",          urgent: data.openAlerts > 0 },
    { label: "Pesquisas ativas",   value: data.activeSurveys,  icon: BarChart2,     color: "text-violet-600 bg-violet-50 border-violet-100",  href: "/admin/surveys",         urgent: false },
    { label: "Categorias",         value: data.totalCategories,icon: FolderOpen,    color: "text-gray-600 bg-gray-50 border-gray-100",        href: "/admin/categories",      urgent: false },
  ];

  const shortcuts = [
    { href: "/admin/materials?new=1",   icon: Plus,         label: "Publicar Material",    color: "bg-purple-600 hover:bg-purple-700" },
    { href: "/admin/supply-requests",   icon: PackageSearch,label: "Ver Pedidos",           color: "bg-orange-500 hover:bg-orange-600" },
    { href: "/admin/map",               icon: Map,          label: "Mapa de Lojas",         color: "bg-emerald-600 hover:bg-emerald-700" },
    { href: "/admin/onboarding",        icon: ClipboardList,label: "Onboarding",            color: "bg-blue-600 hover:bg-blue-700" },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral da rede Cia do Churrasco</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {kpis.map((stat) => (
          <Link key={stat.label} href={stat.href}
            className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition group">
            <div className={`${stat.color} p-2.5 rounded-xl shrink-0`}>
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 leading-tight">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Attention items */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {alerts.map((stat) => (
          <Link key={stat.label} href={stat.href}
            className={`rounded-xl border p-4 flex items-center gap-3 hover:shadow-sm transition ${stat.color} ${stat.urgent ? "ring-1 ring-current/20" : ""}`}>
            <stat.icon className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs leading-tight opacity-75">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick shortcuts */}
      <div className="flex flex-wrap gap-2 mb-8">
        {shortcuts.map((s) => (
          <Link key={s.href} href={s.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition ${s.color}`}>
            <s.icon className="h-4 w-4" />
            {s.label}
          </Link>
        ))}
      </div>

      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-900">Materiais Recentes</h2>
      </div>
      <AdminFeed materials={data.recentMaterials} />
    </div>
  );
}
