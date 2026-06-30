-- Datos de contacto institucional para coordinación interinstitucional
ALTER TABLE "instituciones" ADD COLUMN "email_contacto" VARCHAR(255);
ALTER TABLE "instituciones" ADD COLUMN "telefono_contacto" VARCHAR(50);
