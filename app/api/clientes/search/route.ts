import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const session = await decrypt((await cookies()).get("session")?.value);
  if (!session?.userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const clientes = await prisma.cliente.findMany({
    where: q
      ? {
          OR: [
            { nombre: { contains: q, mode: "insensitive" as const } },
            { telefono: { contains: q } },
          ],
        }
      : undefined,
    take: 20,
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, telefono: true },
  });

  return NextResponse.json(clientes);
}
