import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { stepId, completed, responsible } = await req.json();

  if (stepId) {
    // Update individual step
    await db.onboardingStep.update({
      where: { id: stepId },
      data: {
        completedAt: completed ? new Date() : null,
        ...(responsible !== undefined ? { responsible } : {}),
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
