"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createDiagnostico } from "@/lib/actions/diagnosticos";

export function DiagnosticoForm({ ordenId }: { ordenId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createDiagnostico(formData);
      if (result.success) {
        router.refresh();
        return undefined;
      }
      return result;
    },
    undefined
  );

  return (
    <form action={action}>
      <input type="hidden" name="ordenId" value={ordenId} />
      <h3>Nuevo diagnóstico</h3>
      <div className="form-group">
        <label htmlFor="hallazgos">Hallazgos *</label>
        <textarea id="hallazgos" name="hallazgos" rows={3} required />
        {state && "errors" in state && (
          <p className="field-error">
            {(state as { errors: Record<string, string[]> }).errors
              ?.hallazgos?.[0] ?? ""}
          </p>
        )}
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="solucionPropuesta">Solución propuesta</label>
          <textarea id="solucionPropuesta" name="solucionPropuesta" rows={2} />
        </div>
        <div className="form-group">
          <label htmlFor="costoEstimado">Costo estimado</label>
          <input
            id="costoEstimado"
            name="costoEstimado"
            type="number"
            step="0.01"
            min="0"
          />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" disabled={pending} className="btn-primary btn-sm">
          {pending ? "Guardando..." : "Agregar diagnóstico"}
        </button>
      </div>
    </form>
  );
}
