import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Franchisee confirms a suggested kilo price
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updated = await db.kiloPrice.update({
    where: { id: params.id },
    data: { confirmedAt: new Date() },
  });
  return NextResponse.json(updated);
}
