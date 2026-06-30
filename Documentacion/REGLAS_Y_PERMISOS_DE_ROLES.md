# Reglas y permisos de roles en TEA Link

**Actualizado:** Junio 2026  
**Alineado con:** `schema.prisma`, `perfilAccess.ts`, `perfilConsentimiento.ts`, `perfilCustodia.ts`, `apoderadoPerfil.ts`

---

## Roles del sistema

| Rol | Panel | Acceso a observaciones |
|-----|-------|------------------------|
| SUPERADMIN | Command center (`/superadmin`): dashboard, instituciones, **registro perfiles**, administradores, auditoría | No opera bitácora clínica/pedagógica |
| ADMINISTRADOR | Usuarios, perfiles y colaboración de **su institución** | **No** consulta bitácora |
| FAMILIA | Bitácora e informes (por perfil vinculado) | Solo PUBLICA |
| EDUCADOR | Bitácora e informes | Solo PUBLICA |
| PROFESIONAL | Bitácora e informes | PUBLICA + MULTINIVEL |
| MEDICO | Bitácora e informes | PUBLICA + MULTINIVEL + PRIVADA |

---

## Niveles de privacidad (`privacidad_observacion_enum`)

| Privacidad | Descripción |
|------------|-------------|
| **PUBLICA** | Visible para todos los roles operativos vinculados al perfil. |
| **MULTINIVEL** | Visible para PROFESIONAL y MÉDICO. |
| **PRIVADA** | Visible solo para MÉDICO. |

Solo el **MÉDICO** puede asignar MULTINIVEL o PRIVADA al crear/editar. Los demás roles generan observaciones **PUBLICA**.

---

## Matriz de visibilidad

| Privacidad | FAMILIA | EDUCADOR | PROFESIONAL | MEDICO |
|------------|---------|----------|-------------|--------|
| PUBLICA | Sí | Sí | Sí | Sí |
| MULTINIVEL | No | No | Sí | Sí |
| PRIVADA | No | No | No | Sí |

El filtrado se aplica en el **backend** (`privacidadVisibleParaRol` en `observacionController.ts`).

### Auditoría de observaciones sensibles

Cada acceso o cambio sobre observaciones **MULTINIVEL** o **PRIVADA** queda registrado en `auditoria_observacion` (tabla dedicada, separada de `auditoria_admin`):

| Evento | Acción registrada |
|--------|-------------------|
| Crear observación sensible | `CREAR_OBSERVACION_SENSIBLE` |
| Editar observación sensible | `EDITAR_OBSERVACION_SENSIBLE` |
| Eliminar observación sensible | `ELIMINAR_OBSERVACION_SENSIBLE` |
| Ver detalle MULTINIVEL / PRIVADA | `CONSULTAR_OBSERVACION_SENSIBLE` |
| Listar bitácora con sensibles visibles | `CONSULTAR_LISTA_SENSIBLE` |
| Crear / exportar reporte con sensibles | `CREAR_REPORTE_SENSIBLE` / `EXPORTAR_REPORTE_SENSIBLE` |

- **No** se auditan consultas que solo devuelven observaciones **PUBLICA** (p. ej. familia).
- El superadmin consulta ambas auditorías en `/superadmin/auditoria` (pestañas Administración / Observaciones sensibles).
- Los logs guardan metadatos (usuario, perfil, id observación, nivel, IP); **no** el texto clínico de la descripción.

---

## Perfiles estudiante — reglas de negocio

| Regla | Detalle |
|-------|---------|
| **RUT único** | Cada estudiante tiene un RUT único en TEA Link. Alta con validación chilena; duplicado → HTTP 409. |
| **Quién crea** | Solo administradores de **CENTRO_EDUCACIONAL** o **CENTRO_MEDICO**. |
| **Institución FAMILIA** | Contenedor del tutor; **sin panel admin** ni alta de perfiles. |
| **Consentimiento** | Obligatorio antes de operar plenamente; tutor (menor) o titular (mayor de edad). |
| **Apoderados** | Hasta **3** por perfil (1 principal + 2 adicionales); cada uno confirma consentimiento. |
| **Custodia** | Un perfil tiene una institución **dueña** (`institucion_id`). |
| **Colaboración** | Colegio ↔ centro médico/terapéutico vía `solicitudes_institucion_perfil`. |
| **Ceder custodia** | Si hay colaboración activa, el dueño **no puede eliminar**; debe ceder custodia a la otra institución creadora. |
| **Eliminar perfil** | Solo **SUPERADMIN** (registro perfiles → eliminar). Las instituciones no eliminan del registro. |

**API relevantes:**
- `POST /api/perfiles` — crear (admin colegio/médico; body incluye `rut`)
- `GET /api/perfiles/buscar-rut?rut=` — consulta duplicado (admin)
- `POST /api/perfiles/:id/ceder-custodia` — cesión de custodia
- `DELETE /api/perfiles/:id` — solo SUPERADMIN
- `GET /api/auth/superadmin/perfiles` — listado nacional (superadmin)

---

## Permisos por rol (detalle)

### SUPERADMIN
- CRUD de instituciones (excepto eliminar SISTEMA si aplica política local).
- Crear, editar, resetear contraseña y eliminar **administradores** institucionales.
- **Registro perfiles** (`/superadmin/perfiles`): consulta nacional por RUT, filtros (región, tipo custodia, institución, consentimiento) y eliminación excepcional.
- Panel ejecutivo: KPIs, distribución por rol, actividad reciente.
- Consultar **auditoría** de acciones administrativas y de **observaciones sensibles** (MULTINIVEL / PRIVADA).
- Listar reportes globales del sistema.

**API — reset admin:** `POST /api/auth/superadmin/administrador/:id/reset-password`

### ADMINISTRADOR (institucional)
- Crear usuarios operativos de **su institución** (según tipo).
- **Resetear contraseña** del equipo operativo (`POST /api/auth/usuario/:id/reset-password`).
- **Crear y editar** perfiles (solo si la institución es colegio o centro médico); **no eliminar**.
- Invitar otras instituciones y **ceder custodia** cuando corresponde.
- Asignar equipo a perfiles propios o en colaboración aceptada.
- **No** puede listar, crear ni editar observaciones.

**UI:** `AdminInstitucionDashboard.tsx`, `AdminEquipoSection.tsx`.

### MÉDICO / PROFESIONAL / EDUCADOR / FAMILIA
- Acceso a perfiles por institución o vínculo en `perfil_usuario`.
- Crear/editar/eliminar **solo sus propias** observaciones (salvo reglas de privacidad al crear).
- Familia: gestión de apoderados e invitaciones en panel familia (`ApoderadosFamiliaSection.tsx`).

---

## Acceso a perfiles (equipo interdisciplinario)

Un usuario operativo accede a un perfil si:

1. El perfil pertenece a **su institución**, o  
2. Está en **`perfil_usuario`** para ese perfil, o  
3. Su institución tiene **colaboración ACEPTADA** (admin ve perfiles compartidos).

Implementación: `Producto/backend/src/utils/perfilAccess.ts`.

---

## Observaciones — reglas de autoría

- Solo el **autor** puede editar o eliminar su observación.
- Rutas: `GET/PUT/DELETE /api/observaciones/:id`.

---

## Reportes

- Roles operativos crean reportes sobre perfiles con acceso.
- Formatos: **PDF** y **CSV**.
- Descarga: **creador** o **SUPERADMIN**.

---

## Referencias

| Tema | Archivo |
|------|---------|
| Usuarios demo | `Documentacion/usuarios_prueba.md` |
| Plan de pruebas | `Documentacion/EV3-PLAN-DE-PRUEBAS.md` |
| Modelo de datos | `Documentacion/INFORME-TECNICO-BASE-DATOS.md` |

---

*Documento de referencia para implementación, pruebas, demo e informe final.*
