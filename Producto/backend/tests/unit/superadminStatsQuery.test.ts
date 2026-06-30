import { describe, it, expect } from 'vitest';
import {
  parseInstitucionId,
  parseRolFilter,
  parseStatsDateRange,
  buildSuperadminStatsWhere
} from '../../src/utils/superadminStatsQuery';

describe('superadminStatsQuery', () => {
  it('parseRolFilter acepta rol válido', () => {
    expect(parseRolFilter('familia')).toBe('FAMILIA');
    expect(parseRolFilter('MEDICO')).toBe('MEDICO');
  });

  it('parseRolFilter rechaza rol inválido', () => {
    expect(parseRolFilter('')).toBeUndefined();
    expect(parseRolFilter('INVALIDO')).toBeUndefined();
  });

  it('parseInstitucionId parsea entero positivo', () => {
    expect(parseInstitucionId('11')).toBe(11);
    expect(parseInstitucionId('')).toBeUndefined();
    expect(parseInstitucionId('abc')).toBeUndefined();
  });

  it('parseStatsDateRange construye rango de fechas', () => {
    const range = parseStatsDateRange('2026-01-01', '2026-01-31');
    expect(range?.gte).toEqual(new Date('2026-01-01T00:00:00.000'));
    expect(range?.lte).toEqual(new Date('2026-01-31T23:59:59.999'));
  });

  it('parseStatsDateRange sin fechas devuelve undefined', () => {
    expect(parseStatsDateRange('', '')).toBeUndefined();
  });

  it('buildSuperadminStatsWhere aplica filtro institución', () => {
    const w = buildSuperadminStatsWhere({ institucion: '11' });
    expect(w.usuarioWhere).toMatchObject({ institucion_id: 11 });
    expect(w.institucionWhere).toMatchObject({ id: 11 });
  });

  it('buildSuperadminStatsWhere aplica filtro rol sin institución', () => {
    const w = buildSuperadminStatsWhere({ rol: 'EDUCADOR' });
    expect(w.usuarioWhere).toMatchObject({ rol: 'EDUCADOR' });
    expect(w.perfilWhere).toHaveProperty('usuarios');
  });
});
