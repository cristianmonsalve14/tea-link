
# Usuarios de prueba para rutas protegidas

## ADMINISTRADORES POR INSTITUCIÓN

**ADMINISTRADOR CENTRO EDUCACIONAL**
- email: admin.colegio@tealink.com
- password: AdminColegio123!
- nombre_completo: Administrador Colegio Prueba
- rol: ADMINISTRADOR
- institucion: Centro Educacional Prueba
- tipo_institucion: CENTRO_EDUCACIONAL

**ADMINISTRADOR CENTRO MÉDICO**
- email: admin.hospital@tealink.com
- password: AdminHospital123!
- nombre_completo: Administrador Hospital Prueba
- rol: ADMINISTRADOR
- institucion: Centro Médico Prueba
- tipo_institucion: CENTRO_MEDICO

**ADMINISTRADOR FAMILIA**
- email: admin.familia@tealink.com
- password: AdminFamilia123!
- nombre_completo: Administrador Familia Prueba
- rol: ADMINISTRADOR
- institucion: Familia Prueba
- tipo_institucion: FAMILIA

**ADMINISTRADOR CENTRO PROFESIONAL**
- email: admin.cprofesional@tealink.com
- password: AdminProf123!
- nombre_completo: Administrador Centro Profesional Prueba
- rol: ADMINISTRADOR
- institucion: Centro Profesional Prueba
- tipo_institucion: CENTRO_PROFESIONAL

## OTROS USUARIOS DE PRUEBA

**FAMILIA**
- email: familia@tealink.com
- password: Familia123!
- nombre_completo: Familia Prueba
- rol: FAMILIA
- institucion: Familia Prueba
- tipo_institucion: FAMILIA

**EDUCADOR**
- email: educador2@tealink.com
- password: Educador123!
- nombre_completo: Educador Prueba
- rol: EDUCADOR
- institucion: Centro Educacional Prueba
- tipo_institucion: CENTRO_EDUCACIONAL

**PROFESIONAL**
- email: profesional@tealink.com
- password: Profesional123!
- nombre_completo: Profesional Prueba
- rol: PROFESIONAL
- institucion: Centro Profesional Prueba
- tipo_institucion: CENTRO_PROFESIONAL

**MEDICO**
- email: medico@tealink.com
- password: Medico123!
- nombre_completo: Dr. Roberto Fernández
- rol: MEDICO
- institucion: Centro Médico Prueba
- tipo_institucion: CENTRO_MEDICO

---

## Notas importantes sobre administradores e instituciones

- Cada usuario y perfil está asociado a una institución (familia, centro educacional, centro médico, centro profesional).
- Un ADMINISTRADOR solo puede gestionar (crear, editar, eliminar) usuarios y perfiles de su propia institución.
- No existe un superadministrador global por defecto.
- Las acciones sensibles de administradores quedan registradas en la auditoría.
- Para pruebas, puedes usar estos usuarios y validar que los administradores no pueden modificar recursos de otras instituciones.