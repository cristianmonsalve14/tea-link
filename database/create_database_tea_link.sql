-- =====================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS: TEA LINK
-- =====================================================
-- Fecha: 27 de Marzo 2026
-- Autor: Cristian Monsalve Budrovich
-- Descripción: Base de datos para sistema de seguimiento
--              de observaciones de personas con TEA
-- =====================================================

-- PASO 1: Crear base de datos (ejecutar en PostgreSQL/postgres)
-- Nota: Descomentar si vas a crear la BD desde cero
-- CREATE DATABASE tea_link
--   WITH OWNER = postgres
--   ENCODING = 'UTF8'
--   LC_COLLATE = 'Spanish_Chile.1252'
--   LC_CTYPE = 'Spanish_Chile.1252'
--   TABLESPACE = pg_default
--   CONNECTION LIMIT = -1;

-- PASO 2: Conectar a la base de datos tea_link antes de ejecutar el resto
-- En pgAdmin: Click derecho en tea_link → Query Tool

-- =====================================================
-- ELIMINAR TABLAS EXISTENTES (si existen)
-- =====================================================
DROP TABLE IF EXISTS observaciones_en_reportes CASCADE;
DROP TABLE IF EXISTS reportes CASCADE;
DROP TABLE IF EXISTS observaciones CASCADE;
DROP TABLE IF EXISTS perfiles CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Eliminar tipos ENUM existentes
DROP TYPE IF EXISTS rol_enum CASCADE;
DROP TYPE IF EXISTS categoria_observacion_enum CASCADE;
DROP TYPE IF EXISTS formato_reporte_enum CASCADE;

-- =====================================================
-- CREAR TIPOS ENUMERADOS
-- =====================================================

-- Enum para roles de usuario
CREATE TYPE rol_enum AS ENUM (
  'FAMILIA',
  'EDUCADOR', 
  'PROFESIONAL'
);

-- Enum para categorías de observaciones
CREATE TYPE categoria_observacion_enum AS ENUM (
  'CONDUCTA',
  'COMUNICACION',
  'SOCIAL',
  'ACADEMICO'
);

-- Enum para formatos de reporte
CREATE TYPE formato_reporte_enum AS ENUM (
  'PDF',
  'EXCEL'
);

-- =====================================================
-- TABLA: usuarios
-- =====================================================
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  rol rol_enum NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas por email (login)
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- Comentarios descriptivos
COMMENT ON TABLE usuarios IS 'Usuarios del sistema (familias, educadores, profesionales)';
COMMENT ON COLUMN usuarios.id IS 'ID único autoincremental';
COMMENT ON COLUMN usuarios.email IS 'Email único para login';
COMMENT ON COLUMN usuarios.password_hash IS 'Contraseña encriptada con bcrypt';
COMMENT ON COLUMN usuarios.rol IS 'Rol del usuario: FAMILIA, EDUCADOR o PROFESIONAL';

-- =====================================================
-- TABLA: perfiles
-- =====================================================
CREATE TABLE perfiles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  edad INTEGER CHECK (edad > 0 AND edad < 120),
  diagnostico VARCHAR(500),
  fecha_nacimiento DATE,
  notas TEXT,
  usuario_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Key
  CONSTRAINT fk_perfiles_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_perfiles_usuario_id ON perfiles(usuario_id);

-- Comentarios
COMMENT ON TABLE perfiles IS 'Perfiles de personas con TEA';
COMMENT ON COLUMN perfiles.usuario_id IS 'Usuario que gestiona este perfil (relación 1:N)';
COMMENT ON COLUMN perfiles.diagnostico IS 'Diagnóstico médico o nivel de apoyo';

-- =====================================================
-- TABLA: observaciones
-- =====================================================
CREATE TABLE observaciones (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  categoria categoria_observacion_enum NOT NULL,
  fecha_evento TIMESTAMP NOT NULL,
  perfil_id INTEGER NOT NULL,
  autor_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT fk_observaciones_perfil
    FOREIGN KEY (perfil_id)
    REFERENCES perfiles(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_observaciones_autor
    FOREIGN KEY (autor_id)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT -- No permitir eliminar usuario si tiene observaciones
);

-- Índices para optimización de consultas
CREATE INDEX idx_observaciones_perfil_id ON observaciones(perfil_id);
CREATE INDEX idx_observaciones_autor_id ON observaciones(autor_id);
CREATE INDEX idx_observaciones_fecha_evento ON observaciones(fecha_evento);
CREATE INDEX idx_observaciones_categoria ON observaciones(categoria);

-- Índice compuesto para consultas frecuentes (perfil + fecha)
CREATE INDEX idx_observaciones_perfil_fecha ON observaciones(perfil_id, fecha_evento DESC);

-- Comentarios
COMMENT ON TABLE observaciones IS 'Observaciones registradas sobre los perfiles';
COMMENT ON COLUMN observaciones.categoria IS 'Tipo de observación: CONDUCTA, COMUNICACION, SOCIAL, ACADEMICO';
COMMENT ON COLUMN observaciones.fecha_evento IS 'Fecha cuando ocurrió el evento observado';
COMMENT ON COLUMN observaciones.perfil_id IS 'Perfil sobre el que se hace la observación';
COMMENT ON COLUMN observaciones.autor_id IS 'Usuario que registró la observación';

-- =====================================================
-- TABLA: reportes
-- =====================================================
CREATE TABLE reportes (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  formato formato_reporte_enum NOT NULL,
  url_archivo VARCHAR(500),
  creador_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Validación: fecha_fin debe ser mayor o igual a fecha_inicio
  CONSTRAINT chk_reportes_fechas CHECK (fecha_fin >= fecha_inicio),
  
  -- Foreign Key
  CONSTRAINT fk_reportes_creador
    FOREIGN KEY (creador_id)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT
);

-- Índices
CREATE INDEX idx_reportes_creador_id ON reportes(creador_id);
CREATE INDEX idx_reportes_created_at ON reportes(created_at DESC);

-- Comentarios
COMMENT ON TABLE reportes IS 'Reportes generados en PDF o Excel';
COMMENT ON COLUMN reportes.url_archivo IS 'URL del archivo generado (storage)';

-- =====================================================
-- TABLA: observaciones_en_reportes (relación N:N)
-- =====================================================
CREATE TABLE observaciones_en_reportes (
  reporte_id INTEGER NOT NULL,
  observacion_id INTEGER NOT NULL,
  
  -- Clave primaria compuesta
  PRIMARY KEY (reporte_id, observacion_id),
  
  -- Foreign Keys
  CONSTRAINT fk_observaciones_reportes_reporte
    FOREIGN KEY (reporte_id)
    REFERENCES reportes(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_observaciones_reportes_observacion
    FOREIGN KEY (observacion_id)
    REFERENCES observaciones(id)
    ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_obs_reportes_reporte_id ON observaciones_en_reportes(reporte_id);
CREATE INDEX idx_obs_reportes_observacion_id ON observaciones_en_reportes(observacion_id);

-- Comentarios
COMMENT ON TABLE observaciones_en_reportes IS 'Tabla intermedia: relación N:N entre reportes y observaciones';

-- =====================================================
-- FUNCIÓN: Actualizar timestamp updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS: Auto-actualizar updated_at
-- =====================================================
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
-- DATOS DE PRUEBA (SEED)
-- =====================================================

-- Usuario 1: Familia (Padre)
INSERT INTO usuarios (email, password_hash, nombre_completo, rol) VALUES
('juan.perez@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Juan Pérez Soto', 'FAMILIA');

-- Usuario 2: Educadora
INSERT INTO usuarios (email, password_hash, nombre_completo, rol) VALUES
('maria.gonzalez@escuela.cl', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'María González López', 'EDUCADOR');

-- Usuario 3: Fonoaudióloga
INSERT INTO usuarios (email, password_hash, nombre_completo, rol) VALUES
('ana.martinez@clinica.cl', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Ana Martínez Rojas', 'PROFESIONAL');

-- Perfil 1: Niño con TEA
INSERT INTO perfiles (nombre, edad, diagnostico, fecha_nacimiento, notas, usuario_id) VALUES
('Matías Pérez', 7, 'TEA nivel de apoyo 2', '2019-05-15', 'Requiere apoyo comunicacional con pictogramas', 1);

-- Perfil 2: Niña con TEA
INSERT INTO perfiles (nombre, edad, diagnostico, fecha_nacimiento, notas, usuario_id) VALUES
('Sofía Ramírez', 5, 'TEA nivel de apoyo 1', '2021-03-22', 'Buena comunicación verbal, dificultades sociales', 1);

-- Observaciones de ejemplo
INSERT INTO observaciones (titulo, descripcion, categoria, fecha_evento, perfil_id, autor_id) VALUES
('Buena comunicación en terapia', 
 'Durante la sesión de fonoaudiología logró expresar sus necesidades usando pictogramas. Mostró interés en comunicarse.', 
 'COMUNICACION', 
 '2026-03-26 10:30:00', 
 1, 
 3);

INSERT INTO observaciones (titulo, descripcion, categoria, fecha_evento, perfil_id, autor_id) VALUES
('Crisis sensorial en recreo', 
 'Durante el recreo presentó sobrecarga sensorial por ruido excesivo. Buscó espacio tranquilo y se calmó en 10 minutos.', 
 'CONDUCTA', 
 '2026-03-26 11:15:00', 
 1, 
 2);

INSERT INTO observaciones (titulo, descripcion, categoria, fecha_evento, perfil_id, autor_id) VALUES
('Interacción positiva con compañeros', 
 'Inició juego paralelo con dos compañeros en área de bloques. Mantuvo interacción por 15 minutos.', 
 'SOCIAL', 
 '2026-03-27 09:45:00', 
 1, 
 2);

INSERT INTO observaciones (titulo, descripcion, categoria, fecha_evento, perfil_id, autor_id) VALUES
('Avance en lectura', 
 'Reconoció 5 palabras nuevas durante actividad de lectura. Mostró entusiasmo al identificarlas.', 
 'ACADEMICO', 
 '2026-03-27 14:00:00', 
 1, 
 2);

-- Reporte de ejemplo
INSERT INTO reportes (titulo, fecha_inicio, fecha_fin, formato, creador_id) VALUES
('Reporte Mensual Marzo 2026', '2026-03-01', '2026-03-27', 'PDF', 1);

-- Asociar observaciones al reporte
INSERT INTO observaciones_en_reportes (reporte_id, observacion_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4);

-- =====================================================
-- VERIFICACIÓN DE DATOS
-- =====================================================

-- Contar registros por tabla
SELECT 
  (SELECT COUNT(*) FROM usuarios) AS total_usuarios,
  (SELECT COUNT(*) FROM perfiles) AS total_perfiles,
  (SELECT COUNT(*) FROM observaciones) AS total_observaciones,
  (SELECT COUNT(*) FROM reportes) AS total_reportes,
  (SELECT COUNT(*) FROM observaciones_en_reportes) AS total_obs_en_reportes;

-- Mostrar estructura de la base de datos
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS num_columnas
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================
-- ✅ 5 tablas creadas
-- ✅ 3 tipos ENUM creados
-- ✅ 11 índices creados para optimización
-- ✅ 3 triggers para auto-actualización de timestamps
-- ✅ Datos de prueba insertados
-- ✅ Verificaciones de integridad
-- =====================================================
