-- Especialidad/cargo del educador como catálogo cerrado
CREATE TYPE "especialidad_educador_enum" AS ENUM (
  'DOCENTE_TITULAR',
  'PROFESOR_JEFE',
  'EDUCADOR_PARVULARIA',
  'EDUCADOR_DIFERENCIAL',
  'EDUCADOR_AULA_INTEGRADA',
  'COORDINADOR_PIE',
  'PSICOPEDAGOGO',
  'ASISTENTE_AULA',
  'ORIENTADOR',
  'FONOAUDIOLOGO',
  'KINESIOLOGO',
  'TERAPEUTA_OCUPACIONAL'
);

ALTER TABLE "usuarios" DROP COLUMN "especialidad";
ALTER TABLE "usuarios" ADD COLUMN "especialidad" "especialidad_educador_enum";
