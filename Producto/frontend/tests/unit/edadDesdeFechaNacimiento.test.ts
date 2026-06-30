import { describe, it, expect } from "vitest";
import {
  calcularEdadDetallada,
  formatearEdadDetallada,
  formatearEdadPerfil
} from "../../src/utils/edadDesdeFechaNacimiento";

describe("edadDesdeFechaNacimiento (frontend)", () => {
  const ref = new Date(2026, 5, 28);

  it("formatea años y meses", () => {
    expect(formatearEdadDetallada({ años: 8, meses: 3 })).toBe("8 años y 3 meses");
    expect(formatearEdadDetallada({ años: 1, meses: 0 })).toBe("1 año");
    expect(formatearEdadDetallada({ años: 0, meses: 5 })).toBe("5 meses");
  });

  it("formatearEdadPerfil usa fecha de nacimiento", () => {
    expect(formatearEdadPerfil("2018-03-10", null)).toBe("8 años y 3 meses");
  });

  it("formatearEdadPerfil sin fecha usa años guardados", () => {
    expect(formatearEdadPerfil(null, 12)).toBe("12 años");
  });

  it("calcula edad detallada", () => {
    expect(calcularEdadDetallada("2010-03-15", ref)).toEqual({ años: 16, meses: 3 });
    expect(calcularEdadDetallada("2026-06-28", ref)).toEqual({ años: 0, meses: 0 });
  });
});
