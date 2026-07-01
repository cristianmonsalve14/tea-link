import { describe, expect, it } from 'vitest';
import {
  comunaValidaEnRegion,
  listarComunasPorRegion,
  normalizarComuna,
  ubicacionInstitucionSchema
} from '../../src/utils/ubicacionChile';

describe('ubicacionChile', () => {
  it('lista comunas oficiales por región', () => {
    const comunas = listarComunasPorRegion('METROPOLITANA');
    expect(comunas).toContain('Providencia');
    expect(comunas.length).toBeGreaterThan(50);
  });

  it('valida comuna dentro de la región', () => {
    expect(comunaValidaEnRegion('METROPOLITANA', 'Las Condes')).toBe(true);
    expect(comunaValidaEnRegion('METROPOLITANA', 'Concepción')).toBe(false);
  });

  it('normaliza comuna con acentos', () => {
    expect(normalizarComuna('BIOBIO', 'Concepción')).toBe('Concepción');
  });

  it('exige región y comuna; localidad es opcional', () => {
    const ok = ubicacionInstitucionSchema.safeParse({
      region: 'METROPOLITANA',
      comuna: 'Providencia',
      localidad: 'Centro'
    });
    expect(ok.success).toBe(true);

    const sinLocalidad = ubicacionInstitucionSchema.safeParse({
      region: 'METROPOLITANA',
      comuna: 'Providencia',
      localidad: ''
    });
    expect(sinLocalidad.success).toBe(true);
    if (sinLocalidad.success) {
      expect(sinLocalidad.data.localidad).toBeNull();
    }

    const bad = ubicacionInstitucionSchema.safeParse({
      region: 'METROPOLITANA',
      comuna: 'Concepción',
      localidad: 'Centro'
    });
    expect(bad.success).toBe(false);
  });
});
