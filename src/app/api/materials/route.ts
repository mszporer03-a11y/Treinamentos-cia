import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { sendPushToAll } from "@/lib/push";
import { NextResponse } from "next/server";
import { z } from "zod";

const materialSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileKey: z.string().optional(),
  fileType: z.enum(["VIDEO", "PDF", "IMAGE", "DOCUMENT", "OTHER", "NOTICE"]).optional().default("OTHER"),
  mimeType: z.string().optional(),
  fileSize: z.number().optional(),
  categoryId: z.string(),
  published: z.boolean().optional().default(true),
  linkedStoreIds: z.array(z.string()).optional().default([]),
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
      OR?: object[];
    } = {};

    if (session.user.role !== "ADMIN") {
      where.published = true;
      // Get the franchisee's store IDs
      const userStores = await db.userStore.findMany({
        where: { userId: session.user.id },
        select: { storeId: true },
      });
      const storeIds = userStores.map((us) => us.storeId);
      // Show materials with no store restriction OR linked to one of the user's stores
      where.OR = [
        { linkedStores: { none: {} } },
        { linkedStores: { some: { storeId: { in: storeIds } } } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (slug) where.category = { slug };

    const materials = await db.material.findMany({
      where,
      include: {
        category: true,
        createdBy: { select: { name: true } },
        linkedStores: { include: { store: { select: { id: true, name: true, code: true } } } },
      },
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
    const { linkedStoreIds, ...rest } = data;
    const material = await db.material.create({
      data: {
        ...rest,
        createdById: session.user.id,
        linkedStores: linkedStoreIds.length > 0
          ? { create: linkedStoreIds.map((storeId) => ({ storeId })) }
          : undefined,
      },
      include: {
        category: true,
        linkedStores: { include: { store: { select: { id: true, name: true, code: true } } } },
      },
    });

    if (data.published) {
      const isNotice = data.fileType === "NOTICE";
      await sendPushToAll(
        {
          title: isNotice ? "Novo aviso!" : "Novo material disponivel!",
          body: data.title,
          url: "/gallery",
        },
        "NON_ADMIN"
      );
    }

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
