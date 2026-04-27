
/*
  Warnings:
  - Added the required column `institucion_id` to the `perfiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `institucion_id` to the `usuarios` table without a default value. This is not possible if the table is not empty.
*/

-- 1. Crear enum
CREATE TYPE "tipo_institucion_enum" AS ENUM ('FAMILIA', 'CENTRO_EDUCACIONAL', 'CENTRO_MEDICO', 'CENTRO_PROFESIONAL');

-- 2. Crear tabla instituciones
CREATE TABLE "instituciones" (
  "id" SERIAL NOT NULL,
  "nombre" VARCHAR(255) NOT NULL,
  "tipo" "tipo_institucion_enum" NOT NULL,
  "direccion" VARCHAR(255),
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "instituciones_pkey" PRIMARY KEY ("id")
);

-- 3. Insertar institución temporal
INSERT INTO "instituciones" ("nombre", "tipo") VALUES ('Institución Temporal', 'CENTRO_EDUCACIONAL');

-- 4. Agregar columna institucion_id como opcional
ALTER TABLE "perfiles" ADD COLUMN "institucion_id" INTEGER;
ALTER TABLE "usuarios" ADD COLUMN "institucion_id" INTEGER;

-- 5. Asignar la institución temporal a todos los registros existentes
UPDATE "perfiles" SET "institucion_id" = 1 WHERE "institucion_id" IS NULL;
UPDATE "usuarios" SET "institucion_id" = 1 WHERE "institucion_id" IS NULL;

-- 6. Alterar las columnas para que sean NOT NULL
ALTER TABLE "perfiles" ALTER COLUMN "institucion_id" SET NOT NULL;
ALTER TABLE "usuarios" ALTER COLUMN "institucion_id" SET NOT NULL;

-- 7. Crear índices
CREATE INDEX "idx_perfil_institucion_id" ON "perfiles"("institucion_id");
CREATE INDEX "idx_usuario_institucion_id" ON "usuarios"("institucion_id");

-- 8. Agregar claves foráneas
ALTER TABLE "usuarios" ADD CONSTRAINT "fk_usuario_institucion" FOREIGN KEY ("institucion_id") REFERENCES "instituciones"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "perfiles" ADD CONSTRAINT "fk_perfil_institucion" FOREIGN KEY ("institucion_id") REFERENCES "instituciones"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
