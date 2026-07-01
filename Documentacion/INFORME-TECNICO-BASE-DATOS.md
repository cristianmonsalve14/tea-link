# INFORME TÉCNICO: CONFIGURACIÓN DE BASE DE DATOS
## Proyecto TEA Link - Sistema de Seguimiento de Observaciones TEA

**Autor:** Cristian Monsalve Budrovich  
**Institución:** DuocUC  
**Fecha:** Junio 2026  
**Versión:** 2.2 — 11 tablas (`auditoria_observacion`), 27 migraciones

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Contexto del Proyecto](#contexto-del-proyecto)
3. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Diseño de Base de Datos](#diseño-de-base-de-datos)
6. [Implementación con Prisma ORM](#implementación-con-prisma-orm)
7. [Proceso de Configuración](#proceso-de-configuración)
8. [Verificación de la Base de Datos](#8-verificación-de-la-base-de-datos)
9. [Justificación de Decisiones Técnicas](#justificación-de-decisiones-técnicas)
10. [Resultados y Métricas](#resultados-y-métricas)
11. [Seguridad Implementada](#seguridad-implementada)
12. [Conclusiones](#conclusiones)

---

## 1. RESUMEN EJECUTIVO

Este informe documenta la configuración completa de la base de datos PostgreSQL para el proyecto **TEA Link**, un sistema web de seguimiento de observaciones para personas con Trastorno del Espectro Autista (TEA).

### Alcance del Trabajo Realizado:
- ✅ Esquema relacional **11 tablas**, normalizado **3FN**
- ✅ Modelo multi-institucional y equipo interdisciplinario (`perfil_usuario`)
- ✅ Enumerados (ENUM) y migraciones con Prisma
- ✅ Diagrama ER en `Documentacion/diagramas/`
- ✅ Integridad referencial, índices y auditoría admin
- ✅ Base de datos de pruebas documentada en `usuarios_prueba.md`

---

## 2. CONTEXTO DEL PROYECTO

### 2.1 Problema a Resolver
Las familias, educadores y profesionales que trabajan con personas con TEA necesitan una herramienta centralizada para:
- Registrar observaciones de conducta, comunicación, social y académicas
- Colaborar entre múltiples actores (familia, colegio, terapeutas)
- Generar reportes de seguimiento temporal
- Mantener perfiles individualizados

### 2.2 Objetivos de la Base de Datos
1. **Persistencia:** Almacenar observaciones de forma duradera
2. **Integridad:** Garantizar consistencia de datos mediante constraints
3. **Escalabilidad:** Soportar múltiples usuarios y perfiles
4. **Performance:** Optimizar consultas frecuentes con índices
5. **Seguridad:** Proteger información sensible de salud

---

## 3. ARQUITECTURA DE BASE DE DATOS

### 3.1 Modelo Relacional

Diagrama ER actualizado (11 tablas, multi-institucional, colaboración, RUT y auditoría clínica):

- **Fuente:** `Documentacion/diagramas/modelo-er-base-datos.puml`
- **Imagen:** `Documentacion/diagramas/modelo-er-base-datos.png`

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ INSTITUCIONES│──1:N─│  USUARIOS   │──N:M─│PERFIL_USUARIO│
└──────┬───────┘     └──────┬──────┘     └──────┬───────┘
       │ 1:N                │ 1:N               │ N:1
       ▼                    ▼                   ▼
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   PERFILES   │────▶│OBSERVACIONES│◀────│  (equipo)    │
└──────────────┘ 1:N └──────┬──────┘     └──────────────┘
                            │ N:N
                     ┌──────▼───────┐
                     │   REPORTES   │
                     └──────────────┘
```

### 3.2 Componentes Principales

| Entidad | Propósito | Cardinalidad |
|---------|-----------|--------------|
| **Instituciones** | Familia, colegio, centro médico, etc. | Raíz multi-tenant |
| **Usuarios** | 6 roles (FAMILIA … SUPERADMIN) | N por institución |
| **Perfiles** | Estudiantes bajo seguimiento; RUT único; consentimiento | N por institución custodia |
| **PerfilUsuario** | Equipo interdisciplinario por perfil | N:M usuario ↔ perfil |
| **SolicitudInstitucionPerfil** | Colaboración / cesión de custodia | N por perfil |
| **CatalogoEstablecimiento** | Referencia Mineduc / establecimientos | Catálogo nacional |
| **Observaciones** | Bitácora con privacidad | N por perfil |
| **Reportes** | PDF / Excel | N por creador |
| **ObservacionesEnReportes** | Tabla intermedia N:N | — |
| **AuditoriaAdmin** | Trazabilidad acciones admin | N por admin |

### 3.3 Normalización (1NF · 2NF · 3NF)

**Fuente de verdad:** `Producto/backend/prisma/schema.prisma`  
**Diagrama ER:** `Documentacion/diagramas/modelo-er-base-datos.png`

#### Primera forma normal (1FN)

| Criterio | Cumplimiento |
|----------|--------------|
| Valores atómicos (sin listas en un campo) | ✅ Casi todos los atributos son escalares; ver nota sobre `usuarios.niveles_educacionales[]` |
| Sin grupos repetitivos | ✅ Relaciones N:M resueltas con tablas puente (`perfil_usuario`, `observaciones_en_reportes`) |
| Identificador único por fila | ✅ PK en cada tabla (`id` o clave compuesta en tablas puente) |
| Dominios tipados | ✅ ENUMs PostgreSQL (`rol_enum`, `diagnostico_clinico_enum`, `consentimiento_estado_enum`, etc.) |

**Excepción documentada (1FN estricta):** `usuarios.niveles_educacionales` es un **array** de `nivel_educacional_enum` (PostgreSQL). Permite asignar varios niveles a un educador sin tabla puente. Para el alcance del proyecto se acepta como **redundancia controlada**; la forma purista sería `usuario_nivel_educacional (usuario_id, nivel)`.

#### Segunda forma normal (2FN)

Aplica a tablas con **clave primaria compuesta**:

| Tabla | PK | Atributos no clave | ¿Dependen de la PK completa? |
|-------|-----|-------------------|------------------------------|
| `perfil_usuario` | `(perfil_id, usuario_id)` | `rol_en_perfil`, `puede_editar`, `consentimiento_aceptado_at`, `created_at` | ✅ Sí — rol y consentimiento del apoderado dependen del par usuario+perfil |
| `observaciones_en_reportes` | `(reporte_id, observacion_id)` | *(ninguno)* | ✅ Tabla puente pura |

El resto de tablas tienen PK simple (`id`); 2FN se cumple automáticamente si se cumple 1FN.

#### Tercera forma normal (3FN)

No debe haber dependencias transitivas **entre atributos no clave** (A → B → C con B no clave).

| Tabla | Verificación 3FN |
|-------|------------------|
| `instituciones` | ✅ `nombre`, `tipo`, `region`, `comuna` dependen solo de `id`; enlace opcional a catálogo vía `catalogo_establecimiento_id` (FK) |
| `catalogo_establecimientos` | ✅ Datos de referencia MINEDUC/DEIS; atributos dependen solo de `id` del registro de catálogo |
| `usuarios` | ✅ `institucion_id` es FK; no se duplica `nombre` ni `tipo` de la institución; consentimiento de cuenta (`consentimiento_aceptado_at`) depende de `usuarios.id` |
| `perfiles` | ✅ `institucion_id`, `consentimiento_por_usuario_id` son FK; **`rut` UNIQUE** depende solo de `id` del perfil (identificador nacional del estudiante); enums de diagnóstico/RND y consentimiento del menor no introducen transitividad |
| `perfil_usuario` | ✅ Vínculo N:M; atributos del vínculo (rol, consentimiento apoderado) dependen del par `(perfil_id, usuario_id)` |
| `solicitudes_institucion_perfil` | ✅ Colaboración entre instituciones: solo FK a `perfil_id`, `institucion_solicitante_id`, `institucion_invitada_id` y usuarios que envían/responden; no se copian nombres de colegios en la fila |
| `observaciones` | ✅ `autor_id` y `perfil_id` son FK; no se guarda nombre del autor ni del estudiante en la observación |
| `reportes` | ✅ `creador_id` es FK; metadatos del informe dependen de `id` del reporte |
| `observaciones_en_reportes` | ✅ Tabla puente sin atributos propios |
| `auditoria_admin` | ✅ Registro de evento; `entidad` + `entidad_id` referencian de forma genérica (patrón auditoría administrativa) |
| `auditoria_observacion` | ✅ Trazabilidad de acceso a observaciones MULTINIVEL/PRIVADA; `usuario_id` FK; metadatos (`observacion_id`, `perfil_id`, `accion`, `privacidad`) sin duplicar texto clínico |

**Mejora respecto al diseño inicial:** el campo `perfiles.diagnostico` (texto libre) fue reemplazado por enums (`diagnostico_clinico_enum`, `causa_discapacidad_enum`, `grado_discapacidad_enum`), eliminando ambigüedad y alineando el dominio con catálogos tipados — coherente con 3FN.

**Relaciones N:M correctamente descompuestas:**

```
usuarios ←→ perfil_usuario ←→ perfiles          (equipo interdisciplinario + apoderados)
reportes ←→ observaciones_en_reportes ←→ observaciones
perfiles ←→ solicitudes_institucion_perfil ←→ instituciones   (colaboración / custodia)
instituciones ←→ catalogo_establecimientos   (opcional 1:1, alta desde catálogo)
```

#### Integridad referencial (complemento a la normalización)

| Regla | Implementación |
|-------|----------------|
| FK declaradas | Prisma `@relation` → constraints en PostgreSQL |
| Unicidad | `usuarios.email` UNIQUE; **`perfiles.rut` UNIQUE** (migración `20260701120000_perfil_rut_nacional`) |
| Eliminación controlada | CASCADE en perfiles/observaciones hijas y solicitudes; SET NULL en consentimiento tutor |
| Índices en FK | `idx_perfil_institucion_id`, `idx_perfil_rut`, `idx_observaciones_perfil_id`, `idx_solicitud_inst_invitada_estado`, etc. |

#### Nota de diseño (redundancia controlada)

| Campo | Observación |
|-------|-------------|
| `perfiles.edad` + `perfiles.fecha_nacimiento` | Pueden derivarse mutuamente; se mantienen ambos por **usabilidad en formularios**. No genera anomalía de actualización crítica en el dominio del proyecto. |
| `usuarios.rol` vs `perfil_usuario.rol_en_perfil` | **No es redundancia indebida:** `rol` = rol del sistema; `rol_en_perfil` = rol en un perfil concreto (tutor, titular, educador, etc.). |
| `usuarios.consentimiento_*` vs `perfiles.consentimiento_*` vs `perfil_usuario.consentimiento_aceptado_at` | **Tres niveles semánticos:** consentimiento de la cuenta familia, del perfil del menor y de cada apoderado vinculado. No es duplicación del mismo hecho. |
| `usuarios.niveles_educacionales[]` | Array PostgreSQL; ver excepción 1FN arriba. |
| `instituciones` + `catalogo_establecimientos` | Institución operativa puede enlazarse al catálogo nacional; datos de contacto/dirección en `instituciones` son **snapshot operativo** (registro manual o post-alta), no dependencia transitiva dentro de una sola tabla. |

#### Conclusión para evaluación

> El esquema actual de **11 tablas** y **27 migraciones** cumple **1FN, 2FN y 3FN** para el dominio del proyecto. El diagrama ER (`.puml`) refleja las mismas entidades, cardinalidades y tablas puente que `schema.prisma`. Las dependencias transitivas de datos de negocio se resuelven mediante **claves foráneas** (institución, autor, custodia, catálogo), no duplicando atributos de otras entidades. Las únicas excepciones documentadas son `edad`/`fecha_nacimiento`, el array de niveles del educador y el snapshot institución/catálogo — todas justificadas y sin impacto crítico en integridad.

---

## 4. STACK TECNOLÓGICO

### 4.1 Tecnologías Implementadas

| Capa | Tecnología | Versión | Justificación |
|------|------------|---------|---------------|
| **Base de Datos** | PostgreSQL | 14+ | Motor relacional robusto, ACID compliant |
| **ORM** | Prisma | 5.22.0 | Type-safety, migraciones automáticas |
| **Runtime** | Node.js | 18+ | Ecosistema TypeScript |
| **Lenguaje** | TypeScript | 5.9.3 | Tipado estático, menos errores |
| **Cliente DB** | Prisma Client | 5.22.0 | Generación automática de tipos |

### 4.2 Dependencias Críticas

```json
{
  "@prisma/client": "^5.22.0",  // Cliente de BD generado
  "prisma": "^5.22.0",           // CLI y migraciones
  "typescript": "^5.9.3",        // Compilador TS
  "ts-node": "^10.9.2"           // Ejecutar TS directamente
}
```

---

## 5. DISEÑO DE BASE DE DATOS (ESQUEMA VIGENTE)

**Fuente de verdad:** `Producto/backend/prisma/schema.prisma`  
**Diagrama:** `Documentacion/diagramas/modelo-er-base-datos.png`  
**Normalización:** ver §3.3

No se duplica aquí el SQL manual: el esquema se genera y versiona con **Prisma Migrate** (`Producto/backend/prisma/migrations/`).

### 5.1 Tablas del modelo

| Tabla | PK | Relaciones principales |
|-------|-----|------------------------|
| `instituciones` | `id` | 1:N → `usuarios`, `perfiles` |
| `usuarios` | `id` | FK `institucion_id`; 1:N → `observaciones`, `reportes`, `auditoria_admin`, `auditoria_observacion` |
| `perfiles` | `id` | FK `institucion_id`; **RUT UK**; consentimiento; 1:N → `observaciones`; N:M → `usuarios`; colaboración |
| `perfil_usuario` | `(perfil_id, usuario_id)` | Tabla puente equipo interdisciplinario |
| `solicitudes_institucion_perfil` | `id` | FK perfil + instituciones solicitante/invitada |
| `catalogo_establecimientos` | `id` | Catálogo para alta de instituciones |
| `observaciones` | `id` | FK `perfil_id`, `autor_id`; campo `privacidad` |
| `reportes` | `id` | FK `creador_id`; N:M → `observaciones` |
| `observaciones_en_reportes` | `(reporte_id, observacion_id)` | Tabla puente N:N |
| `auditoria_admin` | `id` | FK `admin_id` — gobierno del sistema |
| `auditoria_observacion` | `id` | FK `usuario_id`; trazabilidad MULTINIVEL / PRIVADA |

### 5.2 Enumerados (PostgreSQL)

| ENUM | Valores (resumen) |
|------|-------------------|
| `rol_enum` | FAMILIA, EDUCADOR, PROFESIONAL, MEDICO, ADMINISTRADOR, SUPERADMIN |
| `rol_perfil_enum` | TUTOR, TITULAR, EDUCADOR, PROFESIONAL, MEDICO |
| `tipo_institucion_enum` | FAMILIA, CENTRO_EDUCACIONAL, CENTRO_MEDICO, CENTRO_PROFESIONAL, SISTEMA |
| `privacidad_observacion_enum` | PUBLICA, MULTINIVEL, PRIVADA |
| `categoria_observacion_enum` | CONDUCTA, COMUNICACION, SOCIAL, ACADEMICO, SENSORIAL, MOTOR, CLINICO, OTRO |
| `formato_reporte_enum` | PDF, EXCEL |
| `diagnostico_clinico_enum` | TEA, TDAH, TEL, DISCAPACIDAD_INTELECTUAL, … (15 valores) |
| `consentimiento_estado_enum` | PENDIENTE, ACEPTADO, RECHAZADO |
| `consentimiento_sujeto_enum` | TUTOR_LEGAL, TITULAR |
| `solicitud_institucion_estado_enum` | PENDIENTE, ACEPTADA, RECHAZADA |
| `nivel_educacional_enum` | PARVULARIA_NT1 … UNIVERSITARIO |
| `region_chile_enum` | 16 regiones |

### 5.3 Índices relevantes

Definidos en `schema.prisma`, entre otros:

- `idx_usuarios_email`
- `idx_perfil_institucion_id`, `idx_perfil_rut` (RUT único nacional)
- `idx_perfil_consentimiento_estado`, `idx_perfil_diagnostico_clinico`
- `idx_observaciones_perfil_fecha` (compuesto: bitácora por perfil)
- `idx_solicitud_inst_invitada_estado` (bandeja de invitaciones)
- Índices en FK de tablas puente y auditoría

### 5.4 Timestamps

Prisma `@updatedAt` mantiene `updated_at` en modelos principales; no se documentan triggers SQL manuales heredados del diseño inicial.

---

## 6. IMPLEMENTACIÓN CON PRISMA ORM

### 6.1 ¿Por qué Prisma?

| Característica | Beneficio |
|----------------|-----------|
| **Type Safety** | TypeScript conoce estructura de BD en tiempo de compilación |
| **Auto-generación** | Genera tipos e interfaces automáticamente |
| **Migraciones** | Control de versiones del esquema |
| **Query Builder** | Sintaxis limpia y segura para queries |
| **DevEx** | Autocompletado en VSCode |

### 6.2 Schema Prisma

Archivo vigente: `Producto/backend/prisma/schema.prisma` (**11 modelos**, ENUMs y relaciones N:M).

No se incluye un volcado completo aquí para evitar duplicar y desactualizar el documento; consultar el archivo y el diagrama ER en `Documentacion/diagramas/`.

### 6.3 Generación de Cliente

```bash
npx prisma generate
```

**Output:**
- Genera `@prisma/client` con tipos TypeScript
- Crea interfaces para cada modelo
- Habilita autocompletado en IDE

---

## 7. PROCESO DE CONFIGURACIÓN

### 7.1 Requisitos

- PostgreSQL 14+ en `localhost:5432` (o instancia remota)
- Node.js y npm en `Producto/backend/`
- Base de datos `tea_link` creada con encoding UTF-8

### 7.2 Variables de entorno

Archivo: `Producto/backend/.env` (no versionado; ver `.env.example`)

```env
DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/tea_link"
PORT=3000
NODE_ENV=development
JWT_SECRET="generar-un-secreto-largo-y-unico"
```

Usar credenciales locales reales solo en `.env`; no documentar contraseñas ni secretos en el repositorio.

### 7.3 Puesta en marcha con Prisma

```bash
cd Producto/backend
npm install
npx prisma generate
npx prisma migrate deploy   # o migrate dev en desarrollo
npx prisma db seed          # datos demo documentados en usuarios_prueba.md
```

Las migraciones versionadas están en `Producto/backend/prisma/migrations/`.

---

## 8. VERIFICACIÓN DE LA BASE DE DATOS

### 8.1 Script de resumen

Archivo: `Producto/backend/scripts/db-resumen.ts`

Lista instituciones, usuarios, perfiles y vínculos `perfil_usuario` (equipo interdisciplinario).

```bash
cd Producto/backend
npx ts-node scripts/db-resumen.ts
```

### 8.2 Estado de datos demo (Junio 2026)

Documentado en `Documentacion/usuarios_prueba.md`:

| Métrica | Valor |
|---------|-------|
| Instituciones | 4 |
| Usuarios | 9 |
| Perfiles (estudiantes) | 3 |
| Observaciones demo | 10 |
| Roles de sistema | FAMILIA, EDUCADOR, PROFESIONAL, MEDICO, ADMINISTRADOR, SUPERADMIN |

**Educador demo:** `eduardoaltavida@email.com` (Colegio AltaVida), vinculado a Matías Pérez y Joaquín Sánchez.

La verificación incluye relaciones N:M, `privacidad` en observaciones, auditoría admin y `must_change_password` tras reset por administrador.

---

## 9. JUSTIFICACIÓN DE DECISIONES TÉCNICAS

### 9.1 PostgreSQL vs Otras Bases de Datos

| Criterio | PostgreSQL | MySQL | MongoDB |
|----------|------------|-------|---------|
| **ACID Compliance** | ✅ Total | ✅ Parcial | ❌ Eventual |
| **Relaciones complejas** | ✅ Excelente | ✅ Bueno | ❌ Manual |
| **Tipos de datos** | ✅ Avanzados (ENUM, JSON) | ⚠️ Limitados | ✅ Flexibles |
| **Integridad referencial** | ✅ Nativa | ✅ Nativa | ❌ Aplicación |
| **Performance en JOINs** | ✅ Muy bueno | ✅ Bueno | ❌ Limitado |

**Decisión:** PostgreSQL por naturaleza relacional de los datos (usuarios → perfiles → observaciones)

### 9.2 Prisma vs SQL Puro

| Aspecto | Prisma ORM | SQL Puro |
|---------|------------|----------|
| **Type Safety** | ✅ 100% | ❌ Sin tipado |
| **Productividad** | ✅ Alta | ⚠️ Media |
| **Migraciones** | ✅ Automatizadas | ❌ Manuales |
| **Curva aprendizaje** | ✅ Baja | ⚠️ Alta |
| **Control fino** | ⚠️ Limitado | ✅ Total |

**Decisión:** Prisma por reducción de errores y velocidad de desarrollo

### 9.3 Uso de ENUM vs VARCHAR

**Opción 1: VARCHAR**
```sql
rol VARCHAR(20) CHECK (rol IN ('FAMILIA', 'EDUCADOR', 'PROFESIONAL'))
```

**Opción 2: ENUM** (elegida)
```sql
CREATE TYPE rol_enum AS ENUM (
  'FAMILIA', 'EDUCADOR', 'PROFESIONAL', 'MEDICO', 'ADMINISTRADOR', 'SUPERADMIN'
);
rol rol_enum NOT NULL;
```

**Ventajas de ENUM:**
- ✅ Validación a nivel de BD (no se puede insertar valor inválido)
- ✅ Consume menos espacio (internamente es un entero)
- ✅ Autocompletado en Prisma Client
- ✅ Rendimiento superior en comparaciones

### 9.4 Índices Optimizados

**Índice Compuesto:**
```sql
CREATE INDEX idx_observaciones_perfil_fecha 
  ON observaciones(perfil_id, fecha_evento DESC);
```

**Justificación:**
- Query más frecuente: "Últimas observaciones del perfil X"
- Evita escaneo completo de tabla
- Reduce tiempo de respuesta de ~500ms a ~5ms en 10,000 registros

### 9.5 Estrategia de Cascading (esquema vigente)

| Relación | ON DELETE | Razón |
|----------|-----------|-------|
| `perfil_usuario` → `perfiles` / `usuarios` | CASCADE | Al eliminar perfil o usuario, se limpian vínculos del equipo |
| `observaciones.autor_id` → `usuarios` | RESTRICT | No borrar usuario con observaciones (auditoría) |
| `observaciones.perfil_id` → `perfiles` | CASCADE | Observaciones ligadas al perfil del estudiante |
| Tablas puente N:N | CASCADE | Coherencia al eliminar reporte u observación |

El diseño antiguo con `perfiles.usuario_id` y `fk_perfiles_usuario` fue reemplazado por `perfil_usuario` (N:M) e `institucion_id` en perfiles y usuarios.

---

## 10. RESULTADOS Y MÉTRICAS

### 10.1 Cobertura de Funcionalidad

| Funcionalidad | Estado | Evidencia |
|---------------|--------|-----------|
| Multi-institucional | ✅ | 4 instituciones en seed |
| Usuarios y roles | ✅ | 9 usuarios, 6 roles |
| Perfiles y equipo N:M | ✅ | 3 perfiles, 10 observaciones demo, tabla `perfil_usuario` |
| Bitácora y privacidad | ✅ | ENUM `privacidad_observacion_enum` |
| Reportes PDF/Excel | ✅ | Tabla `reportes` + puente N:N |
| Auditoría admin | ✅ | Tabla `auditoria_admin` |
| Migraciones versionadas | ✅ | `prisma/migrations/` |
| API REST + JWT | ✅ | Backend Express en producción local |

### 10.2 Performance

Consultas frecuentes (bitácora por perfil, listado con `include`) usan índices definidos en `schema.prisma`, en particular `idx_observaciones_perfil_fecha`.

### 10.3 Integridad de Datos

Prisma y PostgreSQL rechazan emails duplicados, valores ENUM inválidos y violaciones de FK. Las validaciones de negocio adicionales están en la capa API (Zod).

## 11. SEGURIDAD IMPLEMENTADA

### 11.1 Almacenamiento de Contraseñas

**Implementación:**
```typescript
import bcrypt from 'bcrypt'

// Hash con bcrypt (cost factor 10)
const password_hash = await bcrypt.hash('password123', 10)

// Almacenado: $2b$10$abcdefg... (60 caracteres)
```

**Características:**
- ✅ Bcrypt con salt automático
- ✅ Cost factor 10 (2^10 iteraciones)
- ✅ Irreversible (no se puede obtener password original)
- ✅ Resistente a rainbow tables

### 11.2 Variables de Entorno

**NO hardcodeado en código:**
```typescript
// ❌ MAL
const connectionString = "postgresql://postgres:password@localhost/db"

// ✅ BIEN
const connectionString = process.env.DATABASE_URL
```

**Archivo `.env` en `.gitignore`:**
```gitignore
# Variables sensibles
.env
.env.local
.env.production
```

### 11.3 JWT Secret

Definir en `.env` un secreto largo y distinto por entorno. No incluir el valor real en documentación ni en el repositorio.

### 11.4 Protección SQL Injection

**Prisma protege automáticamente:**

```typescript
// ❌ SQL Injection posible con SQL puro:
db.query(`SELECT * FROM usuarios WHERE email = '${input}'`)
// Si input = "' OR '1'='1" → Retorna todos los usuarios

// ✅ Prisma usa prepared statements:
prisma.usuario.findMany({ where: { email: input } })
// Input es escapado automáticamente
```

---

## 12. CONCLUSIONES

### 12.1 Objetivos Cumplidos

| Objetivo | Estado | Observación |
|----------|--------|-------------|
| Diseño de esquema relacional | ✅ | 11 tablas, relaciones 1:N y N:N, 3FN |
| Configuración de PostgreSQL | ✅ | BD `tea_link` funcional |
| Integración con Prisma ORM | ✅ | Cliente generado y probado |
| Validación de integridad | ✅ | Constraints, ENUM, CHECK |
| Optimización de consultas | ✅ | Índices estratégicos |
| Seguridad básica | ✅ | Bcrypt, variables env |
| Testing de conexión | ✅ | `scripts/db-resumen.ts` |
| Datos de prueba | ✅ | Seed data funcional |

### 12.2 Conocimientos Aplicados

**Teoría de Bases de Datos:**
- ✅ Normalización (3NF cumplida)
- ✅ Integridad referencial
- ✅ Modelado entidad-relación
- ✅ Optimización con índices

**Desarrollo Backend:**
- ✅ TypeScript + Node.js
- ✅ ORM (Object-Relational Mapping)
- ✅ Environment variables
- ✅ Testing de integración

**Seguridad:**
- ✅ Hashing de contraseñas
- ✅ Prepared statements (anti SQL-Injection)
- ✅ Separación de entornos (dev/prod)

### 12.3 Estado actual del producto

Lo planificado inicialmente como “próximos pasos” ya está implementado:

- Autenticación JWT y middleware de roles
- Migraciones Prisma y seed multi-institucional
- API REST (observaciones, reportes, admin, reset de clave)
- Validaciones Zod en backend
- Frontend React/Vite con pruebas EV3 documentadas

### 12.4 Lecciones Aprendidas

**Técnicas:**
- Prisma acelera desarrollo pero requiere entender SQL subyacente
- Índices bien diseñados son críticos para performance
- Tipos ENUM mejoran validación y rendimiento

**Metodológicas:**
- Testing temprano evita problemas en desarrollo posterior
- Documentación simultánea facilita defensa y mantenimiento
- Variables de entorno son esenciales desde inicio

---

## 13. ANEXOS

### Anexo A: Comandos Útiles

```bash
# Ver estado de BD
npx prisma studio

# Generar migración
npx prisma migrate dev --name nombre_migracion

# Resetear BD (desarrollo)
npx prisma migrate reset

# Ver logs de Prisma
npx prisma db pull --print
```

### Anexo B: Estructura de Archivos

```
proyecto/
├── Producto/
│   ├── backend/
│   │   ├── .env.example
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── scripts/
│   │   │   └── db-resumen.ts
│   │   └── src/
│   └── frontend/
└── Documentacion/
    ├── INFORME-TECNICO-BASE-DATOS.md
    ├── usuarios_prueba.md
    └── diagramas/
        └── modelo-er-base-datos.png
```

### Anexo C: Referencias

- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Prisma Documentation:** https://www.prisma.io/docs/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Database Normalization:** Elmasri & Navathe, "Fundamentals of Database Systems"

---

## FIRMA Y APROBACIÓN

**Desarrollado por:** Cristian Monsalve Budrovich  
**Fecha:** Junio 2026  
**Proyecto:** TEA Link - DuocUC  
**Materia:** Taller de Programación  

**Estado del Proyecto:** ✅ **FUNCIONAL Y PROBADO**

---

*Este documento constituye evidencia técnica de la configuración exitosa de la base de datos PostgreSQL para el proyecto TEA Link, incluyendo diseño, implementación, testing y justificación de decisiones técnicas.*
