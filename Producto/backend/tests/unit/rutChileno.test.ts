import { describe, it, expect } from 'vitest';
import {
  normalizarRutChileno,
  validarRutChileno,
  formatearRutChileno,
  calcularDvRutChileno
} from '../../src/utils/rutChileno';

describe('rutChileno', () => {
  it('normaliza con y sin puntos', () => {
    expect(normalizarRutChileno('11.111.111-1')).toBe('11111111-1');
    expect(normalizarRutChileno('111111111')).toBe('11111111-1');
  });

  it('valida dígito verificador', () => {
    expect(calcularDvRutChileno('11111111')).toBe('1');
    expect(validarRutChileno('11.111.111-1')).toBe(true);
    expect(validarRutChileno('11.111.111-2')).toBe(false);
  });

  it('formatea para visualización', () => {
    expect(formatearRutChileno('11111111-1')).toBe('11.111.111-1');
  });
});
