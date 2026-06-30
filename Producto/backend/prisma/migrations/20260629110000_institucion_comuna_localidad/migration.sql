-- AlterTable
ALTER TABLE "instituciones" ADD COLUMN "comuna" VARCHAR(100);
ALTER TABLE "instituciones" ADD COLUMN "localidad" VARCHAR(120);

CREATE INDEX "idx_institucion_comuna" ON "instituciones"("comuna");
