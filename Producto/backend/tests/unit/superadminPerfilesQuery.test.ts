import { describe, it, expect } from 'vitest';
import {
  buildSuperadminPerfilSearchWhere,
  buildInstitucionCustodiaWhere,
  superadminPerfilesListQuerySchema
} from '../../src/utils/superadminPerfilesQuery';

describe('superadminPerfilesQuery', () => {
  it('superadminPerfilesListQuerySchema aplica defaults', () => {
    const q = superadminPerfilesListQuerySchema.parse({});
    expect(q.page).toBe(1);
    expect(q.limit).toBe(25);
    expect(q.sort).toBe('nombre');
  });

  it('superadminPerfilesListQuerySchema acepta tipo_institucion custodia', () => {
    const q = superadminPerfilesListQuerySchema.parse({
      tipo_institucion: 'CENTRO_EDUCACIONAL',
      region: 'METROPOLITANA'
    });
    expect(q.tipo_institucion).toBe('CENTRO_EDUCACIONAL');
    expect(q.region).toBe('METROPOLITANA');
  });

  it('buildInstitucionCustodiaWhere combina región y tipo', () => {
    expect(
      buildInstitucionCustodiaWhere({
        region: 'METROPOLITANA',
        tipo_institucion: 'CENTRO_MEDICO'
      })
    ).toEqual({
      region: 'METROPOLITANA',
      tipo: 'CENTRO_MEDICO'
    });
  });

  it('buildSuperadminPerfilSearchWhere busca por nombre y RUT', () => {
    const byNombre = buildSuperadminPerfilSearchWhere('Matías');
    expect(byNombre?.OR).toBeDefined();

    const byRut = buildSuperadminPerfilSearchWhere('11.111.111-1');
    expect(byRut?.OR?.some(c => 'rut' in c && c.rut === '11111111-1')).toBe(true);
  });
});
