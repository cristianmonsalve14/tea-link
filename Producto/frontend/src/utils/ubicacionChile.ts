import type { RegionChile } from "./regionChile";

const API_BASE = "http://localhost:3000/api/auth";

export async function fetchComunasPorRegion(region: RegionChile): Promise<string[]> {
  const res = await fetch(`${API_BASE}/ubicacion/comunas?region=${region}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : "No se pudieron cargar las comunas"
    );
  }
  return Array.isArray(data.comunas) ? data.comunas : [];
}

export type UbicacionInstitucion = {
  region: RegionChile | "";
  comuna: string;
  localidad: string;
};

export function ubicacionInstitucionCompleta(ubicacion: UbicacionInstitucion): boolean {
  return Boolean(ubicacion.region && ubicacion.comuna.trim() && ubicacion.localidad.trim());
}

export type ErroresUbicacionInstitucion = Partial<
  Record<"region" | "comuna" | "localidad", string>
>;

export function validarUbicacionInstitucion(
  ubicacion: UbicacionInstitucion,
  comunasRegion?: string[]
): ErroresUbicacionInstitucion {
  const errors: ErroresUbicacionInstitucion = {};
  if (!ubicacion.region) {
    errors.region = "Seleccione una región";
  }
  const comuna = ubicacion.comuna.trim();
  if (!comuna) {
    errors.comuna = "Seleccione una comuna";
  } else if (comuna.length < 2) {
    errors.comuna = "La comuna debe tener al menos 2 caracteres";
  } else if (comuna.length > 100) {
    errors.comuna = "La comuna no puede superar 100 caracteres";
  } else if (
    comunasRegion?.length &&
    !comunasRegion.some(c => c.localeCompare(comuna, "es", { sensitivity: "accent" }) === 0)
  ) {
    errors.comuna = "La comuna no corresponde a la región seleccionada";
  }
  const localidad = ubicacion.localidad.trim();
  if (!localidad) {
    errors.localidad = "La localidad es obligatoria";
  } else if (localidad.length < 2) {
    errors.localidad = "La localidad debe tener al menos 2 caracteres";
  } else if (localidad.length > 120) {
    errors.localidad = "La localidad no puede superar 120 caracteres";
  }
  return errors;
}

export function formatearUbicacionInstitucion(
  regionLabel?: string | null,
  comuna?: string | null,
  localidad?: string | null
): string | null {
  const partes = [regionLabel, comuna, localidad].filter(Boolean);
  return partes.length > 0 ? partes.join(" · ") : null;
}
