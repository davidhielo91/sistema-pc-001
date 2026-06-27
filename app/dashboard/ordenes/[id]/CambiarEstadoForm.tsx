"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { cambiarEstado } from "@/lib/actions/ordenes";
import { ESTADO_LABELS } from "@/lib/utils";
import type { EstadoOrden } from "@prisma/client";

export function CambiarEstadoForm({
  ordenId,
  estadoActual,
  transiciones,
  moneda,
}: {
  ordenId: string;
  estadoActual: EstadoOrden;
  transiciones: EstadoOrden[];
  moneda: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await cambiarEstado(formData);
      if (result.success) {
        router.refresh();
        return undefined;
      }
      return result;
    },
    undefined
  );

  const isEntrega = transiciones.includes("ENTREGADO" as EstadoOrden);

  return (
    <div className="detail-card">
      <h2>Cambiar estado</h2>
      <form action={action} className="estado-form">
        <input type="hidden" name="ordenId" value={ordenId} />

        <div className="form-group">
          <label>Estado actual: <strong>{ESTADO_LABELS[estadoActual]}</strong></label>
        </div>

        <div className="form-group">
          <label htmlFor="nuevoEstado">Nuevo estado *</label>
          <select id="nuevoEstado" name="nuevoEstado" required>
            <option value="">Seleccione...</option>
            {transiciones.map((est) => (
              <option key={est} value={est}>
                {ESTADO_LABELS[est]}
              </option>
            ))}
          </select>
        </div>

        {isEntrega && (
          <>
            <div className="form-group">
              <label htmlFor="costo">
                Costo ({moneda})
              </label>
              <input
                id="costo"
                name="costo"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
            <div className="form-group">
              <label htmlFor="trabajoRealizado">Trabajo realizado</label>
              <textarea
                id="trabajoRealizado"
                name="trabajoRealizado"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label htmlFor="notasEntrega">Notas de entrega</label>
              <textarea id="notasEntrega" name="notasEntrega" rows={2} />
            </div>
          </>
        )}

        {state?.message && (
          <p className="form-error">{state.message}</p>
        )}

        <div className="form-actions">
          <button
            type="submit"
            disabled={pending}
            className="btn-primary"
          >
            {pending ? "Cambiando..." : "Cambiar estado"}
          </button>
        </div>
      </form>
    </div>
  );
}
