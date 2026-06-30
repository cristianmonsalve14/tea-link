import { describe, it, expect } from "vitest";
import { filtrarPerfilesPorBusqueda } from "../../src/utils/perfilSelectorFilter";

describe("filtrarPerfilesPorBusqueda", () => {
  const perfiles = [
    { id: 1, nombre: "Joaquín Sánchez", edad: 10, diagnostico_clinico: "TEA", notas: null },
    { id: 2, nombre: "María López", edad: 8, diagnostico_clinico: "TDAH", notas: "Seguimiento escolar" },
    { id: 3, nombre: "Pedro Muñoz", edad: 12, diagnostico_clinico: "TEL", notas: null }
  ];

  it("devuelve todos si no hay término", () => {
    expect(filtrarPerfilesPorBusqueda(perfiles, "")).toHaveLength(3);
  });

  it("filtra por nombre o apellido", () => {
    expect(filtrarPerfilesPorBusqueda(perfiles, "sanchez")).toHaveLength(1);
    expect(filtrarPerfilesPorBusqueda(perfiles, "joaquin")).toHaveLength(1);
    expect(filtrarPerfilesPorBusqueda(perfiles, "maria lopez")).toHaveLength(1);
  });

  it("filtra por diagnóstico o notas", () => {
    expect(filtrarPerfilesPorBusqueda(perfiles, "tdah")).toHaveLength(1);
    expect(filtrarPerfilesPorBusqueda(perfiles, "seguimiento")).toHaveLength(1);
  });
});
