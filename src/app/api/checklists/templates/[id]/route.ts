import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/checklists/templates/[id]
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const template = await db.checklistTemplate.findUnique({
    where: { id: params.id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!template) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  return NextResponse.json(template);
}

// PATCH /api/checklists/templates/[id] — admin only
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, active, sections } = body;

  // If sections provided, rebuild them
  if (sections !== undefined) {
    await db.checklistSection.deleteMany({ where: { templateId: params.id } });
    await db.checklistTemplate.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(active !== undefined && { active }),
        sections: {
          create: sections.map((sec: { name: string; items: { text: string }[] }, si: number) => ({
            name: sec.name,
            order: si,
            items: {
              create: (sec.items ?? []).map((item: { text: string }, ii: number) => ({
                text: item.text,
                order: ii,
              })),
            },
          })),
        },
      },
    });
  } else {
    await db.checklistTemplate.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(active !== undefined && { active }),
      },
    });
  }

  const updated = await db.checklistTemplate.findUnique({
    where: { id: params.id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      },
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/checklists/templates/[id] — admin only
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Soft-delete
  await db.checklistTemplate.update({
    where: { id: params.id },
    data: { active: false },
  });

  return NextResponse.json({ ok: true });
}
