import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const assetSchema = z.object({
  fileUrl: z.string().url(),
  fileKey: z.string(),
  fileName: z.string(),
  fileType: z.string(),
});

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  published: z.boolean().default(false),
  assets: z.array(assetSchema).default([]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = session.user.role === "ADMIN" ? {} : { published: true };

  const campaigns = await db.marketingCampaign.findMany({
    where,
    include: { assets: true },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { assets, ...data } = parsed.data;

  const campaign = await db.marketingCampaign.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      assets: { create: assets },
    },
    include: { assets: true },
  });
  return NextResponse.json(campaign, { status: 201 });
}
