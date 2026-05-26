import { rol_enum, tipo_institucion_enum } from '@prisma/client';

/** Roles que un administrador de institución puede dar de alta según el tipo */
export function rolesRegistroPorTipoInstitucion(
  tipo: tipo_institucion_enum
): rol_enum[] {
  switch (tipo) {
    case 'CENTRO_EDUCACIONAL':
      return ['EDUCADOR'];
    case 'CENTRO_MEDICO':
      return ['MEDICO', 'PROFESIONAL'];
    case 'CENTRO_PROFESIONAL':
      return ['PROFESIONAL'];
    case 'FAMILIA':
      return ['FAMILIA'];
    case 'SISTEMA':
      return [];
    default:
      return ['EDUCADOR'];
  }
}

export function etiquetaEquipoInstitucion(tipo: tipo_institucion_enum): string {
  switch (tipo) {
    case 'CENTRO_EDUCACIONAL':
      return 'Educadores del colegio';
    case 'CENTRO_MEDICO':
      return 'Equipo médico';
    case 'CENTRO_PROFESIONAL':
      return 'Profesionales';
    case 'FAMILIA':
      return 'Familias';
    default:
      return 'Usuarios';
  }
}
