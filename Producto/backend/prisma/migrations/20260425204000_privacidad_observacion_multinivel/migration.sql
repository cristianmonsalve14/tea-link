-- CreateEnum
CREATE TYPE "privacidad_observacion_enum" AS ENUM ('PUBLICA', 'SOLO_PROFESIONALES', 'SOLO_MEDICO');

-- AlterTable
ALTER TABLE "observaciones" ADD COLUMN     "privacidad" "privacidad_observacion_enum" NOT NULL DEFAULT 'PUBLICA';
