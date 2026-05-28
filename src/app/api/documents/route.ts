import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  franchiseeId: z.string().cuid(),
  title: z.string().min(1).max(200),
  category: z.enum(["CONTRATO", "ADITIVO", "PROCURACAO", "ALVARA", "CERTIFICADO", "OUTRO"]).default("OUTRO"),
  fileUrl: z.string().url(),
  fileKey: z.string(),
  fileName: z.string(),
  expiresAt: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role === "ADMIN") {
    const docs = await db.franchiseeDocument.findMany({
      include: { franchisee: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(docs);
  }

  const docs = await db.franchiseeDocument.findMany({
    where: { franchiseeId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(docs);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const doc = await db.franchiseeDocument.create({
    data: {
      ...parsed.data,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
    },
    include: { franchisee: { select: { id: true, name: true } } },
  });
  return NextResponse.json(doc, { status: 201 });
}
