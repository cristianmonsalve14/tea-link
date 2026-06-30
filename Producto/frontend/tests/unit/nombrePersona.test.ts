import { describe, it, expect } from "vitest";
import {
  nombreIncluyeApellido,
  validarNombreCompletoConApellido
} from "../../src/utils/nombrePersona";

describe("nombrePersona (frontend)", () => {
  it("valida nombre con dos apellidos", () => {
    expect(validarNombreCompletoConApellido("Ana Torres Vega")).toBeNull();
    expect(nombreIncluyeApellido("Ana Torres Vega")).toBe(true);
  });

  it("rechaza sin segundo apellido", () => {
    expect(validarNombreCompletoConApellido("Ana Torres")).not.toBeNull();
  });
});
