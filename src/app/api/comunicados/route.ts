import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendPushToAll } from "@/lib/push";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  fileUrl: z.string().url().optional(),
  fileKey: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  published: z.boolean().optional().default(true),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN";

  const comunicados = await db.comunicado.findMany({
    where: isAdmin ? {} : { published: true },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { views: true } },
      views: isAdmin
        ? false
        : { where: { userId: session.user.id }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(comunicados);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const comunicado = await db.comunicado.create({
    data: { ...parsed.data, createdById: session.user.id },
    include: { createdBy: { select: { name: true } }, _count: { select: { views: true } } },
  });

  if (comunicado.published) {
    await sendPushToAll(
      { title: "📣 Novo comunicado", body: comunicado.title, url: "/comunicados" },
      "NON_ADMIN"
    );
  }

  return NextResponse.json(comunicado, { status: 201 });
}
