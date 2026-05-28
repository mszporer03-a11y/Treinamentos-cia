import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { optionId } = await req.json();
  if (!z.string().cuid().safeParse(optionId).success)
    return NextResponse.json({ error: "Invalid optionId" }, { status: 400 });

  // Verify option belongs to survey
  const option = await db.surveyOption.findFirst({
    where: { id: optionId, surveyId: params.id },
  });
  if (!option) return NextResponse.json({ error: "Option not found" }, { status: 404 });

  const response = await db.surveyResponse.upsert({
    where: { surveyId_userId: { surveyId: params.id, userId: session.user.id } },
    create: { surveyId: params.id, optionId, userId: session.user.id },
    update: { optionId },
  });
  return NextResponse.json(response, { status: 201 });
}
