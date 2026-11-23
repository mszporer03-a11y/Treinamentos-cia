import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/health           → usado pelo healthcheck do Railway (não toca no banco)
// GET /api/health?deep=1    → diagnóstico: conexão com o banco, migrações e variáveis obrigatórias
export async function GET(req: Request) {
  const base = { status: "ok", timestamp: new Date().toISOString() };
  if (!new URL(req.url).searchParams.has("deep")) return NextResponse.json(base);

  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
    AUTH_URL: !!(process.env.AUTH_URL || process.env.NEXTAUTH_URL),
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? null,
    UPLOADTHING: !!(process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET),
  };

  try {
    await db.$queryRaw`SELECT 1`;
    const migrations = await db.$queryRaw<
      { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }[]
    >`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY started_at`;
    const failed = migrations.filter((m) => !m.finished_at && !m.rolled_back_at).map((m) => m.migration_name);
    // Testa cada tabela usada pelo app para detectar diferenças entre o banco e o código
    const probes: Record<string, () => Promise<unknown>> = {
      user: () => db.user.findFirst(), store: () => db.store.findFirst(), userStore: () => db.userStore.findFirst(),
      material: () => db.material.findFirst(), materialStore: () => db.materialStore.findFirst(), category: () => db.category.findFirst(),
      conversation: () => db.conversation.findFirst(), message: () => db.message.findFirst(), messageStore: () => db.messageStore.findFirst(),
      materialView: () => db.materialView.findFirst(), pushSubscription: () => db.pushSubscription.findFirst(),
      supplyRequest: () => db.supplyRequest.findFirst(), employee: () => db.employee.findFirst(), workSchedule: () => db.workSchedule.findFirst(),
      alert: () => db.nonComplianceAlert.findFirst(), campaign: () => db.marketingCampaign.findFirst(), survey: () => db.survey.findFirst(),
      document: () => db.franchiseeDocument.findFirst(), kiloPrice: () => db.kiloPrice.findFirst(), onboarding: () => db.storeOnboarding.findFirst(),
      tutorial: () => db.appTutorialSeen.findFirst(), checklistTemplate: () => db.checklistTemplate.findFirst(),
      checklistResponse: () => db.checklistResponse.findFirst(),
      storeCounts: () => db.store.findFirst({ include: { _count: { select: { employees: true } }, users: true } }),
    };
    const tables: Record<string, string> = {};
    for (const [name, fn] of Object.entries(probes)) {
      try { await fn(); tables[name] = "ok"; }
      catch (e) { tables[name] = (e instanceof Error ? e.message : String(e)).split("\n").filter(Boolean).slice(-2).join(" ").slice(0, 300); }
    }
    const storeColumns = await db.$queryRaw<{ column_name: string; data_type: string }[]>`
      SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Store' ORDER BY ordinal_position`;
    const [users, stores, materials] = await Promise.all([db.user.count(), db.store.count().catch(() => -1), db.material.count()]);
    return NextResponse.json({
      ...base,
      env,
      db: "ok",
      migrations: { applied: migrations.filter((m) => m.finished_at).length, last: migrations.at(-1)?.migration_name, failed, names: migrations.map((m) => m.migration_name) },
      tables,
      storeColumns: storeColumns.map((c) => `${c.column_name}:${c.data_type}`),
      counts: { users, stores, materials },
    });
  } catch (e) {
    return NextResponse.json(
      { ...base, status: "error", env, db: "error", error: e instanceof Error ? e.message.slice(0, 500) : String(e) },
      { status: 500 }
    );
  }
}
