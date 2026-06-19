# TEA LINK - Sistema Web de Comunicación y Seguimiento Colaborativo para Personas con TEA
## Proyecto de Titulación - Taller Aplicado de Programación (TPY1101)

**Institución:** DuocUC  
**Carrera:** Ingeniería Informática  
**Asignatura:** Taller Aplicado de Programación (TPY1101)  
**Período:** Semestre 2026 (9 marzo - 12 julio 2026)  
**Duración:** 18 semanas - 144 horas pedagógicas  
**Repositorio:** https://github.com/cristianmonsalve14/tea-link

---

## 📋 Descripción General

**TEA Link** es una aplicación web diseñada para centralizar y facilitar la comunicación entre familias, educadores, profesionales y medicos de apoyo que trabajan con personas dentro del **Trastorno del Espectro Autista (TEA)**.

> **Nota:** Este README describe la visión general y el alcance proyectado de TEA Link como producto final. Algunas funcionalidades ya se encuentran implementadas y otras están planificadas para próximas etapas del desarrollo.

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
1. **Implementar un módulo de gestión de usuarios** con registro, autenticación segura (JWT + bcrypt) y asignación de roles diferenciados (familia, educador, profesional) que permita control de acceso granular (RBAC) para proteger información sensible de menores.

2. **Desarrollar un módulo de seguimiento de observaciones** que permita a usuarios autorizados registrar, categorizar (conducta, comunicación, social, académico), editar y consultar observaciones sobre personas con TEA, incluyendo filtrado por fecha, categoría y autor, con validación de datos en frontend y backend.

3. **Crear un módulo de reportes personalizados** que genere documentos (PDF/Excel) consolidados con observaciones seleccionadas, permitiendo a profesionales extraer información para evaluaciones médicas/educativas y facilitar la toma de decisiones basada en datos históricos.

4. **Garantizar seguridad, privacidad y escalabilidad** mediante encriptación de contraseñas (bcrypt 10 rounds), tokens JWT con expiración (24h), HTTPS/TLS 1.3, validación de datos con Zod, y arquitectura escalable (3-Tier Layered) que mantenga integridad ACID de datos sensibles de menores.

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
- **Deployment:** Vercel (CDN global, auto-deploy desde GitHub)

### ⚙️ Backend
- **Runtime:** Node.js 20.x LTS
- **Framework:** Express 4.x + TypeScript
- **ORM:** Prisma 5.x (type-safe, migrations automáticas)
- **Authentication:** JWT (24h expiry) + bcrypt (10 rounds)
- **Validation:** Zod (schema validation)
- **API Documentation:** Swagger/OpenAPI 3.0
- **Deployment:** Render.com (PaaS con auto-scaling)

### 🗄️ Base de Datos
- **Motor:** PostgreSQL 15.x
- **Hosting:** Neon.tech (PostgreSQL serverless con branching)
- **ORM Integration:** Prisma con migrations automáticas
- **Normalization:** 3NF (Third Normal Form)
- **Indices:** email (unique), fecha_evento, categoria para optimization

### 🏗️ Arquitectura
- **Patrón:** 3-Tier Layered Architecture
  - **Capa de Presentación:** React SPA (Vercel)
  - **Capa de Lógica de Negocio:** Express API (Render)
  - **Capa de Datos:** PostgreSQL (Neon)
- **Protocolo:** REST API con 25+ endpoints
- **Security:** HTTPS/TLS 1.3, CORS, RBAC, Helmet.js headers

---

## 📅 Cronograma (18 Semanas)

### **FASE 1: Planificación y Diseño** (Semanas 1-4)
| Actividad | Duración | Estado | Evaluación |
|-----------|----------|--------|-----------|
| 1. Definición y planificación | 2 semanas | ✅ Completada | - |
| 2. Configuración entorno | 1 semana | ⏳ En progreso | - |
| 3. Diseño base de datos | 1 semana | ⏳ Próxima | - |
| 4. Diseño UI/UX | 1 semana | ⏳ Próxima | - |
| 5. Preparación Evaluación 1 | 1 semana | ⏳ Próxima | **Parcial 1 (25%)** |

### **FASE 2: Desarrollo Core** (Semanas 5-11)
| Actividad | Duración | Estado | Evaluación |
|-----------|----------|--------|-----------|
| 6. Sprint 1: Autenticación | 2 semanas | ⏳ Próxima | - |
| 7. Sprint 2: Usuarios y Roles | 2 semanas | ⏳ Próxima | - |
| 8. Sprint 3: Perfiles TEA | 2 semanas | ⏳ Próxima | - |
| 9. Sprint 4: Observaciones P1 | 2 semanas | ⏳ Próxima | - |
| 10. Sprint 5: Observaciones P2 | 2 semanas | ⏳ Próxima | - |
| 11. Preparación Evaluación 2 | 1 semana | ⏳ Próxima | **Parcial 2 (25%)** |

### **FASE 3: Reportes y Mejoras** (Semanas 12-15)
| Actividad | Duración | Estado | Evaluación |
|-----------|----------|--------|-----------|
| 12. Sprint 6: Reportes P1 | 2 semanas | ⏳ Próxima | - |
| 13. Sprint 7: Reportes P2 | 2 semanas | ⏳ Próxima | - |
| 14. Sprint 8: Notificaciones UX | 2 semanas | ⏳ Próxima | - |
| 15. Preparación Evaluación 3 | 1 semana | ⏳ Próxima | **Parcial 3 (25%)** |

### **FASE FINAL: Testing y Defensa** (Semanas 16-18)
| Actividad | Duración | Estado | Evaluación |
|-----------|----------|--------|-----------|
| 16. Testing integral | 1 semana | ⏳ Próxima | - |
| 17. Documentación técnica | 1 semana | ⏳ Próxima | - |
| 18. Defensa final | 1 semana | ⏳ Próxima | **Final (25%)** |

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
│   ├── usuarios_prueba.md            # Credenciales de demo
│   ├── REGLAS_Y_PERMISOS_DE_ROLES.md
│   ├── INFORME-TECNICO-BASE-DATOS.md
│   ├── DISENO-UI-UX.md
│   ├── evidencias-ev3/               # Capturas CP-01 a CP-13
│   └── diagramas/
│       └── flujo-datos-arquitectura.puml
│
├── Producto/                          # Código fuente y SQL
│   ├── backend/                      # API Express + TypeScript
│   │   ├── src/
│   │   │   ├── routes/              # Definición de endpoints
│   │   │   ├── controllers/         # Lógica de negocio
│   │   │   ├── middleware/          # Auth, RBAC, validación
│   │   │   ├── types/               # TypeScript types
│   │   │   ├── index.ts             # Punto de entrada
│   │   │   └── test-db.ts           # Testing de conexión
│   │   ├── prisma/
│   │   │   └── schema.prisma        # Definición de modelo datos
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
│   │   ├── public/
│   │   ├── package.json
│   │   ├── package-lock.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   └── eslint.config.js
│   │
│   └── database/                     # Scripts SQL
│       ├── create_database_tea_link.sql  # Script de creación de BD
│       └── INSTRUCCIONES_EJECUCION.md    # Guía de ejecución
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

# (Opcional) datos demo: npm run db:seed — solo si necesita resetear la BD

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

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Vercel auto-detecta Vite
npm install -g vercel
vercel
# Seguir prompts interactivos
```

### Backend (Render)
```bash
# Crear cuenta en render.com
# Conectar repositorio GitHub
# Render auto-despliega en cada push a main
```

### Database (Neon)
```bash
# 1. Crear proyecto en neon.tech
# 2. Copiar DATABASE_URL
# 3. Guardar en variables de entorno de Render
# 4. Aplicar migraciones: npx prisma migrate deploy
```

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [Informe final](./Documentacion/INFORME-FINAL-TEA-LINK.md) | Entrega integral EV1–EV3 + cierre |
| [Plan de pruebas EV3](./Documentacion/EV3-PLAN-DE-PRUEBAS.md) | Casos CP-01 a CP-28 y BD de pruebas |
| [Resultados pruebas](./Documentacion/EV3-RESULTADOS-PRUEBAS.md) | Ejecución y capturas |
| [Usuarios de prueba](./Documentacion/usuarios_prueba.md) | Credenciales demo |
| [Reglas y permisos](./Documentacion/REGLAS_Y_PERMISOS_DE_ROLES.md) | RBAC y privacidad |
| [Informe técnico BD](./Documentacion/INFORME-TECNICO-BASE-DATOS.md) | Diseño PostgreSQL |
| [Diseño UI/UX](./Documentacion/DISENO-UI-UX.md) | Paleta y wireframes |

---

## ✨ Características Principales

### 👤 Gestión de Usuarios
- [x] Login seguro (JWT + bcrypt)
- [x] Roles: FAMILIA, EDUCADOR, PROFESIONAL, MEDICO, ADMINISTRADOR, SUPERADMIN
- [x] Control de acceso granular (RBAC) por rol e institución
- [x] Cambio de contraseña inicial obligatorio
- [x] Reset de contraseña temporal por superadmin (administradores) y por admin institucional (equipo operativo)
- [ ] Recuperación de contraseña por correo (futuro)

### 👨‍👩‍👧 Perfiles y equipo interdisciplinario
- [x] Perfiles estudiante por institución
- [x] Vínculo de equipo vía `perfil_usuario` (multi-institucional)
- [x] Información: nombre, edad, diagnóstico, notas

### 📝 Observaciones
- [x] CRUD completo (crear, leer, editar, eliminar propias)
- [x] Privacidad: PUBLICA, MULTINIVEL, PRIVADA
- [x] Categorías: CONDUCTA, COMUNICACION, SOCIAL, ACADEMICO, SENSORIAL, MOTOR, CLINICO, OTRO
- [x] Bitácora con búsqueda, filtros por rol y vistas agrupadas
- [x] Validación frontend y backend (Zod)

### 📊 Reportes
- [x] Generación de informes personalizados
- [x] Exportación PDF y CSV (Excel)
- [x] Selección de observaciones y rango de fechas
- [x] Historial de reportes del usuario

### 🔔 Notificaciones
- [ ] Alertas push o en tiempo real (futuro)
- [x] Feedback visual en formularios e interfaz

---

## 🔐 Seguridad

| Capa | Medida | Implementación |
|------|--------|----------------|
| **Autenticación** | Registro + Login | JWT con 24h expiry |
| **Contraseñas** | Hash seguro | bcrypt (10 rounds) = irreversible |
| **Validación** | Double-layer | Frontend (Zod) + Backend (Zod) |
| **Autorización** | Control de roles | RBAC con middleware |
| **Transporte** | Encriptación | HTTPS/TLS 1.3 |
| **Base de datos** | Integridad | PostgreSQL ACID, Foreign Keys, CASCADE |
| **Inyección SQL** | ORM parametrizado | Prisma previene SQL injection |
| **Headers** | CORS configurado | Pendiente Helmet.js en producción |

---

## 📈 Modelo de Datos

### Entidades Principales

**Usuario** (5 campos)
- id (entero autoincremental, primary key)
- email (unique)
- password_hash (bcrypt)
- rol (ENUM: FAMILIA, EDUCADOR, PROFESIONAL)
- fecha_creacion (timestamp)

**Perfil** (8 campos)
- id, usuario_id (FK), nombre, edad, diagnostico, descripcion, fecha_creacion, fecha_actualizacion

**Observacion** (9 campos)
- id, perfil_id (FK), autor_id (FK), titulo, descripcion, categoria (ENUM), fecha_evento, fecha_creacion, fecha_actualizacion

**Reporte** (7 campos)
- id, usuario_id (FK), titulo, fecha_generacion, formato (PDF/Excel), url_descarga, fecha_expiracion

**ObservacionEnReporte** (tabla intermedia N:N)
- id, reporte_id (FK), observacion_id (FK)

### Relaciones
- Usuario → Perfil (1:N, CASCADE delete)
- Perfil → Observacion (1:N, CASCADE delete)
- Usuario → Observacion (1:N como autor, SET NULL)
- Usuario → Reporte (1:N, CASCADE delete)
- Reporte ↔ Observacion (N:N, tabla intermedia)

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
| DevOps | CI/CD, GitHub Actions, deployment |
| Desarrollo de Interfaces | UI/UX, Tailwind, accesibilidad |
| Gestión de Proyectos | Cronograma, Gantt, riesgos |

---

## 🤝 Contribuciones

Este es un proyecto de titulación individual. Para el futuro (v2.0):
- [ ] Soporte multiidioma (i18n)
- [ ] Integración con sistemas de salud
- [ ] Aplicación móvil (React Native)
- [ ] Videoconferencias integradas
- [ ] IA para análisis predictivo de patrones TEA
- [ ] Integración con calendarios y recordatorios

---

## 📞 Soporte y Contacto

- **Institución:** DuocUC
- **Asignatura:** TPY1101 - Taller Aplicado de Programación
- **Período:** 2026 (Semestre 1)
- **Docentes:** [Maria Ignacia Cobo - Cesar Carrasco]

---

## 🎯 Estado del proyecto

**Última actualización:** Junio 2026  
**Estado:** Producto funcional en entorno local — entrega final  
**Avance funcional estimado:** ~90% del núcleo (auth, roles, perfiles, observaciones, reportes, UI)

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
**Estado:** Entrega final — repositorio documentado  
**Repositorio:** https://github.com/cristianmonsalve14/tea-link
