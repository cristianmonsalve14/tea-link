export type RegionChile =
  | "ARICA_PARINACOTA"
  | "TARAPACA"
  | "ANTOFAGASTA"
  | "ATACAMA"
  | "COQUIMBO"
  | "VALPARAISO"
  | "METROPOLITANA"
  | "OHIGGINS"
  | "MAULE"
  | "NUBLE"
  | "BIOBIO"
  | "ARAUCANIA"
  | "LOS_RIOS"
  | "LOS_LAGOS"
  | "AYSEN"
  | "MAGALLANES";

export const REGIONES_CHILE: RegionChile[] = [
  "ARICA_PARINACOTA",
  "TARAPACA",
  "ANTOFAGASTA",
  "ATACAMA",
  "COQUIMBO",
  "VALPARAISO",
  "METROPOLITANA",
  "OHIGGINS",
  "MAULE",
  "NUBLE",
  "BIOBIO",
  "ARAUCANIA",
  "LOS_RIOS",
  "LOS_LAGOS",
  "AYSEN",
  "MAGALLANES"
];

export const REGION_CHILE_LABEL: Record<RegionChile, string> = {
  ARICA_PARINACOTA: "Arica y Parinacota",
  TARAPACA: "Tarapacá",
  ANTOFAGASTA: "Antofagasta",
  ATACAMA: "Atacama",
  COQUIMBO: "Coquimbo",
  VALPARAISO: "Valparaíso",
  METROPOLITANA: "Región Metropolitana",
  OHIGGINS: "O'Higgins",
  MAULE: "Maule",
  NUBLE: "Ñuble",
  BIOBIO: "Biobío",
  ARAUCANIA: "La Araucanía",
  LOS_RIOS: "Los Ríos",
  LOS_LAGOS: "Los Lagos",
  AYSEN: "Aysén",
  MAGALLANES: "Magallanes"
};

export const REGIONES_CHILE_GRUPOS: Array<{
  label: string;
  regiones: RegionChile[];
}> = [
  {
    label: "Zona norte",
    regiones: ["ARICA_PARINACOTA", "TARAPACA", "ANTOFAGASTA", "ATACAMA"]
  },
  {
    label: "Zona centro",
    regiones: ["COQUIMBO", "VALPARAISO", "METROPOLITANA", "OHIGGINS", "MAULE", "NUBLE"]
  },
  {
    label: "Zona sur",
    regiones: ["BIOBIO", "ARAUCANIA", "LOS_RIOS", "LOS_LAGOS", "AYSEN", "MAGALLANES"]
  }
];

export function etiquetaRegionChile(region: RegionChile | string | null | undefined): string {
  if (!region) return "Sin región";
  return REGION_CHILE_LABEL[region as RegionChile] ?? region;
}
