import { prisma } from "./prisma";
import type { EstadoOrden } from "@prisma/client";

export const ESTADO_LABELS: Record<EstadoOrden, string> = {
  RECIBIDO: "Recibido",
  EN_DIAGNOSTICO: "En diagnóstico",
  PRESUPUESTADO: "Presupuestado",
  APROBADO: "Aprobado",
  EN_REPARACION: "En reparación",
  LISTO: "Listo",
  ENTREGADO: "Entregado",
  NO_APROBADO: "No aprobado",
  CANCELADO: "Cancelado",
};

export const TRANSICIONES: Record<EstadoOrden, EstadoOrden[]> = {
  RECIBIDO: ["EN_DIAGNOSTICO", "CANCELADO"],
  EN_DIAGNOSTICO: ["PRESUPUESTADO", "CANCELADO"],
  PRESUPUESTADO: ["APROBADO", "NO_APROBADO", "CANCELADO"],
  APROBADO: ["EN_REPARACION", "CANCELADO"],
  EN_REPARACION: ["LISTO", "CANCELADO"],
  LISTO: ["ENTREGADO", "CANCELADO"],
  ENTREGADO: [],
  NO_APROBADO: ["ENTREGADO", "CANCELADO"],
  CANCELADO: [],
};

export function esEstadoTerminal(estado: EstadoOrden): boolean {
  return estado === "ENTREGADO" || estado === "CANCELADO";
}

export function ordenEstaAtrasada(
  estado: EstadoOrden,
  fechaPrometida: Date | null
): boolean {
  if (!fechaPrometida) return false;
  if (esEstadoTerminal(estado)) return false;
  return new Date() > fechaPrometida;
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDateShort(date: Date | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
  }).format(date);
}

let _moneda: string | null = null;

export async function getMoneda(): Promise<string> {
  if (_moneda) return _moneda;
  const ajustes = await prisma.ajustes.findUnique({ where: { id: 1 } });
  _moneda = ajustes?.moneda ?? "MXN";
  return _moneda;
}

export async function formatCurrency(
  amount: number | null | undefined
): Promise<string> {
  if (amount == null) return "-";
  const moneda = await getMoneda();
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: moneda,
  }).format(amount);
}
