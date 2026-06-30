import { region_chile_enum } from '@prisma/client';
import { z } from 'zod';

export const REGIONES_CHILE: region_chile_enum[] = [
  'ARICA_PARINACOTA',
  'TARAPACA',
  'ANTOFAGASTA',
  'ATACAMA',
  'COQUIMBO',
  'VALPARAISO',
  'METROPOLITANA',
  'OHIGGINS',
  'MAULE',
  'NUBLE',
  'BIOBIO',
  'ARAUCANIA',
  'LOS_RIOS',
  'LOS_LAGOS',
  'AYSEN',
  'MAGALLANES'
];

export const REGION_CHILE_LABEL: Record<region_chile_enum, string> = {
  ARICA_PARINACOTA: 'Arica y Parinacota',
  TARAPACA: 'Tarapacá',
  ANTOFAGASTA: 'Antofagasta',
  ATACAMA: 'Atacama',
  COQUIMBO: 'Coquimbo',
  VALPARAISO: 'Valparaíso',
  METROPOLITANA: 'Región Metropolitana',
  OHIGGINS: "O'Higgins",
  MAULE: 'Maule',
  NUBLE: 'Ñuble',
  BIOBIO: 'Biobío',
  ARAUCANIA: 'La Araucanía',
  LOS_RIOS: 'Los Ríos',
  LOS_LAGOS: 'Los Lagos',
  AYSEN: 'Aysén',
  MAGALLANES: 'Magallanes'
};

export const REGIONES_CHILE_GRUPOS: Array<{
  label: string;
  regiones: region_chile_enum[];
}> = [
  {
    label: 'Zona norte',
    regiones: ['ARICA_PARINACOTA', 'TARAPACA', 'ANTOFAGASTA', 'ATACAMA']
  },
  {
    label: 'Zona centro',
    regiones: ['COQUIMBO', 'VALPARAISO', 'METROPOLITANA', 'OHIGGINS', 'MAULE', 'NUBLE']
  },
  {
    label: 'Zona sur',
    regiones: ['BIOBIO', 'ARAUCANIA', 'LOS_RIOS', 'LOS_LAGOS', 'AYSEN', 'MAGALLANES']
  }
];

export const regionChileSchema = z.enum(
  REGIONES_CHILE as [region_chile_enum, ...region_chile_enum[]]
);

export function etiquetaRegionChile(
  region: region_chile_enum | string | null | undefined
): string {
  if (!region) return 'Sin región';
  return REGION_CHILE_LABEL[region as region_chile_enum] ?? region;
}
