# Instrucciones de Ejecucion - Base de Datos TEA Link

**Proyecto:** TEA Link  
**Estudiante:** Cristian Monsalve Budrovich  
**Base de datos:** PostgreSQL  
**Archivo SQL:** `Producto/database/create_database_tea_link.sql`

---

## Objetivo

Crear y validar la base de datos local `tea_link` para el proyecto TEA Link, alineada con el modelo actual definido en Prisma (`Producto/backend/prisma/schema.prisma`).

El modelo actual incluye:

- `instituciones`
- `usuarios`
- `perfiles`
- `perfil_usuario`
- `observaciones`
- `reportes`
- `observaciones_en_reportes`
- `auditoria_admin`

Tambien incluye tipos ENUM para roles, categorias, privacidad, formatos de reporte y tipos de institucion.

---

## Requisitos

- PostgreSQL instalado localmente.
- pgAdmin 4 o terminal PowerShell.
- Acceso al usuario `postgres`.
- Proyecto descargado en:

```text
D:\Duoc\2026\Taller de Programacion\proyecto
```

> En el ambiente local utilizado para pruebas se trabajo con PostgreSQL 13. El procedimiento tambien aplica a versiones superiores, ajustando la ruta de los ejecutables si corresponde.

---

## Opcion A: Crear Base desde pgAdmin

1. Abrir pgAdmin 4.
2. Conectarse al servidor PostgreSQL.
3. Click derecho en **Databases**.
4. Seleccionar **Create > Database**.
5. Crear la base con el nombre:

```text
tea_link
```

6. Abrir **Query Tool** sobre la base `tea_link`.
7. Abrir el archivo:

```text
D:\Duoc\2026\Taller de Programacion\proyecto\Producto\database\create_database_tea_link.sql
```

8. Copiar todo el contenido y ejecutarlo.

Al final debe mostrarse una consulta de verificacion con conteos de tablas.

---

## Opcion B: Crear Base desde PowerShell

Ubicarse en el proyecto:

```powershell
cd "D:\Duoc\2026\Taller de Programacion\proyecto"
```

Crear la base de datos:

```powershell
& "C:\Program Files\PostgreSQL\13\bin\createdb.exe" -U postgres -h localhost tea_link
```

Si la base ya existe y se desea recrear:

```powershell
& "C:\Program Files\PostgreSQL\13\bin\dropdb.exe" -U postgres -h localhost tea_link
& "C:\Program Files\PostgreSQL\13\bin\createdb.exe" -U postgres -h localhost tea_link
```

Ejecutar el script SQL:

```powershell
& "C:\Program Files\PostgreSQL\13\bin\psql.exe" -U postgres -h localhost -d tea_link -f ".\Producto\database\create_database_tea_link.sql"
```

---

## Verificacion de Datos

Entrar a la base:

```powershell
& "C:\Program Files\PostgreSQL\13\bin\psql.exe" -U postgres -h localhost -d tea_link
```

Desactivar paginador si aparece error con `more`:

```sql
\pset pager off
```

Ejecutar consulta de conteo:

```sql
SELECT
  (SELECT COUNT(*) FROM instituciones) AS instituciones,
  (SELECT COUNT(*) FROM usuarios) AS usuarios,
  (SELECT COUNT(*) FROM perfiles) AS perfiles,
  (SELECT COUNT(*) FROM perfil_usuario) AS perfil_usuario,
  (SELECT COUNT(*) FROM observaciones) AS observaciones,
  (SELECT COUNT(*) FROM reportes) AS reportes,
  (SELECT COUNT(*) FROM observaciones_en_reportes) AS obs_en_reportes,
  (SELECT COUNT(*) FROM auditoria_admin) AS auditoria;
```

Resultado esperado con los datos de prueba del script:

```text
instituciones | usuarios | perfiles | perfil_usuario | observaciones | reportes | obs_en_reportes | auditoria
--------------+----------+----------+----------------+---------------+----------+-----------------+----------
3             | 4        | 1        | 2              | 1             | 1        | 1               | 1
```

---

## Conexion con el Backend

En `Producto/backend/.env`, configurar:

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/tea_link"
JWT_SECRET="clave_segura_para_desarrollo"
PORT=3000
```

Instalar dependencias y ejecutar backend:

```powershell
cd "D:\Duoc\2026\Taller de Programacion\proyecto\Producto\backend"
npm install
npm run dev
```

Servidor esperado:

```text
http://localhost:3000
```

---

## Alternativa Recomendada con Prisma

Para desarrollo del backend, la fuente principal del modelo es Prisma. Por lo tanto, tambien se puede preparar la base con:

```powershell
cd "D:\Duoc\2026\Taller de Programacion\proyecto\Producto\backend"
npx prisma migrate dev
npm run db:seed
```

Verificar migraciones:

```powershell
npx prisma migrate status
```

---

## Backup y Restauracion

Crear carpeta de respaldos:

```powershell
cd "D:\Duoc\2026\Taller de Programacion\proyecto\Producto\backend"
mkdir backups
```

Generar backup:

```powershell
& "C:\Program Files\PostgreSQL\13\bin\pg_dump.exe" -U postgres -h localhost -d tea_link -F c -b -v -f ".\backups\backup_tea_link.dump"
```

Crear base de pruebas:

```powershell
& "C:\Program Files\PostgreSQL\13\bin\createdb.exe" -U postgres -h localhost tea_link_test
```

Restaurar backup:

```powershell
& "C:\Program Files\PostgreSQL\13\bin\pg_restore.exe" -U postgres -h localhost -d tea_link_test -v ".\backups\backup_tea_link.dump"
```

Validar datos restaurados:

```powershell
& "C:\Program Files\PostgreSQL\13\bin\psql.exe" -U postgres -h localhost -d tea_link_test
```

```sql
SELECT
  (SELECT COUNT(*) FROM usuarios) AS usuarios,
  (SELECT COUNT(*) FROM perfiles) AS perfiles,
  (SELECT COUNT(*) FROM observaciones) AS observaciones,
  (SELECT COUNT(*) FROM reportes) AS reportes;
```

---

## Solucion de Problemas

### `pg_dump` o `psql` no se reconoce

Usar la ruta completa del ejecutable:

```powershell
& "C:\Program Files\PostgreSQL\13\bin\pg_dump.exe" --version
```

Si se usa otra version de PostgreSQL, cambiar `13` por la version instalada.

### La base ya existe

Eliminar y recrear:

```powershell
& "C:\Program Files\PostgreSQL\13\bin\dropdb.exe" -U postgres -h localhost tea_link
& "C:\Program Files\PostgreSQL\13\bin\createdb.exe" -U postgres -h localhost tea_link
```

### Error del paginador `more`

Dentro de `psql`:

```sql
\pset pager off
```

---

## Estado

Este documento esta actualizado para el modelo de base de datos vigente del proyecto TEA Link y debe considerarse junto con:

- `Producto/backend/prisma/schema.prisma`
- `Producto/backend/prisma/migrations/`
- `Producto/backend/prisma/seed.ts`
