# EV3 — Pruebas automatizadas (Opción B)

**Proyecto:** TEA Link · **Grupo 12** · **Junio 2026**

Pruebas **unitarias** y de **integración** complementan el plan manual `EV3-PLAN-DE-PRUEBAS.md` (CP-01–CP-13).

---

## 1. Estructura

```
Producto/backend/tests/
  unit/           # ~32 archivos
  integration/    # 7 archivos
  helpers/        # supertest + login

Producto/backend/src/utils/   # lógica extraída para unit tests
  rutChileno.ts, perfilConsentimiento.ts, perfilCustodia.ts, apoderadoPerfil.ts
  superadminPerfilesQuery.ts, superadminStatsQuery.ts, privacidadObservacion.ts, …

Producto/frontend/tests/
  unit/           # 11 archivos
```

| Paquete | Comando | Tests (Jun 2026) |
|---------|---------|------------------|
| Backend | `cd Producto/backend && npm test` | **~176** |
| Frontend | `cd Producto/frontend && npm test` | **42** |
| **Total** | — | **~218** |

Desglose backend aproximado: **~75 % unitarias** + **~25 % integración** (varía según `SKIP_INTEGRATION_TESTS`).

---

## 2. Requisitos

- Node.js 18+
- PostgreSQL con `DATABASE_URL` en `Producto/backend/.env`
- Las integraciones usan datos **aislados** (`@test-auto.tealink.cl`, instituciones `[TEST]*`). No modifican usuarios demo del informe EV3.

Opcional: copiar `.env.test.example` → `.env.test` si usa otra BD.

Para omitir integración (solo unitarias backend):

```bash
set SKIP_INTEGRATION_TESTS=1
npm test
```

---

## 3. Comandos

```bash
# Backend — todo
cd Producto/backend
npm test

# Solo unitarias / integración
npm run test:unit
npm run test:integration

# Cobertura
npm run test:coverage          # unit + integración
npm run test:unit -- --coverage   # solo unitarias

# Regenerar datos de prueba manualmente
npm run test:seed

# Frontend
cd Producto/frontend
npm test
npm run test:coverage
```

---

## 4. Cobertura del plan CP (pruebas funcionales)

| CP | Manual EV3 | Automatizado | Archivo test |
|----|------------|--------------|--------------|
| CP-01 Login OK | ✅ | ✅ | `auth.integration.test.ts` |
| CP-02 Login fallido | ✅ | ✅ | `auth.integration.test.ts` |
| CP-03 Cambio clave | N/A | — | — |
| CP-04 RBAC familia | ✅ | ✅ | `rbac.integration.test.ts` |
| CP-05 Admin sin bitácora | ✅ | ✅ | `rbac.integration.test.ts` |
| CP-06 Familia ve perfil | ✅ | ✅ | `perfiles.integration.test.ts` |
| CP-07 Admin crea perfil | ✅ | ✅ | `perfiles.integration.test.ts` |
| CP-08 Crear obs. pública | ✅ | ✅ | `observaciones.integration.test.ts` |
| CP-09 Validación descripción | ✅ | ✅ | `observaciones.integration.test.ts` + `observacionFormRules.test.ts` |
| CP-10 Educador ve obs. familia | ✅ | ✅ | `privacidad.integration.test.ts` |
| CP-11 Médico ve obs. equipo | ✅ | ✅ | `privacidad.integration.test.ts` |
| CP-12 Familia no ve PRIVADA | ✅ | ✅ | `privacidad.integration.test.ts` |
| CP-13 Profesional MULTINIVEL | ✅ | ✅ | `privacidad.integration.test.ts` |

**Cobertura CP aplicables:** **10 / 12 ≈ 83 %** (CP-03 N/A).

**Cobertura testing total (auto + manual):** ~**55–65 %** automatizado vía API; el resto UI/capturas.

---

## 5. Pruebas unitarias backend

| Módulo | Archivo |
|--------|---------|
| Roles por tipo institución | `institucionRoles.test.ts` |
| Mapeo rol → perfil | `perfilAccess.test.ts` |
| Privacidad por rol | `privacidadObservacion.test.ts` |
| Filtros KPI superadmin | `superadminStatsQuery.test.ts` |
| Middleware `authorizeRoles` | `authMiddleware.test.ts` |
| Reglas observaciones (Zod) | `observacionRules.test.ts` |
| Listado reportes (query) | `reporteListQuery.test.ts` |
| Acceso a reportes | `reporteAccess.test.ts` |
| Login schema | `authValidation.test.ts` |
| Schemas perfil + RUT | `perfilSchemas.test.ts`, `rutChileno.test.ts` |
| Consentimiento / apoderados | `perfilConsentimiento.test.ts`, `apoderadoPerfil.test.ts` |
| Custodia / colaboración | `solicitudInstitucionRules.test.ts`, `perfilCustodia` (frontend) |
| Registro perfiles superadmin | `superadminPerfilesQuery.test.ts` |
| Errores API | `apiError.test.ts` |

## 6. Pruebas unitarias frontend

| Módulo | Archivo |
|--------|---------|
| Sesión / JWT local | `auth.test.ts` |
| Errores API | `parseApiError.test.ts` |
| Validación descripción (CP-09) | `observacionFormRules.test.ts` |
| RUT chileno (formularios) | `rutChileno.test.ts` |
| Reglas consentimiento / equipo | `perfilEquipoAsignacion.test.ts`, `institucionInvitable.test.ts` |

## 7. Integración API (supertest)

| Suite | Contenido |
|-------|-----------|
| `auth.integration` | Login, token, 401/403 |
| `rbac.integration` | Familia vs superadmin, admin sin obs. |
| `perfiles.integration` | Listado familia, creación admin |
| `observaciones.integration` | Crear PUBLICA, validación Zod |
| `privacidad.integration` | PUBLICA / PRIVADA / MULTINIVEL |
| `superadmin.integration` | Stats, filtros, auditoría |

---

## 8. Cobertura de código (referencia)

Última medición — **mayo 2026**:

| Paquete | Alcance | Líneas (aprox.) |
|---------|---------|-----------------|
| Backend | Solo unitarias (`tests/unit`) | **~8 %** global · **~27 %** en `src/utils` |
| Backend | Unit + integración (`npm run test:coverage`) | **~28 %** global |
| Frontend | Solo unitarias (`src/utils`) | **~84 %** |

Utils con mayor cobertura unitaria: `superadminStatsQuery`, `reporteListQuery`, `apiError` (**100 %**); `perfilAccess`, `observacionRules`, `institucionRoles` (**75–82 %**).

La meta EV3 es **cobertura del plan de pruebas (>50 % automatizado)**, no 80 % de líneas en todo el repo. La extracción a `src/utils/` concentra tests en reglas de negocio testeables sin Prisma.

---

## 9. Evidencia para informe

1. Captura de `npm test` en backend (**~176 passed**).
2. Captura de `npm test` en frontend (**42 passed**).
3. Tabla CP ↔ tests (sección 4).
4. Capturas manuales en `Documentacion/evidencias-ev3/` (CP-01 a CP-13).
5. Capturas `Captura-14.png` y `Captura-15.png` — salida de `npm test` backend/frontend.

---

## 10. Control de versiones

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 1.0 | Junio 2026 | Implementación Opción B — 56 tests |
| 1.2 | Junio 2026 | Ampliación: RUT, custodia, registro perfiles — **~218 tests** total |
