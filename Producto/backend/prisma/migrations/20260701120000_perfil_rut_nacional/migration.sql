-- RUT único nacional del estudiante (registro TEA Link)
ALTER TABLE "perfiles" ADD COLUMN "rut" VARCHAR(12);

CREATE UNIQUE INDEX "perfiles_rut_key" ON "perfiles"("rut");
