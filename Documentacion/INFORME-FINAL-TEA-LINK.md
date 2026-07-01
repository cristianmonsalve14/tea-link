<div align="center">

**INSTITUTO PROFESIONAL DUOC UC**

---

**CARRERA:** Ingeniería en Informática

**ASIGNATURA:** Taller Aplicado de Programación  
**SIGLA:** TPY1101

---

# INFORME — ESTADO DE AVANCE N° 3

**Evaluación Parcial 3 · Entrega de encargo**

*Situación evaluativa: Ejecución práctica y documentación del producto*

---

## TEA LINK

### Sistema Web de Comunicación y Seguimiento Colaborativo para Personas con TEA

---

| | |
|---|---|
| **Sección** | 001D — Taller Aplicado de Programación |
| **Número de grupo** | 12 |
| **Tipo de documento** | Informe final integrado (EV1 + EV2 + EV3) |
| **Período académico** | Semestre 2026 (marzo – julio 2026) |
| **Integrante** | Cristian Monsalve Budrovich |
| **RUT** | 12.622.852-k |
| **Correo institucional** | cr.monsalveb@duocuc.cl |
| **Docente(s) guía** | Maria Ignacia Cobo · Cesar Carrasco |
| **Repositorio del proyecto** | https://github.com/cristianmonsalve14/tea-link |
| **Fecha de entrega** | Junio 2026 |
| **Versión del documento** | 1.6 |

---

*Proyecto desarrollado en modalidad individual (responsabilidades full stack: frontend, backend, base de datos y documentación).*

</div>

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Introducción](#2-introducción)
3. [Evaluación Parcial 1 — Planificación y diseño](#3-evaluación-parcial-1--planificación-y-diseño)
4. [Evaluación Parcial 2 — Desarrollo del MVP](#4-evaluación-parcial-2--desarrollo-del-mvp)
5. [Estado del producto — Evaluación 3 y cierre](#5-estado-del-producto--evaluación-3-y-cierre)
6. [IL3.1 — Plan de pruebas y base de datos de pruebas](#6-il31--plan-de-pruebas-y-base-de-datos-de-pruebas)
7. [IL3.1 — Ejecución de pruebas y resultados](#7-il31--ejecución-de-pruebas-y-resultados)
8. [IL3.1 — Evidencias](#8-il31--evidencias)
9. [IL3.2 — Mejoras implementadas tras validación](#9-il32--mejoras-implementadas-tras-validación)
10. [Evaluación final — Cierre del semestre](#10-evaluación-final--cierre-del-semestre)
11. [Conclusiones generales](#11-conclusiones-generales)
12. [Lecciones aprendidas](#12-lecciones-aprendidas)
13. [Alcance cumplido del producto](#13-alcance-cumplido-del-producto)
14. [Anexos y documentos de referencia](#14-anexos-y-documentos-de-referencia)

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

**Estado del producto:** **entrega final** operativa en entorno local: autenticación JWT, seis roles, instituciones, perfiles con RUT y consentimiento, equipo interdisciplinario, observaciones con privacidad (PUBLICA, MULTINIVEL, PRIVADA), auditoría administrativa y **auditoría de observaciones sensibles**, bitácora con filtros, reportes PDF/CSV y panel superadmin con registro nacional de perfiles.

**Pruebas ejecutadas:** **13 casos manuales** (CP-01 a CP-13): **12 OK**, **1 N/A** (CP-03), **13 capturas**. **Complemento automatizado:** **~218 tests** (Vitest + Supertest) — ~176 backend + 42 frontend — detalle en `Documentacion/EV3-PRUEBAS-AUTOMATIZADAS.md`.

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
| Seguridad y validación de datos | JWT, bcrypt, Zod, RBAC, consentimiento y auditoría de accesos sensibles |

### 2.3 Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, Zod |
| Base de datos | PostgreSQL, Prisma ORM |
| Seguridad | JWT, bcrypt, RBAC |
| Entorno | Local — `localhost:3000` / `localhost:5173` |

---

## 3. Evaluación Parcial 1 — Planificación y diseño

### 3.1 Problemática y justificación

La comunicación en el ecosistema TEA se realiza de forma dispersa (WhatsApp, cuadernos, correos), sin trazabilidad ni control de acceso sobre datos sensibles de menores. EV1 formalizó la oportunidad de desarrollar **TEA Link**: una plataforma web que centralice observaciones colaborativas con roles diferenciados y registro histórico.

### 3.2 Objetivos definidos

| Tipo | Contenido |
|------|-----------|
| **General** | Centralizar el registro colaborativo de observaciones sobre personas con TEA, con RBAC y reportes. |
| **Específicos** | (1) Gestión de usuarios con JWT y roles; (2) Módulo de observaciones categorizadas; (3) Reportes PDF/Excel; (4) Seguridad, privacidad y arquitectura escalable. |

### 3.3 Metodología y cronograma

Se adoptó desarrollo **iterativo en 18 semanas** (144 h pedagógicas), con fases de planificación, desarrollo core, reportes/mejoras y cierre con defensa. EV1 cubrió las semanas 1–4: definición del proyecto, configuración de entorno, diseño de base de datos y diseño UI/UX.

### 3.4 Arquitectura de software

Se definió arquitectura **3 capas (3-Tier)**:

| Capa | Tecnología | Responsabilidad |
|------|------------|-----------------|
| Presentación | React + Vite + Tailwind | SPA, formularios, dashboards por rol |
| Lógica de negocio | Node.js + Express + TypeScript | API REST, JWT, RBAC, validación Zod |
| Datos | PostgreSQL + Prisma | Persistencia, integridad, migraciones |

Diagrama de flujo documentado en `Documentacion/diagramas/flujo-datos-arquitectura.png` (caso de uso: crear observación con validación multicapa).

### 3.5 Diseño de base de datos (EV1)

En EV1 se modeló un esquema relacional **normalizado (3FN)** con entidades centrales: usuarios, perfiles, observaciones, reportes y tablas puente. Decisiones clave:

- Uso de **ENUM** en PostgreSQL para roles y categorías (integridad en BD).
- Relaciones **1:N** y **N:N** entre reportes y observaciones.
- Índices en campos de consulta frecuente (`email`, `perfil_id` + `fecha_evento`).

El diseño evolucionó en EV2/EV3 hacia **11 tablas** y **27 migraciones** con multi-institucional, `perfil_usuario`, **RUT único**, consentimiento (cuenta, perfil y apoderados), `solicitudes_institucion_perfil`, catálogo de establecimientos, diagnóstico estructurado por ENUM y **`auditoria_observacion`** (trazabilidad MULTINIVEL/PRIVADA). **Sigue cumpliendo 3FN** (verificación tabla por tabla en `INFORME-TECNICO-BASE-DATOS.md` §3.3). El ER vigente está en `Documentacion/diagramas/modelo-er-base-datos.puml` y `modelo-er-base-datos.png`.

### 3.6 Diseño UI/UX (EV1)

Documentado en `Documentacion/DISENO-UI-UX.md`:

- **Paleta calmada** orientada a usuarios TEA (azules/verdes suaves, alto contraste, evitar colores estridentes).
- **Wireframes** por pantalla: login, dashboard, listado de observaciones, formulario nueva observación, generación de reportes.
- **Navegación por rol**: familia, educador, profesional/médico y administrador con funciones diferenciadas.
- Principios de accesibilidad: espaciado generoso, feedback visual claro, formularios con validación en cliente.

### 3.7 Stack tecnológico seleccionado

Frontend: React 18, TypeScript, Vite, Tailwind, React Router, Zod.  
Backend: Node.js 20, Express, Prisma, JWT, bcrypt.  
Base de datos: PostgreSQL 15.  
Control de versiones: **Git + GitHub** (`https://github.com/cristianmonsalve14/tea-link`).

### 3.8 Entregables EV1

| Entregable | Ubicación |
|------------|-----------|
| Descripción general y objetivos | `README.md` |
| Informe técnico de base de datos | `Documentacion/INFORME-TECNICO-BASE-DATOS.md` |
| Diseño UI/UX | `Documentacion/DISENO-UI-UX.md` |
| Diagrama flujo arquitectura | `Documentacion/diagramas/` |
| Repositorio con estructura DuocUC | `Gestion/`, `Documentacion/`, `Producto/` |

**Resultado EV1:** base conceptual, técnica y visual suficiente para iniciar el desarrollo del MVP en EV2.

---

## 4. Evaluación Parcial 2 — Desarrollo del MVP

### 4.1 Alcance del MVP entregado

EV2 (semanas 5–11) implementó un **producto mínimo viable** demostrable en local, con los módulos core del negocio operativos de extremo a extremo (frontend ↔ API ↔ PostgreSQL).

### 4.2 Módulos implementados en EV2

| Módulo | Funcionalidad entregada |
|--------|-------------------------|
| **Autenticación** | Login con JWT (24 h), hash bcrypt, middleware `authenticateToken` |
| **Roles y RBAC** | Roles FAMILIA, EDUCADOR, PROFESIONAL, MEDICO, ADMINISTRADOR, SUPERADMIN; rutas protegidas con `authorizeRoles` |
| **Instituciones** | CRUD por superadmin; usuarios y perfiles asociados a institución |
| **Usuarios** | Alta/edición/eliminación por admin institucional; registro controlado |
| **Perfiles estudiante** | Alta con **RUT único**; solo colegio/médico crean; consentimiento y apoderados; colaboración y cesión de custodia |
| **Superadmin** | Command center: instituciones, admins, **registro perfiles**, auditoría, KPIs |
| **Observaciones** | Crear, listar por perfil, categorías ENUM, autoría registrada |
| **Reportes** | Generación PDF/CSV con observaciones seleccionadas |
| **Validación** | Esquemas Zod en backend (y validación en formularios frontend) |
| **Auditoría admin** | Registro de acciones administrativas sensibles |

### 4.3 API REST desarrollada (EV2)

Rutas principales bajo `/api`:

| Prefijo | Endpoints representativos |
|---------|---------------------------|
| `/api/auth` | `POST /login`, gestión usuarios/instituciones, rutas por rol |
| `/api/perfiles` | CRUD perfiles estudiante |
| `/api/observaciones` | CRUD observaciones por perfil |
| `/api/reportes` | Crear, listar y exportar reportes |

Todas las rutas de negocio exigen **Bearer JWT** salvo login.

### 4.4 Frontend MVP (EV2)

Páginas y flujos implementados:

- Login y redirección según rol.
- Dashboard por tipo de usuario (familia, educador, profesional, médico, admin, superadmin).
- Selector de perfil estudiante.
- Formulario de nueva observación y listado/bitácora básica.
- Panel administrador: usuarios y perfiles de la institución.
- Panel superadmin: instituciones, administradores, **registro perfiles** (`/superadmin/perfiles`), auditoría y dashboard ejecutivo.

Stack: React + Vite + TypeScript + Tailwind CSS.

### 4.5 Base de datos y Prisma (EV2)

- Esquema en `Producto/backend/prisma/schema.prisma`.
- Migraciones versionadas en `Producto/backend/prisma/migrations/`.
- Seed inicial con usuarios y datos demo para pruebas manuales.
- Conexión verificada con scripts de diagnóstico sobre Prisma Client.

### 4.6 Seguridad aplicada en EV2

| Medida | Implementación |
|--------|----------------|
| Contraseñas | bcrypt (10 rounds) |
| Sesión | JWT en header Authorization |
| Autorización | RBAC por rol e institución |
| Inyección SQL | Prisma (consultas parametrizadas) |
| Validación entrada | Zod en controladores |

### 4.7 Pruebas en EV2

Validación **manual** de flujos: login por rol, creación de observación, listado por perfil, restricción de rutas admin y generación de reporte. Sin suite automatizada en esta etapa.

### 4.8 Entregables EV2

| Entregable | Evidencia |
|------------|-----------|
| Código backend | `Producto/backend/` |
| Código frontend | `Producto/frontend/` |
| Esquema y migraciones | `Producto/backend/prisma/` |
| Documentación RBAC inicial | `Documentacion/REGLAS_Y_PERMISOS_DE_ROLES.md` |
| Repositorio actualizado | Commits en rama `develop` |

### 4.9 Limitaciones detectadas al cierre de EV2

Estas brechas motivaron el trabajo de EV3:

1. Acceso a perfiles **solo por institución**, sin equipo interdisciplinario cross-institucional (`perfil_usuario`).
2. **Sin edición** de observaciones ya publicadas.
3. Bitácora **básica** (sin búsqueda/filtros avanzados).
4. **Privacidad** clínica (MULTINIVEL/PRIVADA) no aplicada de forma consistente en servidor.
5. Errores en reportes cuando el usuario accedía a perfiles de otra institución vía equipo.
6. Interfaz **sin unificar** (estilos heterogéneos entre pantallas).

**Resultado EV2:** MVP funcional y defendible, con deuda técnica y funcional abordada en EV3.

---

## 5. Estado del producto — Evaluación 3 y cierre

### 5.1 Módulos implementados

| Módulo | Estado |
|--------|--------|
| Autenticación, cambio de contraseña inicial y reset por admin | Operativo |
| RBAC (6 roles, paneles diferenciados) | Operativo |
| Instituciones (CRUD superadmin) | Operativo |
| Perfiles y custodia | Operativo — RUT, consentimiento, apoderados, colaboración, cesión |
| Registro perfiles (superadmin) | Operativo |
| Observaciones (CRUD, privacidad, edición propia) | Operativo |
| Bitácora (búsqueda, filtros, vistas) | Operativo |
| Reportes PDF y CSV/Excel | Operativo |
| Auditoría administrativa | Operativo |
| Auditoría observaciones MULTINIVEL/PRIVADA | Operativo |
| UI unificada por rol | Operativo |

### 5.2 Escenario de demostración

Perfil **Matías Pérez** (custodia Colegio AltaVida) — con equipo: familia, médico, profesional y educador (`eduardoaltavida@email.com`) vinculados vía `perfil_usuario`. Caso secundario: **Joaquín Sánchez** en Colegio AltaVida (mismo educador).

---

## 6. IL3.1 — Plan de pruebas y base de datos de pruebas

Plan de **13 casos (CP-01 a CP-13)** documentado en `Documentacion/EV3-PLAN-DE-PRUEBAS.md`.

**Base de datos de pruebas:** 4 instituciones, 9 usuarios, 3 perfiles, 10 observaciones. Credenciales en `Documentacion/usuarios_prueba.md`.

**Matriz de privacidad:**

| Privacidad | FAMILIA | EDUCADOR | PROFESIONAL | MEDICO |
|------------|---------|----------|-------------|--------|
| PUBLICA | Sí | Sí | Sí | Sí |
| MULTINIVEL | No | No | Sí | Sí |
| PRIVADA | No | No | No | Sí |

---

## 7. IL3.1 — Ejecución de pruebas y resultados

### 7.1 Pruebas manuales (CP-01 a CP-13)

| Métrica | Valor |
|---------|-------|
| Casos planificados | 13 |
| Ejecutados OK | 12 |
| N/A | 1 (CP-03) |
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

### 7.2 Pruebas automatizadas (complemento)

Suite documentada en `Documentacion/EV3-PRUEBAS-AUTOMATIZADAS.md` (Vitest en backend y frontend; Supertest para integración API).

| Métrica | Valor |
|---------|-------|
| Total tests automatizados | **88** |
| Backend | **74** (53 unitarias + 21 integración) |
| Frontend | **14** unitarias |
| CP cubiertos por API | **10 / 12** aplicables ≈ **83 %** (CP-03 N/A) |
| Cobertura líneas backend (unit + integración) | **~28 %** global |
| Cobertura `src/utils` backend (unitarias) | **~27–100 %** en módulos críticos |

Los tests de integración usan datos aislados (`@test-auto.tealink.cl`, instituciones `[TEST]*`) sin alterar la BD demo documentada en `usuarios_prueba.md`.

**Comando de verificación:**

```bash
cd Producto/backend && npm test
cd Producto/frontend && npm test
```

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
- Suite automatizada de regresión API y reglas de negocio (~218 tests).
- Escenario interdisciplinario real (Matías Pérez) operativo.

### 10.2 Avance estimado del producto (excl. documentación)

| Ámbito | Estado |
|--------|--------|
| Funcionalidad core (objetivos del proyecto) | Cumplida |
| Pruebas automatizadas (Vitest/Supertest) | Implementadas — ~218 tests |
| Documentación técnica, pruebas y evidencias EV3 | Completa en repositorio |

### 10.3 Entregables del repositorio final

| Entregable | Ubicación |
|------------|-----------|
| Código fuente | `Producto/backend`, `Producto/frontend` |
| Informe final | `Documentacion/INFORME-FINAL-TEA-LINK.md` |
| Plan y resultados de pruebas | `Documentacion/EV3-*.md` |
| Pruebas automatizadas | `Documentacion/EV3-PRUEBAS-AUTOMATIZADAS.md` |
| Evidencias | `Documentacion/evidencias-ev3/` |
| Usuarios de prueba | `Documentacion/usuarios_prueba.md` |
| BD y diagramas | `Documentacion/INFORME-TECNICO-BASE-DATOS.md`, `diagramas/` |

### 10.4 Control de versiones (Git y GitHub)

El proyecto utiliza **Git** como sistema de control de versiones y **GitHub** como repositorio remoto, cumpliendo el requisito de documentar el historial de cambios del producto y la documentación.

#### Herramienta y repositorio

| Ítem | Valor |
|------|--------|
| Software | Git 2.x |
| Hosting remoto | GitHub |
| URL pública | https://github.com/cristianmonsalve14/tea-link |
| Rama principal estable | `main` |
| Rama de desarrollo activa | `develop` (rama de trabajo habitual) |
| Total de commits | 16 (incluye entrega final EV3 — Junio 2026) |

#### Estrategia de ramas

```
main     ─── versión estable / hitos de entrega
develop  ─── integración continua del trabajo diario (rama activa)
```

- **`main`:** línea base del repositorio.
- **`develop`:** creada en el commit `1640673` (*Se crea rama develop, para estrategia de branches*). Todo el avance de EV2 y EV3 se integró en esta rama.
- **Flujo de trabajo:** desarrollo local → `git add` / `git commit` → `git push origin develop`. No se versionan secretos (`.env` excluido vía `.gitignore`).

#### Estructura versionada en el repositorio

```
tea-link/
├── Gestion/              # Integrantes del equipo
├── Documentacion/        # Informes, plan de pruebas, diagramas, evidencias
└── Producto/
    ├── backend/          # API Express + Prisma
    └── frontend/         # SPA React + Vite
```

#### Hitos del historial por evaluación

| Evaluación | Período aprox. | Commits representativos | Contenido versionado |
|------------|----------------|-------------------------|----------------------|
| **EV1** | Abr 2026 | `d10c341`, `b1d6e0b`, `75c3169`, `2233622` | Estructura DuocUC, README, diseño UI/UX (Tailwind), diseño BD con relaciones N:N |
| **EV2** | Abr–May 2026 | `2e4c347`, `fe0315b`, `a85d43b`, `f454cea`, `d73c446` | Auth JWT, RBAC, CRUD usuarios/perfiles, validación Zod, login frontend |
| **EV3** | May–Jun 2026 | `a1fea3a`, `177f4fa` | Sistema integrado, privacidad, equipo interdisciplinario, plan de pruebas, reset clave admin |

#### Tabla de commits relevantes

| Hash | Fecha | Mensaje (resumen) |
|------|-------|-------------------|
| `d10c341` | 2026-04-12 | Primer commit — estructura de carpetas |
| `1640673` | 2026-04-12 | Creación rama `develop` |
| `75c3169` | 2026-04-13 | Diseño UI/UX y Tailwind (EV1) |
| `2233622` | 2026-04-17 | Diseño BD completo (EV1) |
| `2e4c347` | 2026-04-25 | Registro y auth con roles (EV2) |
| `fe0315b` | 2026-04-25 | Middleware JWT y rutas protegidas (EV2) |
| `f454cea` | 2026-04-26 | CRUD usuarios/perfiles + auditoría (EV2) |
| `d73c446` | 2026-04-30 | Login frontend con validaciones (EV2) |
| `a1fea3a` | 2026-05-26 | Avance funcional y documentación (EV3) |
| `177f4fa` | 2026-06-19 | Reset clave admin, entrega EV3 y docs de pruebas |

#### Buenas prácticas aplicadas

| Práctica | Implementación |
|----------|----------------|
| Exclusión de secretos | `.env`, `.env.local` en `.gitignore` |
| Mensajes descriptivos | Commits indican módulo y alcance (auth, BD, EV3…) |
| Trazabilidad | Cada entrega parcial coincide con commits fechados en GitHub |
| Migraciones de BD | `Producto/backend/prisma/migrations/` versionadas en Git |
| Documentación junto al código | `Documentacion/` en el mismo repositorio que `Producto/` |

#### Evidencia de control de versiones

- Historial público de commits: https://github.com/cristianmonsalve14/tea-link/commits/develop  
- Listado de integrantes: `Gestion/Integrantes.txt` y `Grupo_12.txt`  
- Repositorio sincronizado con documentación EV3, evidencias (13 capturas) y diagrama ER.

#### Comandos Git de referencia

```bash
git status                    # Ver cambios pendientes
git log --oneline -10         # Últimos 10 commits
git branch -a                 # Ramas locales y remotas
git push origin develop       # Publicar avances en GitHub
```

---

## 11. Conclusiones generales

1. TEA Link cumple el objetivo de centralizar observaciones colaborativas con RBAC y privacidad granular.
2. La línea EV1 → EV2 → EV3 → Final es coherente: de la planificación a un producto validado.
3. Las pruebas documentadas — manuales (13 CP) y automatizadas (~218 tests) — respaldan los módulos críticos del negocio.
4. Las mejoras post-validación resolvieron brechas reales del MVP dentro del alcance de EV3.
5. El proyecto está **listo para defensa oral** con demo en vivo; la suite automatizada reduce riesgo de regresión en API y la documentación refleja el producto entregado.

---

## 12. Lecciones aprendidas

### 12.1 Técnicas

- **Diseñar la BD antes del código acelera el desarrollo**, pero el modelo debe revisarse cuando aparecen requisitos reales (equipo interdisciplinario, multi-institucional). La tabla `perfil_usuario` resolvió un caso de negocio que el diseño inicial no contemplaba.
- **Prisma + PostgreSQL** redujeron errores de tipado y facilitaron migraciones; aun así, conviene dominar SQL para índices, ENUM y depuración.
- **La seguridad no puede quedar solo en el frontend**: el filtrado de privacidad por rol debió aplicarse en el backend desde el inicio; centralizarlo en `observacionController.ts` evitó inconsistencias.
- **RBAC + institución + vínculo de equipo** es más complejo que RBAC simple; documentar reglas en `REGLAS_Y_PERMISOS_DE_ROLES.md` ayudó a probar y defender el producto.
- **Validación doble (Zod + constraints BD)** detecta errores temprano y mejora la calidad percibida en formularios.

### 12.2 Metodológicas

- **Documentar mientras se desarrolla** (no al final) facilitó armar EV3 con plan de pruebas, usuarios demo y capturas alineadas.
- **Un escenario de demo único** (Matías Pérez #5 con equipo interdisciplinario) hizo más clara la defensa que dispersar pruebas en muchos datos inconsistentes.
- **Alinear la BD de pruebas con el plan** antes de congelar los casos evitó fallos por credenciales o datos inconsistentes.
- **Commits frecuentes en Git** permitieron recuperar avances y demostrar control de versiones ante evaluación.
- Trabajar **individualmente asumiendo frontend, backend y BD** exige priorizar el MVP y cerrar brechas de forma iterativa dentro del semestre (EV2 → EV3).

### 12.3 Sobre pruebas y calidad

- Las **13 pruebas manuales** fueron suficientes para validar flujos críticos de UI, pero CP-03 (cambio obligatorio de contraseña) quedó N/A por no tener un usuario con `must_change_password` en la corrida; conviene preparar datos de prueba para **todos** los casos del plan.
- Las **capturas de pantalla** y la salida de `npm test` (~218 tests) son evidencia complementaria para el informe y la defensa oral.
- La suite **Vitest + Supertest** cubre reglas de negocio extraídas a `src/utils/` (privacidad, RBAC, filtros superadmin) sin depender de la UI.
- Las mejoras post-validación (privacidad, equipo, UI, reset de clave) demostraron que **probar el producto con usuarios reales del dominio** (familia, educador, médico) revela brechas que no aparecen en pruebas aisladas por módulo.

### 12.4 Ética y responsabilidad

- Datos de menores con TEA exigen **mínimo privilegio por rol** y no exponer contraseñas ni secretos JWT en documentación pública.
- La privacidad MULTINIVEL/PRIVADA no es solo técnica: refleja **confianza clínica** entre familia, colegio y centro médico.

---

## 13. Alcance cumplido del producto

El alcance de titulación queda **cerrado** con lo siguiente implementado y documentado:

| Ámbito | Entregado |
|--------|-----------|
| Autenticación y RBAC (6 roles, multi-institucional) | Sí |
| Perfiles (RUT, consentimiento, custodia, colaboración) | Sí |
| Observaciones con privacidad PUBLICA / MULTINIVEL / PRIVADA | Sí |
| Auditoría administrativa y de observaciones sensibles | Sí |
| Reportes PDF y CSV | Sí |
| Panel superadmin (KPIs, instituciones, registro perfiles) | Sí |
| Catálogo nacional (importación datasets MINEDUC/DEIS) | Sí |
| Base de datos 11 tablas, 27 migraciones, 3FN documentada | Sí |
| Pruebas manuales EV3 + ~218 tests automatizados | Sí |
| Informes, diagrama ER, reglas de permisos y usuarios demo | Sí |

**Alcance de ejecución:** entorno **local** documentado (`Producto/backend`, `Producto/frontend`, PostgreSQL). La gestión de credenciales se realiza mediante **reset administrativo** y cambio obligatorio en primer acceso.

---

## 14. Anexos y documentos de referencia

| Anexo | Archivo |
|-------|---------|
| A — Evidencias | `Documentacion/evidencias-ev3/` |
| B — Plan de pruebas | `Documentacion/EV3-PLAN-DE-PRUEBAS.md` |
| C — Resultados | `Documentacion/EV3-RESULTADOS-PRUEBAS.md` |
| C2 — Pruebas automatizadas | `Documentacion/EV3-PRUEBAS-AUTOMATIZADAS.md` |
| D — Usuarios prueba | `Documentacion/usuarios_prueba.md` |
| E — Reglas y permisos | `Documentacion/REGLAS_Y_PERMISOS_DE_ROLES.md` |
| F — Informe BD | `Documentacion/INFORME-TECNICO-BASE-DATOS.md` |
| G — Diseño UI/UX | `Documentacion/DISENO-UI-UX.md` |
| H — Repositorio | https://github.com/cristianmonsalve14/tea-link |
| I — Control de versiones | Sección [10.4](#104-control-de-versiones-git-y-github) de este informe |

---

**Fin del informe final — TEA Link — DuocUC 2026**

