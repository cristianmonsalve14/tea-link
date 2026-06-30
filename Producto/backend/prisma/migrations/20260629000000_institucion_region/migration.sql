-- Región administrativa de Chile para ubicar instituciones a escala nacional
CREATE TYPE "region_chile_enum" AS ENUM (
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
);

ALTER TABLE "instituciones" ADD COLUMN "region" "region_chile_enum";

CREATE INDEX "idx_institucion_region" ON "instituciones"("region");
