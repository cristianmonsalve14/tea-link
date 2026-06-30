import { privacidad_observacion_enum } from '@prisma/client';

/** Niveles de privacidad visibles en bitácora según rol del lector. */
export function privacidadVisibleParaRol(rol: string): privacidad_observacion_enum[] {
  switch (rol) {
    case 'MEDICO':
      return ['PUBLICA', 'PRIVADA', 'MULTINIVEL'];
    case 'PROFESIONAL':
      return ['PUBLICA', 'MULTINIVEL'];
    case 'ADMINISTRADOR':
      return ['PUBLICA', 'MULTINIVEL'];
    default:
      return ['PUBLICA'];
  }
}
