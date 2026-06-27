"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import type { EstadoOrden } from "@prisma/client";

export async function getDashboardStats() {
  await verifySession();

  const estados: EstadoOrden[] = [
    "RECIBIDO",
    "EN_DIAGNOSTICO",
    "PRESUPUESTADO",
    "APROBADO",
    "EN_REPARACION",
    "LISTO",
    "ENTREGADO",
    "NO_APROBADO",
    "CANCELADO",
  ];

  const counts = await Promise.all(
    estados.map((estado) =>
      prisma.orden.count({ where: { estado } })
    )
  );

  const conteos = Object.fromEntries(
    estados.map((estado, i) => [estado, counts[i]])
  ) as Record<EstadoOrden, number>;

  const atrasadas = await prisma.orden.findMany({
    where: {
      estado: { notIn: ["ENTREGADO", "CANCELADO", "NO_APROBADO"] },
      fechaPrometida: { lt: new Date() },
    },
    orderBy: { fechaPrometida: "asc" },
    take: 10,
    include: {
      cliente: { select: { nombre: true } },
    },
  });

  return { conteos, atrasadas };
}
