import { describe, it, expect } from 'vitest';
import { privacidadVisibleParaRol } from '../../src/utils/privacidadObservacion';
import { resolverPrivacidadAlCrear } from '../../src/utils/observacionRules';

describe('privacidadVisibleParaRol', () => {
  it('FAMILIA solo ve PUBLICA', () => {
    expect(privacidadVisibleParaRol('FAMILIA')).toEqual(['PUBLICA']);
  });

  it('EDUCADOR solo ve PUBLICA', () => {
    expect(privacidadVisibleParaRol('EDUCADOR')).toEqual(['PUBLICA']);
  });

  it('PROFESIONAL ve PUBLICA y MULTINIVEL', () => {
    expect(privacidadVisibleParaRol('PROFESIONAL')).toEqual(['PUBLICA', 'MULTINIVEL']);
  });

  it('ADMINISTRADOR ve PUBLICA y MULTINIVEL (sin notas privadas clínicas)', () => {
    expect(privacidadVisibleParaRol('ADMINISTRADOR')).toEqual(['PUBLICA', 'MULTINIVEL']);
  });

  it('MEDICO ve todos los niveles', () => {
    expect(privacidadVisibleParaRol('MEDICO')).toEqual(['PUBLICA', 'PRIVADA', 'MULTINIVEL']);
  });

  it('resolverPrivacidadAlCrear alineado con visibilidad médica', () => {
    expect(resolverPrivacidadAlCrear('MEDICO', 'PRIVADA')).toBe('PRIVADA');
  });
});
