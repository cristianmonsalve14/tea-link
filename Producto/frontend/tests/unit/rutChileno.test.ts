import { describe, it, expect } from "vitest";
import {
  normalizarRutChileno,
  validarRutChileno,
  formatearRutChileno,
  mensajeErrorRut
} from "../../src/utils/rutChileno";

describe("rutChileno (frontend)", () => {
  it("normaliza y valida", () => {
    expect(normalizarRutChileno("11.111.111-1")).toBe("11111111-1");
    expect(validarRutChileno("11.111.111-1")).toBe(true);
  });

  it("formatea para pantalla", () => {
    expect(formatearRutChileno("11111111-1")).toBe("11.111.111-1");
  });

  it("mensajeErrorRut detecta vacío e inválido", () => {
    expect(mensajeErrorRut("")).toMatch(/obligatorio/);
    expect(mensajeErrorRut("11.111.111-9")).toMatch(/inválido/);
    expect(mensajeErrorRut("11.111.111-1")).toBeNull();
  });
});
