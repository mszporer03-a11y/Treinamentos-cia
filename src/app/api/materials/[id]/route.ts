import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { attachmentsSchema, attachmentsSummary, legacyFileFields, materialAttachments } from "@/lib/attachments";
import { notifyMaterialPublished } from "@/lib/notify";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  published: z.boolean().optional(),
  categoryId: z.string().optional(),
  attachments: attachmentsSchema.optional(),
  linkedStoreIds: z.array(z.string()).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const material = await db.material.findUnique({
      where: { id: params.id },
      include: { category: true },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material não encontrado" },
        { status: 404 }
      );
    }

    if (!material.published && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    return NextResponse.json(material);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar material" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { attachments, linkedStoreIds, ...data } = updateSchema.parse(body);

    const before = await db.material.findUnique({ where: { id: params.id }, select: { published: true } });

    let attachmentData = {};
    if (attachments) {
      const current = await db.material.findUnique({ where: { id: params.id }, select: { fileType: true } });
      if (!current) {
        return NextResponse.json({ error: "Material não encontrado" }, { status: 404 });
      }
      if (current.fileType !== "NOTICE" && attachments.length === 0) {
        return NextResponse.json({ error: "Anexe pelo menos um arquivo" }, { status: 400 });
      }
      attachmentData = {
        attachments,
        ...legacyFileFields(attachments),
        ...(current.fileType !== "NOTICE" ? { fileType: attachments[0].kind } : {}),
      };
    }

    const material = await db.material.update({
      where: { id: params.id },
      data: {
        ...data,
        ...attachmentData,
        ...(linkedStoreIds
          ? {
              linkedStores: {
                deleteMany: {},
                create: linkedStoreIds.map((storeId) => ({ storeId })),
              },
            }
          : {}),
      },
      include: {
        category: true,
        linkedStores: { include: { store: { select: { id: true, name: true, code: true } } } },
      },
    });
    // Rascunho → publicado: dispara push + e-mail
    if (before && !before.published && material.published) {
      const list = materialAttachments(material);
      notifyMaterialPublished({
        id: material.id,
        title: material.title,
        fileType: material.fileType,
        summary: list.length > 0 ? attachmentsSummary(list) : undefined,
      }).catch((err) => console.error("[notify] material", err));
    }

    return NextResponse.json(material);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Erro ao atualizar material" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await db.material.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao deletar material" },
      { status: 500 }
    );
  }
}
