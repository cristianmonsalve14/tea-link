import { describe, expect, it } from 'vitest';
import {
  educadorAtiendeNivelPerfil,
  educadorEquipoBodySchema,
  ordenarNivelesEducador,
  requiereDatosEducadorColegio,
  resumenNivelesEducador
} from '../../src/utils/educadorEquipo';

describe('educadorEquipo', () => {
  it('requiere datos solo para educador en colegio', () => {
    expect(requiereDatosEducadorColegio('EDUCADOR', 'CENTRO_EDUCACIONAL')).toBe(true);
    expect(requiereDatosEducadorColegio('EDUCADOR', 'CENTRO_MEDICO')).toBe(false);
    expect(requiereDatosEducadorColegio('MEDICO', 'CENTRO_EDUCACIONAL')).toBe(false);
  });

  it('exige al menos un nivel y un cargo del catálogo', () => {
    const ok = educadorEquipoBodySchema.safeParse({
      niveles_educacionales: ['BASICO_1'],
      especialidad: 'EDUCADOR_DIFERENCIAL'
    });
    expect(ok.success).toBe(true);

    const failNivel = educadorEquipoBodySchema.safeParse({
      niveles_educacionales: [],
      especialidad: 'EDUCADOR_DIFERENCIAL'
    });
    expect(failNivel.success).toBe(false);

    const failCargo = educadorEquipoBodySchema.safeParse({
      niveles_educacionales: ['BASICO_1'],
      especialidad: 'TEXTO_LIBRE'
    });
    expect(failCargo.success).toBe(false);
  });

  it('ordena niveles según currículo', () => {
    expect(ordenarNivelesEducador(['MEDIO_2', 'BASICO_1', 'BASICO_3'])).toEqual([
      'BASICO_1',
      'BASICO_3',
      'MEDIO_2'
    ]);
  });

  it('exige nivel compatible entre educador y alumno', () => {
    expect(educadorAtiendeNivelPerfil(['BASICO_7'], 'BASICO_7')).toBe(true);
    expect(educadorAtiendeNivelPerfil(['BASICO_1', 'BASICO_2'], 'BASICO_7')).toBe(false);
    expect(educadorAtiendeNivelPerfil(['LABORAL'], 'LABORAL')).toBe(true);
    expect(educadorAtiendeNivelPerfil([], 'BASICO_7')).toBe(false);
    expect(educadorAtiendeNivelPerfil(['BASICO_7'], null)).toBe(true);
  });

  it('resume niveles para listados', () => {
    expect(resumenNivelesEducador([])).toBe('Sin nivel asignado');
    expect(resumenNivelesEducador(['BASICO_1', 'BASICO_2'])).toContain('1° básico');
  });
});
