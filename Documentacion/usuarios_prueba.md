# Usuarios de prueba — TEA Link

**Actualizado:** Junio 2026 (BD depurada — `npx ts-node scripts/db-resumen.ts`)  
**Documentos relacionados:** `EV3-PLAN-DE-PRUEBAS.md`, `EV3-RESULTADOS-PRUEBAS.md`, `EV3-PRUEBAS-AUTOMATIZADAS.md`, `INFORME-FINAL-TEA-LINK.md`

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

## Flujo familia (modelo vigente)

| Quién | Qué puede hacer |
|-------|-----------------|
| **Colegio / centro médico** | Crear perfiles de estudiantes e invitar al **apoderado principal** (email al crear el perfil). |
| **Apoderado principal** (`familia@…`, rol FAMILIA) | Aceptar consentimiento, ver bitácora (solo observaciones **públicas**), crear observaciones públicas e **invitar hasta 2 apoderados más** (máx. 3 por perfil). |
| **Apoderado adicional** | Debe confirmar su propio consentimiento por vínculo antes de acceder al perfil. |
| **Institución tipo FAMILIA** | Contenedor técnico del tutor; **no** tiene panel de administrador ni crea perfiles. |

> La cuenta `admin.familia@tealink.com` quedó **obsoleta** en el seed demo: no debe usarse. Si aún existe en una BD antigua, el login mostrará un aviso de que no hay panel admin para instituciones familia.

**Demo con seed (`npm run db:seed`):** el perfil **Matías Pérez** pertenece al **Colegio AltaVida**; `familia@tealink.com` es apoderada principal vinculada desde el colegio.

---

## Resumen — 9 usuarios, 3 perfiles, 5 instituciones

### Instituciones

| ID | Nombre | Tipo |
|----|--------|------|
| 2 | Sistema TEA-LINK | SISTEMA |
| 11 | Familia Pérez Demo | FAMILIA |
| 12 | Centro Médico Integral Demo | CENTRO_MEDICO |
| 14 | Colegio AltaVida | CENTRO_EDUCACIONAL |
| 15 | Centro terapeutico | CENTRO_PROFESIONAL |

---

## Gestión (4–5 cuentas)

| Correo | Rol | Institución | Contraseña | Notas |
|--------|-----|-------------|------------|-------|
| cr.monsalveb@duocuc.cl | SUPERADMIN | Sistema TEA-LINK (#2) | `SuperAdmin123!` | Panel en `/superadmin`; registro perfiles en `/superadmin/perfiles` |
| admin.medico@tealink.com | ADMINISTRADOR | Centro Médico (#12) | `AdminMedico123!` | |
| directoraaltavida@email.com | ADMINISTRADOR | Colegio AltaVida (#14) | `Directora123!` | Crea perfiles e invita tutores |
| centroterapeutico@email.com | ADMINISTRADOR | Centro terapeutico (#15) | `Adminterapeutico123!` | |

~~`admin.familia@tealink.com`~~ — **retirada** (instituciones FAMILIA sin panel admin).

---

## Operativos — con actividad en bitácora (4 cuentas)

| Correo | Rol | Institución | Perfil principal | Obs. creadas | Contraseña |
|--------|-----|-------------|------------------|--------------|------------|
| familia@tealink.com | FAMILIA | Familia Pérez (#11) | Matías Pérez — apoderada principal | 4 | `Familia123!` |
| medico@tealink.com | MEDICO | Centro Médico (#12) | Matías y Clínico | 3 | `Medico123!` |
| profesional@tealink.com | PROFESIONAL | Centro Médico (#12) | Matías y Clínico | 2 | `Profesional123!` |
| eduardoaltavida@email.com | EDUCADOR | Colegio AltaVida (#14) | Matías y Joaquín | 1 | `Eduardo123!` |

**Nota sobre `eduardoaltavida@`:** educador de Colegio AltaVida, vinculado al equipo de **Matías Pérez** y al perfil **Joaquín Sánchez**; puede consultar la bitácora (caso de prueba CP-10 con Matías).

---

## Perfiles estudiante (3)

Cada perfil tiene un **RUT único** en TEA Link (registro de perfiles). Al crear uno nuevo, el formulario lo exige; si el RUT ya existe, el sistema rechaza el alta duplicada.

| ID | Nombre | RUT (demo seed) | Institución | Equipo vinculado | Observaciones |
|----|--------|-----------------|-------------|------------------|---------------|
| **5** | Matías Pérez | 11.111.111-1 | Colegio AltaVida (custodia) | familia (principal), medico, profesional, eduardoaltavida | 7 |
| 6 | Matías Pérez Clínico | 33.333.333-3 | Centro Médico | medico, profesional | 2 |
| 8 | Joaquin Sanchez | 22.222.222-2 | Colegio AltaVida | eduardoaltavida | 1 |

**Demo principal:** perfil **#5 Matías Pérez**.

---

## Depuración realizada (Junio 2026)

| Eliminado | Motivo |
|-----------|--------|
| `profesional.ct@tealink.com` | Sin institución, sin vínculos, sin observaciones |
| Perfil #9 *perfil de prueba EV3* | Perfil vacío de prueba CP-07 |
| `educador1@email.com` | Retirado de la cohorte demo (Jun 2026) |
| `karlataiss@email.com` | Retirado de la cohorte demo (Jun 2026) |

---

## Notas

- **9 usuarios** en total: 1 superadmin + 3 admins + 4 operativos.
- `eduardoaltavida@` pertenece a Colegio AltaVida (#14) y accede a Matías Pérez y Joaquín Sánchez vía `perfil_usuario`.
- Administradores **no** consultan bitácora.
- **Reset de clave:** superadmin → admins; admin institucional → equipo operativo (ver *Gestión de contraseñas*).
- Verificar BD: `cd Producto/backend` → `npx ts-node scripts/db-resumen.ts`
- **Re-ejecutar `npm run db:seed`** borra datos de demo y vuelve a cargar la cohorte de este documento (no afecta catálogo MINEDUC/DEIS).
- **Tests automatizados de integración** usan otra cohorte (`@test-auto.tealink.cl`); ver `EV3-PRUEBAS-AUTOMATIZADAS.md` y `npm run test:seed` en backend.

---

*Documento de referencia para demo, pruebas e informe final.*
