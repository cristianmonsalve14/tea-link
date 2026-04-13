# CONTROL DE AVANCE - PROYECTO TEA LINK
## Sistema de Seguimiento de Actividades y Checklist Completo

---

**Fecha de Inicio del Proyecto**: 9 de marzo de 2026  
**Fecha Actual**: 13 de abril de 2026  
**Semana Actual**: SEMANA 5 de 18  
**Días transcurridos**: 35 días  
**Días restantes**: 90 días (hasta 12 julio 2026)

---

## 📊 RESUMEN EJECUTIVO

| Métrica | Estado | Porcentaje |
|---------|--------|------------|
| **Documentación** | ✅ Completada | 100% |
| **Planificación** | ✅ Completada | 100% |
| **Configuración Entorno** | ✅ Completada | 100% |
| **Diseño Base de Datos** | ✅ Completada | 100% |
| **Limpieza Repositorio** | ✅ Completada | 100% |
| **Diseño UI/UX** | ✅ Completada | 100% |
| **Desarrollo (Código)** | ⏳ Pendiente | 0% |
| **Testing** | ⏳ Pendiente | 0% |
| **Deployment** | ⏳ Pendiente | 0% |

**AVANCE GLOBAL DEL PROYECTO**: 27.78% (5 de 18 actividades completadas)

---

## 📁 DOCUMENTOS CREADOS (RESPALDO COMPLETO)

### ✅ DOCUMENTACIÓN COMPLETADA

| # | Documento | Ubicación | Estado | Fecha Creación | Páginas/Ítems |
|---|-----------|-----------|--------|----------------|---------------|
| 1 | **README.md** | `README.md` | ✅ Completado | 22 marzo 2026 | Documentación completa proyecto |
| 2 | **Control de Avance** | `CONTROL-AVANCE-TEA-LINK.md` | ✅ Actualizado | 12 abril 2026 | Este documento |
| 3 | **Informe de Avances** | `INFORME-AVANCES-SEMANAL.md` | ✅ Actualizado | 12 abril 2026 | Reportes semanales |
| 4 | **Documentación Técnica** | `docs/` | ✅ Estructurada | Marzo 2026 | 5+ documentos técnicos |

### © CONTENIDO DE LA DOCUMENTACIÓN DEL PROYECTO

**Documentación estructurada en carpeta `docs/`:**

- [x] **Definición del Proyecto** (`docs/01-definicion-proyecto.md`)
  - [x] Nombre, descripción, objetivos
  - [x] Alcance (IN/OUT)
  - [x] Requisitos funcionales y no funcionales
  
- [x] **Planificación y Metodología** (`docs/02-planificacion-metodologia.md`)
  - [x] Metodología Scrum adaptada
  - [x] Product Backlog
  - [x] Sprints planificados
  
- [x] **Arquitectura y Tecnologías** (`docs/03-arquitectura-tecnologias.md`)
  - [x] Arquitectura por Capas justificada
  - [x] Stack tecnológico completo
  - [x] Diseño de API REST

- [x] **Roles y Responsabilidades** (`docs/04-roles-responsabilidades.md`)
  - [x] Roles Scrum (Developer/PO/SM)
  - [x] Distribución de trabajo

- [x] **Métricas de Calidad** (`docs/05-metricas-calidad-seguridad.md`)
  - [x] Estándares de código
  - [x] Seguridad (JWT, RBAC, bcrypt)

---

## 📅 CRONOGRAMA DETALLADO (18 SEMANAS)

### ✅ FASE 1: PLANIFICACIÓN Y DISEÑO (Semanas 1-4)

#### **Actividad 1: Definición y planificación** (S1-S2: 9-22 marzo)
**Estado**: ✅ **COMPLETADA**

Checklist de tareas:
- [x] Lectura de requisitos de GUÍA 1
- [x] Decisión de arquitectura (análisis 10 arquitecturas)
- [x] Decisión de stack tecnológico (React + Node + PostgreSQL)
- [x] Redacción de contexto y motivación personal
- [x] Definición de objetivo general
- [x] Definición de 4 objetivos específicos
- [x] Definición de alcance (IN/OUT)
- [x] Listado de 20 requisitos funcionales
- [x] Listado de 10 requisitos no funcionales
- [x] Definición de metodología Scrum adaptada
- [x] Creación de 20 User Stories (Product Backlog)
- [x] Descripción técnica completa (arquitectura, stack, seguridad)
- [x] Plan de trabajo (18 actividades)
- [x] Tabla de evidencias (12 evidencias)
- [x] Carta Gantt (planificación semestral)
- [x] Sección "Otros" (motivación, impacto, escalabilidad)
- [x] Creación de repositorio mental del proyecto
- [x] Guía de defensa con 18 preguntas

**Entregables producidos**:
- ✅ Documentación estructurada en `docs/`
- ✅ `README.md` (documentación completa del proyecto)
- ✅ `CONTROL-AVANCE-TEA-LINK.md` (sistema de tracking)
- ✅ `INFORME-AVANCES-SEMANAL.md` (reportes)

**Tiempo invertido**: 13 días (9-22 marzo)
**Tiempo planificado**: 14 días (2 semanas)
**Estado**: ⏰ Adelantado por 1 día

---

#### **Actividad 2: Configuración del entorno de desarrollo** (S2-S3: 16-22 marzo)
**Estado**: ✅ **COMPLETADA** (22 marzo 2026)

Checklist de tareas:
- [x] Instalar Node.js 20.x LTS (verificar versión) - **v22.18.0 ✅**
- [x] Instalar PostgreSQL 15.x local (con pgAdmin) - **Verificado ✅**
- [x] Crear estructura de carpetas del proyecto
  - [x] `/frontend` (React + Vite)
  - [x] `/backend` (Express + TypeScript)
  - [x] `/docs` (documentación)
- [x] Configurar proyecto frontend:
  - [x] `npm create vite@latest frontend -- --template react-ts`
  - [x] Instalar Tailwind CSS + PostCSS + Autoprefixer
  - [x] Configurar tailwind.config.js y postcss.config.js
  - [x] Actualizar index.css con directivas Tailwind
  - [x] Instalar React Router DOM
  - [x] Instalar React Hook Form + Zod + @hookform/resolvers
  - [x] Verificar compilación (`npm run dev`) - **localhost:5173 ✅**
- [x] Configurar proyecto backend:
  - [x] `npm init -y`
  - [x] Instalar TypeScript + @types/node + @types/express
  - [x] Instalar ts-node + nodemon
  - [x] Instalar Express + CORS + dotenv
  - [x] Instalar @types/cors
  - [x] Instalar Prisma CLI + @prisma/client
  - [x] Instalar JWT + bcrypt + Zod
  - [x] Instalar @types/jsonwebtoken + @types/bcrypt
  - [x] Configurar `tsconfig.json` (npx tsc --init)
  - [x] Crear estructura de carpetas (src/routes, controllers, middleware, types)
- [x] Configurar Git:
  - [x] Crear `.gitignore` mejorado
  - [x] Limpieza de archivos innecesarios
  - [ ] `git init`
  - [ ] Crear repositorio en GitHub
  - [ ] Primer commit y push

**Entregables producidos**:
- ✅ Estructura de carpetas creada (frontend/, backend/, docs/)
- ✅ `package.json` frontend con 14 dependencias
- ✅ `package.json` backend con 20 dependencias
- ✅ Frontend compilando sin errores (Vite + React + TypeScript + Tailwind)
- ✅ Backend configurado con TypeScript (tsconfig.json + estructura carpetas)
- ⏳ Repositorio GitHub (pendiente - siguiente sesión)

**Tiempo invertido**: 1 día (22 marzo)
**Tiempo planificado**: 1 semana (16-22 marzo)
**Estado**: ⏰ **COMPLETADA en 1 DÍA** (adelantado por 6 días)

---

#### **Actividad 3: Diseño de base de datos** (S3: 23-29 marzo)
**Estado**: ⏳ **PRÓXIMA SEMANA**

Checklist de tareas:
- [ ] Crear archivo `schema.prisma` completo
- [ ] Definir modelo `Usuario` (5 campos + relaciones)
- [ ] Definir modelo `Perfil` (8 campos + relaciones)
- [ ] Definir modelo `Observacion` (9 campos + relaciones)
- [ ] Definir modelo `Reporte` (7 campos + relaciones)
- [ ] Definir modelo `ObservacionEnReporte` (tabla intermedia N:N)
- [ ] Configurar relaciones 1:N (Usuario→Perfil, Perfil→Observacion)
- [ ] Configurar relación N:N (Reporte↔Observacion)
- [ ] Configurar ON DELETE CASCADE
- [ ] Configurar índices (email, fecha_evento, categoria)
- [ ] Ejecutar `npx prisma migrate dev --name init`
- [ ] Verificar migración exitosa en PostgreSQL
- [ ] Crear diagrama ER visual:
  - [ ] Usar dbdiagram.io o draw.io
  - [ ] Exportar como PNG/PDF
  - [ ] Guardar en `/docs/diagrams/`
- [ ] Documentar decisiones de diseño (normalización 3FN)

**Entregables esperados**:
- [ ] `prisma/schema.prisma` validado
- [ ] Migraciones aplicadas (`prisma/migrations/`)
- [ ] Diagrama ER visual (PNG/PDF)
- [ ] Documentación de diseño (Markdown)

**Tiempo planificado**: 1 semana (23-29 marzo)

---

#### **Actividad 4: Diseño de interfaz UI/UX** (S3-S4: 23-29 marzo)
**Estado**: ✅ **COMPLETADA** (13 abril 2026)

Checklist de tareas:
- [x] Definir paleta de colores (accesible para TEA)
  - [x] Color primario (#4A90E2 - Azul calmado)
  - [x] Color secundario (#7ED321 - Verde suave)
  - [x] Colores de estado (warning, error, success)
  - [x] Escala de grises
- [x] Diseñar wireframes de 6 pantallas principales:
  - [x] 1. Login
  - [x] 2. Dashboard principal
  - [x] 3. Lista de observaciones (con filtros)
  - [x] 4. Crear observación
  - [x] 5. Perfil de usuario
  - [x] 6. Generar reporte
- [x] Definir tipografía (Inter + Roboto)
- [x] Configurar Tailwind CSS con paleta personalizada
- [x] Crear componentes Tailwind reutilizables:
  - [x] Botones (.btn-primary, .btn-secondary)
  - [x] Inputs de formulario (.input)
  - [x] Cards (.card)
- [x] Validar accesibilidad:
  - [x] Contraste mínimo WCAG AA (4.5:1)
  - [x] Navegación por teclado (focus-visible)
  - [x] Tamaño mínimo táctil (44px)
- [x] Documentar guía de estilo

**Entregables producidos**:
- ✅ Wireframes de 6 pantallas principales (`Documentacion/DISENO-UI-UX.md`)
- ✅ Paleta de colores documentada (azul calmado + verde suave)
- ✅ `tailwind.config.js` configurado con colores, tipografía, breakpoints
- ✅ `index.css` con clases de utilidad (.btn-primary, .card, .input)
- ✅ Fuente Inter integrada desde Google Fonts
- ✅ Checklist de accesibilidad aplicado

**Tiempo invertido**: 1 día (13 abril 2026)
**Tiempo planificado**: 1 semana (23-29 marzo, paralelo con Act. 3)
**Estado**: ⏰ **COMPLETADA** (pendiente de mockups de alta fidelidad - opcional)

---

#### **Actividad 5: Preparación presentación Evaluación 1** (S4: 30 marzo - 5 abril)
**Estado**: ⏳ **SEMANA 4**

Checklist de tareas:
- [ ] Crear presentación PowerPoint/Google Slides
- [ ] Slide 1: Portada (nombre, asignatura, fecha)
- [ ] Slide 2: Contexto personal (motivación)
- [ ] Slide 3: Problema identificado
- [ ] Slide 4: Objetivo general
- [ ] Slide 5: Objetivos específicos (4)
- [ ] Slide 6: Alcance (IN/OUT)
- [ ] Slide 7: Metodología Scrum adaptada
- [ ] Slide 8: Arquitectura (diagrama 3-Tier)
- [ ] Slide 9: Stack tecnológico (logos)
- [ ] Slide 10: Modelo de datos (diagrama ER)
- [ ] Slide 11: Plan de trabajo (Gantt simplificado)
- [ ] Slide 12: Próximos pasos (Sprints 1-5)
- [ ] Slide 13: Preguntas
- [ ] Ensayar presentación (20 minutos)
- [ ] Grabar ensayo para auto-revisión
- [ ] Ajustar timing si es necesario
- [ ] Preparar respuestas a preguntas frecuentes (usar Guía Defensa)

**Entregables esperados**:
- [ ] Presentación PowerPoint/Slides (PDF)
- [ ] Guión de presentación (notas)
- [ ] Respuestas preparadas a 5-10 preguntas críticas

**Tiempo planificado**: 1 semana (30 marzo - 5 abril)
**Evaluación**: ⚠️ **PARCIAL 1 - 25% de la nota final**

---

### ⏳ FASE 2: DESARROLLO CORE (Semanas 5-11)

#### **Actividad 6: Sprint 1 - Módulo de Autenticación** (S5-S6: 6-19 abril)
**Estado**: 🔄 **EN CURSO - Semana 5** (12 abril 2026)

Checklist de tareas:
- [ ] **Backend - API de autenticación**:
  - [ ] Crear `/backend/src/routes/auth.routes.ts`
  - [ ] Crear `/backend/src/controllers/auth.controller.ts`
  - [ ] Implementar `POST /api/auth/register`
  - [ ] Implementar `POST /api/auth/login`
  - [ ] Implementar `POST /api/auth/logout`
  - [ ] Crear esquemas Zod de validación
  - [ ] Implementar hashing con bcrypt (10 rounds)
  - [ ] Implementar generación de JWT (24h expiry)
  - [ ] Crear middleware `authMiddleware.ts`
  - [ ] Testing con Postman (casos válidos/inválidos)
- [ ] **Frontend - UI de autenticación**:
  - [ ] Crear `/frontend/src/pages/Login.tsx`
  - [ ] Crear `/frontend/src/pages/Register.tsx`
  - [ ] Implementar formularios con React Hook Form
  - [ ] Validación frontend con Zod
  - [ ] Manejo de errores (toasts/alerts)
  - [ ] Guardar token en localStorage
  - [ ] Redireccionamiento post-login
  - [ ] Protección de rutas (PrivateRoute component)
- [ ] **Testing**:
  - [ ] Test: registro con email válido → 201 Created
  - [ ] Test: registro con email duplicado → 400 Bad Request
  - [ ] Test: login con credenciales válidas → 200 OK + token
  - [ ] Test: login con password incorrecta → 401 Unauthorized
  - [ ] Test: acceso a ruta protegida sin token → 401
  - [ ] Test: acceso a ruta protegida con token válido → 200 OK

**Entregables esperados**:
- [ ] API de autenticación funcional (3 endpoints)
- [ ] UI de login/registro funcional
- [ ] Middleware de autenticación implementado
- [ ] 6+ tests pasando

---

#### **Actividad 7: Sprint 2 - Módulo de Usuarios y Roles** (S6-S7: 13-26 abril)
**Estado**: ⏳ **Semana 6-7**

Checklist de tareas pendientes (se completarán cuando lleguemos)

---

#### **Actividades 8-11**: (Se detallarán conforme avancemos)

---

### ⏳ FASE 3: DESARROLLO REPORTES Y MEJORAS (Semanas 12-15)

_(Se detallará cuando lleguemos a esa fase)_

---

### ⏳ FASE FINAL: TESTING Y DEFENSA (Semanas 16-18)

_(Se detallará cuando lleguemos a esa fase)_

---

## 🎯 EVALUACIONES (4 Parciales = 100%)

| Evaluación | Semana | Fecha Estimada | Peso | Contenido | Estado |
|------------|--------|----------------|------|-----------|--------|
| **Parcial 1** | S4 | 30 marzo - 5 abril | 25% | Presentación: Contexto, objetivos, metodología, arquitectura, plan | ⏳ Pendiente |
| **Parcial 2** | S11 | 18-24 mayo | 25% | Demo funcional: Auth, Usuarios, Perfiles, Observaciones | ⏳ Pendiente |
| **Parcial 3** | S15 | 15-21 junio | 25% | Demo completa: Todos los módulos + Reportes | ⏳ Pendiente |
| **Final** | S18 | 6-12 julio | 25% | Defensa oral + Video demo + Informe técnico | ⏳ Pendiente |

---

## 📈 MÉTRICAS DE PROGRESO

### **Por Fase**

| Fase | Actividades | Completadas | Pendientes | % Avance |
|------|-------------|-------------|------------|----------|
| Fase 1 (S1-S4) | 5 | 1 | 4 | 20% |
| Fase 2 (S5-S11) | 6 | 0 | 6 | 0% |
| Fase 3 (S12-S15) | 4 | 0 | 4 | 0% |
| Fase Final (S16-S18) | 3 | 0 | 3 | 0% |
| **TOTAL** | **18** | **1** | **17** | **5.5%** |

### **Por Tipo de Trabajo**

| Tipo | Completado | En Progreso | Pendiente |
|------|------------|-------------|-----------|
| Documentación | ✅ 100% | - | - |
| Planificación | ✅ 100% | - | - |
| Diseño (DB + UI) | 0% | - | ⏳ 100% |
| Configuración | 0% | - | ⏳ 100% |
| Desarrollo | 0% | - | ⏳ 100% |
| Testing | 0% | - | ⏳ 100% |
| Defensa | 70% (Guía) | 🔄 | ⏳ 30% |

---

## 🚨 RIESGOS IDENTIFICADOS

| # | Riesgo | Probabilidad | Impacto | Mitigación Planeada | Estado |
|---|--------|--------------|---------|---------------------|--------|
| R1 | Atraso por trabajo solo (scope de 3 personas) | Alta | Alto | Priorizar RF core, descartar RF opcionales si necesario | ⚠️ Monitoreando |
| R2 | Curva aprendizaje tecnologías nuevas (Prisma, Zod) | Media | Medio | Documentación oficial + tutoriales + tiempo buffer | 📚 Estudiando |
| R3 | Problemas de deployment en producción | Baja | Medio | Deploy temprano (Fase 2), testing continuo | ⏳ Futuro |
| R4 | Bugs críticos antes de evaluaciones | Media | Alto | Testing cada sprint, buffer de 1 semana antes de eval. | ⏳ Futuro |
| R5 | Falta de usuarios reales para testing | Media | Bajo | Testing con personas cercanas (familia, colegas) | ✅ Planeado |

---

## 📚 CONOCIMIENTOS/TECNOLOGÍAS A APRENDER

### ✅ Ya Dominados
- [x] Git básico (commit, push, pull)
- [x] Markdown (documentación)
- [x] Conceptos de arquitectura (Capas, Microservicios)
- [x] Conceptos de bases de datos (SQL, relaciones)

### 🔄 En Aprendizaje
- [ ] React 18 (Hooks, Context, Router)
- [ ] TypeScript avanzado (Generics, Types vs Interfaces)
- [ ] Tailwind CSS (utility-first, responsive)
- [ ] Node.js + Express (middleware, rutas)
- [ ] Prisma ORM (schema, migrations, queries)
- [ ] JWT + bcrypt (autenticación)
- [ ] Zod (validación de esquemas)

### ⏳ Por Aprender
- [ ] React Hook Form (manejo de formularios)
- [ ] Swagger/OpenAPI (documentación API)
- [ ] Testing (Jest, Vitest, Supertest)
- [ ] Deployment (Vercel, Render, Neon)
- [ ] CI/CD (GitHub Actions)

---

## 🎓 APRENDIZAJES CLAVE POR ASIGNATURA (Homologación)

| Asignatura DuocUC | Aplicación en TEA Link | Estado |
|-------------------|------------------------|--------|
| **Programación Web** | React components, hooks, routing | ⏳ Sprint 1-5 |
| **Base de Datos** | PostgreSQL, modelo ER, normalización 3FN | ⏳ Semana 3 |
| **Ingeniería de Software** | Scrum, requisitos, casos de uso | ✅ GUÍA 1 |
| **Arquitectura de Software** | 3-Tier, separación de capas | ✅ GUÍA 1 |
| **Programación Backend** | Node.js, Express, API REST | ⏳ Sprint 1+ |
| **Seguridad Informática** | JWT, bcrypt, HTTPS, RBAC | ⏳ Sprint 1 |
| **Testing de Software** | Jest, pruebas unitarias/integración | ⏳ Semana 16 |
| **Gestión de Proyectos** | Cronograma, Gantt, riesgos | ✅ GUÍA 1 |
| **Desarrollo de Interfaces** | UI/UX, wireframes, accesibilidad | ⏳ Semana 3-4 |
| **Deploy y DevOps** | Vercel, Render, CI/CD | ⏳ Sprint 6+ |

---

## 📝 NOTAS Y DECISIONES IMPORTANTES

### **Decisiones Arquitectónicas (Registradas)**
1. ✅ **Arquitectura en Capas** (3-Tier) sobre Microservicios
   - Justificación: Dominio cohesivo, 1 desarrollador, escala de miles (no millones)
   - Documentado en: GUÍA 1 Sección 5.1, Pregunta 17 de Defensa

2. ✅ **PostgreSQL** sobre MongoDB
   - Justificación: Relaciones claras, ACID crítico, queries complejos con JOINs
   - Documentado en: GUÍA 1 Sección 5.3, Pregunta 18 de Defensa

3. ✅ **React + Vite** sobre Next.js
   - Justificación: SPA suficiente (no necesito SSR), Vite más rápido
   - Documentado en: GUÍA 1 Sección 5.2

4. ✅ **Prisma ORM** sobre TypeORM/Sequelize
   - Justificación: Type-safety, migrations automáticas, mejor DX
   - Documentado en: GUÍA 1 Sección 5.2, Pregunta 7 de Defensa

5. ✅ **JWT en localStorage** (no cookies HttpOnly)
   - Justificación: SPA sin backend de sesión, simplicidad
   - Trade-off aceptado: Vulnerable a XSS (mitigado con React auto-escape)
   - Documentado en: Pregunta 14 de Defensa

### **Alcance Ajustado (Scope Creep Prevention)**

**Incluido (IN)**:
- ✅ CRUD completo (Usuarios, Perfiles, Observaciones, Reportes)
- ✅ Autenticación + Autorización RBAC
- ✅ Filtros y búsquedas básicas
- ✅ Generación de reportes PDF
- ✅ Notificaciones básicas (toasts)

**Excluido (OUT)** - No se hará en MVP:
- ❌ Aplicación móvil (React Native)
- ❌ Notificaciones push (WebSockets en tiempo real)
- ❌ Integración con sistemas externos (calendarios, salud)
- ❌ IA/Machine Learning (análisis predictivo)
- ❌ Videollamadas/Chat en vivo
- ❌ Internacionalización (i18n) - Solo español

**Opcional (Si hay tiempo en Semana 14-15)**:
- ⚠️ Dashboard con estadísticas (gráficos básicos)
- ⚠️ Exportación a Excel (además de PDF)
- ⚠️ Sistema de etiquetas/tags para observaciones

---

## ✅ CHECKLIST PRE-EVALUACIÓN 1 (Semana 4)

### **Documentación**
- [x] GUÍA 1 completada (9 secciones)
- [x] Repositorio GitHub inicializado
- [ ] README.md actualizado con instrucciones

### **Diseño**
- [ ] Diagrama ER exportado (PNG/PDF)
- [ ] Wireframes de 10 pantallas
- [ ] Paleta de colores definida

### **Presentación**
- [ ] PowerPoint/Slides creado (12-15 slides)
- [ ] Ensayo de 20 minutos grabado
- [ ] Guía de defensa repasada (Preguntas 1-18)

### **Código (opcional para Eval 1, pero recomendado)**
- [ ] Frontend compilando sin errores
- [ ] Backend compilando sin errores
- [ ] Schema Prisma validado

---

## 🔄 PRÓXIMOS PASOS INMEDIATOS (Esta Semana)

### **HOY - 17 Marzo (Lunes)**
1. ✅ Crear documento de Control de Avance (este archivo)
2. [ ] Verificar instalación de Node.js 20.x
3. [ ] Verificar instalación de PostgreSQL 15.x
4. [ ] Crear estructura de carpetas del proyecto

### **18 Marzo (Martes)**
- [ ] Configurar proyecto frontend (Vite + React + TS)
- [ ] Instalar dependencias frontend (Tailwind, Router, etc.)
- [ ] Verificar compilación frontend

### **19 Marzo (Miércoles)**
- [ ] Configurar proyecto backend (Express + TS)
- [ ] Instalar dependencias backend (Prisma, JWT, etc.)
- [ ] Verificar compilación backend

### **20 Marzo (Jueves)**
- [ ] Configurar Git + GitHub
- [ ] Primer commit y push
- [ ] Actualizar README.md

### **21-22 Marzo (Viernes-Sábado)**
- [ ] Buffer para resolver problemas de configuración
- [ ] Verificación final de Actividad 2 completada

---

## 📞 CONTACTOS Y RECURSOS

### **Recursos de Aprendizaje**
- React Docs: https://react.dev
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- Prisma Docs: https://www.prisma.io/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Express Guide: https://expressjs.com/en/guide/routing.html

### **Herramientas**
- GitHub: https://github.com/[usuario]/tea-link
- Figma/Excalidraw: (para wireframes)
- dbdiagram.io: (para diagrama ER)
- Postman: (para testing API)

---

## 🏆 MOTIVACIÓN Y RECORDATORIOS

### **¿Por qué estoy haciendo esto?**
> "Soy padre de un hijo con TEA severo. Vivo diariamente la fragmentación de la comunicación entre familia, colegio y terapeutas. Este proyecto no es solo académico, es personal. TEA Link puede mejorar la vida de 15,000 familias chilenas que enfrentan el mismo problema."

### **Recordatorios para mantener el enfoque**
1. 📅 **Fecha límite**: 12 de julio 2026 (117 días)
2. 🎯 **4 evaluaciones**: Cada una vale 25% (no hay margen de error)
3. 💪 **Trabajo solo**: Requiere disciplina y gestión de tiempo impecable
4. 🚀 **MVP primero**: Funcionalidad core antes que features bonitas
5. 📝 **Documentar todo**: Cada decisión técnica debe estar justificada

### **Mantra del Proyecto**
> "Progreso sobre perfección. Entregar algo funcional es mejor que algo perfecto sin terminar."

---

## 📊 DASHBOARD VISUAL (Actualización Semanal)

```
SEMANA ACTUAL: 2/18  [██░░░░░░░░░░░░░░░░] 11%

FASE 1 (Planificación):  [████░░░░░░] 40%
FASE 2 (Desarrollo):     [░░░░░░░░░░]  0%
FASE 3 (Reportes):       [░░░░░░░░░░]  0%
FASE FINAL (Defensa):    [██████░░░░] 60%

EVALUACIÓN 1: ⏳ 13 días (30 marzo)
EVALUACIÓN 2: ⏳ 62 días (18 mayo)
EVALUACIÓN 3: ⏳ 90 días (15 junio)
EVALUACIÓN FINAL: ⏳ 111 días (6 julio)
```

---

**Última actualización**: 17 de marzo de 2026, 22:30  
**Próxima revisión**: 24 de marzo de 2026 (fin Semana 3)  
**Responsable**: Cristian Monsalve Budrovich

---

**NOTA**: Este documento es **VIVO** y se actualiza semanalmente. Cada vez que completemos una actividad, marcaremos el checkbox ✅ y actualizaremos las métricas de progreso.
