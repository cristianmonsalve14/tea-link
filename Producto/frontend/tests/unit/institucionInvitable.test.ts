import { describe, expect, it } from "vitest";
import {
  mensajeBusquedaInvitable,
  puedeListarInstitucionesInvitables,
  rangoPaginaInvitables
} from "../../src/utils/institucionInvitable";

describe("institucionInvitable (frontend)", () => {
  it("mensaje guía en catálogo grande", () => {
    expect(mensajeBusquedaInvitable(800, "", false)).toContain("800 centros");
    expect(mensajeBusquedaInvitable(800, "a", false)).toContain("al menos 2");
    expect(mensajeBusquedaInvitable(800, "norte", false)).toBe("");
    expect(mensajeBusquedaInvitable(800, "", true)).toContain("región seleccionada");
    expect(mensajeBusquedaInvitable(5, "", false)).toBe("");
  });

  it("rango legible para paginación", () => {
    expect(rangoPaginaInvitables(2, 10, 25)).toEqual({ desde: 11, hasta: 20 });
  });

  it("alinea reglas con backend", () => {
    expect(puedeListarInstitucionesInvitables(30, "cl")).toBe(true);
    expect(puedeListarInstitucionesInvitables(30, "c")).toBe(false);
  });
});
