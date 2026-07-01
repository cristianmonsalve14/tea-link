# Despliegue y CI/CD — TEA Link

Stack de producción acordado: **Vercel** (frontend) + **Neon** (PostgreSQL) + **Render Free** (backend en Docker) + **GitHub Actions** (CI).

## Arquitectura

```
git push main → GitHub Actions (tests)
             → Vercel (build frontend automático)
             → Render (build Docker API automático)
API (Render) → Neon (DATABASE_URL + prisma migrate deploy al arrancar)
Navegador → Vercel → fetch(VITE_API_URL)
```

**Render Free:** la API puede **dormir** tras ~15 min sin peticiones. La primera visita la **despierta sola** (30 s–2 min). No requiere reinicio manual.

---

## 1. Requisitos previos en código (ya en el repo)

- `Producto/frontend/src/config/api.ts` — `VITE_API_URL`
- `Producto/backend/Dockerfile` + `scripts/docker-entrypoint.sh` (`prisma migrate deploy`)
- `CORS_ORIGIN` en el backend
- `.github/workflows/ci.yml`

---

## 2. Neon (base de datos)

1. Crear cuenta en [neon.tech](https://neon.tech) → proyecto `tea-link-prod`.
2. Copiar **Connection string** (`postgresql://...?sslmode=require`).
3. En tu PC (una sola vez), aplicar esquema y datos de demo:

```powershell
cd Producto\backend
$env:DATABASE_URL="postgresql://..."
npx prisma migrate deploy
npm run db:seed
# Opcional catálogo MINEDUC/DEIS:
npm run catalog:import
```

Usuarios de prueba: `Documentacion/usuarios_prueba.md`.

---

## 3. Render (backend — plan Free)

1. [render.com](https://render.com) → **New Web Service** → conectar repo GitHub.
2. **Root Directory:** `Producto/backend`
3. **Environment:** Docker (usa el `Dockerfile` del repo).
4. **Plan:** Free.
5. Variables de entorno:

| Variable | Valor |
|----------|--------|
| `DATABASE_URL` | URL de Neon |
| `JWT_SECRET` | string largo aleatorio |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | URL de Vercel (ver paso 4) |
| `PORT` | `3000` |

6. **Health Check Path:** `/health`
7. Deploy → anotar URL, p. ej. `https://tea-link-api.onrender.com`

Alternativa: usar `Producto/backend/render.yaml` como Blueprint.

---

## 4. Vercel (frontend)

1. [vercel.com](https://vercel.com) → importar repo.
2. **Root Directory:** `Producto/frontend`
3. Framework: Vite.
4. Variable de entorno (build):

| Variable | Valor |
|----------|--------|
| `VITE_API_URL` | URL de Render **sin** barra final, p. ej. `https://tea-link-api.onrender.com` |

5. Deploy → copiar URL, p. ej. `https://tea-link.vercel.app`
6. Volver a Render y actualizar `CORS_ORIGIN` con la URL exacta de Vercel.
7. En Vercel, **Redeploy** si cambiaste `VITE_API_URL`.

---

## 5. Automatización (CD)

Con el repo conectado:

| Evento | Qué ocurre |
|--------|------------|
| `push` a `main` | Vercel y Render redeployan automáticamente |
| Arranque del contenedor | `prisma migrate deploy` aplica migraciones en Neon |
| `push` / PR | GitHub Actions ejecuta tests |

**No es automático:** seed inicial, import de catálogo, crear cuentas en Vercel/Neon/Render.

---

## 6. Docker local (opcional)

Desde la raíz del repo:

```bash
docker compose up --build
```

- API: http://localhost:3000  
- Postgres: localhost:5432  

El frontend en desarrollo sigue con `npm run dev` en `Producto/frontend` (puerto 5173).

---

## 7. CI (GitHub Actions)

Workflow: `.github/workflows/ci.yml`

- Backend: Postgres efímero, `migrate deploy`, `test:seed`, `npm test`, build Docker.
- Frontend: `npm test` + `npm run build`.

Activar en GitHub → Settings → Branches → proteger `main` → require checks `backend` y `frontend` (opcional).

---

## 8. Checklist antes de la defensa

- [ ] Login superadmin en URL de Vercel
- [ ] `GET https://...onrender.com/health` → OK
- [ ] Escenario demo (`usuarios_prueba.md` #5)
- [ ] 2–3 min antes de presentar: abrir app o `/health` (despertar API en plan Free)
- [ ] Captura del workflow CI en verde

---

## 9. Variables de referencia

Ver `Producto/backend/.env.example` y `Producto/frontend/.env.example`.

**Nunca** commitear `.env` con secretos reales.
