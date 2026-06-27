"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ClienteSchema } from "@/lib/validations";
import { verifySession } from "@/lib/dal";

export async function getClientes(search?: string) {
  await verifySession();

  const where = search
    ? {
        OR: [
          { nombre: { contains: search, mode: "insensitive" as const } },
          { telefono: { contains: search } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  return prisma.cliente.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { ordenes: true } } },
  });
}

export async function getCliente(id: string) {
  await verifySession();

  return prisma.cliente.findUnique({
    where: { id },
    include: {
      ordenes: {
        orderBy: { createdAt: "desc" },
        include: { recibidoPor: { select: { nombre: true } } },
      },
    },
  });
}

export async function createCliente(formData: FormData) {
  await verifySession();

  const raw = Object.fromEntries(formData);
  const parsed = ClienteSchema.safeParse({
    ...raw,
    telefono: raw.telefono || null,
    email: raw.email || null,
    documento: raw.documento || null,
    notas: raw.notas || null,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const cliente = await prisma.cliente.create({ data: parsed.data });
  revalidatePath("/dashboard/clientes");
  return { success: true, cliente };
}

export async function updateCliente(id: string, formData: FormData) {
  await verifySession();

  const raw = Object.fromEntries(formData);
  const parsed = ClienteSchema.safeParse({
    ...raw,
    telefono: raw.telefono || null,
    email: raw.email || null,
    documento: raw.documento || null,
    notas: raw.notas || null,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.cliente.update({ where: { id }, data: parsed.data });
  revalidatePath("/dashboard/clientes");
  return { success: true };
}
