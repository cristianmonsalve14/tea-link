-- =====================================================
-- SCRIPT DE CREACION DE BASE DE DATOS: TEA LINK
-- =====================================================
-- Autor: Cristian Monsalve Budrovich
-- Proyecto: TEA Link
-- Descripcion:
--   Script SQL actualizado segun el modelo Prisma actual.
--   La fuente principal del modelo es:
--   Producto/backend/prisma/schema.prisma
-- =====================================================

-- Crear la base manualmente si no existe y luego conectarse a tea_link.
-- CREATE DATABASE tea_link WITH OWNER = postgres ENCODING = 'UTF8';

DROP TABLE IF EXISTS observaciones_en_reportes CASCADE;
DROP TABLE IF EXISTS auditoria_admin CASCADE;
DROP TABLE IF EXISTS reportes CASCADE;
DROP TABLE IF EXISTS observaciones CASCADE;
DROP TABLE IF EXISTS perfil_usuario CASCADE;
DROP TABLE IF EXISTS perfiles CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS instituciones CASCADE;

DROP TYPE IF EXISTS tipo_institucion_enum CASCADE;
DROP TYPE IF EXISTS rol_enum CASCADE;
DROP TYPE IF EXISTS rol_perfil_enum CASCADE;
DROP TYPE IF EXISTS categoria_observacion_enum CASCADE;
DROP TYPE IF EXISTS privacidad_observacion_enum CASCADE;
DROP TYPE IF EXISTS formato_reporte_enum CASCADE;

CREATE TYPE tipo_institucion_enum AS ENUM (
  'FAMILIA',
  'CENTRO_EDUCACIONAL',
  'CENTRO_MEDICO',
  'CENTRO_PROFESIONAL',
  'SISTEMA'
);

CREATE TYPE rol_enum AS ENUM (
  'FAMILIA',
  'EDUCADOR',
  'PROFESIONAL',
  'ADMINISTRADOR',
  'MEDICO',
  'SUPERADMIN'
);

CREATE TYPE rol_perfil_enum AS ENUM (
  'TUTOR',
  'EDUCADOR',
  'PROFESIONAL',
  'MEDICO'
);

CREATE TYPE categoria_observacion_enum AS ENUM (
  'CONDUCTA',
  'COMUNICACION',
  'SOCIAL',
  'ACADEMICO',
  'SENSORIAL',
  'MOTOR',
  'CLINICO',
  'OTRO'
);

CREATE TYPE privacidad_observacion_enum AS ENUM (
  'PUBLICA',
  'PRIVADA',
  'MULTINIVEL'
);

CREATE TYPE formato_reporte_enum AS ENUM (
  'PDF',
  'EXCEL'
);

CREATE TABLE instituciones (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  tipo tipo_institucion_enum NOT NULL,
  direccion VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  rol rol_enum NOT NULL,
  institucion_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_institucion
    FOREIGN KEY (institucion_id) REFERENCES instituciones(id)
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_institucion_id ON usuarios(institucion_id);

CREATE TABLE perfiles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  edad INTEGER,
  diagnostico VARCHAR(500),
  fecha_nacimiento DATE,
  notas TEXT,
  institucion_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_perfil_institucion
    FOREIGN KEY (institucion_id) REFERENCES instituciones(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_perfil_institucion_id ON perfiles(institucion_id);

CREATE TABLE perfil_usuario (
  perfil_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  rol_en_perfil rol_perfil_enum NOT NULL,
  puede_editar BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (perfil_id, usuario_id),
  CONSTRAINT fk_perfil_usuario_perfil
    FOREIGN KEY (perfil_id) REFERENCES perfiles(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_perfil_usuario_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_perfil_usuario_perfil_id ON perfil_usuario(perfil_id);
CREATE INDEX idx_perfil_usuario_usuario_id ON perfil_usuario(usuario_id);

CREATE TABLE observaciones (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  categoria categoria_observacion_enum NOT NULL,
  fecha_evento TIMESTAMP NOT NULL,
  perfil_id INTEGER NOT NULL,
  autor_id INTEGER NOT NULL,
  privacidad privacidad_observacion_enum NOT NULL DEFAULT 'PUBLICA',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_observaciones_perfil
    FOREIGN KEY (perfil_id) REFERENCES perfiles(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_observaciones_autor
    FOREIGN KEY (autor_id) REFERENCES usuarios(id)
);

CREATE INDEX idx_observaciones_perfil_id ON observaciones(perfil_id);
CREATE INDEX idx_observaciones_autor_id ON observaciones(autor_id);
CREATE INDEX idx_observaciones_fecha_evento ON observaciones(fecha_evento);
CREATE INDEX idx_observaciones_categoria ON observaciones(categoria);
CREATE INDEX idx_observaciones_perfil_fecha ON observaciones(perfil_id, fecha_evento DESC);

CREATE TABLE reportes (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  formato formato_reporte_enum NOT NULL,
  url_archivo VARCHAR(500),
  creador_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_reportes_fechas CHECK (fecha_fin >= fecha_inicio),
  CONSTRAINT fk_reportes_creador
    FOREIGN KEY (creador_id) REFERENCES usuarios(id)
);

CREATE INDEX idx_reportes_creador_id ON reportes(creador_id);
CREATE INDEX idx_reportes_created_at ON reportes(created_at DESC);

CREATE TABLE observaciones_en_reportes (
  reporte_id INTEGER NOT NULL,
  observacion_id INTEGER NOT NULL,
  PRIMARY KEY (reporte_id, observacion_id),
  CONSTRAINT fk_observaciones_reportes_reporte
    FOREIGN KEY (reporte_id) REFERENCES reportes(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_observaciones_reportes_observacion
    FOREIGN KEY (observacion_id) REFERENCES observaciones(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_obs_reportes_reporte_id ON observaciones_en_reportes(reporte_id);
CREATE INDEX idx_obs_reportes_observacion_id ON observaciones_en_reportes(observacion_id);

CREATE TABLE auditoria_admin (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  accion VARCHAR(100) NOT NULL,
  entidad VARCHAR(50),
  entidad_id INTEGER,
  detalles VARCHAR(500),
  ip_address VARCHAR(45),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auditoria_admin
    FOREIGN KEY (admin_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_auditoria_admin_id ON auditoria_admin(admin_id);
CREATE INDEX idx_auditoria_created_at ON auditoria_admin(created_at DESC);
CREATE INDEX idx_auditoria_accion ON auditoria_admin(accion);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_instituciones_updated_at
  BEFORE UPDATE ON instituciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_perfiles_updated_at
  BEFORE UPDATE ON perfiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_observaciones_updated_at
  BEFORE UPDATE ON observaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS DE PRUEBA MINIMOS
-- =====================================================
INSERT INTO instituciones (id, nombre, tipo, direccion) VALUES
(1, 'Sistema TEA-LINK', 'SISTEMA', NULL),
(2, 'colegio de prueba', 'CENTRO_EDUCACIONAL', 'Direccion de prueba'),
(3, 'Centro Medico de Prueba', 'CENTRO_MEDICO', 'Direccion de prueba');

INSERT INTO usuarios (id, email, password_hash, nombre_completo, rol, institucion_id) VALUES
(1, 'cr.monsalveb@duocuc.cl', '$2b$10$/JUwlXGp0i9Jl7wZXER6iuyw38ZJUI1i50Gg2UsQ5EWhPoOeslxqC', 'Super Administrador', 'SUPERADMIN', 1),
(2, 'admin.colegio@tealink.com', '$2b$10$CidV/56svr60WsAp1uTg8O/vYLcqugY5s/ZyYHvh/iXgyG2AJoEHG', 'Administrador Colegio Prueba', 'ADMINISTRADOR', 2),
(3, 'educador2@tealink.com', '$2b$10$3y7oLIppx4Sw773BTemXNugbFpcc3Vz7O3cuxzoZiM1aS2XEu5bk2', 'Educador Prueba', 'EDUCADOR', 2),
(4, 'medico@tealink.com', '$2b$10$0./PPCwBC79qNnOq9VrBweZVb/DIQKKAw6d3h93r.Sj8P0PWv8Y6i', 'Dr. Roberto Fernandez', 'MEDICO', 3);

INSERT INTO perfiles (id, nombre, edad, diagnostico, fecha_nacimiento, notas, institucion_id) VALUES
(1, 'Juanito Perez Marin', 9, 'TEA nivel de apoyo 2', '2017-06-15', 'Perfil de prueba para colegio.', 2);

INSERT INTO perfil_usuario (perfil_id, usuario_id, rol_en_perfil, puede_editar) VALUES
(1, 3, 'EDUCADOR', FALSE),
(1, 4, 'MEDICO', FALSE);

INSERT INTO observaciones (id, titulo, descripcion, categoria, fecha_evento, perfil_id, autor_id, privacidad) VALUES
(1, 'Mejoras motrices', 'Registro de avance observado durante actividad educativa.', 'COMUNICACION', '2026-05-23 10:00:00', 1, 3, 'PUBLICA');

INSERT INTO reportes (id, titulo, fecha_inicio, fecha_fin, formato, creador_id) VALUES
(1, 'Informe prueba', '2026-04-27', '2026-05-22', 'PDF', 3);

INSERT INTO observaciones_en_reportes (reporte_id, observacion_id) VALUES
(1, 1);

INSERT INTO auditoria_admin (admin_id, accion, entidad, entidad_id, detalles, ip_address) VALUES
(2, 'CREAR_PERFIL', 'perfiles', 1, 'Perfil de prueba creado para validacion local', '127.0.0.1');

SELECT setval('instituciones_id_seq', (SELECT MAX(id) FROM instituciones));
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));
SELECT setval('perfiles_id_seq', (SELECT MAX(id) FROM perfiles));
SELECT setval('observaciones_id_seq', (SELECT MAX(id) FROM observaciones));
SELECT setval('reportes_id_seq', (SELECT MAX(id) FROM reportes));
SELECT setval('auditoria_admin_id_seq', (SELECT MAX(id) FROM auditoria_admin));

-- =====================================================
-- VERIFICACION
-- =====================================================
SELECT
  (SELECT COUNT(*) FROM instituciones) AS total_instituciones,
  (SELECT COUNT(*) FROM usuarios) AS total_usuarios,
  (SELECT COUNT(*) FROM perfiles) AS total_perfiles,
  (SELECT COUNT(*) FROM perfil_usuario) AS total_perfil_usuario,
  (SELECT COUNT(*) FROM observaciones) AS total_observaciones,
  (SELECT COUNT(*) FROM reportes) AS total_reportes,
  (SELECT COUNT(*) FROM observaciones_en_reportes) AS total_obs_en_reportes,
  (SELECT COUNT(*) FROM auditoria_admin) AS total_auditoria;

-- Resumen esperado:
-- instituciones: 3
-- usuarios: 4
-- perfiles: 1
-- perfil_usuario: 2
-- observaciones: 1
-- reportes: 1
-- observaciones_en_reportes: 1
-- auditoria_admin: 1
