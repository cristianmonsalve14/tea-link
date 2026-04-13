# 📋 INSTRUCCIONES PARA CREAR BASE DE DATOS TEA LINK EN pgAdmin 4

**Fecha**: 27 de Marzo 2026  
**Estudiante**: Cristian Monsalve Budrovich  
**Proyecto**: TEA Link - Sistema de Seguimiento de Observaciones TEA

---

## 🎯 OBJETIVO

Crear la base de datos `tea_link` con 5 tablas, IDs autoincrementales, y datos de prueba.

---

## 📝 PASOS DE EJECUCIÓN

### **PASO 1: Abrir pgAdmin 4**

1. Abre **pgAdmin 4** desde el menú inicio de Windows
2. Ingresa la contraseña maestra de pgAdmin (si te la pide)
3. Expande en el panel izquierdo: **Servers → PostgreSQL 15**
4. Ingresa la contraseña de PostgreSQL si te la solicita

---

### **PASO 2: Crear la Base de Datos**

#### **Opción A: Interfaz Gráfica (Recomendado)**

1. Click derecho en **Databases** → **Create** → **Database...**
2. En la pestaña **General**:
   - **Database**: `tea_link`
   - **Owner**: `postgres`
   - **Comment**: `Base de datos para sistema TEA Link - Taller de Programación 2026`
3. En la pestaña **Definition**:
   - **Encoding**: `UTF8`
   - **Template**: `template0`
   - **Collation**: `Spanish_Chile.1252` (o `es_ES.UTF-8` en Linux/Mac)
   - **Character type**: `Spanish_Chile.1252`
4. Click en **Save**

#### **Opción B: SQL Manual**

1. Click derecho en **Databases** → **Query Tool**
2. Pega este comando:
   ```sql
   CREATE DATABASE tea_link
     WITH OWNER = postgres
     ENCODING = 'UTF8'
     LC_COLLATE = 'Spanish_Chile.1252'
     LC_CTYPE = 'Spanish_Chile.1252'
     TABLESPACE = pg_default
     CONNECTION LIMIT = -1;
   ```
3. Click en el botón **▶️ Execute/Refresh** (o presiona `F5`)
4. Deberías ver: `CREATE DATABASE` en el panel de mensajes

---

### **PASO 3: Conectar a la Base de Datos tea_link**

1. En el panel izquierdo, expande **Databases**
2. Verás la nueva base de datos **tea_link**
3. Click derecho en **tea_link** → **Herramienta de consulta** (o **Query Tool** si está en inglés)
4. Se abrirá una nueva pestaña de consultas conectada a `tea_link`
   - En la pestaña superior verás algo como: `Query - tea_link/postgres@PostgreSQL 15`
   - Esto confirma que estás conectado a la base de datos correcta

---

### **PASO 4: Ejecutar el Script de Creación**

1. Abre el archivo `create_database_tea_link.sql` en un editor de texto
   - Ubicación: `D:\Duoc\2026\Taller de Programacion\proyecto\database\create_database_tea_link.sql`
   - Puedes usar Notepad, VS Code o el editor integrado de pgAdmin

2. **Copia TODO el contenido del archivo** (Ctrl+A, Ctrl+C)

3. Pega el contenido en el **Query Tool** de pgAdmin conectado a `tea_link`

4. Click en el botón **▶️ Execute/Refresh** (o presiona `F5`)

5. **Observa los mensajes de salida** en el panel inferior:
   ```
   DROP TABLE
   DROP TABLE
   DROP TABLE
   DROP TABLE
   DROP TABLE
   DROP TYPE
   DROP TYPE
   DROP TYPE
   CREATE TYPE
   CREATE TYPE
   CREATE TYPE
   CREATE TABLE
   CREATE INDEX
   ...
   INSERT 0 1
   ...
   ```

6. Al final deberías ver una tabla con los conteos:
   ```
   total_usuarios | total_perfiles | total_observaciones | total_reportes | total_obs_en_reportes
   --------------+-----------------+---------------------+----------------+----------------------
              3 |              2 |                   4 |              1 |                    4
   ```

✅ **Si ves esto, la base de datos se creó correctamente!**

---

### **PASO 5: Verificar la Estructura**

1. En el panel izquierdo, expande:
   ```
   tea_link
     └── Schemas
          └── public
               └── Tables
   ```

2. Deberías ver **5 tablas**:
   - ✅ `observaciones`
   - ✅ `observaciones_en_reportes`
   - ✅ `perfiles`
   - ✅ `reportes`
   - ✅ `usuarios`

3. Click derecho en `usuarios` → **View/Edit Data** → **All Rows**
4. Deberías ver **3 usuarios** de prueba:
   - juan.perez@example.com (FAMILIA)
   - maria.gonzalez@escuela.cl (EDUCADOR)
   - ana.martinez@clinica.cl (PROFESIONAL)

---

### **PASO 6: Obtener la Cadena de Conexión**

Para conectar tu backend Node.js necesitas la **DATABASE_URL**:

**Formato:**
```
postgresql://usuario:contraseña@localhost:5432/tea_link
```

**Ejemplo real:**
```
postgresql://postgres:tu_contraseña_postgres@localhost:5432/tea_link
```

**Actualizar en el proyecto:**

1. Abre el archivo `backend/.env`
2. Actualiza la línea `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://postgres:tu_contraseña@localhost:5432/tea_link"
   ```
3. Reemplaza `tu_contraseña` con tu contraseña real de PostgreSQL

---

## 🧪 CONSULTAS DE PRUEBA

Puedes ejecutar estas consultas en el Query Tool para verificar que todo funciona:

### **1. Ver todos los usuarios**
```sql
SELECT id, email, nombre_completo, rol, created_at 
FROM usuarios 
ORDER BY id;
```

### **2. Ver perfiles con sus usuarios**
```sql
SELECT 
  p.id,
  p.nombre AS nombre_perfil,
  p.edad,
  p.diagnostico,
  u.nombre_completo AS gestionado_por,
  u.rol
FROM perfiles p
JOIN usuarios u ON p.usuario_id = u.id
ORDER BY p.id;
```

### **3. Ver observaciones con detalles completos**
```sql
SELECT 
  o.id,
  o.titulo,
  o.categoria,
  o.fecha_evento,
  p.nombre AS perfil,
  u.nombre_completo AS autor,
  u.rol AS rol_autor
FROM observaciones o
JOIN perfiles p ON o.perfil_id = p.id
JOIN usuarios u ON o.autor_id = u.id
ORDER BY o.fecha_evento DESC;
```

### **4. Ver reporte con sus observaciones**
```sql
SELECT 
  r.titulo AS reporte,
  r.fecha_inicio,
  r.fecha_fin,
  COUNT(ore.observacion_id) AS total_observaciones,
  u.nombre_completo AS creado_por
FROM reportes r
JOIN observaciones_en_reportes ore ON r.id = ore.reporte_id
JOIN usuarios u ON r.creador_id = u.id
GROUP BY r.id, r.titulo, r.fecha_inicio, r.fecha_fin, u.nombre_completo;
```

### **5. Estadísticas por categoría**
```sql
SELECT 
  categoria,
  COUNT(*) AS total_observaciones
FROM observaciones
GROUP BY categoria
ORDER BY total_observaciones DESC;
```

---

## ❌ SOLUCIÓN DE PROBLEMAS

### **Error: "database tea_link already exists"**

**Solución**: Si la base de datos ya existe, puedes:
1. Eliminarla: Click derecho en `tea_link` → **Delete/Drop** → **YES**
2. Volver a crearla siguiendo el PASO 2

### **Error: "permission denied for schema public"**

**Solución**: Ejecuta este comando en Query Tool conectado a `postgres` database:
```sql
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

### **Error: "syntax error at or near..."**

**Solución**: 
- Asegúrate de copiar TODO el script completo
- Verifica que estás conectado a la base de datos `tea_link` (no a `postgres`)

### **Error de codificación (caracteres especiales mal)**

**Solución**:
- Al crear la BD, usa `LC_COLLATE = 'C'` y `LC_CTYPE = 'C'` en lugar de Spanish_Chile

---

## 📊 DIAGRAMA ENTIDAD-RELACIÓN

**5 TABLAS EN TOTAL:**

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────────┐
│   usuarios      │──1:N──│   perfiles      │──1:N──│   observaciones     │
│                 │       │                 │       │                     │
│ id (PK)         │       │ id (PK)         │       │ id (PK)             │
│ email           │       │ nombre          │       │ titulo              │
│ password_hash   │       │ edad            │       │ descripcion         │
│ nombre_completo │       │ diagnostico     │       │ categoria           │
│ rol             │       │ usuario_id (FK) │       │ fecha_evento        │
│ created_at      │       │ created_at      │       │ perfil_id (FK)      │
│ updated_at      │       │ updated_at      │       │ autor_id (FK)       │
└─────────────────┘       └─────────────────┘       │ created_at          │
         │                                           │ updated_at          │
         │                                           └─────────────────────┘
         │                                                      │
         │                                                      │
         │                ┌─────────────────┐                  │
         └────────1:N─────│    reportes     │                  │
                          │                 │                  │
                          │ id (PK)         │                  │
                          │ titulo          │                  │
                          │ fecha_inicio    │                  │
                          │ fecha_fin       │                  │
                          │ formato         │                  │
                          │ url_archivo     │                  │
                          │ creador_id (FK) │                  │
                          │ created_at      │                  │
                          └─────────────────┘                  │
                                  │                            │
                                  │                            │
                                  └──────────┬─────────────────┘
                                             │
                                             │ N:N
                                             ▼
                          ┌──────────────────────────────────┐
                          │ observaciones_en_reportes        │
                          │ (TABLA INTERMEDIA - TABLA 5)     │
                          │                                  │
                          │ reporte_id (PK, FK)              │
                          │ observacion_id (PK, FK)          │
                          └──────────────────────────────────┘
```

**Relaciones:**
- `usuarios` → `perfiles` (1:N) - Un usuario gestiona varios perfiles
- `perfiles` → `observaciones` (1:N) - Un perfil tiene varias observaciones
- `usuarios` → `observaciones` (1:N) - Un usuario autor crea varias observaciones
- `usuarios` → `reportes` (1:N) - Un usuario creador genera varios reportes
- `reportes` ↔ `observaciones` (N:N) - Relación muchos a muchos mediante tabla intermedia

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de continuar con Prisma, verifica:

- [ ] Base de datos `tea_link` creada
- [ ] 5 tablas creadas (usuarios, perfiles, observaciones, reportes, observaciones_en_reportes)
- [ ] 3 tipos ENUM creados (rol_enum, categoria_observacion_enum, formato_reporte_enum)
- [ ] Datos de prueba insertados (3 usuarios, 2 perfiles, 4 observaciones)
- [ ] Consultas de verificación ejecutadas correctamente
- [ ] DATABASE_URL actualizada en `backend/.env`

---

## 🚀 PRÓXIMOS PASOS

Después de verificar que la base de datos funciona:

1. **Configurar Prisma** para conectarse a esta base de datos
2. **Generar Prisma Client** para acceder a los datos desde Node.js
3. **Crear endpoints** del backend para CRUD de cada tabla
4. **Conectar frontend** con el backend

---

**¿Listo para continuar?** Una vez verificada la BD, avísame y continuamos con la integración de Prisma! 🎉
