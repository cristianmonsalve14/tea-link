# TEA LINK - Sistema Web de Comunicación y Seguimiento Colaborativo para Personas con TEA
## Proyecto de Titulación - Taller Aplicado de Programación (TPY1101)

**Institución:** DuocUC  
**Carrera:** Ingeniería Informática  
**Asignatura:** Taller Aplicado de Programación (TPY1101)  
**Período:** Semestre 2026 (9 marzo - 12 julio 2026)  
**Duración:** 18 semanas - 144 horas pedagógicas  
**Grupo:** 12 · **Sección:** 001D  
**Repositorio:** https://github.com/cristianmonsalve14/tea-link

---

## 📋 Descripción General

**TEA Link** es una aplicación web diseñada para centralizar y facilitar la comunicación entre familias, educadores, profesionales y medicos de apoyo que trabajan con personas dentro del **Trastorno del Espectro Autista (TEA)**.

> **Estado:** producto **entregado y funcional en entorno local** (EV1–EV3 completadas). **~218 tests automatizados** (Vitest + Supertest).

El sistema permite:
- ✅ Registrar observaciones colaborativas de manera segura y organizada
- ✅ Realizar seguimiento longitudinal del desarrollo de personas con TEA
- ✅ Generar reportes personalizados para coordinación del equipo multidisciplinario
- ✅ Proteger información sensible de menores mediante control de acceso basado en roles (RBAC)
- ✅ Centralizar comunicación fragmentada (WhatsApp, cuadernos, correos desorganizados)

### Problema que Resuelve
Actualmente, la comunicación entre familias, educadores y terapeutas se realiza de manera informal y dispersa:
- ❌ Grupos de WhatsApp (información fragmentada)
- ❌ Cuadernos físicos (sin trazabilidad digital)
- ❌ Correos desorganizados
- ❌ Hojas de cálculo compartidas (sin control de acceso robusto)

TEA Link **centraliza toda la información** en una plataforma segura, accesible y colaborativa.

---

## 👥 Equipo de Desarrollo

| Integrante | RUT | Rol | Responsabilidades |
|------------|-----|-----|-------------------|
| Cristian Monsalve Budrovich | [RUT: 12.622.852-k] | Desarrollador Full Stack | Frontend (React), Backend (Node.js), Base de Datos (PostgreSQL), Deployment, Documentación, Testing |

**Nota:** Este proyecto fue diseñado originalmente para equipos de 3 personas (Frontend Dev, Backend Dev, DevOps). Se está desarrollando de forma individual, asumiendo las 3 responsabilidades.

---

## 🎯 Objetivos del Proyecto

### Objetivo General
Desarrollar una aplicación web que centralice y facilite el registro colaborativo de observaciones sobre personas con TEA, mejorando la comunicación entre familias, educadores y profesionales de apoyo mediante una plataforma segura con control de acceso basado en roles, trazabilidad completa de eventos, y generación de reportes personalizados que permitan el seguimiento longitudinal del desarrollo.

### Objetivos Específicos
1. **Implementar un módulo de gestión de usuarios** con autenticación segura (JWT + bcrypt), seis roles (FAMILIA, EDUCADOR, PROFESIONAL, MEDICO, ADMINISTRADOR, SUPERADMIN), multi-institucional y RBAC para proteger información sensible.

2. **Desarrollar un módulo de seguimiento de observaciones** con registro, categorización, edición, privacidad (PUBLICA, MULTINIVEL, PRIVADA), bitácora con filtros y equipo interdisciplinario vía `perfil_usuario`, con validación Zod en frontend y backend.

3. **Crear un módulo de reportes personalizados** que genere documentos (PDF/Excel) consolidados con observaciones seleccionadas, permitiendo a profesionales extraer información para evaluaciones médicas/educativas y facilitar la toma de decisiones basada en datos históricos.

4. **Garantizar seguridad, privacidad y escalabilidad** mediante encriptación de contraseñas (bcrypt 10 rounds), tokens JWT con expiración, validación de datos con Zod, RBAC, auditoría de accesos sensibles y arquitectura en capas (3-Tier) con integridad ACID en PostgreSQL para datos de menores.

---

## 📊 Stack Tecnológico

### 🎨 Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5.x (10x más rápido que Webpack)
- **Styling:** Tailwind CSS 3.x
- **Routing:** React Router DOM v6
- **Forms:** React Hook Form + Zod (validación)
- **State Management:** Zustand (ligero, no Redux)
- **HTTP Client:** Fetch API nativa + Axios (opcional)
- **Deployment:** Entorno local (Vite dev server)

### ⚙️ Backend
- **Runtime:** Node.js 20.x LTS
- **Framework:** Express 4.x + TypeScript
- **ORM:** Prisma 5.x (type-safe, migrations automáticas)
- **Authentication:** JWT (24h expiry) + bcrypt (10 rounds)
- **Validation:** Zod (schema validation)
- **Deployment:** Entorno local documentado (Node.js + PostgreSQL)

### 🗄️ Base de Datos
- **Motor:** PostgreSQL 15.x
- **Hosting:** PostgreSQL local (desarrollo y demo)
- **ORM Integration:** Prisma con migrations automáticas
- **Normalization:** 3NF (Third Normal Form)
- **Indices:** email (unique), fecha_evento, categoria para optimization

### 🏗️ Arquitectura
- **Patrón:** 3-Tier Layered Architecture
  - **Capa de Presentación:** React SPA (Vercel)
  - **Capa de Lógica de Negocio:** Express API (Render)
  - **Capa de Datos:** PostgreSQL (Neon)
- **Protocolo:** REST API con 25+ endpoints
- **Security:** CORS, RBAC, JWT, bcrypt

---

## 📅 Cronograma (18 Semanas)

### **FASE 1: Planificación y Diseño** (Semanas 1-4)
| Actividad | Duración | Estado | Evaluación |
|-----------|----------|--------|-----------|
| 1. Definición y planificación | 2 semanas | ✅ Completada | - |
| 2. Configuración entorno | 1 semana | ✅ Completada | - |
| 3. Diseño base de datos | 1 semana | ✅ Completada | - |
| 4. Diseño UI/UX | 1 semana | ✅ Completada | - |
| 5. Preparación Evaluación 1 | 1 semana | ✅ Completada | **Parcial 1 (25%)** |

### **FASE 2: Desarrollo Core** (Semanas 5-11)
| Actividad | Duración | Estado | Evaluación |
|-----------|----------|--------|-----------|
| 6. Sprint 1: Autenticación | 2 semanas | ✅ Completada | - |
| 7. Sprint 2: Usuarios y Roles | 2 semanas | ✅ Completada | - |
| 8. Sprint 3: Perfiles TEA | 2 semanas | ✅ Completada | - |
| 9. Sprint 4: Observaciones P1 | 2 semanas | ✅ Completada | - |
| 10. Sprint 5: Observaciones P2 | 2 semanas | ✅ Completada | - |
| 11. Preparación Evaluación 2 | 1 semana | ✅ Completada | **Parcial 2 (25%)** |

### **FASE 3: Reportes y Mejoras** (Semanas 12-15)
| Actividad | Duración | Estado | Evaluación |
|-----------|----------|--------|-----------|
| 12. Sprint 6: Reportes P1 | 2 semanas | ✅ Completada | - |
| 13. Sprint 7: Reportes P2 | 2 semanas | ✅ Completada | - |
| 14. Sprint 8: UI/UX unificada | 2 semanas | ✅ Completada | - |
| 15. Preparación Evaluación 3 | 1 semana | ✅ Completada | **Parcial 3 (35%)** |

### **FASE FINAL: Testing y Defensa** (Semanas 16-18)
| Actividad | Duración | Estado | Evaluación |
|-----------|----------|--------|-----------|
| 16. Testing integral (13 casos CP) | 1 semana | ✅ Completada | - |
| 17. Documentación técnica | 1 semana | ✅ Completada | - |
| 18. Defensa final | 1 semana | ⏳ Pendiente | **Final (25%)** |

---

## 📁 Estructura del Proyecto

**Organización según requisitos DuocUC:**

```
tea-link/
├── Gestion/                           # Gestión del proyecto
│   └── Integrantes.txt               # Listado de integrantes del equipo
│
├── Documentacion/                     # Documentación técnica y evaluaciones
│   ├── INFORME-FINAL-TEA-LINK.md     # Informe final de entrega (EV1–EV3)
│   ├── EV3-PLAN-DE-PRUEBAS.md        # Plan de pruebas EV3
│   ├── EV3-RESULTADOS-PRUEBAS.md     # Resultados y evidencias
│   ├── EV3-PRUEBAS-AUTOMATIZADAS.md  # Suite Vitest/Supertest (~218 tests)
│   ├── usuarios_prueba.md            # Credenciales de demo
│   ├── REGLAS_Y_PERMISOS_DE_ROLES.md
│   ├── INFORME-TECNICO-BASE-DATOS.md
│   ├── DISENO-UI-UX.md
│   ├── evidencias-ev3/               # Capturas CP-01 a CP-13
│   └── diagramas/                    # Flujo 3 capas + ER (PlantUML/PNG)
│       ├── flujo-datos-arquitectura.puml
│       └── modelo-er-base-datos.puml
│
├── Producto/                          # Código fuente
│   ├── backend/                      # API Express + TypeScript
│   │   ├── src/
│   │   │   ├── routes/              # Definición de endpoints
│   │   │   ├── controllers/         # Lógica de negocio
│   │   │   ├── middleware/          # Auth, RBAC, validación
│   │   │   ├── types/               # TypeScript types
│   │   │   └── index.ts             # Punto de entrada
│   │   ├── scripts/
│   │   │   └── db-resumen.ts        # Resumen de BD demo
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Definición de modelo datos
│   │   │   └── migrations/          # Migraciones versionadas
│   │   ├── tests/                   # Pruebas unitarias e integración (Vitest)
│   │   ├── package.json
│   │   ├── package-lock.json
│   │   └── tsconfig.json
│   │
│   ├── frontend/                     # SPA React con Vite
│   │   ├── src/
│   │   │   ├── pages/               # Páginas (Login, Dashboard, etc.)
│   │   │   ├── components/          # Componentes reutilizables
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   ├── services/            # Llamadas a API
│   │   │   ├── types/               # TypeScript types/interfaces
│   │   │   ├── assets/              # Imágenes, iconos
│   │   │   ├── App.tsx              # Componente raíz
│   │   │   ├── App.css
│   │   │   ├── index.css
│   │   │   └── main.tsx
│   │   ├── tests/                   # Pruebas unitarias (Vitest)
│   │   ├── public/
│   │   ├── package.json
│   │   ├── package-lock.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   └── eslint.config.js
│
├── README.md                          # Este archivo
├── .gitignore
└── .vscode/
    └── settings.json                  # Configuración del editor
```

---

## 🔧 Configuración Rápida (Local)

### Requisitos
- **Node.js 20.x LTS** o superior
- **PostgreSQL 15.x** instalado localmente
- **Git** para control de versiones
- **VS Code** (recomendado) con extensiones: ESLint, Prettier, Prisma

### 1️⃣ Clonar repositorio
```bash
git clone https://github.com/cristianmonsalve14/tea-link.git
cd tea-link
```

### 2️⃣ Configurar Backend
```bash
cd Producto/backend

# Instalar dependencias
npm install

# Crear archivo .env con DATABASE_URL y JWT_SECRET (ver Producto/backend/README.md)

# Aplicar migraciones Prisma
npx prisma migrate deploy

# (Opcional) datos demo: npm run db:seed — recarga cohorte de Documentacion/usuarios_prueba.md

# Iniciar servidor backend (puerto 3000)
npm run dev
```

### 3️⃣ Configurar Frontend
```bash
cd Producto/frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 5173)
npm run dev
```

### 4️⃣ Verificar
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health: http://localhost:3000/health
- Usuarios demo: ver `Documentacion/usuarios_prueba.md`

### 5️⃣ Verificar BD demo (opcional)
```bash
cd Producto/backend
npx ts-node scripts/db-resumen.ts
```

### 6️⃣ Ejecutar pruebas automatizadas
```bash
# Backend —  ~176 tests (unitarias + integración)
# Frontend — 42 tests
cd Producto/backend
npm test

# Frontend — 42 tests unitarios
cd Producto/frontend
npm test
```

Detalle de cobertura CP y comandos: `Documentacion/EV3-PRUEBAS-AUTOMATIZADAS.md`.

---

## 🖥️ Ejecución local

El producto entregado se ejecuta en **entorno local** documentado en `Producto/backend/README.md` y `Producto/frontend/README.md`:

```bash
# Backend (puerto 3000)
cd Producto/backend && npm install && npx prisma migrate deploy && npx prisma db seed && npm run dev

# Frontend (puerto 5173)
cd Producto/frontend && npm install && npm run dev
```

Credenciales demo: `Documentacion/usuarios_prueba.md`.

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [Informe final](./Documentacion/INFORME-FINAL-TEA-LINK.md) | Entrega integral EV1–EV3 + cierre |
| [Plan de pruebas EV3](./Documentacion/EV3-PLAN-DE-PRUEBAS.md) | 13 casos CP-01 a CP-13 y BD de pruebas |
| [Resultados pruebas](./Documentacion/EV3-RESULTADOS-PRUEBAS.md) | Ejecución manual y capturas |
| [Pruebas automatizadas](./Documentacion/EV3-PRUEBAS-AUTOMATIZADAS.md) | ~218 tests Vitest/Supertest |
| [Usuarios de prueba](./Documentacion/usuarios_prueba.md) | Credenciales demo |
| [Reglas y permisos](./Documentacion/REGLAS_Y_PERMISOS_DE_ROLES.md) | RBAC y privacidad |
| [Informe técnico BD](./Documentacion/INFORME-TECNICO-BASE-DATOS.md) | Diseño PostgreSQL |
| [Diseño UI/UX](./Documentacion/DISENO-UI-UX.md) | Paleta y wireframes |
| [Diagramas](./Documentacion/diagramas/README.md) | Flujo arquitectura y modelo ER |

---

## 🔀 Control de versiones

- **Git + GitHub:** rama activa `develop`, estable `main`
- **Historial:** https://github.com/cristianmonsalve14/tea-link/commits/develop
- **Detalle documentado:** `Documentacion/INFORME-FINAL-TEA-LINK.md` §10.4

---

## ✨ Características Principales

### 👤 Gestión de Usuarios
- [x] Login seguro (JWT + bcrypt)
- [x] Roles: FAMILIA, EDUCADOR, PROFESIONAL, MEDICO, ADMINISTRADOR, SUPERADMIN
- [x] Control de acceso granular (RBAC) por rol e institución
- [x] Cambio de contraseña inicial obligatorio
- [x] Reset de contraseña temporal por superadmin (administradores) y por admin institucional (equipo operativo)

### 👨‍👩‍👧 Perfiles y equipo interdisciplinario
- [x] Perfiles estudiante con **RUT único** (validación chilena; sin duplicados)
- [x] Alta solo por **colegio** o **centro médico**; familia como apoderados (sin panel admin)
- [x] **Consentimiento** tutor/titular y hasta **3 apoderados** por perfil
- [x] **Colaboración** interinstitucional y **cesión de custodia**
- [x] Vínculo de equipo vía `perfil_usuario` (multi-institucional)
- [x] Información: nombre, edad, diagnóstico estructurado, nivel educacional, RND

### 🛡️ Superadmin (command center)
- [x] Panel ejecutivo con KPIs y auditoría
- [x] **Registro perfiles** nacional (`/superadmin/perfiles`) con filtros en cascada
- [x] Eliminación de perfiles solo por superadmin

### 📝 Observaciones
- [x] CRUD completo (crear, leer, editar, eliminar propias)
- [x] Privacidad: PUBLICA, MULTINIVEL, PRIVADA
- [x] Auditoría de acceso a observaciones sensibles (`auditoria_observacion`)
- [x] Categorías: CONDUCTA, COMUNICACION, SOCIAL, ACADEMICO, SENSORIAL, MOTOR, CLINICO, OTRO
- [x] Bitácora con búsqueda, filtros por rol y vistas agrupadas
- [x] Validación frontend y backend (Zod)

### 📊 Reportes
- [x] Generación de informes personalizados
- [x] Exportación PDF y CSV (Excel)
- [x] Selección de observaciones y rango de fechas
- [x] Historial de reportes del usuario

### 🔔 Interfaz y feedback
- [x] Feedback visual en formularios e interfaz

---

## 🔐 Seguridad

| Capa | Medida | Implementación |
|------|--------|----------------|
| **Autenticación** | Registro + Login | JWT con 24h expiry |
| **Contraseñas** | Hash seguro | bcrypt (10 rounds) = irreversible |
| **Validación** | Double-layer | Frontend (Zod) + Backend (Zod) |
| **Autorización** | Control de roles | RBAC con middleware |
| **Transporte** | API local | HTTP entre frontend (5173) y backend (3000), CORS configurado |
| **Base de datos** | Integridad | PostgreSQL ACID, Foreign Keys, CASCADE |
| **Inyección SQL** | ORM parametrizado | Prisma previene SQL injection |
| **Headers** | CORS | Configurado para desarrollo local |

---

## 📈 Modelo de Datos

**Fuente de verdad:** `Producto/backend/prisma/schema.prisma`  
**Diagrama ER:** `Documentacion/diagramas/modelo-er-base-datos.png`  
**Normalización:** 3FN — detalle en `Documentacion/INFORME-TECNICO-BASE-DATOS.md`

### Tablas (11)

| Tabla | Propósito |
|-------|-----------|
| `instituciones` | Familia, colegio, centro médico, centro profesional, sistema |
| `catalogo_establecimientos` | Catálogo oficial de establecimientos (alta instituciones) |
| `usuarios` | Credenciales, rol, institución, `must_change_password` |
| `perfiles` | Estudiantes: **RUT único**, consentimiento, diagnóstico, custodia |
| `perfil_usuario` | Equipo interdisciplinario N:M (usuario ↔ perfil) |
| `solicitudes_institucion_perfil` | Colaboración y cesión de custodia entre instituciones |
| `observaciones` | Bitácora con categoría y privacidad |
| `reportes` | Informes PDF/CSV generados |
| `observaciones_en_reportes` | Puente N:N reporte ↔ observación |
| `auditoria_admin` | Trazabilidad de acciones administrativas |
| `auditoria_observacion` | Trazabilidad de acceso a observaciones MULTINIVEL / PRIVADA |

### Roles (`rol_enum`)

FAMILIA · EDUCADOR · PROFESIONAL · MEDICO · ADMINISTRADOR · SUPERADMIN

### Privacidad en observaciones

| Nivel | Quién ve |
|-------|----------|
| PUBLICA | Todos los roles operativos |
| MULTINIVEL | PROFESIONAL, MEDICO |
| PRIVADA | Solo MEDICO |

### Relaciones principales

- Institución → Usuarios / Perfiles (1:N)
- Perfil ↔ Usuarios vía `perfil_usuario` (N:M, equipo interdisciplinario)
- Perfil → Observaciones (1:N); Usuario → Observaciones como autor (1:N)
- Reporte ↔ Observaciones (N:N); Usuario → Reportes como creador (1:N)

---

## 🎓 Aprendizajes Académicos (Homologación)

Este proyecto toca **10+ asignaturas** de la carrera:

| Asignatura | Aplicación en TEA Link |
|-----------|------------------------|
| Programación Web | React components, hooks, SPA |
| Base de Datos | PostgreSQL, ER, normalización 3FN |
| Ingeniería de Software | Scrum, requisitos, casos de uso |
| Arquitectura de Software | 3-Tier, separación de capas |
| Programación Backend | Node.js, Express, API REST |
| Seguridad Informática | JWT, bcrypt, RBAC, HTTPS, validación |
| Testing | Jest, Vitest, tests unitarios/integración |
| DevOps | Git, GitHub, control de versiones |
| Desarrollo de Interfaces | UI/UX, Tailwind, accesibilidad |
| Gestión de Proyectos | Cronograma, Gantt, riesgos |

---

## 📦 Alcance del proyecto

Proyecto de **titulación individual** (TPY1101 — DuocUC 2026). El alcance entregado comprende aplicación full-stack local, base de datos PostgreSQL, documentación EV1–EV3, pruebas manuales y automatizadas, e informe final integrado.

---

## 📞 Soporte y Contacto

- **Institución:** DuocUC
- **Asignatura:** TPY1101 - Taller Aplicado de Programación
- **Período:** 2026 (Semestre 1)
- **Docentes:** [Maria Ignacia Cobo - Cesar Carrasco]

---

## 🎯 Estado del proyecto

**Última actualización:** Junio 2026  
**Estado:** Entrega final — producto funcional en entorno local — **~218 tests automatizados**

### Evaluaciones

| Evaluación | Estado |
|------------|--------|
| Parcial 1 — Planificación y diseño | Completada |
| Parcial 2 — MVP | Completada |
| Parcial 3 — Sistema integrado + pruebas | Completada |
| Final — Informe + repositorio + defensa | En entrega |

---

## 📄 Licencia y Derechos

© 2026 Cristian Monsalve Budrovich. Todos los derechos reservados.

Este proyecto está desarrollado como **Proyecto de Titulación** en la carrera de Ingeniería Informática, DuocUC (Taller Aplicado de Programación - TPY1101).

### Restricciones de Uso

**No se permite sin autorización expresa del autor:**
- ❌ Uso comercial o con fines de lucro
- ❌ Redistribución o publicación del código fuente
- ❌ Modificación o uso del código para otros proyectos académicos
- ❌ Uso de la documentación, arquitectura o diseño en otros sistemas

### Uso Permitido

- ✅ Revisión académica por parte de docentes y evaluadores de DuocUC
- ✅ Consulta con fines de aprendizaje (sin copia ni redistribución)
- ✅ Referencia bibliográfica citando al autor

### Propiedad Intelectual

Este proyecto contiene ideas, diseños y código original del autor. Cualquier uso no autorizado constituye una violación a los derechos de propiedad intelectual.

**Para consultas sobre licenciamiento, colaboración o implementación:**  
Contactar a: Cristian Monsalve Budrovich

---

**Última actualización:** Junio 2026  
**Estado:** Entrega final EV3 — producto funcional en local, documentación y tests automatizados al día  
**Repositorio:** https://github.com/cristianmonsalve14/tea-link
