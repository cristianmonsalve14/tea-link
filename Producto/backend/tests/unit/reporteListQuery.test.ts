import { describe, it, expect } from 'vitest';
import { buildReportesListWhere, parseFormatoReporte } from '../../src/utils/reporteListQuery';

describe('reporteListQuery', () => {
  it('parseFormatoReporte acepta PDF y EXCEL', () => {
    expect(parseFormatoReporte('PDF')).toBe('PDF');
    expect(parseFormatoReporte('EXCEL')).toBe('EXCEL');
    expect(parseFormatoReporte('WORD')).toBeUndefined();
  });

  it('buildReportesListWhere sin filtros devuelve objeto vacío', () => {
    expect(buildReportesListWhere({})).toEqual({});
  });

  it('buildReportesListWhere con formato', () => {
    expect(buildReportesListWhere({ formato: 'PDF' })).toEqual({ formato: 'PDF' });
  });

  it('buildReportesListWhere con rango de fechas', () => {
    const where = buildReportesListWhere({
      desde: '2026-01-01',
      hasta: '2026-01-31'
    });
    expect(where.AND).toHaveLength(1);
    expect(where.AND![0].fecha_inicio?.gte).toEqual(new Date('2026-01-01'));
    expect(where.AND![0].fecha_fin?.lte).toEqual(new Date('2026-01-31'));
  });
});
