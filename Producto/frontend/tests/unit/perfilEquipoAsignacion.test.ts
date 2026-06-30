import { describe, it, expect } from "vitest";
import {
  adminPuedeAsignarEquipoPerfil,
  educadorCompatibleConPerfil,
  rolesAsignablesPorInstitucion
} from "../../src/utils/perfilEquipoAsignacion";
import type { NivelEducacional } from "../../src/utils/nivelEducacional";

describe("perfilEquipoAsignacion", () => {
  it("centro médico asigna médicos y profesionales", () => {
    expect(rolesAsignablesPorInstitucion("CENTRO_MEDICO")).toEqual([
      "MEDICO",
      "PROFESIONAL"
    ]);
  });

  it("permite asignar en perfil propio con consentimiento", () => {
    expect(
      adminPuedeAsignarEquipoPerfil(
        { es_propio: true, consentimiento_estado: "ACEPTADO" },
        "CENTRO_MEDICO"
      )
    ).toBe(true);
  });

  it("bloquea sin consentimiento", () => {
    expect(
      adminPuedeAsignarEquipoPerfil(
        { es_propio: true, consentimiento_estado: "PENDIENTE" },
        "CENTRO_MEDICO"
      )
    ).toBe(false);
  });

  it("educador solo compatible con el nivel del alumno en colegio", () => {
    const educador = {
      rol: "EDUCADOR",
      niveles_educacionales: ["BASICO_7" as NivelEducacional]
    };
    expect(
      educadorCompatibleConPerfil(educador, "BASICO_7", "CENTRO_EDUCACIONAL")
    ).toBe(true);
    expect(
      educadorCompatibleConPerfil(educador, "LABORAL", "CENTRO_EDUCACIONAL")
    ).toBe(false);
    expect(
      educadorCompatibleConPerfil(
        { rol: "MEDICO", niveles_educacionales: [] },
        "BASICO_7",
        "CENTRO_MEDICO"
      )
    ).toBe(true);
  });
});
