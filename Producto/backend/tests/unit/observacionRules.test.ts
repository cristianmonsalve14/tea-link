import { describe, it, expect } from 'vitest';
import {
  isRolBloqueadoBitacora,
  isRolLecturaObservacion,
  isRolOperativoObservacion,
  isPerfilIdQueryInvalid,
  observacionCreateSchema,
  resolverPrivacidadAlCrear
} from '../../src/utils/observacionRules';

describe('observacionRules', () => {
  it('isRolOperativoObservacion reconoce roles válidos', () => {
    expect(isRolOperativoObservacion('FAMILIA')).toBe(true);
    expect(isRolOperativoObservacion('MEDICO')).toBe(true);
    expect(isRolOperativoObservacion('ADMINISTRADOR')).toBe(false);
  });

  it('isRolBloqueadoBitacora bloquea escritura para admin y superadmin', () => {
    expect(isRolBloqueadoBitacora('ADMINISTRADOR')).toBe(true);
    expect(isRolBloqueadoBitacora('SUPERADMIN')).toBe(true);
    expect(isRolBloqueadoBitacora('FAMILIA')).toBe(false);
    expect(isRolBloqueadoBitacora(undefined)).toBe(false);
  });

  it('isRolLecturaObservacion permite admin y roles operativos', () => {
    expect(isRolLecturaObservacion('ADMINISTRADOR')).toBe(true);
    expect(isRolLecturaObservacion('EDUCADOR')).toBe(true);
    expect(isRolLecturaObservacion('SUPERADMIN')).toBe(false);
    expect(isRolLecturaObservacion(undefined)).toBe(false);
  });

  it('resolverPrivacidadAlCrear: familia siempre PUBLICA', () => {
    expect(resolverPrivacidadAlCrear('FAMILIA', 'PRIVADA')).toBe('PUBLICA');
  });

  it('resolverPrivacidadAlCrear: médico puede PRIVADA/MULTINIVEL', () => {
    expect(resolverPrivacidadAlCrear('MEDICO', 'PRIVADA')).toBe('PRIVADA');
    expect(resolverPrivacidadAlCrear('MEDICO', 'MULTINIVEL')).toBe('MULTINIVEL');
    expect(resolverPrivacidadAlCrear('MEDICO')).toBe('PUBLICA');
  });

  it('observacionCreateSchema rechaza título vacío', () => {
    expect(() =>
      observacionCreateSchema.parse({
        titulo: '',
        descripcion: 'Descripción con más de diez caracteres',
        categoria: 'CONDUCTA',
        fecha_evento: '2026-01-01',
        perfil_id: 1
      })
    ).toThrow();
  });

  it('observacionCreateSchema acepta payload válido', () => {
    const data = observacionCreateSchema.parse({
      titulo: 'Título',
      descripcion: 'Descripción válida',
      categoria: 'ACADEMICO',
      fecha_evento: '2026-06-01',
      perfil_id: '5'
    });
    expect(data.perfil_id).toBe(5);
  });

  it('isPerfilIdQueryInvalid detecta query inválido', () => {
    expect(isPerfilIdQueryInvalid('abc')).toBe(true);
    expect(isPerfilIdQueryInvalid('12')).toBe(false);
    expect(isPerfilIdQueryInvalid(undefined)).toBe(false);
  });
});
