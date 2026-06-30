import { describe, it, expect } from 'vitest';
import { canViewReporte, isValidNumericId } from '../../src/utils/reporteAccess';

describe('reporteAccess', () => {
  it('superadmin no puede ver reportes', () => {
    expect(canViewReporte('SUPERADMIN', 1, 1)).toBe(false);
    expect(canViewReporte('SUPERADMIN', 1, 99)).toBe(false);
  });

  it('administrador institucional no puede ver reportes', () => {
    expect(canViewReporte('ADMINISTRADOR', 1, 1)).toBe(false);
  });

  it('creador puede ver su reporte', () => {
    expect(canViewReporte('FAMILIA', 5, 5)).toBe(true);
  });

  it('otro usuario no puede ver reporte ajeno', () => {
    expect(canViewReporte('FAMILIA', 5, 8)).toBe(false);
  });

  it('sin userId no autorizado', () => {
    expect(canViewReporte('FAMILIA', undefined, 5)).toBe(false);
  });

  it('isValidNumericId valida enteros positivos', () => {
    expect(isValidNumericId(3)).toBe(true);
    expect(isValidNumericId('7')).toBe(true);
    expect(isValidNumericId(0)).toBe(false);
    expect(isValidNumericId('x')).toBe(false);
  });
});
