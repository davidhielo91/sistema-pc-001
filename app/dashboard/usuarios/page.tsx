"use client";

import { useEffect, useState, useActionState } from "react";
import {
  getUsuarios,
  createUsuario,
  toggleUsuarioActivo,
  cambiarRolUsuario,
} from "@/lib/actions/usuarios";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<
    {
      id: string;
      nombre: string;
      email: string;
      rol: string;
      activo: boolean;
      createdAt: Date;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getUsuarios().then((data) => {
      setUsuarios(data);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createUsuario(formData);
      if (result.success) {
        load();
        const form = document.getElementById("user-form") as HTMLFormElement;
        form?.reset();
        return undefined;
      }
      return result;
    },
    undefined
  );

  return (
    <>
      <header className="content-header">
        <h1>Usuarios</h1>
      </header>
      <div className="content-body">
        {/* Nuevo usuario */}
        <div className="form-card">
          <h2>Nuevo usuario</h2>
          <form id="user-form" action={action} className="form-card-inner">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombre">Nombre *</label>
                <input id="nombre" name="nombre" required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input id="email" name="email" type="email" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Contraseña *</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label htmlFor="rol">Rol *</label>
                <select id="rol" name="rol" required>
                  <option value="TECNICO">Técnico</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>
            {state?.message && <p className="form-error">{state.message}</p>}
            {state && "errors" in state && (
              <p className="field-error">
                {
                  (
                    state as {
                      errors: Record<string, string[]>;
                    }
                  ).errors?.email?.[0] ?? ""
                }
              </p>
            )}
            <div className="form-actions">
              <button type="submit" disabled={pending} className="btn-primary">
                {pending ? "Creando..." : "Crear usuario"}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de usuarios */}
        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nombre}</td>
                    <td>{u.email}</td>
                    <td>{u.rol === "ADMIN" ? "Administrador" : "Técnico"}</td>
                    <td>
                      <span
                        className={`estado-badge ${
                          u.activo ? "estado-listo" : "estado-cancelado"
                        }`}
                      >
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn-link"
                          onClick={async () => {
                            await toggleUsuarioActivo(u.id);
                            load();
                          }}
                        >
                          {u.activo ? "Desactivar" : "Activar"}
                        </button>
                        <select
                          value={u.rol}
                          className="rol-select"
                          onChange={async (e) => {
                            await cambiarRolUsuario(
                              u.id,
                              e.target.value as "ADMIN" | "TECNICO"
                            );
                            load();
                          }}
                        >
                          <option value="TECNICO">Técnico</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
