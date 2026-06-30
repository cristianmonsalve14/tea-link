import { describe, it, expect } from 'vitest';
import { parseApiError } from '../../src/utils/parseApiError';

describe('parseApiError', () => {
  it('devuelve error string', () => {
    expect(parseApiError({ error: 'Correo duplicado' }, 'fallback')).toBe('Correo duplicado');
  });

  it('concatena errores de validación en arreglo', () => {
    expect(
      parseApiError(
        { error: [{ message: 'Campo requerido' }, { message: 'Email inválido' }] },
        'fallback'
      )
    ).toBe('Campo requerido. Email inválido');
  });

  it('usa message si existe', () => {
    expect(parseApiError({ message: 'No autorizado' }, 'fallback')).toBe('No autorizado');
  });

  it('usa fallback si no hay detalle', () => {
    expect(parseApiError({}, 'Error genérico')).toBe('Error genérico');
  });
});
