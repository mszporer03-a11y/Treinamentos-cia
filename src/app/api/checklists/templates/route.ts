import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/checklists/templates
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const templates = await db.checklistTemplate.findMany({
    where: { active: true },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      },
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

// POST /api/checklists/templates — admin only
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, sections } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  }

  const template = await db.checklistTemplate.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      sections: {
        create: (sections ?? []).map((sec: { name: string; items: { text: string }[] }, si: number) => ({
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
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      },
    },
  });

  return NextResponse.json(template, { status: 201 });
}
