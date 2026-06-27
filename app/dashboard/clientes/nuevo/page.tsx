"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createCliente } from "@/lib/actions/clientes";

export default function NuevoClientePage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createCliente(formData);
      if (result.success) {
        router.push("/dashboard/clientes");
        router.refresh();
      }
      return result;
    },
    undefined
  );

  return (
    <>
      <header className="content-header">
        <h1>Nuevo cliente</h1>
      </header>
      <div className="content-body">
        <form action={action} className="form-card">
          <div className="form-group">
            <label htmlFor="nombre">Nombre *</label>
            <input id="nombre" name="nombre" required />
            {state?.errors?.nombre && (
              <p className="field-error">{state.errors.nombre[0]}</p>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input id="telefono" name="telefono" type="tel" />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="documento">Documento</label>
            <input id="documento" name="documento" />
          </div>
          <div className="form-group">
            <label htmlFor="notas">Notas</label>
            <textarea id="notas" name="notas" rows={3} />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => router.back()}
            >
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "Guardando..." : "Guardar cliente"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
