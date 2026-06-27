import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET() {
  const session = await decrypt((await cookies()).get("session")?.value);
  if (!session?.userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ajustes = await prisma.ajustes.findUnique({ where: { id: 1 } });
  return NextResponse.json(ajustes);
}
