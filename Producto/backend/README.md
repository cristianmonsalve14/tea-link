# Backend - TEA Link

Este directorio contiene el codigo fuente de la API REST de TEA Link, desarrollada con **Node.js, Express, TypeScript, Prisma y PostgreSQL**.

Para la vision general del proyecto, objetivos, arquitectura y alcance proyectado, revisar el [README principal](../../README.md).

## Funcionalidades principales

- Autenticacion con JWT y contrasenas cifradas con bcrypt.
- Control de acceso basado en roles: SUPERADMIN, ADMINISTRADOR, EDUCADOR, FAMILIA, PROFESIONAL y MEDICO.
- Gestion de instituciones, administradores institucionales, perfiles, educadores, observaciones y reportes.
- **RUT unico** por estudiante, consentimiento, apoderados (hasta 3), colaboracion interinstitucional y cesion de custodia.
- **Registro perfiles** para superadmin (`GET /api/auth/superadmin/perfiles`).
- Separacion de datos por institucion y por privacidad de observaciones.
- Auditoria de acciones administrativas relevantes.
- Generacion inicial de reportes en PDF/CSV.

## Tecnologias

- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt
- Zod
- pdfkit

## Configuracion local

Instalar dependencias:

```powershell
npm install
```

Crear un archivo `.env` en `Producto/backend` con las variables necesarias:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/tea_link"
JWT_SECRET="clave_segura_para_desarrollo"
PORT=3000
```

> No subir credenciales reales al repositorio.

## Base de datos

Ejecutar migraciones Prisma:

```powershell
npx prisma migrate dev
```

Cargar datos de prueba:

```powershell
npm run db:seed
```

Verificar estado de migraciones:

```powershell
npx prisma migrate status
```

## Ejecucion

Levantar el backend en desarrollo:

```powershell
npm run dev
```

Si el puerto 3000 queda ocupado por un proceso anterior:

```powershell
npm run dev:kill-port
npm run dev
```

Tambien existe una variante forzada:

```powershell
npm run dev:force
```

El servidor queda disponible en:

```text
http://localhost:3000
```

## Scripts disponibles

- `npm run dev`: libera el puerto 3000 y levanta el backend con nodemon.
- `npm run dev:kill-port`: intenta liberar el puerto 3000.
- `npm run dev:force`: fuerza liberacion del puerto y levanta el backend.
- `npm run build`: compila TypeScript.
- `npm run start`: ejecuta la version compilada.
- `npm run db:seed`: borra datos demo y recarga la cohorte de `Documentacion/usuarios_prueba.md` (no afecta catálogo MINEDUC/DEIS).

## Pruebas automatizadas

```powershell
npm test                 # ~176 tests (unitarias + integración)
npm run test:unit        # solo unitarias
npm run test:integration # solo integración API
npm run test:coverage    # reporte de cobertura
npm run test:seed        # datos @test-auto.tealink.cl para integración
```

Documentación: `Documentacion/EV3-PRUEBAS-AUTOMATIZADAS.md`.

## Seguridad JWT

La variable `JWT_SECRET` debe estar definida en `.env`. Si no se define, el backend usa un valor por defecto solo apto para desarrollo local.
