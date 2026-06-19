# Reglas y permisos de roles en TEA Link

**Actualizado:** Junio 2026  
**Alineado con:** `Producto/backend/prisma/schema.prisma`, `observacionController.ts`, `perfilAccess.ts`

---

## Roles del sistema

| Rol | Panel | Acceso a observaciones |
|-----|-------|------------------------|
| SUPERADMIN | Gestión global (instituciones, admins, auditoría, reportes) | No opera bitácora clínica/pedagógica |
| ADMINISTRADOR | Usuarios y perfiles de su institución | **No** consulta bitácora |
| FAMILIA | Bitácora e informes | Solo PUBLICA |
| EDUCADOR | Bitácora e informes | Solo PUBLICA |
| PROFESIONAL | Bitácora e informes | PUBLICA + MULTINIVEL |
| MEDICO | Bitácora e informes | PUBLICA + MULTINIVEL + PRIVADA |

---

## Niveles de privacidad (`privacidad_observacion_enum`)

| Privacidad | Descripción |
|------------|-------------|
| **PUBLICA** | Visible para todos los roles operativos. |
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

El filtrado se aplica en el **backend** al listar observaciones (`privacidadVisibleParaRol` en `observacionController.ts`).

---

## Permisos por rol (detalle)

### SUPERADMIN
- CRUD de instituciones (excepto eliminar Sistema TEA-LINK si aplica política local).
- Crear, editar, resetear contraseña y eliminar administradores institucionales.

**API — reset de contraseña admin:** `POST /api/auth/superadmin/administrador/:id/reset-password`. Auditoría: `RESETEAR_PASSWORD_ADMIN`.
- Consultar auditoría de acciones administrativas.
- Listar reportes globales del sistema.

### ADMINISTRADOR (institucional)
- Crear, editar y eliminar usuarios de **su institución** (roles permitidos según tipo de institución).
- **Resetear contraseña** de usuarios operativos de su institución (educadores, médicos, profesionales, familia): genera clave temporal y obliga cambio en el próximo ingreso (`must_change_password`).
- Crear, editar y eliminar perfiles estudiante de su institución.
- Vincular miembros del equipo a perfiles: `POST /api/perfiles/:id/vincular-equipo`.
- **No** puede listar, crear ni editar observaciones.

**API — reset de contraseña operativo:** `POST /api/auth/usuario/:id/reset-password` (solo ADMINISTRADOR; usuario debe pertenecer a su institución y rol permitido). Auditoría: `RESETEAR_PASSWORD_USUARIO`.

**UI:** panel institucional → sección **Equipo** → botón **Clave** por usuario (`AdminEquipoSection.tsx`).

### MÉDICO
- Accede a perfiles de su institución o vinculados en `perfil_usuario`.
- Crea observaciones con cualquier privacidad.
- Edita y elimina **solo sus propias** observaciones.

### PROFESIONAL
- Accede a perfiles por institución o vínculo de equipo.
- Ve PUBLICA y MULTINIVEL.
- Crea observaciones PUBLICA; edita/elimina solo las propias.
- Puede generar reportes PDF/CSV sobre perfiles con acceso.

### EDUCADOR
- Accede a perfiles por institución o vínculo de equipo.
- Ve solo PUBLICA; crea PUBLICA; edita/elimina solo las propias.

### FAMILIA
- Accede a perfiles de su institución o vinculados.
- Ve solo PUBLICA; crea PUBLICA; edita/elimina solo las propias.

---

## Acceso a perfiles (equipo interdisciplinario)

Un usuario operativo (FAMILIA, EDUCADOR, PROFESIONAL, MEDICO) accede a un perfil si:

1. El perfil pertenece a **su institución**, o  
2. Está registrado en **`perfil_usuario`** para ese perfil.

Ejemplo validado en pruebas: **Matías Pérez (#5)** — familia, educador, profesional y médico de distintas instituciones colaboran en la misma bitácora según privacidad.

Implementación: `Producto/backend/src/utils/perfilAccess.ts`.

---

## Observaciones — reglas de autoría

- Solo el **autor** puede editar o eliminar su observación.
- Rutas: `GET/PUT/DELETE /api/observaciones/:id`, frontend `/observaciones/:id/editar`.
- Validación de campos con **Zod** en backend y frontend.

---

## Reportes

- Roles operativos pueden crear reportes sobre perfiles a los que tienen acceso.
- Formatos: **PDF** (pdfkit) y **CSV** (etiquetado Excel en UI).
- Solo el **creador** o **SUPERADMIN** descargan un reporte dado.

---

## Ejemplo API — observación privada (médico)

```json
{
  "titulo": "Nota clínica privada evaluación",
  "descripcion": "Evaluación reservada solo para equipo médico.",
  "categoria": "CLINICO",
  "fecha_evento": "2026-06-01T10:00:00.000Z",
  "perfil_id": 5,
  "privacidad": "PRIVADA"
}
```

---

## Referencias

| Tema | Archivo |
|------|---------|
| Usuarios demo | `Documentacion/usuarios_prueba.md` |
| Plan de pruebas | `Documentacion/EV3-PLAN-DE-PRUEBAS.md` |
| Resultados CP-12, CP-13 | `Documentacion/EV3-RESULTADOS-PRUEBAS.md` |

---

*Documento de referencia para implementación, pruebas, demo e informe final.*
