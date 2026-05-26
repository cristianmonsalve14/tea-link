-- Restaurar vínculo de perfiles con institución
ALTER TABLE "perfiles" ADD COLUMN "institucion_id" INTEGER;

UPDATE "perfiles" p
SET "institucion_id" = (
  SELECT u."institucion_id"
  FROM "perfil_usuario" pu
  JOIN "usuarios" u ON u."id" = pu."usuario_id"
  WHERE pu."perfil_id" = p."id" AND u."institucion_id" IS NOT NULL
  LIMIT 1
)
WHERE "institucion_id" IS NULL;

UPDATE "perfiles"
SET "institucion_id" = (SELECT "id" FROM "instituciones" ORDER BY "id" LIMIT 1)
WHERE "institucion_id" IS NULL;

ALTER TABLE "perfiles" ALTER COLUMN "institucion_id" SET NOT NULL;

CREATE INDEX "idx_perfil_institucion_id" ON "perfiles"("institucion_id");

ALTER TABLE "perfiles" ADD CONSTRAINT "fk_perfil_institucion" FOREIGN KEY ("institucion_id") REFERENCES "instituciones"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
