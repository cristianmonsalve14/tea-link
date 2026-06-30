import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  clearSession,
  clearPerfilActivo,
  familiaNecesitaSeleccionPerfil,
  getPostAuthPath,
  getRole,
  getToken,
  isAuthenticated,
  isTokenValid,
  mustChangePassword,
  saveSession,
  setPerfilActivo
} from '../../src/utils/auth';

function fakeJwt(payload: Record<string, unknown>) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('auth utils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('saveSession y getToken', () => {
    saveSession('abc', 'FAMILIA', 'Inst', 'FAMILIA', false, 'Usuario Test');
    expect(getToken()).toBe('abc');
    expect(getRole()).toBe('FAMILIA');
    expect(mustChangePassword()).toBe(false);
  });

  it('isTokenValid rechaza token expirado', () => {
    const expired = fakeJwt({ exp: Math.floor(Date.now() / 1000) - 60, rol: 'FAMILIA' });
    expect(isTokenValid(expired)).toBe(false);
  });

  it('isTokenValid acepta token vigente', () => {
    const valid = fakeJwt({ exp: Math.floor(Date.now() / 1000) + 3600, rol: 'FAMILIA' });
    expect(isTokenValid(valid)).toBe(true);
  });

  it('isAuthenticated es false sin token', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('clearSession limpia almacenamiento', () => {
    saveSession('tok', 'MEDICO');
    clearSession();
    expect(getToken()).toBeNull();
    expect(getRole()).toBeNull();
  });

  it('mustChangePassword true cuando corresponde', () => {
    saveSession('tok', 'EDUCADOR', undefined, undefined, true);
    expect(mustChangePassword()).toBe(true);
  });

  it('familia necesita seleccionar perfil sin perfil activo', () => {
    saveSession('tok', 'FAMILIA');
    expect(familiaNecesitaSeleccionPerfil()).toBe(true);
    setPerfilActivo(5, 'Matías');
    expect(familiaNecesitaSeleccionPerfil()).toBe(false);
  });

  it('getPostAuthPath prioriza cambio de clave y selección familia', () => {
    saveSession('tok', 'FAMILIA', 'Inst', 'FAMILIA', true);
    expect(getPostAuthPath()).toBe('/cambiar-contrasena');
    saveSession('tok', 'FAMILIA', 'Inst', 'FAMILIA', false);
    expect(getPostAuthPath()).toBe('/familia/seleccionar-perfil');
    setPerfilActivo(5, 'Matías');
    expect(getPostAuthPath()).toBe('/dashboard');
    clearPerfilActivo();
    saveSession('tok', 'MEDICO');
    expect(getPostAuthPath()).toBe('/dashboard');
  });
});
