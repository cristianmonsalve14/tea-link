

# Usuarios de prueba para rutas protegidas

## SUPERADMIN

**SUPERADMIN**
- email: cr.monsalveb@duocuc.cl
- password: SuperAdmin123!
- nombre_completo: Super Administrador
- rol: SUPERADMIN

## ADMINISTRADORES POR INSTITUCIÓN

**ADMINISTRADOR GENERAL**
- email: admin@tealink.com
- password: (definir o consultar en la base de datos)
- nombre_completo: Administrador General
- rol: ADMINISTRADOR

**ADMINISTRADOR CENTRO EDUCACIONAL**
- email: admin.colegio@tealink.com
- password: AdminColegio123!
- nombre_completo: Administrador Colegio Prueba
- rol: ADMINISTRADOR

**ADMINISTRADOR EDUCA123**
- email: educa123@email.com
- password: (definir o consultar en la base de datos)
- nombre_completo: admin-educa
- rol: ADMINISTRADOR

## OTROS USUARIOS DE PRUEBA

**EDUCADOR**
- email: educador2@tealink.com
- password: Educador123!
- nombre_completo: Educador Prueba
- rol: EDUCADOR

**MEDICO**
- email: medico@tealink.com
- password: Medico123!
- nombre_completo: Dr. Roberto Fernández
- rol: MEDICO

---

## Notas importantes sobre administradores e instituciones

- Cada usuario y perfil está asociado a una institución (familia, centro educacional, centro médico, centro profesional).
- Un ADMINISTRADOR solo puede gestionar (crear, editar, eliminar) usuarios y perfiles de su propia institución.
- El SUPERADMIN puede gestionar instituciones y administradores globalmente.
- Las acciones sensibles de administradores y superadmin quedan registradas en la auditoría.
- Para pruebas, puedes usar estos usuarios y validar que los administradores no pueden modificar recursos de otras instituciones.