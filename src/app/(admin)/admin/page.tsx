import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { AdminFeed } from "@/components/admin/AdminFeed";
import { AdminDashboardCards } from "@/components/admin/AdminDashboardCards";
import Image from "next/image";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [totalUsers, activeStores, publishedMaterials, openAlerts, pendingRequests, recentMaterials] =
    await Promise.all([
      db.user.count({ where: { role: "FRANCHISEE", active: true } }),
      db.store.count({ where: { active: true } }),
      db.material.count({ where: { published: true } }),
      db.nonComplianceAlert.count(),
      db.message.count({ where: { category: { not: null }, requestStatus: "PENDING" } }),
      db.material.findMany({
        take: 12,
        orderBy: { createdAt: "desc" },
        include: { category: true, createdBy: { select: { name: true } } },
      }),
    ]);

  return { totalUsers, activeStores, publishedMaterials, openAlerts, pendingRequests, recentMaterials };
}

export default async function AdminDashboardPage() {
  const session = await auth();
  const data = await getDashboardData();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Admin";

  const stats = [
    { label: "Franqueados",       value: data.totalUsers,          color: "text-blue-400" },
    { label: "Lojas ativas",      value: data.activeStores,        color: "text-emerald-400" },
    { label: "Materiais publicados", value: data.publishedMaterials, color: "text-purple-400" },
    ...(data.openAlerts > 0
      ? [{ label: "Registros", value: data.openAlerts, color: "text-orange-400" }]
      : []),
    ...(data.pendingRequests > 0
      ? [{ label: "Solicitações pendentes", value: data.pendingRequests, color: "text-amber-400" }]
      : []),
  ];

  return (
    <div className="p-4 sm:p-6">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl px-6 py-8 mb-8 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #EA580C 0%, transparent 60%)" }}
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Olá, {firstName} 👋
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Painel de administração — Companhia do Churrasco
              </p>
              {/* Stats chips */}
              <div className="flex flex-wrap gap-3 mt-4">
                {stats.map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-1.5">
                    <span className={`text-base font-bold ${s.color}`}>{s.value}</span>
                    <span className="text-xs text-gray-400">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <Image
              src="/logo.png"
              alt="Companhia do Churrasco"
              width={140}
              height={50}
              className="invert brightness-0 invert opacity-90 flex-shrink-0 hidden sm:block"
            />
          </div>
        </div>
      </div>

      {/* Nav cards — client component (loads badges) */}
      <AdminDashboardCards />

      {/* Recent materials */}
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-900">Materiais Recentes</h2>
      </div>
      <AdminFeed materials={data.recentMaterials} />
    </div>
  );
}
