# Usuarios de prueba — TEA Link

**Actualizado:** Junio 2026 (BD depurada — `npx ts-node scripts/db-resumen.ts`)  
**Documentos relacionados:** `EV3-PLAN-DE-PRUEBAS.md`, `EV3-RESULTADOS-PRUEBAS.md`, `INFORME-FINAL-TEA-LINK.md`

> Todas las credenciales de demo están documentadas abajo. Si se pierde una clave, ver *Gestión de contraseñas*.

---

## Gestión de contraseñas

| Quién resetea | A quién | Dónde en la app | Endpoint |
|---------------|---------|-----------------|----------|
| **SUPERADMIN** | Administradores institucionales | Panel superadmin → Usuarios → **Clave** | `POST /api/auth/superadmin/administrador/:id/reset-password` |
| **ADMINISTRADOR** | Usuarios operativos de su institución (FAMILIA, EDUCADOR, MEDICO, PROFESIONAL según tipo) | Panel admin → **Equipo** → **Clave** | `POST /api/auth/usuario/:id/reset-password` |

En ambos casos se genera una **contraseña temporal** mostrada en un modal; el usuario afectado debe cambiarla en el próximo login (`/cambiar-contrasena`). La acción queda registrada en auditoría administrativa.

**Ejemplo:** `directoraaltavida@email.com` → Equipo → **Clave** en `eduardoaltavida@email.com` → compartir la clave temporal generada.

---

## Resumen — 11 usuarios, 3 perfiles, 5 instituciones

### Instituciones

| ID | Nombre | Tipo |
|----|--------|------|
| 2 | Sistema TEA-LINK | SISTEMA |
| 11 | Familia Pérez Demo | FAMILIA |
| 12 | Centro Médico Integral Demo | CENTRO_MEDICO |
| 14 | Colegio AltaVida | CENTRO_EDUCACIONAL |
| 15 | Centro terapeutico | CENTRO_PROFESIONAL |

---

## Gestión (5 cuentas)

| Correo | Rol | Institución | Contraseña |
|--------|-----|-------------|------------|
| cr.monsalveb@duocuc.cl | SUPERADMIN | Sistema TEA-LINK (#2) | `SuperAdmin123!` |
| admin.familia@tealink.com | ADMINISTRADOR | Familia Pérez Demo (#11) | `AdminFamilia123!` |
| admin.medico@tealink.com | ADMINISTRADOR | Centro Médico (#12) | `AdminMedico123!` |
| directoraaltavida@email.com | ADMINISTRADOR | Colegio AltaVida (#14) | `Directora123!` |
| centroterapeutico@email.com | ADMINISTRADOR | Centro terapeutico (#15) | `Adminterapeutico123!` |

---

## Operativos — con actividad en bitácora (6 cuentas)

| Correo | Rol | Institución | Perfil principal | Obs. creadas | Contraseña |
|--------|-----|-------------|------------------|--------------|------------|
| familia@tealink.com | FAMILIA | Familia Pérez (#11) | Matías Pérez (#5) | 4 | `Familia123!` |
| medico@tealink.com | MEDICO | Centro Médico (#12) | Matías #5 y Clínico #6 | 3 | `Medico123!` |
| profesional@tealink.com | PROFESIONAL | Centro Médico (#12) | Matías #5 y Clínico #6 | 2 | `Profesional123!` |
| eduardoaltavida@email.com | EDUCADOR | Colegio AltaVida (#14) | Joaquín (#8) | 1 | `Eduardo123!` |
| karlataiss@email.com | EDUCADOR | Colegio AltaVida (#14) | Joaquín (#8) | 1 | `Karla123!` |
| educador1@email.com | EDUCADOR | Colegio AltaVida (#14) | Matías Pérez (#5) | 0 | `Educador123!` |

**Nota sobre `educador1@`:** educador de Colegio AltaVida, vinculado al equipo interdisciplinario de Matías Pérez (#5); consulta la bitácora (caso de prueba CP-10).

---

## Perfiles estudiante (3)

| ID | Nombre | Institución | Equipo vinculado | Observaciones |
|----|--------|-------------|------------------|---------------|
| **5** | Matías Pérez | Familia Pérez Demo | familia, medico, profesional, educador1 | 7 |
| 6 | Matías Pérez Clínico | Centro Médico | medico, profesional | 2 |
| 8 | Joaquin Sanchez | Colegio AltaVida | eduardoaltavida, karlataiss | 2 |

**Demo principal:** perfil **#5 Matías Pérez**.

---

## Depuración realizada (Junio 2026)

| Eliminado | Motivo |
|-----------|--------|
| `profesional.ct@tealink.com` | Sin institución, sin vínculos, sin observaciones |
| Perfil #9 *perfil de prueba EV3* | Perfil vacío de prueba CP-07 |

---

## Notas

- **11 usuarios** en total: 1 superadmin + 4 admins + 6 operativos.
- `educador1@` pertenece a Colegio AltaVida (#14) y accede a Matías Pérez (#5) vía `perfil_usuario`.
- Administradores **no** consultan bitácora.
- **Reset de clave:** superadmin → admins; admin institucional → equipo operativo (ver *Gestión de contraseñas*).
- Verificar BD: `cd Producto/backend` → `npx ts-node scripts/db-resumen.ts`
- **No ejecutar `npm run db:seed`** si deseas conservar esta configuración.

---

*Documento de referencia para demo, pruebas e informe final.*
