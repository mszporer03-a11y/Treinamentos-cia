import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { attachmentsSchema, legacyNamedFileFields } from "@/lib/attachments";

export const dynamic = "force-dynamic";

// PATCH /api/onboarding/[id] — somente admin: conclui/reabre etapa, define
// responsável e anexa/remove o arquivo da etapa.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { stepId, completed, responsible, file } = body as {
    stepId?: string;
    completed?: boolean;
    responsible?: string | null;
    file?: { url: string; key?: string; name?: string; type?: string } | null;
  };
  // Lista completa de anexos da etapa (vários arquivos)
  const parsedAttachments = body.attachments === undefined ? null : attachmentsSchema.safeParse(body.attachments);
  if (parsedAttachments && !parsedAttachments.success) {
    return NextResponse.json({ error: "Anexos inválidos" }, { status: 400 });
  }
  const attachments = parsedAttachments?.success ? parsedAttachments.data : undefined;

  if (stepId) {
    const step = await db.onboardingStep.findFirst({
      where: { id: stepId, onboardingId: params.id },
      select: { id: true },
    });
    if (!step) return NextResponse.json({ error: "Etapa não encontrada" }, { status: 404 });

    await db.onboardingStep.update({
      where: { id: stepId },
      data: {
        ...(completed !== undefined ? { completedAt: completed ? new Date() : null } : {}),
        ...(responsible !== undefined ? { responsible } : {}),
        ...(attachments
          ? { attachments, ...legacyNamedFileFields(attachments) }
          : file !== undefined
          ? {
              fileUrl: file?.url ?? null,
              fileKey: file?.key ?? null,
              fileName: file?.name ?? null,
              fileType: file?.type ?? null,
              attachments: [],
            }
          : {}),
      },
    });
  }

  // Recalculate overall completion
  const onboarding = await db.storeOnboarding.findUnique({
    where: { id: params.id },
    include: { steps: true },
  });
  if (!onboarding) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allDone = onboarding.steps.every((s) => s.completedAt !== null);
  const updated = await db.storeOnboarding.update({
    where: { id: params.id },
    data: { completedAt: allDone ? new Date() : null },
    include: { store: { select: { id: true, name: true } }, steps: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(updated);
}
