import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(10),
  endsAt: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const surveys = await db.survey.findMany({
    where: session.user.role === "ADMIN" ? {} : { active: true },
    include: {
      options: {
        include: { _count: { select: { responses: true } } },
        orderBy: { order: "asc" },
      },
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // For franchisees: include whether they already responded
  if (session.user.role !== "ADMIN") {
    const myResponses = await db.surveyResponse.findMany({
      where: { userId: session.user.id },
      select: { surveyId: true, optionId: true },
    });
    const answered = new Map(myResponses.map((r) => [r.surveyId, r.optionId]));
    const enriched = surveys.map((s) => ({
      ...s,
      myAnswer: answered.get(s.id) ?? null,
    }));
    return NextResponse.json(enriched);
  }

  return NextResponse.json(surveys);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { question, options, endsAt } = parsed.data;

  const survey = await db.survey.create({
    data: {
      question,
      endsAt: endsAt ? new Date(endsAt) : undefined,
      options: {
        create: options.map((text, order) => ({ text, order })),
      },
    },
    include: {
      options: { orderBy: { order: "asc" } },
    },
  });
  return NextResponse.json(survey, { status: 201 });
}
