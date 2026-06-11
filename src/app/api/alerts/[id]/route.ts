import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED"]).optional(),
  resolution: z.string().max(1000).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const isAdmin = session.user.role === "ADMIN";

  if (!isAdmin) {
    // Franqueado só pode reconhecer alertas das próprias lojas
    const alert = await db.nonComplianceAlert.findUnique({
      where: { id: params.id },
      select: { storeId: true },
    });
    if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const link = await db.userStore.findFirst({
      where: { userId: session.user.id, storeId: alert.storeId },
    });
    if (!link || parsed.data.status !== "ACKNOWLEDGED")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await db.nonComplianceAlert.update({
    where: { id: params.id },
    data: parsed.data,
    include: { store: { select: { id: true, name: true } } },
  });

  // Notificar admins quando um franqueado reconhece um alerta
  if (!isAdmin && parsed.data.status === "ACKNOWLEDGED") {
    const admins = await db.user.findMany({
      where: { role: "ADMIN", active: true },
      select: { id: true },
    });
    await Promise.allSettled(
      admins.map((admin) =>
        sendPushToUser(admin.id, {
          title: `Alerta reconhecido — ${updated.store.name}`,
          body: `${session.user.name ?? "Franqueado"} reconheceu: ${updated.title}`,
          url: "/admin/notificacoes",
        })
      )
    );
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.nonComplianceAlert.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
