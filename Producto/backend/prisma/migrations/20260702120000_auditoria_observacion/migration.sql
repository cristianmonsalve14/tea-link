-- Trazabilidad de acceso a observaciones MULTINIVEL y PRIVADA
CREATE TABLE "auditoria_observacion" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "observacion_id" INTEGER,
    "perfil_id" INTEGER,
    "reporte_id" INTEGER,
    "accion" VARCHAR(80) NOT NULL,
    "privacidad" "privacidad_observacion_enum",
    "detalles" VARCHAR(500),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_observacion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_auditoria_obs_usuario" ON "auditoria_observacion"("usuario_id");
CREATE INDEX "idx_auditoria_obs_observacion" ON "auditoria_observacion"("observacion_id");
CREATE INDEX "idx_auditoria_obs_perfil" ON "auditoria_observacion"("perfil_id");
CREATE INDEX "idx_auditoria_obs_created_at" ON "auditoria_observacion"("created_at" DESC);
CREATE INDEX "idx_auditoria_obs_accion" ON "auditoria_observacion"("accion");
CREATE INDEX "idx_auditoria_obs_privacidad" ON "auditoria_observacion"("privacidad");

ALTER TABLE "auditoria_observacion" ADD CONSTRAINT "fk_auditoria_obs_usuario"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
