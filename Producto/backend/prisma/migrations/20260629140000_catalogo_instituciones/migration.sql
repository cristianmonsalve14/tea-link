-- Catálogo oficial de establecimientos (MINEDUC / DEIS) e incorporación a instituciones

CREATE TYPE "catalogo_fuente_enum" AS ENUM ('MINEDUC_ESCOLAR', 'DEIS_SALUD');
CREATE TYPE "catalogo_ambito_enum" AS ENUM ('EDUCACION', 'SALUD', 'TERAPEUTICO');

CREATE TABLE "catalogo_establecimientos" (
    "id" SERIAL NOT NULL,
    "fuente" "catalogo_fuente_enum" NOT NULL,
    "ambito" "catalogo_ambito_enum" NOT NULL,
    "codigo_externo" VARCHAR(32) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "nombre_busqueda" VARCHAR(255) NOT NULL,
    "tipo_oficial" VARCHAR(120),
    "region" "region_chile_enum",
    "comuna" VARCHAR(100),
    "localidad" VARCHAR(120),
    "direccion" VARCHAR(255),
    "dependencia" VARCHAR(80),
    "sostenedor" VARCHAR(255),
    "tiene_pie" BOOLEAN NOT NULL DEFAULT false,
    "es_escuela_especial" BOOLEAN NOT NULL DEFAULT false,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,

    CONSTRAINT "catalogo_establecimientos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_catalogo_fuente_codigo" ON "catalogo_establecimientos"("fuente", "codigo_externo");
CREATE INDEX "idx_catalogo_ambito" ON "catalogo_establecimientos"("ambito");
CREATE INDEX "idx_catalogo_region_comuna" ON "catalogo_establecimientos"("region", "comuna");
CREATE INDEX "idx_catalogo_nombre_busqueda" ON "catalogo_establecimientos"("nombre_busqueda");
CREATE INDEX "idx_catalogo_tipo_oficial" ON "catalogo_establecimientos"("tipo_oficial");

ALTER TABLE "instituciones" ADD COLUMN "registro_manual" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "instituciones" ADD COLUMN "catalogo_establecimiento_id" INTEGER;
ALTER TABLE "instituciones" ADD COLUMN "codigo_externo" VARCHAR(32);
ALTER TABLE "instituciones" ADD COLUMN "catalogo_fuente" "catalogo_fuente_enum";
ALTER TABLE "instituciones" ADD COLUMN "tipo_oficial" VARCHAR(120);
ALTER TABLE "instituciones" ADD COLUMN "dependencia_oficial" VARCHAR(80);

CREATE UNIQUE INDEX "instituciones_catalogo_establecimiento_id_key" ON "instituciones"("catalogo_establecimiento_id");
CREATE INDEX "idx_institucion_catalogo_codigo" ON "instituciones"("catalogo_fuente", "codigo_externo");

ALTER TABLE "instituciones" ADD CONSTRAINT "instituciones_catalogo_establecimiento_id_fkey" FOREIGN KEY ("catalogo_establecimiento_id") REFERENCES "catalogo_establecimientos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
