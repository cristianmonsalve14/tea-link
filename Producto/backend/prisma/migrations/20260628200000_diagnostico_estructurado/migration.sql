-- Catálogos de diagnóstico clínico y calificación RND (Ley 20.422 / Decreto 47)

CREATE TYPE "diagnostico_clinico_enum" AS ENUM (
  'TEA',
  'TDAH',
  'TEL',
  'DISCAPACIDAD_INTELECTUAL',
  'SINDROME_DOWN',
  'PARALISIS_CEREBRAL',
  'DISCAPACIDAD_VISUAL',
  'DISCAPACIDAD_AUDITIVA',
  'EPILEPSIA',
  'SINDROME_FRAGIL_X',
  'RETRASO_GLOBAL_DESARROLLO',
  'TRASTORNO_APRENDIZAJE',
  'TRASTORNO_PSICOTICO_INFANTIL',
  'TRASTORNO_MOVIMIENTO',
  'ALTAS_CAPACIDADES'
);

CREATE TYPE "causa_discapacidad_enum" AS ENUM (
  'FISICA',
  'SENSORIAL_VISUAL',
  'SENSORIAL_AUDITIVA',
  'SENSORIAL_COMUNICACION',
  'MENTAL_PSIQUICA',
  'MENTAL_INTELECTUAL',
  'MULTIPLE'
);

CREATE TYPE "grado_discapacidad_enum" AS ENUM (
  'NO_CALIFICADO',
  'SIN_DISCAPACIDAD',
  'LEVE',
  'MODERADA',
  'SEVERA',
  'PROFUNDA'
);

ALTER TABLE "perfiles" ADD COLUMN "diagnostico_clinico" "diagnostico_clinico_enum";
ALTER TABLE "perfiles" ADD COLUMN "diagnostico_secundario" "diagnostico_clinico_enum";
ALTER TABLE "perfiles" ADD COLUMN "causa_discapacidad" "causa_discapacidad_enum";
ALTER TABLE "perfiles" ADD COLUMN "grado_discapacidad" "grado_discapacidad_enum" NOT NULL DEFAULT 'NO_CALIFICADO';
ALTER TABLE "perfiles" ADD COLUMN "porcentaje_rnd" INTEGER;
ALTER TABLE "perfiles" ADD COLUMN "tiene_credencial_rnd" BOOLEAN NOT NULL DEFAULT false;

-- Migrar texto libre anterior a catálogo (mejor esfuerzo)
UPDATE "perfiles" SET "diagnostico_clinico" = 'TEA'
WHERE "diagnostico" ILIKE '%tea%' OR "diagnostico" ILIKE '%autismo%' OR "diagnostico" ILIKE '%espectro%';

UPDATE "perfiles" SET "diagnostico_clinico" = 'TDAH'
WHERE "diagnostico_clinico" IS NULL AND "diagnostico" ILIKE '%tdah%';

UPDATE "perfiles" SET "diagnostico_clinico" = 'TEL'
WHERE "diagnostico_clinico" IS NULL AND ("diagnostico" ILIKE '%tel%' OR "diagnostico" ILIKE '%lenguaje%');

UPDATE "perfiles" SET "diagnostico_clinico" = 'DISCAPACIDAD_INTELECTUAL'
WHERE "diagnostico_clinico" IS NULL AND ("diagnostico" ILIKE '%intelectual%' OR "diagnostico" ILIKE '%cognit%');

UPDATE "perfiles" SET "diagnostico_clinico" = 'SINDROME_DOWN'
WHERE "diagnostico_clinico" IS NULL AND "diagnostico" ILIKE '%down%';

UPDATE "perfiles" SET "diagnostico_clinico" = 'PARALISIS_CEREBRAL'
WHERE "diagnostico_clinico" IS NULL AND ("diagnostico" ILIKE '%parálisis%' OR "diagnostico" ILIKE '%paralisis%' OR "diagnostico" ILIKE '%cerebral%');

UPDATE "perfiles" SET "diagnostico_clinico" = 'DISCAPACIDAD_VISUAL'
WHERE "diagnostico_clinico" IS NULL AND ("diagnostico" ILIKE '%visual%' OR "diagnostico" ILIKE '%ciego%');

UPDATE "perfiles" SET "diagnostico_clinico" = 'DISCAPACIDAD_AUDITIVA'
WHERE "diagnostico_clinico" IS NULL AND ("diagnostico" ILIKE '%auditiv%' OR "diagnostico" ILIKE '%sordo%');

UPDATE "perfiles" SET "diagnostico_clinico" = 'EPILEPSIA'
WHERE "diagnostico_clinico" IS NULL AND "diagnostico" ILIKE '%epilep%';

UPDATE "perfiles" SET "diagnostico_clinico" = 'RETRASO_GLOBAL_DESARROLLO'
WHERE "diagnostico_clinico" IS NULL AND ("diagnostico" ILIKE '%retraso%' OR "diagnostico" ILIKE '%desarrollo%');

UPDATE "perfiles" SET "diagnostico_clinico" = 'TEA'
WHERE "diagnostico_clinico" IS NULL AND "diagnostico" IS NOT NULL AND TRIM("diagnostico") <> '';

UPDATE "perfiles" SET "diagnostico_clinico" = 'TEA'
WHERE "diagnostico_clinico" IS NULL;

ALTER TABLE "perfiles" ALTER COLUMN "diagnostico_clinico" SET NOT NULL;
ALTER TABLE "perfiles" DROP COLUMN "diagnostico";

CREATE INDEX "idx_perfil_diagnostico_clinico" ON "perfiles"("diagnostico_clinico");
