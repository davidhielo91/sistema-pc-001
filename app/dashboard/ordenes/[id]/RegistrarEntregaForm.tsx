"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { cambiarEstado } from "@/lib/actions/ordenes";

export function RegistrarEntregaForm({
  ordenId,
  moneda,
}: {
  ordenId: string;
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

  return (
    <div className="detail-card highlight-card">
      <h2>Registrar entrega</h2>
      <p className="text-muted section-subtitle">
        La orden está lista para ser entregada al cliente.
      </p>
      <form action={action} className="estado-form">
        <input type="hidden" name="ordenId" value={ordenId} />
        <input type="hidden" name="nuevoEstado" value="ENTREGADO" />

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="costo">Costo ({moneda})</label>
            <input
              id="costo"
              name="costo"
              type="number"
              step="0.01"
              min="0"
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="trabajoRealizado">Trabajo realizado</label>
          <textarea id="trabajoRealizado" name="trabajoRealizado" rows={3} />
        </div>
        <div className="form-group">
          <label htmlFor="notasEntrega">Notas de entrega</label>
          <textarea id="notasEntrega" name="notasEntrega" rows={2} />
        </div>

        {state?.message && <p className="form-error">{state.message}</p>}

        <div className="form-actions">
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Registrando..." : "Confirmar entrega"}
          </button>
        </div>
      </form>
    </div>
  );
}
