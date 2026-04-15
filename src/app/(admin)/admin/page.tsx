import { db } from "@/lib/db";
import { Users, FolderOpen, FileText, Eye } from "lucide-react";
import { AdminFeed } from "@/components/admin/AdminFeed";

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
