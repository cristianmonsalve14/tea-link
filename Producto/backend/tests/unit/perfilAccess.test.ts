import { describe, it, expect } from 'vitest';
import { rolEnPerfil } from '../../src/utils/perfilAccess';

describe('rolEnPerfil', () => {
  it('mapea FAMILIA a TUTOR', () => {
    expect(rolEnPerfil('FAMILIA')).toBe('TUTOR');
  });

  it('mapea EDUCADOR a EDUCADOR', () => {
    expect(rolEnPerfil('EDUCADOR')).toBe('EDUCADOR');
  });

  it('mapea MEDICO a MEDICO', () => {
    expect(rolEnPerfil('MEDICO')).toBe('MEDICO');
  });

  it('devuelve null para ADMINISTRADOR', () => {
    expect(rolEnPerfil('ADMINISTRADOR')).toBeNull();
  });
});
