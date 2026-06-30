import { describe, it, expect } from 'vitest';
import {
  CONSENTIMIENTO_VERSION,
  usuarioNecesitaConsentimiento
} from '../../src/utils/consentimiento';

describe('consentimiento', () => {
  it('FAMILIA sin fecha requiere consentimiento', () => {
    expect(usuarioNecesitaConsentimiento('FAMILIA', null)).toBe(true);
  });

  it('FAMILIA con fecha aceptada no requiere consentimiento', () => {
    expect(usuarioNecesitaConsentimiento('FAMILIA', new Date())).toBe(false);
  });

  it('otros roles no requieren consentimiento', () => {
    expect(usuarioNecesitaConsentimiento('MEDICO', null)).toBe(false);
    expect(usuarioNecesitaConsentimiento('ADMINISTRADOR', null)).toBe(false);
  });

  it('tiene versión definida', () => {
    expect(CONSENTIMIENTO_VERSION.length).toBeGreaterThan(0);
  });
});
