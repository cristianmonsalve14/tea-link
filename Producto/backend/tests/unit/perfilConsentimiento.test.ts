import { describe, it, expect } from 'vitest';
import {
  perfilEstaOperativo,
  mensajeBloqueoConsentimiento,
  institucionRequiereTutorAlCrear,
  institucionPuedeCrearPerfilMenor,
  determinarSujetoConsentimiento,
  esMenorDeEdad,
  etiquetaEstadoConsentimientoPendiente,
  etiquetaResponsableConsentimiento
} from '../../src/utils/perfilConsentimiento';

describe('perfilConsentimiento', () => {
  it('solo ACEPTADO está operativo', () => {
    expect(perfilEstaOperativo('ACEPTADO')).toBe(true);
    expect(perfilEstaOperativo('PENDIENTE')).toBe(false);
    expect(perfilEstaOperativo('RECHAZADO')).toBe(false);
  });

  it('mensajes de bloqueo por estado', () => {
    expect(mensajeBloqueoConsentimiento('PENDIENTE', 'TUTOR_LEGAL')).toMatch(/tutor/i);
    expect(mensajeBloqueoConsentimiento('PENDIENTE', 'TITULAR')).toMatch(/estudiante/i);
    expect(mensajeBloqueoConsentimiento('RECHAZADO', 'TITULAR')).toMatch(/rechaz/i);
  });

  it('colegio y médico requieren responsable al crear', () => {
    expect(institucionRequiereTutorAlCrear('CENTRO_EDUCACIONAL')).toBe(true);
    expect(institucionRequiereTutorAlCrear('CENTRO_MEDICO')).toBe(true);
    expect(institucionRequiereTutorAlCrear('FAMILIA')).toBe(false);
  });

  it('tipos que pueden crear perfil menor', () => {
    expect(institucionPuedeCrearPerfilMenor('CENTRO_EDUCACIONAL')).toBe(true);
    expect(institucionPuedeCrearPerfilMenor('CENTRO_MEDICO')).toBe(true);
    expect(institucionPuedeCrearPerfilMenor('FAMILIA')).toBe(false);
    expect(institucionPuedeCrearPerfilMenor('SISTEMA')).toBe(false);
  });

  it('determina sujeto según edad', () => {
    expect(esMenorDeEdad(17)).toBe(true);
    expect(esMenorDeEdad(18)).toBe(false);
    expect(determinarSujetoConsentimiento(17)).toBe('TUTOR_LEGAL');
    expect(determinarSujetoConsentimiento(18)).toBe('TITULAR');
    expect(determinarSujetoConsentimiento(null, '2010-01-01')).toBe('TUTOR_LEGAL');
  });

  it('etiquetas de estado y responsable', () => {
    expect(etiquetaEstadoConsentimientoPendiente('TITULAR')).toBe('Pendiente estudiante');
    expect(etiquetaEstadoConsentimientoPendiente('TUTOR_LEGAL')).toBe('Pendiente tutor');
    expect(etiquetaResponsableConsentimiento('TITULAR')).toBe('estudiante titular');
  });
});
