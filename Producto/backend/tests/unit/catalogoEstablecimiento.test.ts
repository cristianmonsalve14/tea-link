import { describe, it, expect } from 'vitest';
import {
  inferirAmbitoSalud,
  inferirTipoOficialEducacion,
  inferirTipoOficialSalud,
  normalizarTextoBusqueda,
  parseCsvSemicolon,
  sugerirTipoInstitucionTeaLink,
  repararTextoCatalogo,
  etiquetaCodigoCatalogo
} from '../../src/utils/catalogoEstablecimiento';

describe('catalogoEstablecimiento', () => {
  it('normalizarTextoBusqueda elimina tildes y símbolos', () => {
    expect(normalizarTextoBusqueda('Colegio Altavida — Viña')).toBe('COLEGIO ALTAVIDA VINA');
  });

  it('parseCsvSemicolon lee encabezados con BOM', () => {
    const csv = '\uFEFFcol1;col2\na;b\nc;d';
    const rows = parseCsvSemicolon(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ col1: 'a', col2: 'b' });
  });

  it('inferirTipoOficialEducacion clasifica por nombre', () => {
    expect(inferirTipoOficialEducacion('Liceo Bicentenario')).toBe('liceo');
    expect(inferirTipoOficialEducacion('Colegio San José')).toBe('colegio');
    expect(inferirTipoOficialEducacion('CTRO. DE RECURSOS ALTAVIDA')).toBe('centro_educacional');
  });

  it('inferirAmbitoSalud distingue terapéutico de salud general', () => {
    expect(inferirAmbitoSalud('Hospital', 'Hospital Van Buren')).toBe('SALUD');
    expect(inferirAmbitoSalud('Centro', 'Centro de Recursos Altavida')).toBe('TERAPEUTICO');
    expect(inferirAmbitoSalud('Centro', 'Centro de Rehabilitación')).toBe('TERAPEUTICO');
  });

  it('inferirTipoOficialSalud clasifica establecimientos', () => {
    expect(inferirTipoOficialSalud('Hospital', 'Hospital Regional')).toBe('hospital');
    expect(inferirTipoOficialSalud('CESFAM', 'CESFAM Norte')).toBe('consultorio_aps');
  });

  it('sugerirTipoInstitucionTeaLink mapea ámbito a tipo TEA Link', () => {
    expect(sugerirTipoInstitucionTeaLink('EDUCACION')).toBe('CENTRO_EDUCACIONAL');
    expect(sugerirTipoInstitucionTeaLink('SALUD')).toBe('CENTRO_MEDICO');
    expect(sugerirTipoInstitucionTeaLink('TERAPEUTICO')).toBe('CENTRO_PROFESIONAL');
  });

  it('repararTextoCatalogo corrige mojibake UTF-8', () => {
    expect(repararTextoCatalogo('ValparaÃ­so')).toBe('Valparaíso');
  });

  it('etiquetaCodigoCatalogo formatea RBD y DEIS', () => {
    expect(etiquetaCodigoCatalogo('MINEDUC_ESCOLAR', '14799')).toBe('RBD 14799');
    expect(etiquetaCodigoCatalogo('DEIS_SALUD', '12345')).toBe('Código salud 12345');
  });
});
