-- Niveles educacionales (orden del enum = orden curricular Mineduc: parvularia → básica → media → especial/laboral)
CREATE TYPE "nivel_educacional_enum" AS ENUM (
  'PARVULARIA_NT1',
  'PARVULARIA_NT2',
  'BASICO_1',
  'BASICO_2',
  'BASICO_3',
  'BASICO_4',
  'BASICO_5',
  'BASICO_6',
  'BASICO_7',
  'BASICO_8',
  'MEDIO_1',
  'MEDIO_2',
  'MEDIO_3',
  'MEDIO_4',
  'ESPECIAL_TRANSICION',
  'LABORAL'
);

ALTER TABLE "perfiles" ADD COLUMN "nivel_educacional" "nivel_educacional_enum";

CREATE INDEX "idx_perfil_institucion_nivel" ON "perfiles"("institucion_id", "nivel_educacional");
