-- Invitaciones entre instituciones para colaborar en un mismo perfil de menor
CREATE TYPE "solicitud_institucion_estado_enum" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA');

CREATE TABLE "solicitudes_institucion_perfil" (
    "id" SERIAL NOT NULL,
    "perfil_id" INTEGER NOT NULL,
    "institucion_solicitante_id" INTEGER NOT NULL,
    "institucion_invitada_id" INTEGER NOT NULL,
    "estado" "solicitud_institucion_estado_enum" NOT NULL DEFAULT 'PENDIENTE',
    "solicitado_por_id" INTEGER NOT NULL,
    "respondido_por_id" INTEGER,
    "respondido_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitudes_institucion_perfil_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_solicitud_perfil_inst_invitada" ON "solicitudes_institucion_perfil"("perfil_id", "institucion_invitada_id");
CREATE INDEX "idx_solicitud_inst_invitada_estado" ON "solicitudes_institucion_perfil"("institucion_invitada_id", "estado");

ALTER TABLE "solicitudes_institucion_perfil" ADD CONSTRAINT "fk_solicitud_perfil" FOREIGN KEY ("perfil_id") REFERENCES "perfiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "solicitudes_institucion_perfil" ADD CONSTRAINT "fk_solicitud_inst_origen" FOREIGN KEY ("institucion_solicitante_id") REFERENCES "instituciones"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "solicitudes_institucion_perfil" ADD CONSTRAINT "fk_solicitud_inst_destino" FOREIGN KEY ("institucion_invitada_id") REFERENCES "instituciones"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "solicitudes_institucion_perfil" ADD CONSTRAINT "fk_solicitud_solicitado_por" FOREIGN KEY ("solicitado_por_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "solicitudes_institucion_perfil" ADD CONSTRAINT "fk_solicitud_respondido_por" FOREIGN KEY ("respondido_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
