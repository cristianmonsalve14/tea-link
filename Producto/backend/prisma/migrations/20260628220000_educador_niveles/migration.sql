-- Niveles y especialidad del educador (colegio)
ALTER TABLE "usuarios" ADD COLUMN "niveles_educacionales" "nivel_educacional_enum"[] DEFAULT ARRAY[]::"nivel_educacional_enum"[];
ALTER TABLE "usuarios" ADD COLUMN "especialidad" VARCHAR(255);
