import { describe, it, expect } from 'vitest';
import { regionDesdeCodigoDeis, regionDesdeNombreOficial } from '../../src/utils/regionCatalogo';

describe('regionCatalogo', () => {
  it('regionDesdeNombreOficial resuelve alias y nombres oficiales', () => {
    expect(regionDesdeNombreOficial('Valparaíso')).toBe('VALPARAISO');
    expect(regionDesdeNombreOficial('RM')).toBe('METROPOLITANA');
    expect(regionDesdeNombreOficial('Región Metropolitana')).toBe('METROPOLITANA');
    expect(regionDesdeNombreOficial('Arica y Parinacota')).toBe('ARICA_PARINACOTA');
  });

  it('regionDesdeNombreOficial devuelve null si no hay coincidencia', () => {
    expect(regionDesdeNombreOficial('')).toBeNull();
    expect(regionDesdeNombreOficial(null)).toBeNull();
    expect(regionDesdeNombreOficial('Zona desconocida')).toBeNull();
  });

  it('regionDesdeCodigoDeis mapea códigos DEIS', () => {
    expect(regionDesdeCodigoDeis('5')).toBe('VALPARAISO');
    expect(regionDesdeCodigoDeis('13')).toBe('METROPOLITANA');
    expect(regionDesdeCodigoDeis('16')).toBe('NUBLE');
    expect(regionDesdeCodigoDeis('99')).toBeNull();
  });
});
