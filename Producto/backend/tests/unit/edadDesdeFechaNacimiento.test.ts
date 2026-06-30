import { describe, it, expect } from 'vitest';
import {
  calcularEdadDesdeFechaNacimiento,
  calcularEdadDetallada,
  resolverEdadPerfilDesdeFecha
} from '../../src/utils/edadDesdeFechaNacimiento';

describe('edadDesdeFechaNacimiento', () => {
  const ref = new Date(2026, 5, 28); // 28 jun 2026

  it('calcula años cumplidos', () => {
    expect(calcularEdadDesdeFechaNacimiento('2016-06-28', ref)).toBe(10);
    expect(calcularEdadDesdeFechaNacimiento('2016-06-29', ref)).toBe(9);
    expect(calcularEdadDesdeFechaNacimiento('2026-01-15', ref)).toBe(0);
  });

  it('calcula años y meses', () => {
    expect(calcularEdadDetallada('2016-03-15', ref)).toEqual({ años: 10, meses: 3 });
    expect(calcularEdadDetallada('2016-06-28', ref)).toEqual({ años: 10, meses: 0 });
    expect(calcularEdadDetallada('2025-12-28', ref)).toEqual({ años: 0, meses: 6 });
  });

  it('rechaza fechas futuras o inválidas', () => {
    expect(calcularEdadDesdeFechaNacimiento('2027-01-01', ref)).toBeNull();
    expect(calcularEdadDesdeFechaNacimiento('no-es-fecha', ref)).toBeNull();
  });

  it('resolverEdadPerfilDesdeFecha sobrescribe edad manual', () => {
    const res = resolverEdadPerfilDesdeFecha({
      nombre: 'Niño',
      edad: 99,
      fecha_nacimiento: '2016-06-28'
    });
    expect(res.edad).toBe(10);
  });
});
