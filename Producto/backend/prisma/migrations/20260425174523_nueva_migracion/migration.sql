-- CreateEnum
CREATE TYPE "categoria_observacion_enum" AS ENUM ('CONDUCTA', 'COMUNICACION', 'SOCIAL', 'ACADEMICO', 'SENSORIAL', 'MOTOR', 'CLINICO', 'OTRO');

-- CreateEnum
CREATE TYPE "formato_reporte_enum" AS ENUM ('PDF', 'EXCEL');

-- CreateEnum
CREATE TYPE "rol_enum" AS ENUM ('FAMILIA', 'EDUCADOR', 'PROFESIONAL', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "rol_perfil_enum" AS ENUM ('TUTOR', 'EDUCADOR', 'PROFESIONAL', 'MEDICO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "nombre_completo" VARCHAR(255) NOT NULL,
    "rol" "rol_enum" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfiles" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "edad" INTEGER,
    "diagnostico" VARCHAR(500),
    "fecha_nacimiento" DATE,
    "notas" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil_usuario" (
    "perfil_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "rol_en_perfil" "rol_perfil_enum" NOT NULL,
    "puede_editar" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfil_usuario_pkey" PRIMARY KEY ("perfil_id","usuario_id")
);

-- CreateTable
CREATE TABLE "observaciones" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" "categoria_observacion_enum" NOT NULL,
    "fecha_evento" TIMESTAMP(6) NOT NULL,
    "perfil_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportes" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "formato" "formato_reporte_enum" NOT NULL,
    "url_archivo" VARCHAR(500),
    "creador_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reportes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observaciones_en_reportes" (
    "reporte_id" INTEGER NOT NULL,
    "observacion_id" INTEGER NOT NULL,

    CONSTRAINT "observaciones_en_reportes_pkey" PRIMARY KEY ("reporte_id","observacion_id")
);

-- CreateTable
CREATE TABLE "auditoria_admin" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "accion" VARCHAR(100) NOT NULL,
    "entidad" VARCHAR(50),
    "entidad_id" INTEGER,
    "detalles" VARCHAR(500),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "idx_usuarios_email" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "idx_perfil_usuario_perfil_id" ON "perfil_usuario"("perfil_id");

-- CreateIndex
CREATE INDEX "idx_perfil_usuario_usuario_id" ON "perfil_usuario"("usuario_id");

-- CreateIndex
CREATE INDEX "idx_observaciones_autor_id" ON "observaciones"("autor_id");

-- CreateIndex
CREATE INDEX "idx_observaciones_categoria" ON "observaciones"("categoria");

-- CreateIndex
CREATE INDEX "idx_observaciones_fecha_evento" ON "observaciones"("fecha_evento");

-- CreateIndex
CREATE INDEX "idx_observaciones_perfil_fecha" ON "observaciones"("perfil_id", "fecha_evento" DESC);

-- CreateIndex
CREATE INDEX "idx_observaciones_perfil_id" ON "observaciones"("perfil_id");

-- CreateIndex
CREATE INDEX "idx_reportes_creador_id" ON "reportes"("creador_id");

-- CreateIndex
CREATE INDEX "idx_reportes_created_at" ON "reportes"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_obs_reportes_observacion_id" ON "observaciones_en_reportes"("observacion_id");

-- CreateIndex
CREATE INDEX "idx_obs_reportes_reporte_id" ON "observaciones_en_reportes"("reporte_id");

-- CreateIndex
CREATE INDEX "idx_auditoria_admin_id" ON "auditoria_admin"("admin_id");

-- CreateIndex
CREATE INDEX "idx_auditoria_created_at" ON "auditoria_admin"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_auditoria_accion" ON "auditoria_admin"("accion");

-- AddForeignKey
ALTER TABLE "perfil_usuario" ADD CONSTRAINT "fk_perfil_usuario_perfil" FOREIGN KEY ("perfil_id") REFERENCES "perfiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "perfil_usuario" ADD CONSTRAINT "fk_perfil_usuario_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "observaciones" ADD CONSTRAINT "fk_observaciones_autor" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "observaciones" ADD CONSTRAINT "fk_observaciones_perfil" FOREIGN KEY ("perfil_id") REFERENCES "perfiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "fk_reportes_creador" FOREIGN KEY ("creador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "observaciones_en_reportes" ADD CONSTRAINT "fk_observaciones_reportes_observacion" FOREIGN KEY ("observacion_id") REFERENCES "observaciones"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "observaciones_en_reportes" ADD CONSTRAINT "fk_observaciones_reportes_reporte" FOREIGN KEY ("reporte_id") REFERENCES "reportes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auditoria_admin" ADD CONSTRAINT "fk_auditoria_admin" FOREIGN KEY ("admin_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
