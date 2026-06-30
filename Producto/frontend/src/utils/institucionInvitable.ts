/** Máximo de centros listables sin escribir en el buscador. */
export const UMBRAL_CATALOGO_INVITABLE_LISTADO = 25;

/** Mínimo de caracteres para buscar cuando el catálogo supera el umbral. */
export const MIN_BUSQUEDA_INVITABLE_CHARS = 2;

export function puedeListarInstitucionesInvitables(
  totalFiltrado: number,
  q?: string | null
): boolean {
  if (totalFiltrado <= UMBRAL_CATALOGO_INVITABLE_LISTADO) return true;
  return (q?.trim().length ?? 0) >= MIN_BUSQUEDA_INVITABLE_CHARS;
}

export function rangoPaginaInvitables(
  page: number,
  limit: number,
  total: number
): { desde: number; hasta: number } | null {
  if (total <= 0) return null;
  const desde = (page - 1) * limit + 1;
  const hasta = Math.min(page * limit, total);
  return { desde, hasta };
}

export function mensajeBusquedaInvitable(
  totalFiltrado: number,
  busquedaInput: string,
  tieneFiltroRegion: boolean
): string {
  const q = busquedaInput.trim();
  if (totalFiltrado <= UMBRAL_CATALOGO_INVITABLE_LISTADO) {
    return "";
  }
  if (q.length === 0 && !tieneFiltroRegion) {
    return `Hay ${totalFiltrado} centros disponibles. Seleccione región/comuna y/o escriba al menos ${MIN_BUSQUEDA_INVITABLE_CHARS} caracteres (nombre, ubicación, email, teléfono o dirección) para ver resultados.`;
  }
  if (q.length > 0 && q.length < MIN_BUSQUEDA_INVITABLE_CHARS) {
    return `Escriba al menos ${MIN_BUSQUEDA_INVITABLE_CHARS} caracteres para buscar entre ${totalFiltrado} centros.`;
  }
  if (q.length === 0 && tieneFiltroRegion) {
    return `Hay ${totalFiltrado} centros en la región seleccionada. Escriba al menos ${MIN_BUSQUEDA_INVITABLE_CHARS} caracteres para acotar la lista.`;
  }
  return "";
}
