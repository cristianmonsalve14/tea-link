# Evaluación 3 — Resultados de ejecución de pruebas

**Proyecto:** TEA Link  
**Fecha de ejecución:** 28 de mayo de 2026  
**Entorno:** Local — PostgreSQL, backend `localhost:3000`, frontend `localhost:5173`  
**Plan de referencia:** `EV3-PLAN-DE-PRUEBAS.md`

---

## Resumen de avance

| Métrica | Valor |
|---------|-------|
| Casos planificados | 13 (CP-01 a CP-13) |
| Ejecutados OK | 12 |
| No aplica / saltado | 1 (CP-03) |
| Capturas | 13 (Captura-01 a Captura-13) |
| Estado del plan | **Completo** |

---

## Catálogo de evidencias (capturas)

| Captura | Caso / uso | Descripción breve |
|---------|------------|-------------------|
| Captura-01 | CP-01 | Login exitoso familia → Panel de Familia en `/dashboard` |
| Captura-02 | CP-02 | Mensaje de error con credenciales inválidas |
| Captura-03 | CP-04 | Panel familia sin funciones de administrador |
| Captura-04 | CP-05 | Panel admin familia sin bitácora de observaciones |
| Captura-05 | CP-06 | Selector de perfil con Matías Pérez |
| Captura-06 | CP-07 | Perfil estudiante creado por admin en listado |
| Captura-07 | CP-08 | Observación pública creada en bitácora |
| Captura-08 | CP-09 | Error de validación por descripción corta |
| Captura-09 | Preparación 3.2 | Observación PRIVADA del médico en perfil #5 |
| Captura-10 | CP-10 | Educador ve observaciones públicas de familia |
| Captura-11 | CP-11 | Médico ve observaciones del equipo en bitácora |
| Captura-12 | CP-12 | Familia no ve la nota privada del médico |
| Captura-13 | CP-13 | Profesional ve observación MULTINIVEL |

> Archivos de imagen en `Documentacion/evidencias-ev3/` — ver `README.md` de esa carpeta.

---

## Tabla de resultados

**Leyenda estado:** OK · Falla · Corregido · N/A

| ID | Módulo | Funcionalidad | Resultado obtenido | Estado | Evidencia |
|----|--------|---------------|-------------------|--------|-----------|
| CP-01 | Auth | Login exitoso familia | Redirección a `/dashboard` con Panel de Familia e institución Familia Pérez Demo | OK | Captura-01 |
| CP-02 | Auth | Login credenciales inválidas | Mensaje de error; no se accede al sistema | OK | Captura-02 |
| CP-03 | Auth | Cambio contraseña inicial | No ejecutado: usuario de prueba sin cambio obligatorio de contraseña | N/A | — |
| CP-04 | RBAC | Familia sin funciones admin | Panel limitado a perfiles, bitácora e informes; sin gestión de usuarios ni instituciones | OK | Captura-03 |
| CP-05 | RBAC | Admin sin bitácora | Panel admin con gestión de perfiles/equipo; sin listado de observaciones | OK | Captura-04 |
| CP-06 | Perfiles | Familia ve perfil vinculado | Selector muestra Matías Pérez (#5) | OK | Captura-05 |
| CP-07 | Perfiles | Admin crea perfil | Perfil estudiante de prueba creado y visible en listado de Familia Pérez Demo | OK | Captura-06 |
| CP-08 | Observaciones | Familia crea obs. pública | Observación guardada y visible en bitácora como PUBLICA | OK | Captura-07 |
| CP-09 | Observaciones | Validación descripción corta | El sistema rechaza descripción &lt; 10 caracteres; no se guarda | OK | Captura-08 |
| CP-10 | Equipo | Educador ve obs. familia | educador1 ve observaciones PUBLICA de familia en Matías Pérez con autor visible | OK | Captura-10 |
| CP-11 | Equipo | Médico ve obs. del equipo | Médico ve observaciones PUBLICA de familia, educador y profesional en perfil #5 | OK | Captura-11 |
| CP-12 | Privacidad | Familia no ve PRIVADA | Familia no visualiza la nota clínica privada del médico en bitácora | OK | Captura-12 |
| CP-13 | Privacidad | Profesional ve MULTINIVEL | Profesional visualiza obs. MULTINIVEL; no visualiza PRIVADAS del médico | OK | Captura-13 |

---

## Tabla ampliada (detalle para informe)

Copiar al Word del informe si se requiere columnas completas de pasos y resultado esperado.

| ID | Precondiciones | Pasos ejecutados | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|----|----------------|------------------|-------------------|-------------------|--------|-----------|
| CP-01 | Usuario `familia@tealink.com` activo | Login en `/login` con credenciales válidas | Redirección a panel familia | Cumple | OK | Captura-01 |
| CP-02 | — | Login con clave incorrecta | Error; sin acceso | Cumple | OK | Captura-02 |
| CP-03 | Usuario con cambio obligatorio | — | Cambio de clave y acceso | No aplica en BD actual | N/A | — |
| CP-04 | Sesión familia | Revisión del panel | Solo funciones de rol familia | Cumple | OK | Captura-03 |
| CP-05 | Sesión `admin.familia@tealink.com` | Revisión del panel admin | Sin bitácora de observaciones | Cumple | OK | Captura-04 |
| CP-06 | Login familia | Abrir selector de perfil | Aparece Matías Pérez | Cumple | OK | Captura-05 |
| CP-07 | Login admin familia | Crear perfil estudiante | Perfil en listado institución | Cumple | OK | Captura-06 |
| CP-08 | Perfil Matías Pérez seleccionado | Nueva observación completa | Obs. PUBLICA en bitácora | Cumple | OK | Captura-07 |
| CP-09 | Formulario nueva obs. | Descripción &lt; 10 caracteres | Error de validación | Cumple | OK | Captura-08 |
| CP-10 | Obs. familia en perfil #5 | Login educador1 + bitácora | Ve obs. PUBLICA de familia | Cumple | OK | Captura-10 |
| CP-11 | Equipo vinculado perfil #5 | Login médico + bitácora | Ve obs. PUBLICA del equipo | Cumple | OK | Captura-11 |
| CP-12 | Obs. PRIVADA médico en #5 | Login familia + bitácora | No ve nota privada | Cumple | OK | Captura-12 |
| CP-13 | Obs. MULTINIVEL disponible | Login profesional + bitácora | Ve MULTINIVEL; no PRIVADA | Cumple | OK | Captura-13 |

---

*Plan de 13 casos completado. Evidencias en `Documentacion/evidencias-ev3/` (Captura-01 a Captura-13).*
