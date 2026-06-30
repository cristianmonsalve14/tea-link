import { describe, expect, it } from 'vitest';
import {
  ESPECIALIDADES_EDUCADOR,
  etiquetaEspecialidadEducador,
  especialidadEducadorSchema
} from '../../src/utils/especialidadEducador';

describe('especialidadEducador', () => {
  it('acepta solo valores del catálogo', () => {
    for (const cargo of ESPECIALIDADES_EDUCADOR) {
      expect(especialidadEducadorSchema.safeParse(cargo).success).toBe(true);
    }
    expect(especialidadEducadorSchema.safeParse('OTRO').success).toBe(false);
  });

  it('genera etiquetas legibles', () => {
    expect(etiquetaEspecialidadEducador('COORDINADOR_PIE')).toBe('Coordinador(a) PIE');
    expect(etiquetaEspecialidadEducador(null)).toBe('Sin cargo asignado');
  });
});
