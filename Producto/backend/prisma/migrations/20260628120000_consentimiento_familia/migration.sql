-- Consentimiento informado para tutores/padres (rol FAMILIA)
ALTER TABLE "usuarios" ADD COLUMN "consentimiento_aceptado_at" TIMESTAMP(6);
ALTER TABLE "usuarios" ADD COLUMN "consentimiento_version" VARCHAR(20);
