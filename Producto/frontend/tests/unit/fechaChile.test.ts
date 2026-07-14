import { describe, expect, it } from "vitest";
import {
  datetimeLocalChileToISO,
  formatFechaHoraChile,
  toDatetimeLocalChile
} from "../../src/utils/fechaChile";

describe("fechaChile", () => {
  it("convierte datetime-local Chile a UTC y vuelve al mismo valor local", () => {
    const local = "2026-07-08T14:30";
    const iso = datetimeLocalChileToISO(local);
    expect(toDatetimeLocalChile(iso)).toBe(local);
  });

  it("formatea en horario de Chile aunque el navegador use otra zona", () => {
    const iso = "2026-07-08T18:30:00.000Z";
    const formatted = formatFechaHoraChile(iso);
    expect(formatted).toMatch(/14:30|2:30/);
    expect(formatted).toMatch(/2026/);
  });
});
