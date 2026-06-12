import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/checklists/responses
// Admin → all responses; Franchisee → responses for their stores
export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const templateId = searchParams.get("templateId");
  const storeId = searchParams.get("storeId");

  let storeIds: string[] | undefined;
  if (session.user.role !== "ADMIN") {
    const userStores = await db.userStore.findMany({
      where: { userId: session.user.id },
      select: { storeId: true },
    });
    storeIds = userStores.map((us) => us.storeId);
  }

  const responses = await db.checklistResponse.findMany({
    where: {
      ...(storeIds && { storeId: { in: storeIds } }),
      ...(templateId && { templateId }),
      ...(storeId && { storeId }),
    },
    include: {
      template: { select: { id: true, name: true } },
      store: { select: { id: true, name: true, code: true } },
      responder: { select: { id: true, name: true } },
      items: { include: { item: { select: { text: true, section: { select: { name: true } } } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(responses);
}

// POST /api/checklists/responses — submit a filled checklist
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { templateId, storeId, notes, items } = body;

  if (!templateId || !storeId) {
    return NextResponse.json({ error: "templateId e storeId são obrigatórios" }, { status: 400 });
  }

  // Validate store access for franchisee/manager
  if (session.user.role !== "ADMIN") {
    const access = await db.userStore.findFirst({
      where: { userId: session.user.id, storeId },
    });
    if (!access) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const allChecked = Array.isArray(items) && items.every((i: { checked: boolean }) => i.checked);

  const response = await db.checklistResponse.create({
    data: {
      templateId,
      storeId,
      responderId: session.user.id,
      notes: notes?.trim() || null,
      completedAt: allChecked ? new Date() : null,
      items: {
        create: (items ?? []).map((item: { itemId: string; checked: boolean; notes?: string }) => ({
          itemId: item.itemId,
          checked: !!item.checked,
          notes: item.notes?.trim() || null,
        })),
      },
    },
    include: {
      template: { select: { id: true, name: true } },
      store: { select: { id: true, name: true, code: true } },
      responder: { select: { id: true, name: true } },
      items: true,
    },
  });

  return NextResponse.json(response, { status: 201 });
}
