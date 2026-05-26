/*
  Warnings:

  - The values [SOLO_PROFESIONALES,SOLO_MEDICO] on the enum `privacidad_observacion_enum` will be removed. If these variants are still used in the database, this will fail.
  - The values [SUPERADMIN] on the enum `rol_enum` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `institucion_id` on the `perfiles` table. All the data in the column will be lost.
  - You are about to drop the column `activo` on the `usuarios` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."privacidad_observacion_enum_new" AS ENUM ('PUBLICA', 'PRIVADA', 'MULTINIVEL');
ALTER TABLE "public"."observaciones" ALTER COLUMN "privacidad" DROP DEFAULT;
ALTER TABLE "public"."observaciones" ALTER COLUMN "privacidad" TYPE "public"."privacidad_observacion_enum_new" USING ("privacidad"::text::"public"."privacidad_observacion_enum_new");
ALTER TYPE "public"."privacidad_observacion_enum" RENAME TO "privacidad_observacion_enum_old";
ALTER TYPE "public"."privacidad_observacion_enum_new" RENAME TO "privacidad_observacion_enum";
DROP TYPE "public"."privacidad_observacion_enum_old";
ALTER TABLE "public"."observaciones" ALTER COLUMN "privacidad" SET DEFAULT 'PUBLICA';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."rol_enum_new" AS ENUM ('FAMILIA', 'EDUCADOR', 'PROFESIONAL', 'ADMINISTRADOR', 'MEDICO');
ALTER TABLE "public"."usuarios" ALTER COLUMN "rol" TYPE "public"."rol_enum_new" USING ("rol"::text::"public"."rol_enum_new");
ALTER TYPE "public"."rol_enum" RENAME TO "rol_enum_old";
ALTER TYPE "public"."rol_enum_new" RENAME TO "rol_enum";
DROP TYPE "public"."rol_enum_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."perfiles" DROP CONSTRAINT "fk_perfil_institucion";

-- DropForeignKey
ALTER TABLE "public"."usuarios" DROP CONSTRAINT "fk_usuario_institucion";

-- DropIndex
DROP INDEX "public"."idx_perfil_institucion_id";

-- DropIndex
DROP INDEX "public"."idx_usuario_institucion_id";

-- AlterTable
ALTER TABLE "public"."perfiles" DROP COLUMN "institucion_id";

-- AlterTable
ALTER TABLE "public"."usuarios" DROP COLUMN "activo",
ALTER COLUMN "institucion_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "public"."instituciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
