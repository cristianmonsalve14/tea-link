# Reglas y permisos de roles en TEA Link

## Niveles de privacidad de observaciones
- **PUBLICA**: Visible para todos los roles.
- **SOLO_PROFESIONALES**: Visible solo para PROFESIONAL y MÉDICO.
- **SOLO_MEDICO**: Visible solo para MÉDICO.

## Permisos por rol

### MÉDICO
- Puede autenticarse y acceder a la plataforma.
- Puede ver todas las observaciones (según privacidad).
- Puede crear observaciones con cualquier nivel de privacidad.
- Puede editar y eliminar solo sus propias observaciones.

### PROFESIONAL
- Puede autenticarse y acceder a la plataforma.
- Puede ver observaciones PUBLICA y SOLO_PROFESIONALES.
- Puede crear observaciones (por defecto, privacidad PUBLICA).
- Puede editar y eliminar solo sus propias observaciones.

### EDUCADOR
- Puede autenticarse y acceder a la plataforma.
- Puede ver observaciones PUBLICA.
- Puede crear observaciones (por defecto, privacidad PUBLICA).
- Puede editar y eliminar solo sus propias observaciones.

### FAMILIA
- Puede autenticarse y acceder a la plataforma.
- Puede ver observaciones PUBLICA.
- Puede crear observaciones (por defecto, privacidad PUBLICA).
- Puede editar y eliminar solo sus propias observaciones.

### ADMINISTRADOR
- Puede autenticarse y acceder a la plataforma.
- No puede ver, editar ni eliminar observaciones.
- Solo gestiona usuarios y configuración general.

## Resumen de reglas de visibilidad
| Privacidad           | FAMILIA | EDUCADOR | PROFESIONAL | MÉDICO |
|----------------------|---------|----------|-------------|--------|
| PUBLICA              | ✔       | ✔        | ✔           | ✔      |
| SOLO_PROFESIONALES   | ✖       | ✖        | ✔           | ✔      |
| SOLO_MEDICO          | ✖       | ✖        | ✖           | ✔      |

## Ejemplo de payload para crear observación
```json
{
  "titulo": "Observación ejemplo",
  "descripcion": "Texto de la observación.",
  "categoria": "CLINICO",
  "fecha_evento": "2026-04-25T10:00:00.000Z",
  "perfil_id": 1,
  "privacidad": "PUBLICA"
}
```

## Notas
- Solo el autor puede editar/eliminar sus observaciones.
- El campo privacidad solo puede ser definido por el MÉDICO. Otros roles crean observaciones siempre como PUBLICA.

---

Este documento deja constancia del acuerdo y será la base para la implementación técnica y pruebas.
