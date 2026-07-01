# Usuarios de prueba — TEA Link

**Actualizado:** Junio 2026 — verificar con `npx ts-node scripts/db-resumen.ts`  
**Documentos relacionados:** `EV3-PLAN-DE-PRUEBAS.md`, `EV3-RESULTADOS-PRUEBAS.md`, `EV3-PRUEBAS-AUTOMATIZADAS.md`, `INFORME-FINAL-TEA-LINK.md`

> Todas las credenciales de demo están documentadas abajo. Si se pierde una clave, ver *Gestión de contraseñas*.

---

## Gestión de contraseñas

| Quién resetea | A quién | Dónde en la app | Endpoint |
|---------------|---------|-----------------|----------|
| **SUPERADMIN** | Administradores institucionales | Panel superadmin → Usuarios → **Clave** | `POST /api/auth/superadmin/administrador/:id/reset-password` |
| **ADMINISTRADOR** | Equipo de su institución: **EDUCADOR** (colegio), **MEDICO** / **PROFESIONAL** (centro médico), **PROFESIONAL** (centro terapéutico) | Panel admin → **Equipo** → **Clave** | `POST /api/auth/usuario/:id/reset-password` |
| **ADMINISTRADOR** (al crear perfil) | Apoderado principal (**rol FAMILIA**) | Formulario de alta de perfil → email del tutor | Cuenta creada con contraseña temporal (primer login en `/cambiar-contrasena`) |

Los apoderados (**rol FAMILIA**) **no** pertenecen a una institución ni aparecen en **Equipo**; el administrador no les resetea la clave desde ahí.

En reset por superadmin o por **Equipo**, se genera una **contraseña temporal** en un modal; el usuario debe cambiarla en el próximo login (`/cambiar-contrasena`). La acción queda en auditoría administrativa. Al invitar apoderado en alta de perfil, la clave temporal se entrega en ese flujo de creación.

**Ejemplo:** `directoraaltavida@email.com` → Equipo → **Clave** en `eduardoaltavida@email.com` → compartir la clave temporal generada.

---

## Flujo familia (modelo vigente)

| Quién | Qué puede hacer |
|-------|-----------------|
| **Colegio / centro médico** | Crear perfiles de estudiantes e invitar al **apoderado principal** (email al crear el perfil). |
| **Apoderado principal** (`familia@…`, rol FAMILIA) | Aceptar consentimiento, ver bitácora (solo observaciones **públicas**), crear observaciones públicas e **invitar hasta 2 apoderados más** (máx. 3 por perfil). **No pertenece a una institución**; accede por vínculo en `perfil_usuario`. |
| **Apoderado adicional** | Debe confirmar su propio consentimiento por vínculo antes de acceder al perfil. |

**Demo con seed (`npm run db:seed`):** el perfil **Matías Pérez** pertenece al **Colegio AltaVida**; `familia@tealink.com` es apoderada principal vinculada desde el colegio.

---

## Resumen — 9 usuarios, 3 perfiles, 4 instituciones

### Instituciones

| ID | Nombre | Tipo |
|----|--------|------|
| 2 | Sistema TEA-LINK | SISTEMA |
| 12 | Centro Médico Integral Demo | CENTRO_MEDICO |
| 14 | Colegio AltaVida | CENTRO_EDUCACIONAL |
| 15 | Centro terapeutico | CENTRO_PROFESIONAL |

---

## Gestión (4 cuentas)

| Correo | Rol | Institución | Contraseña | Notas |
|--------|-----|-------------|------------|-------|
| cr.monsalveb@duocuc.cl | SUPERADMIN | Sistema TEA-LINK (#2) | `SuperAdmin123!` | Panel en `/superadmin`; registro perfiles en `/superadmin/perfiles` |
| admin.medico@tealink.com | ADMINISTRADOR | Centro Médico (#12) | `AdminMedico123!` | |
| directoraaltavida@email.com | ADMINISTRADOR | Colegio AltaVida (#14) | `Directora123!` | Crea perfiles e invita tutores |
| centroterapeutico@email.com | ADMINISTRADOR | Centro terapeutico (#15) | `Adminterapeutico123!` | |

---

## Operativos — con actividad en bitácora (4 cuentas)

| Correo | Rol | Institución empleador / vínculo | Perfil principal | Obs. creadas | Contraseña |
|--------|-----|--------------------------------|------------------|--------------|------------|
| familia@tealink.com | FAMILIA | Sin institución — apoderada por `perfil_usuario` | Matías Pérez — apoderada principal | 4 | `Familia123!` |
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

## Notas

- **9 usuarios** en total: 1 superadmin + 3 admins + 4 operativos.
- `familia@tealink.com` es apoderada principal de Matías Pérez vía `perfil_usuario` (sin institución propia).
- `eduardoaltavida@` pertenece a Colegio AltaVida (#14) y accede a Matías Pérez y Joaquín Sánchez vía `perfil_usuario`.
- Administradores **no** consultan bitácora.
- **Reset de clave:** superadmin → admins institucionales; admin → equipo (EDUCADOR / MEDICO / PROFESIONAL); apoderados → clave temporal al invitar en alta de perfil (ver *Gestión de contraseñas*).
- Verificar BD: `cd Producto/backend` → `npx ts-node scripts/db-resumen.ts`
- **Re-ejecutar `npm run db:seed`** borra datos de demo y vuelve a cargar la cohorte de este documento (no afecta catálogo MINEDUC/DEIS).
- **Tests automatizados de integración** usan otra cohorte (`@test-auto.tealink.cl`); ver `EV3-PRUEBAS-AUTOMATIZADAS.md` y `npm run test:seed` en backend.

---

*Documento de referencia para demo, pruebas e informe final.*
