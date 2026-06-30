import { describe, it, expect } from 'vitest';
import {
  etiquetaNivelEducacional,
  institucionRequiereNivelEducacional,
  NIVELES_EDUCACIONALES
} from '../../src/utils/nivelEducacional';

describe('nivelEducacional', () => {
  it('etiqueta niveles básicos y medio', () => {
    expect(etiquetaNivelEducacional('BASICO_1')).toBe('1° básico');
    expect(etiquetaNivelEducacional('MEDIO_2')).toBe('2° medio');
    expect(etiquetaNivelEducacional('LABORAL')).toContain('laboral');
  });

  it('sin nivel asignado', () => {
    expect(etiquetaNivelEducacional(null)).toBe('Sin nivel asignado');
  });

  it('solo centros educacionales requieren nivel', () => {
    expect(institucionRequiereNivelEducacional('CENTRO_EDUCACIONAL')).toBe(true);
    expect(institucionRequiereNivelEducacional('CENTRO_MEDICO')).toBe(false);
  });

  it('enum ordenado curricularmente', () => {
    expect(NIVELES_EDUCACIONALES[0]).toBe('PARVULARIA_NT1');
    expect(NIVELES_EDUCACIONALES.at(-1)).toBe('UNIVERSITARIO');
  });
});
