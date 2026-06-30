# Evaluación 3 — Plan de pruebas y base de datos de pruebas

**Proyecto:** TEA Link  
**Fecha de actualización:** Junio 2026  
**Estado:** Alineado a BD depurada (11 usuarios, 3 perfiles, 11 observaciones)

---

## 1. Entorno de pruebas

| Ítem | Valor |
|------|--------|
| Motor de BD | PostgreSQL |
| ORM | Prisma |
| Backend | `http://localhost:3000` |
| Frontend | `http://localhost:5173` (o puerto alternativo si 5173 está ocupado) |
| Carpeta backend | `Producto/backend` |
| Carpeta frontend | `Producto/frontend` |

### Comandos útiles

```bash
# Terminal 1 — backend
cd Producto/backend
npm run dev

# Terminal 2 — frontend
cd Producto/frontend
npm run dev

# Resumen del estado actual de la BD (solo lectura)
cd Producto/backend
npx ts-node scripts/db-resumen.ts
```

> **Nota:** `npm run db:seed` recrea datos demo del seed original (incluye instituciones y usuarios que ya no existen en tu BD actual). **No ejecutar seed** si quieres conservar la configuración actual. Usar solo para reset completo si el docente lo autoriza.

---

## 2. Base de datos de pruebas (estado actual)

### 2.1 Instituciones (5)

| ID | Nombre | Tipo | Uso en pruebas |
|----|--------|------|----------------|
| 2 | Sistema TEA-LINK | SISTEMA | Superadmin del sistema |
| 11 | Familia Pérez Demo | FAMILIA | Escenario principal interdisciplinario |
| 12 | Centro Médico Integral Demo | CENTRO_MEDICO | Médico, profesional y perfil clínico |
| 14 | Colegio AltaVida | CENTRO_EDUCACIONAL | Caso educativo (Joaquín Sánchez) |
| 15 | Centro terapeutico | CENTRO_PROFESIONAL | Administración de centro profesional |

### 2.2 Usuarios (11)

| ID | Correo | Rol | Institución | Contraseña |
|----|--------|-----|-------------|------------|
| 1 | cr.monsalveb@duocuc.cl | SUPERADMIN | Sistema TEA-LINK (#2) | `SuperAdmin123!` |
| 14 | ~~admin.familia@tealink.com~~ | — | — | **Retirada** — FAMILIA sin panel admin |
| 15 | familia@tealink.com | FAMILIA | Familia Pérez Demo (#11) | `Familia123!` |
| 16 | admin.medico@tealink.com | ADMINISTRADOR | Centro Médico (#12) | `AdminMedico123!` |
| 17 | medico@tealink.com | MEDICO | Centro Médico (#12) | `Medico123!` |
| 18 | profesional@tealink.com | PROFESIONAL | Centro Médico (#12) | `Profesional123!` |
| 23 | educador1@email.com | EDUCADOR | Colegio AltaVida (#14), vinculado #5 | `Educador123!` |
| 24 | directoraaltavida@email.com | ADMINISTRADOR | Colegio AltaVida (#14) | `Directora123!` |
| 25 | eduardoaltavida@email.com | EDUCADOR | Colegio AltaVida (#14) | `Eduardo123!` |
| 26 | centroterapeutico@email.com | ADMINISTRADOR | Centro terapeutico (#15) | `Adminterapeutico123!` |
| 27 | karlataiss@email.com | EDUCADOR | Colegio AltaVida (#14) | `Karla123!` |

**Notas técnicas:**
- `educador1@email.com` pertenece a Colegio AltaVida (#14) y accede a Matías Pérez (#5) vía `perfil_usuario` (consulta bitácora; CP-10).
- Admin del centro terapéutico (#15): `centroterapeutico@email.com`.
- Eliminados de la BD de prueba: `profesional.ct@tealink.com`, perfil #9 vacío.

### 2.3 Perfiles / estudiantes (3)

| ID | Nombre | RUT | Institución custodia | Escenario de prueba |
|----|--------|-----|----------------------|---------------------|
| **5** | Matías Pérez | 11.111.111-1 | Colegio AltaVida (#14) | **Principal** — equipo interdisciplinario; familia como apoderada |
| 6 | Matías Pérez Clínico | 33.333.333-3 | Centro Médico (#12) | Médico + profesional del mismo centro |
| 8 | Joaquin Sanchez | — | Colegio AltaVida (#14) | Educadores Eduardo y Karla |

> En la demo usar **Matías Pérez (#5)** como escenario interdisciplinario principal.

### 2.4 Equipo vinculado (`perfil_usuario`)

**Perfil #5 — Matías Pérez**
- FAMILIA: `familia@tealink.com`
- MEDICO: `medico@tealink.com`
- PROFESIONAL: `profesional@tealink.com`
- EDUCADOR: `educador1@email.com`

**Perfil #6 — Matías Pérez Clínico**
- MEDICO: `medico@tealink.com`
- PROFESIONAL: `profesional@tealink.com`

**Perfil #8 — Joaquin Sanchez**
- EDUCADOR: `eduardoaltavida@email.com`
- EDUCADOR: `karlataiss@email.com`

### 2.5 Observaciones existentes (11)

| ID | Perfil | Privacidad | Título (resumen) | Autor |
|----|--------|------------|------------------|-------|
| 5 | #5 Matías Pérez | PUBLICA | mejora la comunicacion con personas | familia@tealink.com |
| 8 | #5 | PUBLICA | Desregulacion | familia@tealink.com |
| 12 | #5 | PUBLICA | Observacion de Prueva EV3 | familia@tealink.com |
| 15 | #5 | PUBLICA | nueva observacion de la familia | familia@tealink.com |
| 10 | #5 | PUBLICA | avance en motricidad | profesional@tealink.com |
| 13 | #5 | PRIVADA | Prueba de nota clinica Privada | medico@tealink.com |
| 14 | #5 | PUBLICA | observacion de prueba nro 2 | medico@tealink.com |
| 6 | #6 Matías Pérez Clínico | PUBLICA | Buen avance en la lectura de voz | profesional@tealink.com |
| 7 | #6 | MULTINIVEL | observacion medica | medico@tealink.com |
| 11 | #8 Joaquin Sanchez | PUBLICA | Avance motrices | eduardoaltavida@email.com |
| 16 | #8 | PUBLICA | Avance en lectura | karlataiss@email.com |

### 2.6 Niveles de privacidad (implementación vigente)

| Privacidad | FAMILIA | EDUCADOR | PROFESIONAL | MEDICO |
|------------|---------|----------|-------------|--------|
| PUBLICA | Sí | Sí | Sí | Sí |
| MULTINIVEL | No | No | Sí | Sí |
| PRIVADA | No | No | No | Sí |

Solo el rol **MEDICO** puede crear observaciones con privacidad PRIVADA o MULTINIVEL. Los demás roles crean observaciones PUBLICA por defecto.

---

## 3. Preparación obligatoria antes de ejecutar el plan

### 3.1 Verificar servicios

1. Backend y frontend en ejecución.
2. Login exitoso con al menos `familia@tealink.com` y `medico@tealink.com`.
3. (Opcional) Ejecutar `npx ts-node scripts/db-resumen.ts` y confirmar que coincide con las tablas de la sección 2.

### 3.2 Observación PRIVADA para CP-12

En la BD actual **ya existe** la observación **#13** (*Prueba de nota clinica Privada*, PRIVADA, `medico@tealink.com`, perfil #5). No es necesario crearla de nuevo antes de CP-12.

Si se resetea la BD, crear una observación PRIVADA del médico en Matías Pérez (#5) antes de ejecutar CP-12.

### 3.3 Datos ya disponibles (no requieren creación previa)

| Caso | Dato existente |
|------|----------------|
| CP-10, CP-11 | Observaciones PUBLICA en perfil #5 (IDs 5, 8, 10) |
| CP-13 (MULTINIVEL) | Observación #7 en perfil #6, o MULTINIVEL en #5 con el médico |

---

## 4. Plan de pruebas — casos de prueba (13)

**Total:** 13 casos (CP-01 a CP-13) · **13 capturas** (Captura-01 a Captura-13)  
**Leyenda de estado:** Pendiente / OK / Falla / Corregido / N/A  
**Evidencia:** número de captura (Ej.: Captura-01)

| ID | Módulo | Funcionalidad | Precondiciones | Pasos | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|----|--------|---------------|----------------|-------|-------------------|-------------------|--------|-----------|
| CP-01 | Auth | Login exitoso familia | Usuario `familia@tealink.com` activo | 1. Ir a `/login` 2. Ingresar correo y clave 3. Entrar | Redirección a `/dashboard` con panel familia | Redirección correcta | OK | Captura-01 |
| CP-02 | Auth | Login con credenciales inválidas | — | 1. Ingresar correo válido y clave incorrecta 2. Intentar entrar | Mensaje de error; no accede al sistema | Error mostrado | OK | Captura-02 |
| CP-03 | Auth | Cambio de contraseña inicial | Usuario con `must_change_password = true` (si aplica) | 1. Login 2. Completar formulario en `/cambiar-contrasena` | Acceso al panel tras cambiar clave | No aplica en BD actual | N/A | — |
| CP-04 | RBAC | Familia no accede a funciones de admin | Sesión `familia@tealink.com` | 1. Revisar panel disponible | Solo funciones de familia; sin gestión de usuarios | Panel limitado a rol familia | OK | Captura-03 |
| CP-05 | RBAC | Admin no consulta bitácora | Sesión `directoraaltavida@email.com` (admin colegio) | 1. Revisar panel administrador | Gestión de perfiles/equipo/colaboración; sin listado de observaciones | Sin bitácora en panel admin | OK | Captura-04 |
| CP-06 | Perfiles | Familia ve perfil vinculado | Login familia | 1. Abrir selector de perfil | Aparece **Matías Pérez** (#5) | Matías Pérez visible | OK | Captura-05 |
| CP-07 | Perfiles | Admin colegio crea perfil con RUT | Login `directoraaltavida@email.com` | 1. Crear perfil con RUT válido, diagnóstico y tutor 2. Guardar | Perfil visible en listado del colegio | Perfil creado | OK | Captura-06 |
| CP-08 | Observaciones | Familia crea observación pública | Perfil Matías Pérez (#5) seleccionado | 1. Nueva observación 2. Completar campos 3. Guardar | Aparece en bitácora como PUBLICA | Obs. PUBLICA guardada | OK | Captura-07 |
| CP-09 | Observaciones | Validación descripción corta | Formulario nueva observación | 1. Descripción &lt; 10 caracteres 2. Guardar | Error de validación; no se guarda | Validación rechazada | OK | Captura-08 |
| CP-10 | Equipo | Educador ve obs. pública de familia | Obs. en perfil #5; login `educador1@email.com` | 1. Seleccionar Matías Pérez 2. Abrir bitácora | Ve obs. PUBLICA de familia con autor visible | Educador ve obs. familia | OK | Captura-10 |
| CP-11 | Equipo | Médico ve obs. públicas del equipo | Equipo vinculado en perfil #5 | 1. Login `medico@tealink.com` 2. Matías Pérez 3. Bitácora | Ve obs. PUBLICA del equipo | Médico ve obs. del equipo | OK | Captura-11 |
| CP-12 | Privacidad | Familia NO ve nota PRIVADA del médico | Obs. PRIVADA en perfil #5 (sección 3.2) | 1. Login familia 2. Matías Pérez 3. Bitácora | La nota privada **no** aparece | Familia no ve PRIVADA | OK | Captura-12 |
| CP-13 | Privacidad | Profesional ve obs. MULTINIVEL | Obs. MULTINIVEL en perfil #6 o #5 | 1. Login `profesional@tealink.com` 2. Perfil con MULTINIVEL 3. Bitácora | Ve MULTINIVEL; no ve PRIVADAS | Profesional ve MULTINIVEL | OK | Captura-13 |

---

## 5. Orden de ejecución

1. CP-01 a CP-05 — Autenticación y roles  
2. CP-06 a CP-09 — Perfiles y creación de observaciones  
3. **Preparación 3.2** — Observación PRIVADA (evidencia Captura-09)  
4. CP-10 a CP-13 — Equipo interdisciplinario y privacidad  

Subir **Captura-01 … Captura-13** en `Documentacion/evidencias-ev3/`.

---

## 6. Resumen para el informe (párrafo listo)

> El plan de pruebas de la Evaluación 3 contempla **13 casos** (CP-01 a CP-13) con **13 capturas de evidencia**, cubriendo autenticación, RBAC, perfiles, observaciones, equipo interdisciplinario y privacidad (PUBLICA, MULTINIVEL, PRIVADA). La ejecución registró **12 casos OK** y **1 N/A** (CP-03). La base de datos de pruebas utiliza cinco instituciones, once usuarios y tres perfiles estudiante, con **Matías Pérez (#5)** como escenario principal. **Complemento:** **~218 tests automatizados** (Vitest + Supertest) — **~176 backend** + **42 frontend** — documentados en `EV3-PRUEBAS-AUTOMATIZADAS.md`.

---

## 7. Pruebas automatizadas (complemento al plan manual)

| Aspecto | Detalle |
|---------|---------|
| Documento | `EV3-PRUEBAS-AUTOMATIZADAS.md` |
| Herramientas | Vitest, Supertest, jsdom (frontend) |
| Total tests | **~218** (~176 backend + 42 frontend) |
| Cobertura CP vía API | 10/12 aplicables ≈ 83 % |
| BD integración | Datos `@test-auto.tealink.cl` (aislados de demo) |

---

## 8. Control de versiones del documento

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 1.0 | 28-05-2026 | Creación alineada a BD actual |
| 1.1 | Junio 2026 | Depuración: 11 usuarios, 3 perfiles, 11 observaciones |
| 1.2 | Junio 2026 | Plan reducido a 13 casos y 13 capturas (CP-01 a CP-13) |
| 1.3 | Junio 2026 | Suite automatizada ampliada (~218 tests); RUT, custodia, registro perfiles |
