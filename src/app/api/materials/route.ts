import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const materialSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  fileKey: z.string(),
  fileType: z.enum(["VIDEO", "PDF", "IMAGE", "DOCUMENT", "OTHER"]),
  mimeType: z.string().optional(),
  fileSize: z.number().optional(),
  categoryId: z.string(),
  published: z.boolean().optional().default(true),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const slug = searchParams.get("slug");

  try {
    const where: {
      published?: boolean;
      categoryId?: string;
      category?: { slug: string };
    } = {};

    if (session.user.role !== "ADMIN") {
      where.published = true;
    }
    if (categoryId) where.categoryId = categoryId;
    if (slug) where.category = { slug };

    const materials = await db.material.findMany({
      where,
      include: { category: true, createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(materials);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar materiais" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = materialSchema.parse(body);
    const material = await db.material.create({
      data: { ...data, createdById: session.user.id },
    });
    return NextResponse.json(material, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Erro ao criar material" },
      { status: 500 }
    );
  }
}
