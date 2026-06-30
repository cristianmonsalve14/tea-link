import { describe, it, expect } from 'vitest';
import {
  DESCRIPCION_OBSERVACION_MIN,
  isDescripcionObservacionValida,
  mensajeDescripcionCorta
} from '../../src/utils/observacionFormRules';

describe('observacionFormRules (CP-09)', () => {
  it('constante mínima es 10', () => {
    expect(DESCRIPCION_OBSERVACION_MIN).toBe(10);
  });

  it('rechaza descripción corta', () => {
    expect(isDescripcionObservacionValida('corto')).toBe(false);
    expect(isDescripcionObservacionValida('123456789')).toBe(false);
  });

  it('acepta descripción con 10+ caracteres', () => {
    expect(isDescripcionObservacionValida('1234567890')).toBe(true);
    expect(isDescripcionObservacionValida('  diez chars  ')).toBe(true);
  });

  it('mensaje de error menciona mínimo', () => {
    expect(mensajeDescripcionCorta()).toMatch(/10 caracteres/);
  });
});
