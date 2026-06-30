import { describe, it, expect } from 'vitest';
import { parseApiError } from '../../src/utils/apiError';

describe('apiError', () => {
  it('devuelve string de error', () => {
    expect(parseApiError({ error: 'No autorizado' }, 'fallback')).toBe('No autorizado');
  });

  it('concatena issues de validación', () => {
    expect(
      parseApiError(
        { error: [{ message: 'Campo requerido' }, { message: 'Email inválido' }] },
        'fallback'
      )
    ).toBe('Campo requerido. Email inválido');
  });

  it('usa message alternativo', () => {
    expect(parseApiError({ message: 'Error servidor' }, 'fb')).toBe('Error servidor');
  });

  it('fallback si vacío', () => {
    expect(parseApiError({}, 'Error genérico')).toBe('Error genérico');
  });
});
