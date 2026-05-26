# Frontend - TEA Link

Este directorio contiene la aplicacion web de TEA Link, desarrollada con **React, TypeScript y Vite**. El frontend consume la API del backend y muestra interfaces diferenciadas segun el rol del usuario autenticado.

Para la vision general del proyecto, objetivos, arquitectura y alcance proyectado, revisar el [README principal](../../README.md).

## Funcionalidades principales

- Login con manejo de sesion mediante token JWT.
- Rutas protegidas para usuarios autenticados.
- Redireccion al dashboard correspondiente segun rol.
- Panel de SUPERADMIN para instituciones, administradores y reportes globales.
- Panel de ADMINISTRADOR institucional para perfiles y educadores.
- Panel de EDUCADOR para observaciones y reportes.
- Componentes modulares para gestion de usuarios, perfiles, observaciones y reportes.
- Mensajes de error y validaciones basicas en formularios.

## Tecnologias

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Zod
- React Hook Form

## Configuracion local

Instalar dependencias:

```powershell
npm install
```

Levantar el servidor de desarrollo:

```powershell
npm run dev
```

La aplicacion queda disponible normalmente en:

```text
http://localhost:5173
```

El backend debe estar corriendo en:

```text
http://localhost:3000
```

## Scripts disponibles

- `npm run dev`: inicia Vite en modo desarrollo.
- `npm run build`: compila TypeScript y genera build de produccion.
- `npm run lint`: ejecuta ESLint.
- `npm run preview`: previsualiza el build generado.

## Estructura principal

```text
src/
├── components/     # Componentes reutilizables y secciones por rol
├── pages/          # Paginas principales como Login y Dashboard
├── utils/          # Utilidades de autenticacion/sesion
├── AppRouter.tsx   # Definicion de rutas
└── main.tsx        # Punto de entrada React
```

## Roles y vistas

- **SUPERADMIN:** administra instituciones, administradores institucionales y reportes globales.
- **ADMINISTRADOR:** administra perfiles y educadores de su institucion.
- **EDUCADOR:** registra observaciones y genera reportes desde observaciones seleccionadas.
- **FAMILIA, PROFESIONAL y MEDICO:** roles definidos para flujos especificos y ampliacion funcional.

## Usuarios de prueba

Los usuarios de prueba se documentan en:

```text
../../Documentacion/usuarios_prueba.md
```

> Si algun usuario no existe en la base local, ejecutar el seed del backend o crearlo desde el panel correspondiente.

## Estado actual

El frontend se encuentra funcional en ambiente local para los flujos principales de login, navegacion por rol, administracion institucional, observaciones y reportes. Algunas funciones proyectadas del producto final continuan en validacion o desarrollo progresivo.
