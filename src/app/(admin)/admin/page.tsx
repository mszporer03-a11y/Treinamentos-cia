import { db } from "@/lib/db";
import { Users, FolderOpen, FileText, Eye, Store, PackageSearch, AlertTriangle, BarChart2 } from "lucide-react";
import { AdminFeed } from "@/components/admin/AdminFeed";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [
    totalUsers, totalStores, activeStores, totalCategories, totalMaterials, publishedMaterials,
    pendingSupply, openAlerts, activeSurveys, recentMaterials,
  ] = await Promise.all([
    db.user.count({ where: { role: "FRANCHISEE", active: true } }),
    db.store.count(),
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

  return { totalUsers, totalStores, activeStores, totalCategories, totalMaterials, publishedMaterials, pendingSupply, openAlerts, activeSurveys, recentMaterials };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const topStats = [
    { label: "Franqueados ativos", value: data.totalUsers,      icon: Users,     color: "bg-blue-500",    href: "/admin/users" },
    { label: "Lojas ativas",       value: data.activeStores,    icon: Store,     color: "bg-emerald-500", href: "/admin/stores" },
    { label: "Materiais",          value: data.totalMaterials,  icon: FileText,  color: "bg-purple-500",  href: "/admin/materials" },
    { label: "Categorias",         value: data.totalCategories, icon: FolderOpen,color: "bg-indigo-500",  href: "/admin/categories" },
  ];

  const alertStats = [
    { label: "Pedidos pendentes",  value: data.pendingSupply,  icon: PackageSearch,  color: "text-orange-600 bg-orange-50", href: "/admin/supply-requests" },
    { label: "Alertas abertos",    value: data.openAlerts,     icon: AlertTriangle,  color: "text-red-600 bg-red-50",       href: "/admin/alerts" },
    { label: "Pesquisas ativas",   value: data.activeSurveys,  icon: BarChart2,      color: "text-violet-600 bg-violet-50", href: "/admin/surveys" },
    { label: "Publicados",         value: data.publishedMaterials, icon: Eye,        color: "text-green-600 bg-green-50",   href: "/admin/materials" },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral da rede Cia do Churrasco</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {topStats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition group">
            <div className={`${stat.color} p-2.5 rounded-xl flex-shrink-0`}>
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition">{stat.value}</p>
              <p className="text-xs text-gray-500 leading-tight">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Alert KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {alertStats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition group">
            <div className={`${stat.color} p-2.5 rounded-xl flex-shrink-0`}>
              <stat.icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 leading-tight">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Materiais Recentes</h2>
      </div>
      <AdminFeed materials={data.recentMaterials} />
    </div>
  );
}


export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [totalUsers, totalCategories, totalMaterials, publishedMaterials, recentMaterials] =
    await Promise.all([
      db.user.count(),
      db.category.count(),
      db.material.count(),
      db.material.count({ where: { published: true } }),
      db.material.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          createdBy: { select: { name: true } },
        },
      }),
    ]);

  return { totalUsers, totalCategories, totalMaterials, publishedMaterials, recentMaterials };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const stats = [
    { label: "Usuarios",           value: data.totalUsers,         icon: Users,     color: "bg-blue-500" },
    { label: "Categorias",         value: data.totalCategories,    icon: FolderOpen, color: "bg-green-500" },
    { label: "Total de Materiais", value: data.totalMaterials,     icon: FileText,  color: "bg-purple-500" },
    { label: "Publicados",         value: data.publishedMaterials, icon: Eye,       color: "bg-orange-500" },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visao geral do portal de treinamentos</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 md:mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
            <div className={`${stat.color} p-2.5 sm:p-3 rounded-xl flex-shrink-0`}>
              <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Materiais Recentes</h2>
      </div>
      <AdminFeed materials={data.recentMaterials} />
    </div>
  );
}
