import { describe, it, expect } from 'vitest';
import {
  esInstitucionCreadoraPerfil,
  tiposInstitucionInvitablesPorSolicitante,
  tipoInstitucionPuedeRecibirInvitacion
} from '../../src/utils/solicitudInstitucionRules';

describe('solicitudInstitucionRules', () => {
  it('colegio y centro médico son creadores de perfil', () => {
    expect(esInstitucionCreadoraPerfil('CENTRO_EDUCACIONAL')).toBe(true);
    expect(esInstitucionCreadoraPerfil('CENTRO_MEDICO')).toBe(true);
    expect(esInstitucionCreadoraPerfil('CENTRO_PROFESIONAL')).toBe(false);
  });

  it('colegio puede invitar médico y terapéutico', () => {
    expect(tiposInstitucionInvitablesPorSolicitante('CENTRO_EDUCACIONAL')).toEqual([
      'CENTRO_MEDICO',
      'CENTRO_PROFESIONAL'
    ]);
  });

  it('centro médico puede invitar colegio y terapéutico', () => {
    expect(tiposInstitucionInvitablesPorSolicitante('CENTRO_MEDICO')).toEqual([
      'CENTRO_EDUCACIONAL',
      'CENTRO_PROFESIONAL'
    ]);
  });

  it('centro médico puede recibir invitación desde colegio', () => {
    expect(
      tipoInstitucionPuedeRecibirInvitacion('CENTRO_MEDICO', 'CENTRO_EDUCACIONAL')
    ).toBe(true);
  });

  it('colegio puede recibir invitación desde centro médico', () => {
    expect(
      tipoInstitucionPuedeRecibirInvitacion('CENTRO_EDUCACIONAL', 'CENTRO_MEDICO')
    ).toBe(true);
  });

  it('familia no puede recibir invitación institucional', () => {
    expect(tipoInstitucionPuedeRecibirInvitacion('FAMILIA')).toBe(false);
  });
});
