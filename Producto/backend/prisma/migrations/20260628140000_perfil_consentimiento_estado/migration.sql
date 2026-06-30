-- Consentimiento por perfil del menor (tutor autoriza uso de datos)
CREATE TYPE "consentimiento_estado_enum" AS ENUM ('PENDIENTE', 'ACEPTADO', 'RECHAZADO');

ALTER TABLE "perfiles" ADD COLUMN "consentimiento_estado" "consentimiento_estado_enum" NOT NULL DEFAULT 'PENDIENTE';
ALTER TABLE "perfiles" ADD COLUMN "consentimiento_aceptado_at" TIMESTAMP(6);
ALTER TABLE "perfiles" ADD COLUMN "consentimiento_version" VARCHAR(20);
ALTER TABLE "perfiles" ADD COLUMN "consentimiento_por_usuario_id" INTEGER;

ALTER TABLE "perfiles" ADD CONSTRAINT "fk_perfil_consentimiento_usuario"
  FOREIGN KEY ("consentimiento_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Perfiles demo existentes quedan operativos
UPDATE "perfiles" SET "consentimiento_estado" = 'ACEPTADO', "consentimiento_version" = '2026-01'
WHERE "consentimiento_estado" = 'PENDIENTE';
