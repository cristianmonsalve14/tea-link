import { describe, it, expect } from 'vitest';
import {
  ACCION_AUDITORIA_OBS,
  esPrivacidadAuditable,
  filtrarObservacionesAuditables,
  truncarDetallesAuditoria
} from '../../src/utils/auditoriaObservacion';

describe('auditoriaObservacion', () => {
  it('esPrivacidadAuditable solo MULTINIVEL y PRIVADA', () => {
    expect(esPrivacidadAuditable('MULTINIVEL')).toBe(true);
    expect(esPrivacidadAuditable('PRIVADA')).toBe(true);
    expect(esPrivacidadAuditable('PUBLICA')).toBe(false);
    expect(esPrivacidadAuditable(null)).toBe(false);
  });

  it('filtrarObservacionesAuditables', () => {
    const rows = [
      { id: 1, privacidad: 'PUBLICA' as const },
      { id: 2, privacidad: 'MULTINIVEL' as const },
      { id: 3, privacidad: 'PRIVADA' as const }
    ];
    const out = filtrarObservacionesAuditables(rows);
    expect(out.map(r => r.id)).toEqual([2, 3]);
  });

  it('truncarDetallesAuditoria respeta máximo', () => {
    const largo = 'x'.repeat(500);
    expect(truncarDetallesAuditoria(largo).length).toBeLessThanOrEqual(480);
    expect(truncarDetallesAuditoria('corto')).toBe('corto');
  });

  it('ACCION_AUDITORIA_OBS tiene claves esperadas', () => {
    expect(ACCION_AUDITORIA_OBS.CONSULTAR).toBe('CONSULTAR_OBSERVACION_SENSIBLE');
    expect(ACCION_AUDITORIA_OBS.EXPORTAR_REPORTE).toBe('EXPORTAR_REPORTE_SENSIBLE');
  });
});
