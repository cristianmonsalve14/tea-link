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
| 14 | admin.familia@tealink.com | ADMINISTRADOR | Familia Pérez Demo (#11) | `AdminFamilia123!` |
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

| ID | Nombre | Institución | Escenario de prueba |
|----|--------|-------------|---------------------|
| **5** | Matías Pérez | Familia Pérez Demo (#11) | **Principal** — equipo interdisciplinario |
| 6 | Matías Pérez Clínico | Centro Médico (#12) | Médico + profesional del mismo centro |
| 8 | Joaquin Sanchez | Colegio AltaVida (#14) | Educadores Eduardo y Karla |

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
| CP-10, CP-11, CP-17–19 | Observaciones PUBLICA en perfil #5 (IDs 5, 8, 10) |
| CP-13 (MULTINIVEL) | Observación #7 en perfil #6, o crear MULTINIVEL en #5 con el médico |
| CP-27 (AltaVida) | Perfil #8 y observación #11 |
| CP-28 (reset clave) | `eduardoaltavida@email.com` en equipo de AltaVida; login `directoraaltavida@email.com` |

---

## 4. Plan de pruebas — casos de prueba

**Leyenda de estado:** Pendiente / OK / Falla / Corregido  
**Evidencia:** número de captura o anexo (Ej.: Captura-01)

| ID | Módulo | Funcionalidad | Precondiciones | Pasos | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|----|--------|---------------|----------------|-------|-------------------|-------------------|--------|-----------|
| CP-01 | Auth | Login exitoso familia | Usuario `familia@tealink.com` activo | 1. Ir a `/login` 2. Ingresar correo y clave 3. Entrar | Redirección a `/dashboard` con panel familia | | Pendiente | |
| CP-02 | Auth | Login con credenciales inválidas | — | 1. Ingresar correo válido y clave incorrecta 2. Intentar entrar | Mensaje de error; no accede al sistema | | Pendiente | |
| CP-03 | Auth | Cambio de contraseña inicial | Usuario con `must_change_password = true` (si aplica) | 1. Login 2. Completar formulario en `/cambiar-contrasena` | Acceso al panel tras cambiar clave | | Pendiente | |
| CP-04 | RBAC | Familia no accede a funciones de admin | Sesión `familia@tealink.com` | 1. Revisar panel disponible | Solo funciones de familia (perfiles, bitácora, reportes); sin gestión de usuarios institución | | Pendiente | |
| CP-05 | RBAC | Admin no consulta bitácora | Sesión `admin.familia@tealink.com` | 1. Revisar panel administrador | Gestión de perfiles/equipo/usuarios; sin listado de observaciones | | Pendiente | |
| CP-06 | Perfiles | Familia ve perfil vinculado | Login familia | 1. Abrir selector de perfil | Aparece **Matías Pérez** (#5) | | Pendiente | |
| CP-07 | Perfiles | Admin crea perfil en su institución | Login `admin.familia@tealink.com` | 1. Crear nuevo perfil estudiante 2. Guardar | Perfil visible en listado de Familia Pérez Demo | | Pendiente | |
| CP-08 | Observaciones | Familia crea observación pública | Perfil Matías Pérez (#5) seleccionado | 1. Nueva observación 2. Completar campos obligatorios 3. Guardar | Mensaje de éxito; aparece en bitácora como PUBLICA | | Pendiente | |
| CP-09 | Observaciones | Validación descripción corta | Formulario nueva observación | 1. Descripción con menos de 10 caracteres 2. Guardar | Error de validación; no se guarda | | Pendiente | |
| CP-10 | Equipo | Educador ve obs. pública de familia | Obs. #5 o #8 en perfil #5; login `educador1@email.com` | 1. Seleccionar Matías Pérez 2. Abrir bitácora | Ve observaciones PUBLICA de familia con rol autor visible | | Pendiente | |
| CP-11 | Equipo | Médico ve obs. públicas del equipo | Equipo vinculado en perfil #5 | 1. Login `medico@tealink.com` 2. Matías Pérez 3. Bitácora | Ve obs. PUBLICA de familia, educador y profesional | | Pendiente | |
| CP-12 | Privacidad | Familia NO ve nota PRIVADA del médico | **Obs. PRIVADA creada en sección 3.2** en perfil #5 | 1. Login `familia@tealink.com` 2. Matías Pérez 3. Bitácora | La nota privada del médico **no** aparece | | Pendiente | |
| CP-13 | Privacidad | Profesional ve obs. MULTINIVEL | Obs. #7 en perfil #6, o MULTINIVEL en #5 | 1. Login `profesional@tealink.com` 2. Perfil con obs. MULTINIVEL 3. Bitácora | Ve MULTINIVEL; no ve PRIVADAS del médico | | Pendiente | |
| CP-14 | Observaciones | Editar observación propia | Obs. creada por el usuario logueado | 1. Ir a `/observaciones/:id/editar` 2. Modificar título 3. Guardar | Cambios guardados; mismo registro (no duplica) | | Pendiente | |
| CP-15 | Observaciones | No editar obs. de otro autor | Obs. de otro usuario en bitácora | 1. Buscar observación ajena | Sin botones Editar/Eliminar para esa obs. | | Pendiente | |
| CP-16 | Observaciones | Eliminar observación propia | Obs. propia recién creada (CP-08) | 1. Eliminar 2. Confirmar | Desaparece de la bitácora | | Pendiente | |
| CP-17 | Bitácora UI | Filtro por rol | Varias obs. en perfil #5 | 1. Aplicar filtro “Familia” | Solo observaciones cuyo autor es familia | | Pendiente | |
| CP-18 | Bitácora UI | Búsqueda por texto | Obs. con título conocido (ej. “Desregulacion”) | 1. Buscar en campo de búsqueda | Lista filtrada correctamente | | Pendiente | |
| CP-19 | Bitácora UI | Vista por rol vs cronológica | Bitácora con obs. de varios roles en #5 | 1. Alternar vista “Por rol” / “Cronológico” | Ambas vistas muestran datos coherentes | | Pendiente | |
| CP-20 | Reportes | Profesional genera informe | Perfil #5; obs. seleccionadas | 1. Pestaña Reportes 2. Título y fechas 3. Marcar obs. 4. Crear | Informe creado en “Mis reportes” | | Pendiente | |
| CP-21 | Reportes | Descargar PDF | Informe de CP-20 | 1. Descargar PDF | Archivo PDF válido y legible | | Pendiente | |
| CP-22 | Reportes | Ver detalle del informe | Informe existente | 1. Botón Ver | Muestra observaciones incluidas y período | | Pendiente | |
| CP-23 | Admin | Registrar usuario en institución | Login `directoraaltavida@email.com` o `centroterapeutico@email.com` | 1. Equipo → nuevo usuario 2. Completar y guardar | Usuario creado en la institución del admin; modal con contraseña temporal | | Pendiente | |
| CP-28 | Admin | Resetear contraseña de usuario del equipo | Login `directoraaltavida@email.com`; `eduardoaltavida@email.com` en el listado | 1. Equipo → botón **Clave** en el usuario 2. Confirmar 3. Copiar clave del modal | Nueva contraseña temporal; usuario con `must_change_password`; acción en auditoría | | Pendiente | |
| CP-24 | Seguridad | API sin token | Postman o navegador | 1. `GET /api/observaciones` sin header Authorization | Respuesta 401 | | Pendiente | |
| CP-25 | Seguridad | Rol incorrecto en endpoint admin | Token de `familia@tealink.com` | 1. Llamar endpoint reservado a administrador | Respuesta 403 | | Pendiente | |
| CP-26 | Superadmin | Listar instituciones | Login `cr.monsalveb@duocuc.cl` | 1. Panel superadmin | Listado con las 5 instituciones actuales | | Pendiente | |
| CP-27 | AltaVida | Educador accede a su perfil | Login `eduardoaltavida@email.com` | 1. Panel 2. Perfil Joaquin Sanchez (#8) | Acceso a bitácora; ve obs. #11 | | Pendiente | |

**Total:** 28 casos de prueba (CP-01 a CP-27 + CP-28).

---

## 5. Orden sugerido de ejecución

1. CP-01 a CP-05 — Autenticación y roles  
2. CP-06 a CP-09 — Perfiles y creación de observaciones  
3. **Preparación 3.2** — Crear observación PRIVADA (médico)  
4. CP-10 a CP-13 — Equipo interdisciplinario y privacidad  
5. CP-14 a CP-19 — Edición, eliminación y UI de bitácora  
6. CP-20 a CP-22 — Reportes  
7. CP-23 y CP-28 — Administración (alta y reset de usuarios)  
8. CP-24 a CP-26 — Seguridad y superadmin  
9. CP-27 — Caso Colegio AltaVida  

---

## 6. Resumen para el informe (párrafo listo)

> El plan de pruebas de la Evaluación 3 contempla 28 casos distribuidos en autenticación, control de acceso por roles (RBAC), gestión de perfiles, observaciones colaborativas con niveles de privacidad (PUBLICA, MULTINIVEL, PRIVADA), interfaz de bitácora, generación de reportes PDF, administración de usuarios (incluido reset de contraseña por admin institucional) y pruebas de seguridad en la API. La base de datos de pruebas utiliza cinco instituciones (Sistema TEA-LINK, Familia Pérez Demo, Centro Médico Integral Demo, Colegio AltaVida y Centro terapeutico), once usuarios y tres perfiles estudiante, con el perfil **Matías Pérez (#5)** como escenario interdisciplinario principal. Antes de las pruebas de privacidad se preparó una observación PRIVADA del médico en dicho perfil, dado que no existía en el estado inicial de la base de datos. La ejecución se realiza en entorno local con PostgreSQL, backend Node.js/Express y frontend React.

---

## 7. Control de versiones del documento

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 1.0 | 28-05-2026 | Creación alineada a BD actual |
| 1.1 | Junio 2026 | Depuración: 11 usuarios, 3 perfiles, 11 observaciones; eliminados profesional.ct y perfil #9 |
| 1.2 | Junio 2026 | CP-28: reset de contraseña por administrador institucional (Equipo → Clave) |
