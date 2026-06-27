# AGENTS.md — Sistema de Gestión para Taller de Reparación de Computadoras

> Este documento es la **fuente de verdad** del proyecto. Cualquier agente de IA
> (OpenCode/DeepSeek, Claude Code) debe leerlo **completo** antes de generar o
> modificar código. No inventes entidades, campos ni dependencias que no estén
> descritas aquí. Si algo no está definido, elige la opción más simple y déjalo
> anotado en el CHANGELOG, no lo improvises en silencio.

---

## 1. Propósito

Aplicación web para administrar un taller de reparación de computadoras. Cubre el
flujo central:

1. Registrar el **ingreso** de equipos (nota de recepción).
2. Guardar **información básica del cliente**.
3. Gestionar **diagnósticos**.
4. Controlar **tiempos de entrega** (fecha prometida vs. fecha real) y registrar la
   **nota de entrega**.

Es una herramienta **interna del taller**, no un sistema de facturación.

---

## 2. Modelo de despliegue (MUY IMPORTANTE)

- **Single-tenant: un despliegue por taller.** Cada taller corre su propia copia con
  su propia base de datos. **No hay multi-tenancy.** No agregues `tenant_id` ni lógica
  de aislamiento entre talleres.
- El código se publica en GitHub y cada colega lo clona y despliega en su propio VPS
  (con EasyPanel) o lo corre en local para desarrollo.
- **Toda configuración específica del taller** (nombre, moneda, datos de contacto,
  usuario admin inicial) vive en variables de entorno o en la tabla de Ajustes.
  **Nunca** debe quedar nada de un taller concreto escrito en el código.
- Entornos objetivo:
  - **Local (Windows):** solo para desarrollo, vía Docker. No se requiere modo offline.
  - **Producción:** VPS con EasyPanel usando el mismo `Dockerfile`.

---

## 3. Stack tecnológico

- **Next.js (App Router) + TypeScript** — una sola base de código (frontend + backend).
- **PostgreSQL** como base de datos.
- **Prisma** como ORM. El esquema de Prisma es la fuente de verdad del modelo de datos.
- **Prisma Migrate** para migraciones. **Prohibido** alterar la base de datos a mano.
- **Autenticación** propia simple basada en sesión (email + contraseña con hash). No
  agregues OAuth ni proveedores externos.
- **Docker** + `docker-compose` para paridad local/producción.
- **Idioma de la interfaz: español.**

> Regla: no agregar librerías "porque sí". Cada dependencia nueva debe justificarse.
> Mantener el stack pequeño y mainstream.

---

## 4. Modelo de datos

Cinco entidades: **Usuario, Cliente, Orden, Diagnostico, Ajustes**.

Esquema de referencia en Prisma (ajustable en detalles, no en su esencia):

```prisma
// Roles de usuario
enum Rol {
  ADMIN
  TECNICO
}

// Estados de una orden (máquina de estados, ver sección 5)
enum EstadoOrden {
  RECIBIDO
  EN_DIAGNOSTICO
  PRESUPUESTADO
  APROBADO
  EN_REPARACION
  LISTO
  ENTREGADO
  NO_APROBADO
  CANCELADO
}

model Usuario {
  id           String   @id @default(cuid())
  nombre       String
  email        String   @unique
  passwordHash String
  rol          Rol      @default(TECNICO)
  activo       Boolean  @default(true)
  createdAt    DateTime @default(now())

  ordenesRecibidas  Orden[]        @relation("Recepcion")
  ordenesEntregadas Orden[]        @relation("Entrega")
  diagnosticos      Diagnostico[]
}

model Cliente {
  id        String   @id @default(cuid())
  nombre    String
  telefono  String?
  email     String?
  documento String?  // campo libre opcional (ID local); NO es para facturación
  notas     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  ordenes Orden[]
}

model Orden {
  id        String   @id @default(cuid())
  folio     Int      @unique @default(autoincrement()) // número legible para el cliente

  cliente   Cliente  @relation(fields: [clienteId], references: [id])
  clienteId String

  // Datos del equipo
  tipoEquipo  String   // laptop, PC de escritorio, etc.
  marca       String?
  modelo      String?
  serie       String?
  accesorios  String?  // qué deja el cliente (cargador, mochila, etc.)

  // Recepción
  fallaReportada String
  estadoFisico   String?  // golpes, rayones, etc.
  notasRecepcion String?
  contrasenaEquipo String? // opcional, para poder probar el equipo

  // Tiempos
  fechaIngreso   DateTime @default(now())
  fechaPrometida DateTime?
  fechaEntrega   DateTime?

  // Flujo
  estado EstadoOrden @default(RECIBIDO)
  costo  Decimal?    @db.Decimal(12, 2) // monto cobrado; moneda viene de Ajustes

  // Entrega
  trabajoRealizado String?
  notasEntrega     String?

  recibidoPor   Usuario  @relation("Recepcion", fields: [recibidoPorId], references: [id])
  recibidoPorId String
  entregadoPor   Usuario? @relation("Entrega", fields: [entregadoPorId], references: [id])
  entregadoPorId String?

  diagnosticos Diagnostico[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Diagnostico {
  id      String @id @default(cuid())
  orden   Orden  @relation(fields: [ordenId], references: [id])
  ordenId String

  hallazgos        String
  solucionPropuesta String?
  costoEstimado    Decimal? @db.Decimal(12, 2)
  aprobado         Boolean? // null = pendiente, true = aprobado, false = rechazado

  tecnico   Usuario @relation(fields: [tecnicoId], references: [id])
  tecnicoId String

  createdAt DateTime @default(now())
}

// Singleton: una sola fila con la configuración del taller
model Ajustes {
  id          Int     @id @default(1)
  nombreTaller String
  moneda      String  @default("MXN") // código ISO 4217: MXN, ARS, COP, USD, etc.
  telefono    String?
  direccion   String?
  logoUrl     String?
}
```

### Notas del modelo
- **La moneda es global del taller**, vive en `Ajustes.moneda`. No se elige por orden.
  Todos los montos se muestran formateados con esa moneda (usar `Intl.NumberFormat`).
- **No hay RFC ni datos fiscales.** El cliente es solo información básica de contacto.
- `folio` es el número legible que se le da al cliente en la nota de recepción.

---

## 5. Máquina de estados de la Orden

Flujo normal:

```
RECIBIDO → EN_DIAGNOSTICO → PRESUPUESTADO → APROBADO → EN_REPARACION → LISTO → ENTREGADO
```

Ramas alternas:
- Desde `PRESUPUESTADO` el cliente puede rechazar → `NO_APROBADO` → (se entrega sin reparar) → `ENTREGADO`.
- Desde casi cualquier estado previo a la entrega se puede `CANCELADO`.

Reglas:
- Al pasar a `ENTREGADO` se debe registrar `fechaEntrega` y `entregadoPorId`.
- El control de tiempos compara `fechaPrometida` con la fecha actual (si no está
  entregada) o con `fechaEntrega`. Una orden está **atrasada** si hoy > `fechaPrometida`
  y el estado no es `ENTREGADO`/`CANCELADO`/`NO_APROBADO`.

---

## 6. Roles y permisos (simple)

- **ADMIN:** todo, incluyendo gestionar usuarios y editar Ajustes.
- **TECNICO:** registrar ingresos, crear/editar diagnósticos, mover estados, registrar
  entregas. No edita Ajustes ni gestiona usuarios.

No hace falta un sistema de permisos granular. Basta con estos dos roles.

---

## 7. Alcance de la v1

**Incluido:**
- CRUD de clientes (datos básicos).
- Registro de ingreso de equipos (orden + nota de recepción).
- Diagnósticos asociados a la orden.
- Máquina de estados + control de tiempos (alertas de atraso en el listado).
- Nota de entrega.
- **Comprobante de ingreso en PDF** (básico): datos del taller, folio, cliente, equipo,
  falla reportada, accesorios, fecha de ingreso y fecha prometida.
- Configuración del taller (Ajustes) y gestión de usuarios.

**Fuera de la v1 (no implementar todavía):**
- Inventario de refacciones.
- Facturación / documentos fiscales.
- Fotos del equipo / manejo de archivos subidos.
- Portal de cara al cliente / notificaciones por WhatsApp o correo.
- Multi-tenancy.

> Si una funcionalidad fuera de alcance "ayudaría", **no la agregues**. Anótala como
> idea futura en el CHANGELOG.

---

## 8. Convenciones de despliegue y arranque

- **Turnkey:** el primer arranque debe dejar el sistema usable sin pasos manuales en
  consola. Al iniciar, el contenedor debe:
  1. Ejecutar las migraciones pendientes (`prisma migrate deploy`).
  2. Ejecutar un **seed idempotente** que crea (si no existe) el usuario ADMIN con datos
     del `.env` y la fila singleton de `Ajustes`.
- **`.env.example`** documentado con todas las variables. Variables mínimas:
  - `DATABASE_URL`
  - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NOMBRE`
  - `TALLER_NOMBRE`, `TALLER_MONEDA`
  - `SESSION_SECRET`
- **Docker:** `Dockerfile` para la app + `docker-compose.yml` con `app` + `postgres`
  para correr en local en Windows con `docker compose up`.
- **EasyPanel:** usa el mismo `Dockerfile`; el Postgres puede ser el servicio
  administrado de EasyPanel. Solo se configuran variables de entorno.
- **Actualizaciones:** un colega actualiza con `git pull` + reconstruir; las migraciones
  corren solas. Documentar en el README. Avisar en el CHANGELOG cuando una versión traiga
  cambios de base de datos.
- **Respaldos:** responsabilidad de cada taller. Documentar en el README cómo respaldar
  el Postgres (incluyendo la opción de backups de EasyPanel).

---

## 9. Convenciones de código

- TypeScript estricto. Nada de `any` salvo casos justificados.
- El esquema de Prisma manda: si cambia el modelo, se crea una migración.
- Validación de entradas en el servidor (p. ej. con `zod`).
- Construir por **rebanadas verticales**: una funcionalidad completa de punta a punta
  (formulario → guardado → listado → detalle) antes de pasar a la siguiente.
- Estructura sugerida de carpetas (App Router):
  ```
  /app            rutas y páginas
  /app/api        endpoints si se necesitan
  /lib            db (prisma client), auth, utilidades (formato de moneda/fechas)
  /components     componentes de UI reutilizables
  /prisma         schema.prisma, migraciones, seed.ts
  /docker         Dockerfile, docker-compose.yml
  ```
- Textos de interfaz en español.

---

## 10. Licencia

Decidir antes de publicar: MIT si se quiere abierto, o privado por invitación si se quiere
controlar el acceso. (Pendiente de definir por el dueño del repo.)
