import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH /api/onboarding/[id] — somente admin: conclui/reabre etapa, define
// responsável e anexa/remove o arquivo da etapa.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { stepId, completed, responsible, file } = (await req.json()) as {
    stepId?: string;
    completed?: boolean;
    responsible?: string | null;
    file?: { url: string; key?: string; name?: string; type?: string } | null;
  };

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
        ...(file !== undefined
          ? {
              fileUrl: file?.url ?? null,
              fileKey: file?.key ?? null,
              fileName: file?.name ?? null,
              fileType: file?.type ?? null,
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
