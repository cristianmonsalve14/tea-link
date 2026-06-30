-- Niveles educacionales superiores
ALTER TYPE "nivel_educacional_enum" ADD VALUE 'FORMACION_TECNICA';
ALTER TYPE "nivel_educacional_enum" ADD VALUE 'UNIVERSITARIO';

-- Quién debe autorizar el consentimiento del perfil
CREATE TYPE "consentimiento_sujeto_enum" AS ENUM ('TUTOR_LEGAL', 'TITULAR');

ALTER TABLE "perfiles"
  ADD COLUMN "consentimiento_sujeto" "consentimiento_sujeto_enum" NOT NULL DEFAULT 'TUTOR_LEGAL';

-- Titular del perfil (estudiante mayor de edad)
ALTER TYPE "rol_perfil_enum" ADD VALUE 'TITULAR';
