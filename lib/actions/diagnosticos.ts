"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const DiagnosticoSchema = z.object({
  ordenId: z.string(),
  hallazgos: z.string().min(1, "Los hallazgos son requeridos"),
  solucionPropuesta: z.string().nullable().optional(),
  costoEstimado: z.number().nullable().optional(),
});

export async function createDiagnostico(formData: FormData) {
  const session = await verifySession();

  const raw = Object.fromEntries(formData);
  const parsed = DiagnosticoSchema.safeParse({
    ...raw,
    solucionPropuesta: raw.solucionPropuesta || null,
    costoEstimado: raw.costoEstimado ? Number(raw.costoEstimado) : null,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.diagnostico.create({
    data: {
      ...parsed.data,
      costoEstimado: parsed.data.costoEstimado,
      tecnicoId: session.userId,
    },
  });

  revalidatePath(`/dashboard/ordenes/${parsed.data.ordenId}`);
  return { success: true };
}

export async function aprobarDiagnostico(diagnosticoId: string, aprobado: boolean) {
  await verifySession();

  const diagnostico = await prisma.diagnostico.findUnique({
    where: { id: diagnosticoId },
    select: { ordenId: true },
  });

  if (!diagnostico) return { message: "Diagnóstico no encontrado" };

  await prisma.diagnostico.update({
    where: { id: diagnosticoId },
    data: { aprobado },
  });

  revalidatePath(`/dashboard/ordenes/${diagnostico.ordenId}`);
  return { success: true };
}
