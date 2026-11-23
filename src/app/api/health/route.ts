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
    const [users, stores, materials] = await Promise.all([db.user.count(), db.store.count(), db.material.count()]);
    return NextResponse.json({
      ...base,
      env,
      db: "ok",
      migrations: { applied: migrations.filter((m) => m.finished_at).length, last: migrations.at(-1)?.migration_name, failed },
      counts: { users, stores, materials },
    });
  } catch (e) {
    return NextResponse.json(
      { ...base, status: "error", env, db: "error", error: e instanceof Error ? e.message.slice(0, 500) : String(e) },
      { status: 500 }
    );
  }
}
