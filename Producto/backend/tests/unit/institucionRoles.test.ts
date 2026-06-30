import { describe, it, expect } from 'vitest';
import {
  etiquetaEquipoInstitucion,
  rolesRegistroPorTipoInstitucion
} from '../../src/utils/institucionRoles';

describe('institucionRoles', () => {
  it('rolesRegistroPorTipoInstitucion para FAMILIA', () => {
    expect(rolesRegistroPorTipoInstitucion('FAMILIA')).toEqual(['FAMILIA']);
  });

  it('rolesRegistroPorTipoInstitucion para CENTRO_EDUCACIONAL', () => {
    expect(rolesRegistroPorTipoInstitucion('CENTRO_EDUCACIONAL')).toEqual(['EDUCADOR']);
  });

  it('rolesRegistroPorTipoInstitucion para CENTRO_MEDICO', () => {
    expect(rolesRegistroPorTipoInstitucion('CENTRO_MEDICO')).toEqual(['MEDICO', 'PROFESIONAL']);
  });

  it('rolesRegistroPorTipoInstitucion para SISTEMA devuelve vacío', () => {
    expect(rolesRegistroPorTipoInstitucion('SISTEMA')).toEqual([]);
  });

  it('rolesRegistroPorTipoInstitucion para CENTRO_PROFESIONAL', () => {
    expect(rolesRegistroPorTipoInstitucion('CENTRO_PROFESIONAL')).toEqual(['PROFESIONAL']);
  });

  it('etiquetaEquipoInstitucion para familia y médico', () => {
    expect(etiquetaEquipoInstitucion('FAMILIA')).toBe('Familias');
    expect(etiquetaEquipoInstitucion('CENTRO_MEDICO')).toBe('Equipo médico');
    expect(etiquetaEquipoInstitucion('CENTRO_PROFESIONAL')).toBe('Profesionales');
  });
});
