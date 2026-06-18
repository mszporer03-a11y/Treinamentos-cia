import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import { z } from "zod";

const createSchema = z.object({
  storeId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  fileUrl: z.string().url().optional(),
  fileKey: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");

  const where: Record<string, unknown> = {};

  if (session.user.role !== "ADMIN") {
    const userStores = await db.userStore.findMany({
      where: { userId: session.user.id },
      select: { storeId: true },
    });
    const ids = userStores.map((s) => s.storeId);
    where.storeId = { in: ids };
  } else if (storeId) {
    where.storeId = storeId;
  }

  const alerts = await db.nonComplianceAlert.findMany({
    where,
    include: {
      store: { select: { id: true, name: true, code: true } },
      // Admin: conta quantos viram. Não-admin: saber se ele já viu.
      _count: { select: { views: true } },
      views:
        session.user.role === "ADMIN"
          ? false
          : { where: { userId: session.user.id }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(alerts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const alert = await db.nonComplianceAlert.create({
    data: parsed.data,
    include: { store: { select: { id: true, name: true } } },
  });

  // Notificar franqueados/gerentes vinculados à loja
  const links = await db.userStore.findMany({
    where: { storeId: alert.storeId },
    select: { userId: true },
  });
  await Promise.allSettled(
    links.map((link) =>
      sendPushToUser(link.userId, {
        title: `📋 Novo registro — ${alert.store.name}`,
        body: alert.title,
        url: "/registros",
      })
    )
  );

  return NextResponse.json(alert, { status: 201 });
}
