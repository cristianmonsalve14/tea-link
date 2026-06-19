# INFORME FINAL — PROYECTO TEA LINK

## Sistema Web de Comunicación y Seguimiento Colaborativo para Personas con TEA

---

| Campo | Detalle |
|-------|---------|
| **Institución** | DuocUC |
| **Carrera** | Ingeniería en Informática |
| **Asignatura** | Taller de Programación / TPY1101 |
| **Integrante** | Cristian Monsalve Budrovich |
| **RUT** | 12.622.852-k |
| **Correo** | cr.monsalveb@duocuc.cl |
| **Repositorio** | https://github.com/cristianmonsalve14/tea-link |
| **Fecha del informe** | Junio 2026 |
| **Versión** | 1.0 — Informe final de entrega |

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Introducción](#2-introducción)
3. [Integración Evaluación 1 — Planificación y diseño](#3-integración-evaluación-1--planificación-y-diseño)
4. [Integración Evaluación 2 — Desarrollo del MVP](#4-integración-evaluación-2--desarrollo-del-mvp)
5. [Estado del producto — Evaluación 3 y cierre](#5-estado-del-producto--evaluación-3-y-cierre)
6. [IL3.1 — Plan de pruebas y base de datos de pruebas](#6-il31--plan-de-pruebas-y-base-de-datos-de-pruebas)
7. [IL3.1 — Ejecución de pruebas y resultados](#7-il31--ejecución-de-pruebas-y-resultados)
8. [IL3.1 — Evidencias](#8-il31--evidencias)
9. [IL3.2 — Mejoras implementadas tras validación](#9-il32--mejoras-implementadas-tras-validación)
10. [Evaluación final — Cierre del semestre](#10-evaluación-final--cierre-del-semestre)
11. [Conclusiones generales](#11-conclusiones-generales)
12. [Trabajo futuro](#12-trabajo-futuro)
13. [Anexos y documentos de referencia](#13-anexos-y-documentos-de-referencia)

---

## 1. Resumen ejecutivo

TEA Link es una aplicación web full-stack que centraliza la comunicación y el seguimiento colaborativo de personas con Trastorno del Espectro Autista (TEA), conectando familias, educadores, profesionales de apoyo y médicos mediante control de acceso por roles (RBAC), gestión multi-institucional y niveles de privacidad en las observaciones.

El proyecto recorre tres evaluaciones parciales más la entrega final:

| Evaluación | Enfoque | Estado |
|------------|---------|--------|
| EV1 | Planificación, arquitectura, diseño BD y UI/UX | Completada |
| EV2 | MVP: auth, usuarios, perfiles, observaciones | Completada |
| EV3 | Sistema integrado, pruebas, mejoras post-validación | Completada |
| **Final** | Informe integral, repositorio y defensa del producto | Este documento |

**Estado del producto (funcional):** aproximadamente **90% del núcleo** operativo en entorno local: autenticación JWT, seis roles, instituciones, perfiles, equipo interdisciplinario, observaciones con privacidad (PUBLICA, MULTINIVEL, PRIVADA), bitácora con filtros, edición de observaciones, reportes PDF/CSV y panel superadmin.

**Pruebas ejecutadas:** 12 casos OK, 1 N/A, 13 capturas de evidencia (CP-01 a CP-13), cubriendo autenticación, RBAC, perfiles, observaciones, equipo interdisciplinario y privacidad.

---

## 2. Introducción

### 2.1 Contexto

La comunicación en el ecosistema TEA suele ser fragmentada (mensajería informal, cuadernos, correos). TEA Link ofrece una plataforma única con trazabilidad, roles diferenciados y protección de información sensible.

### 2.2 Objetivos del proyecto (cumplimiento)

| Objetivo | Cumplimiento |
|----------|--------------|
| Gestión de usuarios con JWT y RBAC | Implementado (6 roles) |
| Módulo de observaciones colaborativas | Implementado con privacidad y edición |
| Reportes PDF/Excel consolidados | Implementado |
| Seguridad y validación de datos | JWT, bcrypt, Zod, RBAC — despliegue productivo pendiente |

### 2.3 Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, Zod |
| Base de datos | PostgreSQL, Prisma ORM |
| Seguridad | JWT, bcrypt, RBAC |
| Entorno | Local — `localhost:3000` / `localhost:5173` |

---

## 3. Integración Evaluación 1 — Planificación y diseño

En EV1 se definieron problemática, objetivos, metodología iterativa (18 semanas), arquitectura 3 capas, modelo de datos normalizado y diseño UI/UX con paleta calmada y wireframes por rol.

**Documentos de respaldo:** `README.md`, `Documentacion/INFORME-TECNICO-BASE-DATOS.md`, `Documentacion/DISENO-UI-UX.md`, `Documentacion/diagramas/flujo-datos-arquitectura.puml`.

---

## 4. Integración Evaluación 2 — Desarrollo del MVP

EV2 entregó un MVP con login JWT, roles operativos y administrativos, instituciones, perfiles estudiante, observaciones categorizadas y API REST protegida.

**Limitaciones detectadas** que motivaron EV3: acceso solo por institución (sin equipo interdisciplinario), sin edición de observaciones, bitácora básica, errores en reportes cross-institución e interfaz sin unificar.

---

## 5. Estado del producto — Evaluación 3 y cierre

### 5.1 Módulos implementados

| Módulo | Estado |
|--------|--------|
| Autenticación, cambio de contraseña inicial y reset por admin | Operativo |
| RBAC (6 roles, paneles diferenciados) | Operativo |
| Instituciones (CRUD superadmin) | Operativo |
| Perfiles y equipo interdisciplinario | Operativo |
| Observaciones (CRUD, privacidad, edición propia) | Operativo |
| Bitácora (búsqueda, filtros, vistas) | Operativo |
| Reportes PDF y CSV/Excel | Operativo |
| Auditoría administrativa | Operativo |
| UI unificada por rol | Operativo |

### 5.2 Escenario de demostración

Perfil **Matías Pérez (ID 5)** — Familia Pérez Demo — con equipo: familia, médico, profesional y educador (`educador1@`) vinculados vía `perfil_usuario`. Caso secundario: **Joaquín Sánchez (#8)** en Colegio AltaVida.

---

## 6. IL3.1 — Plan de pruebas y base de datos de pruebas

Plan de **28 casos (CP-01 a CP-28)** documentado en `Documentacion/EV3-PLAN-DE-PRUEBAS.md`.

**Base de datos de pruebas:** 5 instituciones, 11 usuarios, 3 perfiles, 11 observaciones. Credenciales en `Documentacion/usuarios_prueba.md`.

**Matriz de privacidad:**

| Privacidad | FAMILIA | EDUCADOR | PROFESIONAL | MEDICO |
|------------|---------|----------|-------------|--------|
| PUBLICA | Sí | Sí | Sí | Sí |
| MULTINIVEL | No | No | Sí | Sí |
| PRIVADA | No | No | No | Sí |

---

## 7. IL3.1 — Ejecución de pruebas y resultados

| Métrica | Valor |
|---------|-------|
| Casos planificados | 28 |
| Ejecutados OK | 12 |
| N/A | 1 (CP-03) |
| Pendientes formales | 15 (CP-14 a CP-28) |
| Capturas | 13 |

Detalle en `Documentacion/EV3-RESULTADOS-PRUEBAS.md`.

| ID | Funcionalidad | Estado | Evidencia |
|----|---------------|--------|-----------|
| CP-01 | Login familia | OK | Captura-01 |
| CP-02 | Credenciales inválidas | OK | Captura-02 |
| CP-03 | Cambio contraseña inicial | N/A | — |
| CP-04 | Familia sin admin | OK | Captura-03 |
| CP-05 | Admin sin bitácora | OK | Captura-04 |
| CP-06 | Perfil Matías Pérez | OK | Captura-05 |
| CP-07 | Admin crea perfil | OK | Captura-06 |
| CP-08 | Familia crea obs. pública | OK | Captura-07 |
| CP-09 | Validación descripción | OK | Captura-08 |
| CP-10 | Educador ve obs. familia | OK | Captura-10 |
| CP-11 | Médico ve equipo | OK | Captura-11 |
| CP-12 | Familia no ve PRIVADA | OK | Captura-12 |
| CP-13 | Profesional ve MULTINIVEL | OK | Captura-13 |

---

## 8. IL3.1 — Evidencias

13 capturas en `Documentacion/evidencias-ev3/` (Captura-01.png … Captura-13.png).

| Captura | Caso | Descripción |
|---------|------|-------------|
| Captura-01 | CP-01 | Login → Panel de Familia |
| Captura-02 | CP-02 | Error credenciales inválidas |
| Captura-03 | CP-04 | Panel familia |
| Captura-04 | CP-05 | Panel admin sin bitácora |
| Captura-05 | CP-06 | Selector Matías Pérez |
| Captura-06 | CP-07 | Perfil creado |
| Captura-07 | CP-08 | Observación pública |
| Captura-08 | CP-09 | Validación descripción |
| Captura-09 | Prep. | Obs. PRIVADA médico |
| Captura-10 | CP-10 | Educador ve familia |
| Captura-11 | CP-11 | Médico ve equipo |
| Captura-12 | CP-12 | Familia no ve privada |
| Captura-13 | CP-13 | Profesional MULTINIVEL |

---

## 9. IL3.2 — Mejoras implementadas tras validación

1. **Equipo interdisciplinario** — `perfil_usuario` + `perfilAccess.ts` + API vincular-equipo.
2. **Privacidad server-side** — filtrado por rol en `observacionController.ts`.
3. **Edición de observaciones** — `EditarObservacionPage` + PUT `/api/observaciones/:id`.
4. **Bitácora mejorada** — búsqueda, filtros, vista por rol/cronológica.
5. **Reportes cross-institución** — corrección en `reporteController.ts`.
6. **Sesión sincronizada** — `authMiddleware` refresca rol e institución.
7. **UI unificada** — theme por rol, AppShell, UI kit, dashboards refactorizados.
8. **Reset de contraseña institucional** — el administrador de cada institución puede regenerar clave temporal del equipo operativo (Equipo → Clave), simétrico al reset que hace el superadmin sobre administradores.

---

## 10. Evaluación final — Cierre del semestre

### 10.1 Logros del semestre

- Producto full-stack funcional demostrable en local.
- Documentación técnica, de pruebas y de gestión en el repositorio.
- Validación manual de flujos críticos con evidencias fotográficas.
- Escenario interdisciplinario real (Matías Pérez) operativo.

### 10.2 Avance estimado del producto (excl. documentación)

| Ámbito | % aprox. |
|--------|----------|
| Funcionalidad core (demo/defensa) | 90% |
| Proyecto completo (deploy + tests auto.) | 75% |

### 10.3 Entregables del repositorio final

| Entregable | Ubicación |
|------------|-----------|
| Código fuente | `Producto/backend`, `Producto/frontend` |
| Informe final | `Documentacion/INFORME-FINAL-TEA-LINK.md` |
| Plan y resultados de pruebas | `Documentacion/EV3-*.md` |
| Evidencias | `Documentacion/evidencias-ev3/` |
| Usuarios de prueba | `Documentacion/usuarios_prueba.md` |
| BD y diagramas | `Documentacion/INFORME-TECNICO-BASE-DATOS.md`, `diagramas/` |

---

## 11. Conclusiones generales

1. TEA Link cumple el objetivo de centralizar observaciones colaborativas con RBAC y privacidad granular.
2. La línea EV1 → EV2 → EV3 → Final es coherente: de la planificación a un producto validado.
3. Las pruebas documentadas respaldan los módulos críticos del negocio.
4. Las mejoras post-validación resolvieron brechas reales del MVP.
5. El proyecto está listo para defensa oral con demo en vivo; el despliegue cloud y tests automatizados quedan como trabajo futuro.

---

## 12. Trabajo futuro

| Ítem | Prioridad |
|------|-----------|
| Despliegue (Vercel / Render / Neon) | Alta |
| Pruebas automatizadas (Jest, Vitest, Supertest) | Alta |
| Documentación OpenAPI / Swagger | Media |
| Recuperación de contraseña por correo (automática) | Media |
| Completar ejecución formal CP-14 a CP-28 | Baja |
| Notificaciones en tiempo real | Baja |

---

## 13. Anexos y documentos de referencia

| Anexo | Archivo |
|-------|---------|
| A — Evidencias | `Documentacion/evidencias-ev3/` |
| B — Plan de pruebas | `Documentacion/EV3-PLAN-DE-PRUEBAS.md` |
| C — Resultados | `Documentacion/EV3-RESULTADOS-PRUEBAS.md` |
| D — Usuarios prueba | `Documentacion/usuarios_prueba.md` |
| E — Reglas y permisos | `Documentacion/REGLAS_Y_PERMISOS_DE_ROLES.md` |
| F — Informe BD | `Documentacion/INFORME-TECNICO-BASE-DATOS.md` |
| G — Diseño UI/UX | `Documentacion/DISENO-UI-UX.md` |
| H — Repositorio | https://github.com/cristianmonsalve14/tea-link |

---

**Fin del informe final — TEA Link — DuocUC 2026**

*Exportar a PDF desde Word o editor Markdown para entrega formal si el docente lo requiere.*
