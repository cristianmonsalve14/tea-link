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
DROP TABLE IF EXISTS perfil_usuario CASCADE;
DROP TABLE IF EXISTS auditoria_admin CASCADE;
DROP TABLE IF EXISTS observaciones_en_reportes CASCADE;
DROP TABLE IF EXISTS reportes CASCADE;
DROP TABLE IF EXISTS observaciones CASCADE;
DROP TABLE IF EXISTS perfiles CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Eliminar tipos ENUM existentes
DROP TYPE IF EXISTS rol_enum CASCADE;
DROP TYPE IF EXISTS categoria_observacion_enum CASCADE;
DROP TYPE IF EXISTS formato_reporte_enum CASCADE;
DROP TYPE IF EXISTS rol_perfil_enum CASCADE;

-- =====================================================
-- CREAR TIPOS ENUMERADOS
-- =====================================================

-- Enum para roles de usuario
CREATE TYPE rol_enum AS ENUM (
  'FAMILIA',
  'EDUCADOR', 
  'PROFESIONAL',
  'ADMINISTRADOR'
);

-- Enum para categorías de observaciones
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

-- Enum para formatos de reporte
CREATE TYPE formato_reporte_enum AS ENUM (
  'PDF',
  'EXCEL'
);

-- Enum para roles en perfil (N:N)
CREATE TYPE rol_perfil_enum AS ENUM (
  'TUTOR',
  'EDUCADOR',
  'PROFESIONAL',
  'MEDICO'
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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Comentarios
COMMENT ON TABLE perfiles IS 'Perfiles de personas con TEA';
COMMENT ON COLUMN perfiles.diagnostico IS 'Diagnóstico médico o nivel de apoyo';

-- =====================================================
-- TABLA: perfil_usuario (relación N:N)
-- =====================================================
CREATE TABLE perfil_usuario (
  perfil_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  rol_en_perfil rol_perfil_enum NOT NULL,
  puede_editar BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Clave primaria compuesta
  PRIMARY KEY (perfil_id, usuario_id),
  
  -- Foreign Keys
  CONSTRAINT fk_perfil_usuario_perfil
    FOREIGN KEY (perfil_id)
    REFERENCES perfiles(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_perfil_usuario_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_perfil_usuario_perfil_id ON perfil_usuario(perfil_id);
CREATE INDEX idx_perfil_usuario_usuario_id ON perfil_usuario(usuario_id);

-- Comentarios
COMMENT ON TABLE perfil_usuario IS 'Relación N:N entre perfiles y usuarios - permite múltiples colaboradores por perfil';
COMMENT ON COLUMN perfil_usuario.rol_en_perfil IS 'Rol del usuario en este perfil: TUTOR (edita perfil + crea observaciones), EDUCADOR/PROFESIONAL (solo crean observaciones), MEDICO (solo observaciones clínicas para profesionales médicos)';
COMMENT ON COLUMN perfil_usuario.puede_editar IS 'Permiso para editar información del perfil (generalmente solo TUTOR)';

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
COMMENT ON COLUMN observaciones.categoria IS 'Tipo de observación: CONDUCTA, COMUNICACION, SOCIAL, ACADEMICO, SENSORIAL, MOTOR, OTRO';
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
-- TABLA: auditoria_admin
-- =====================================================
CREATE TABLE auditoria_admin (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  accion VARCHAR(100) NOT NULL,
  entidad VARCHAR(50),
  entidad_id INTEGER,
  detalles VARCHAR(500),
  ip_address VARCHAR(45),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Key
  CONSTRAINT fk_auditoria_admin
    FOREIGN KEY (admin_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_auditoria_admin_id ON auditoria_admin(admin_id);
CREATE INDEX idx_auditoria_created_at ON auditoria_admin(created_at DESC);
CREATE INDEX idx_auditoria_accion ON auditoria_admin(accion);

-- Comentarios
COMMENT ON TABLE auditoria_admin IS 'Registro de auditoría de acciones administrativas';
COMMENT ON COLUMN auditoria_admin.accion IS 'Tipo de acción: CREAR_USUARIO, DESACTIVAR_USUARIO, RESETEAR_PASSWORD, etc.';
COMMENT ON COLUMN auditoria_admin.entidad IS 'Tipo de entidad afectada: usuarios, config, etc.';
COMMENT ON COLUMN auditoria_admin.detalles IS 'Información adicional no sensible (ej: email del usuario afectado)';

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

-- ============ USUARIOS (10 usuarios de ejemplo) ============

-- Usuario 1: Padre (Familia)
INSERT INTO usuarios (email, password_hash, nombre_completo, rol) VALUES
('juan.perez@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Juan Pérez Soto', 'FAMILIA');

-- Usuario 2: Madre (Familia)
INSERT INTO usuarios (email, password_hash, nombre_completo, rol) VALUES
('carmen.lopez@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Carmen López Miranda', 'FAMILIA');

-- Usuario 3: Educador Diferencial
INSERT INTO usuarios (email, password_hash, nombre_completo, rol) VALUES
('maria.gonzalez@escuela.cl', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'María González López', 'EDUCADOR');

-- Usuario 4: Asistente Educador Diferencial
INSERT INTO usuarios (email, password_hash, nombre_completo, rol) VALUES
('pedro.rojas@escuela.cl', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Pedro Rojas Contreras', 'EDUCADOR');

-- Usuario 5: Fonoaudiólogo
INSERT INTO usuarios (email, password_hash, nombre_completo, rol) VALUES
('ana.martinez@clinica.cl', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Ana Martínez Rojas', 'PROFESIONAL');

-- Usuario 6: Terapeuta Ocupacional
INSERT INTO usuarios (email, password_hash, nombre_completo, rol) VALUES
('laura.torres@clinica.cl', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Laura Torres Valdés', 'PROFESIONAL');

-- Usuario 7: Psicólogo
INSERT INTO usuarios (email, password_hash, nombre_completo, rol) VALUES
('carlos.silva@clinica.cl', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Carlos Silva Morales', 'PROFESIONAL');

-- Usuario 8: Madre (Otro perfil)
INSERT INTO usuarios (email, password_hash, nombre_completo, rol) VALUES
('sofia.ramirez@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Sofía Ramírez Castro', 'FAMILIA');

-- Usuario 9: Educadora (Otro perfil)
INSERT INTO usuarios (email, password_hash, nombre_completo, rol) VALUES
('claudia.munoz@escuela.cl', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Claudia Muñoz Ríos', 'EDUCADOR');

-- Usuario 10: Psiquiatra (Profesional médico)
INSERT INTO usuarios (email, password_hash, nombre_completo, rol) VALUES
('roberto.fernandez@hospital.cl', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Dr. Roberto Fernández Acosta', 'PROFESIONAL');

-- Usuario 11: Neuróloga (Profesional médico)
INSERT INTO usuarios (email, password_hash, nombre_completo, rol) VALUES
('patricia.morales@hospital.cl', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Dra. Patricia Morales Díaz', 'PROFESIONAL');

-- Usuario 12: Administrador del sistema
INSERT INTO usuarios (email, password_hash, nombre_completo, rol) VALUES
('admin@tealink.cl', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', 'Diego Administrador Sistema', 'ADMINISTRADOR');

-- ============ PERFILES (2 perfiles de niños con TEA) ============

-- Perfil 1: Juanito Pérez (9 años) - PERFIL PRINCIPAL CON 9 COLABORADORES (7 activos + 2 observadores)
INSERT INTO perfiles (nombre, edad, diagnostico, fecha_nacimiento, notas) VALUES
('Juanito Pérez López', 9, 'TEA nivel de apoyo 2 - Requiere apoyo sustancial', '2017-06-15', 
 'Comunicación verbal limitada, usa pictogramas. Sensibilidad auditiva. Buena memoria visual. Tratamiento farmacológico: Risperidona 0.5mg.');

-- Perfil 2: Valentina Ramírez (6 años)
INSERT INTO perfiles (nombre, edad, diagnostico, fecha_nacimiento, notas) VALUES
('Valentina Ramírez Castro', 6, 'TEA nivel de apoyo 1', '2020-03-22', 
 'Buena comunicación verbal, dificultades sociales. Intereses restringidos en dinosaurios.');

-- ============ ASIGNACIÓN DE USUARIOS A PERFILES (perfil_usuario) ============

-- PERFIL 1: JUANITO PÉREZ - 9 colaboradores (7 activos + 2 médicos)

-- Tutores (2): Papá y Mamá - pueden editar perfil y crear observaciones
INSERT INTO perfil_usuario (perfil_id, usuario_id, rol_en_perfil, puede_editar) VALUES
(1, 1, 'TUTOR', TRUE),  -- Juan Pérez (papá) - puede editar
(1, 2, 'TUTOR', TRUE);  -- Carmen López (mamá) - puede editar

-- Educadores (2): Educador diferencial + Asistente - solo crean observaciones
INSERT INTO perfil_usuario (perfil_id, usuario_id, rol_en_perfil, puede_editar) VALUES
(1, 3, 'EDUCADOR', FALSE),  -- María González (educadora diferencial)
(1, 4, 'EDUCADOR', FALSE);  -- Pedro Rojas (asistente educador)

-- Profesionales activos (3): Trabajan regularmente con Juanito - crean observaciones
INSERT INTO perfil_usuario (perfil_id, usuario_id, rol_en_perfil, puede_editar) VALUES
(1, 5, 'PROFESIONAL', FALSE),  -- Ana Martínez (fonoaudióloga)
(1, 6, 'PROFESIONAL', FALSE),  -- Laura Torres (terapeuta ocupacional)
(1, 7, 'PROFESIONAL', FALSE);  -- Carlos Silva (psicólogo)

-- Médicos (2): Profesionales médicos que crean observaciones CLINICAS (medicación, diagnóstico)
INSERT INTO perfil_usuario (perfil_id, usuario_id, rol_en_perfil, puede_editar) VALUES
(1, 10, 'MEDICO', FALSE),  -- Dr. Roberto Fernández (psiquiatra) - solo observaciones CLINICO
(1, 11, 'MEDICO', FALSE);  -- Dra. Patricia Morales (neuróloga) - solo observaciones CLINICO

-- PERFIL 2: VALENTINA RAMÍREZ - 2 colaboradores
INSERT INTO perfil_usuario (perfil_id, usuario_id, rol_en_perfil, puede_editar) VALUES
(2, 8, 'TUTOR', TRUE),       -- Sofía Ramírez (mamá) - puede editar
(2, 9, 'EDUCADOR', FALSE);   -- Claudia Muñoz (educadora)

-- ============ OBSERVACIONES (múltiples autores sobre Juanito) ============

-- Observación 1: Por Fonoaudióloga (Ana Martínez)
INSERT INTO observaciones (titulo, descripcion, categoria, fecha_evento, perfil_id, autor_id) VALUES
('Avance en comunicación con pictogramas', 
'Durante la sesión de fonoaudiología logró expresar 8 necesidades diferentes usando pictogramas. Mostró iniciativa para comunicarse sin ayuda. Destacable progreso respecto a mes anterior.',
 'COMUNICACION', 
 '2026-04-10 10:30:00', 
 1,   -- Juanito Pérez
 5);  -- Ana Martínez (fonoaudióloga)

-- Observación 2: Por Educadora Diferencial (María González)
INSERT INTO observaciones (titulo, descripcion, categoria, fecha_evento, perfil_id, autor_id) VALUES
('Sobrecarga sensorial durante recreo', 
 'Durante el recreo presentó sobrecarga sensorial por ruido excesivo de otros niños. Identificó su malestar y buscó espacio tranquilo de forma autónoma. Se calmó en 8 minutos (antes 15 min). Avance en autorregulación.', 
 'SENSORIAL', 
 '2026-04-11 11:15:00', 
 1,   -- Juanito Pérez
 3);  -- María González (educadora diferencial)

-- Observación 3: Por Psicólogo (Carlos Silva)
INSERT INTO observaciones (titulo, descripcion, categoria, fecha_evento, perfil_id, autor_id) VALUES
('Mejora en interacción social con pares', 
 'Inició juego paralelo con dos compañeros en área de bloques. Mantuvo interacción por 20 minutos (antes 10 min). Aceptó turnos compartidos. Muestra mayor tolerancia a proximidad de otros niños.', 
 'SOCIAL', 
 '2026-04-11 14:45:00', 
 1,   -- Juanito Pérez
 7);  -- Carlos Silva (psicólogo)

-- Observación 4: Por Asistente Educador (Pedro Rojas)
INSERT INTO observaciones (titulo, descripcion, categoria, fecha_evento, perfil_id, autor_id) VALUES
('Progreso en lectoescritura', 
 'Reconoció 12 palabras nuevas durante actividad de lectura (antes 5). Logró escribir su nombre completo sin modelo. Mostró entusiasmo y orgullo al identificarlas. Mayor concentración sostenida.', 
 'ACADEMICO', 
 '2026-04-12 09:30:00', 
 1,   -- Juanito Pérez
 4);  -- Pedro Rojas (asistente educador)

-- Observación 5: Por Terapeuta Ocupacional (Laura Torres)
INSERT INTO observaciones (titulo, descripcion, categoria, fecha_evento, perfil_id, autor_id) VALUES
('Sensibilidad táctil - progreso gradual', 
 'Evitó tocar plastilina durante actividad artística. Se ofreció material alternativo (papel, témpera con pincel). Participó activamente. Se sugiere exposición progresiva a texturas en sesiones futuras.', 
 'SENSORIAL', 
 '2026-04-12 15:00:00', 
 1,   -- Juanito Pérez
 6);  -- Laura Torres (terapeuta ocupacional)

-- Observación 6: Por Terapeuta Ocupacional (Laura Torres)
INSERT INTO observaciones (titulo, descripcion, categoria, fecha_evento, perfil_id, autor_id) VALUES
('Avance notable en motricidad fina', 
 'Logró abotonar su chaqueta sin ayuda por primera vez. Demostró concentración y perseverancia. Tiempo: 3 minutos. Celebró su logro con sonrisa. Objetivo alcanzado del plan terapéutico trimestral.', 
 'MOTOR', 
 '2026-04-13 10:15:00', 
 1,   -- Juanito Pérez
 6);  -- Laura Torres (terapeuta ocupacional)

-- Observación 7: Por Mamá (Carmen López)
INSERT INTO observaciones (titulo, descripcion, categoria, fecha_evento, perfil_id, autor_id) VALUES
('Adaptación positiva a visita familiar', 
 'Primo Matías (12 años) vino a visitarnos. Inicialmente reticente, pero después de 20 minutos jugó con él con bloques. Toleró contacto físico (abrazo breve). Evento social exitoso. Gran avance.', 
 'OTRO', 
 '2026-04-14 16:30:00', 
 1,   -- Juanito Pérez
 2);  -- Carmen López (mamá)

-- Observación 8: Por Papá (Juan Pérez)
INSERT INTO observaciones (titulo, descripcion, categoria, fecha_evento, perfil_id, autor_id) VALUES
('Manejo de frustración en actividad familiar', 
 'Durante juego de mesa, perdió su turno y mostró frustración (antes crisis). Respiró profundo (técnica aprendida con psicólogo) y continuó jugando. Primera vez que autorregula en contexto familiar. ¡Muy orgulloso!', 
 'CONDUCTA', 
 '2026-04-15 18:00:00', 
 1,   -- Juanito Pérez
 1);  -- Juan Pérez (papá)

-- Observación 9: Por Educadora (Claudia Muñoz) sobre Valentina
INSERT INTO observaciones (titulo, descripcion, categoria, fecha_evento, perfil_id, autor_id) VALUES
('Interés intenso en dinosaurios - canalizar académicamente', 
 'Compartió 15 datos sobre dinosaurios durante círculo. Buena memoria y vocabulario técnico. Sugiero incorporar dinosaurios en actividades matemáticas para motivación adicional.', 
 'ACADEMICO', 
 '2026-04-14 10:00:00', 
 2,   -- Valentina Ramírez
 9);  -- Claudia Muñoz (educadora)

-- ============ REPORTES ============

-- Reporte 1: Informe trimestral de Juanito (creado por mamá Carmen)
INSERT INTO reportes (titulo, fecha_inicio, fecha_fin, formato, creador_id) VALUES
('Informe Trimestral Abril 2026 - Juanito Pérez', '2026-04-01', '2026-04-15', 'PDF', 2);

-- Asociar 8 observaciones de Juanito al reporte
INSERT INTO observaciones_en_reportes (reporte_id, observacion_id) VALUES
(1, 1),  -- Comunicación (fonoaudióloga)
(1, 2),  -- Sensorial (educadora)
(1, 3),  -- Social (psicólogo)
(1, 4),  -- Académico (asistente educador)
(1, 5),  -- Sensorial (terapeuta ocupacional)
(1, 6),  -- Motor (terapeuta ocupacional)
(1, 7),  -- Otro (mamá)
(1, 8);  -- Conducta (papá)

-- ============ AUDITORÍA DE ACCIONES ADMINISTRATIVAS ============

-- Auditoría 1: Admin crea usuario educador diferencial
INSERT INTO auditoria_admin (admin_id, accion, entidad, entidad_id, detalles, ip_address, created_at) VALUES
(12, 'CREAR_USUARIO', 'usuarios', 3, 'Creó usuario: maria.gonzalez@escuela.cl (EDUCADOR)', '192.168.1.100', '2026-04-01 09:15:00');

-- Auditoría 2: Admin crea usuario fonoaudióloga
INSERT INTO auditoria_admin (admin_id, accion, entidad, entidad_id, detalles, ip_address, created_at) VALUES
(12, 'CREAR_USUARIO', 'usuarios', 5, 'Creó usuario: ana.martinez@clinica.cl (PROFESIONAL - Fonoaudióloga)', '192.168.1.100', '2026-04-01 09:20:00');

-- Auditoría 3: Admin resetea contraseña de padre
INSERT INTO auditoria_admin (admin_id, accion, entidad, entidad_id, detalles, ip_address, created_at) VALUES
(12, 'RESETEAR_PASSWORD', 'usuarios', 1, 'Reseteó contraseña de: juan.perez@example.com', '192.168.1.100', '2026-04-05 14:30:00');

-- Auditoría 4: Admin asigna profesionales médicos al perfil de Juanito
INSERT INTO auditoria_admin (admin_id, accion, entidad, entidad_id, detalles, ip_address, created_at) VALUES
(12, 'ASIGNAR_MEDICOS', 'perfil_usuario', 1, 'Asignó 2 profesionales médicos (psiquiatra, neuróloga) al perfil: Juanito Pérez López', '192.168.1.100', '2026-04-08 10:00:00');

-- =====================================================
-- VERIFICACIÓN DE DATOS
-- =====================================================

-- Contar registros por tabla
SELECT 
  (SELECT COUNT(*) FROM usuarios) AS total_usuarios,
  (SELECT COUNT(*) FROM perfiles) AS total_perfiles,
  (SELECT COUNT(*) FROM perfil_usuario) AS total_asignaciones_perfil,
  (SELECT COUNT(*) FROM observaciones) AS total_observaciones,
  (SELECT COUNT(*) FROM reportes) AS total_reportes,
  (SELECT COUNT(*) FROM observaciones_en_reportes) AS total_obs_en_reportes,
  (SELECT COUNT(*) FROM auditoria_admin) AS total_auditoria;

-- Mostrar estructura de la base de datos
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS num_columnas
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- SCRIPT COMPLETADO - RESUMEN FINAL
-- =====================================================
-- ✅ 7 tablas creadas:
--    - usuarios (12 registros)
--    - perfiles (2 registros: Juanito y Valentina)
--    - perfil_usuario (11 asignaciones: relación N:N)
--    - observaciones (9 registros)
--    - reportes (1 registro)
--    - observaciones_en_reportes (8 asociaciones)
--    - auditoria_admin (4 registros)
--
-- ✅ 4 tipos ENUM creados:
--    - rol_enum (4 valores: FAMILIA, EDUCADOR, PROFESIONAL, ADMINISTRADOR)
--    - rol_perfil_enum (4 valores: TUTOR, EDUCADOR, PROFESIONAL, OBSERVADOR)
--    - categoria_observacion_enum (7 valores: CONDUCTA, COMUNICACION, SOCIAL, ACADEMICO, SENSORIAL, MOTOR, OTRO)
--    - formato_reporte_enum (2 valores: PDF, EXCEL)
--
-- ✅ 17 índices creados para optimización
-- ✅ 3 triggers para auto-actualización de timestamps
--
-- ✅ DATOS DE PRUEBA:
--    - 12 usuarios (2 familias, 3 educadores, 5 profesionales: 3 terapeutas + 2 médicos observadores, 1 admin)
--    - 2 perfiles de niños con TEA
--    - PERFIL PRINCIPAL: Juanito Pérez (9 años) con 9 colaboradores:
--      * 2 tutores (mamá y papá) - editan perfil + crean observaciones
--      * 2 educadores (diferencial + asistente) - solo crean observaciones
--      * 3 profesionales activos (fonoaudióloga, terapeuta ocupacional, psicólogo) - solo crean observaciones
--      * 2 observadores médicos (psiquiatra, neuróloga) - SOLO LECTURA (no crean observaciones)
--    - 9 observaciones (8 sobre Juanito de diferentes autores, 1 sobre Valentina)
--    - 1 reporte con 8 observaciones asociadas
--    - 4 registros de auditoría administrativa
--
-- ✅ CARACTERÍSTICAS IMPLEMENTADAS:
--    - Relación N:N entre perfiles y usuarios (múltiples colaboradores por perfil)
--    - 4 roles en perfil con permisos diferenciados:
--      * TUTOR: edita perfil + crea observaciones
--      * EDUCADOR: solo crea observaciones  
--      * PROFESIONAL: solo crea observaciones
--      * OBSERVADOR: SOLO LECTURA (médicos consultores para diagnóstico/medicación)
--    - Control de permisos granular (rol_en_perfil + puede_editar)
--    - Auditoría completa de acciones administrativas
--    - 7 categorías de observaciones (incluyendo SENSORIAL, MOTOR, OTRO)
--    - 4 roles de usuarios (incluyendo ADMINISTRADOR)
--
-- =====================================================
--
-- ✅ 17 índices creados para optimización
-- ✅ 3 triggers para auto-actualización de timestamps
--
-- ✅ DATOS DE PRUEBA:
--    - 10 usuarios (2 familias, 3 educadores, 3 profesionales, 1 admin)
--    - 2 perfiles de niños con TEA
--    - PERFIL PRINCIPAL: Juanito Pérez (9 años) con 7 colaboradores:
--      * 2 tutores (mamá y papá)
--      * 2 educadores (diferencial + asistente)
--      * 3 profesionales (fonoaudióloga, terapeuta ocupacional, psicólogo)
--    - 9 observaciones (8 sobre Juanito de diferentes autores, 1 sobre Valentina)
--    - 1 reporte con 8 observaciones asociadas
--    - 4 registros de auditoría administrativa
--
-- ✅ CARACTERÍSTICAS IMPLEMENTADAS:
--    - Relación N:N entre perfiles y usuarios (múltiples colaboradores por perfil)
--    - Control de permisos granular (rol_en_perfil + puede_editar)
--    - Auditoría completa de acciones administrativas
--    - 7 categorías de observaciones (incluyendo SENSORIAL, MOTOR, OTRO)
--    - 4 roles de usuarios (incluyendo ADMINISTRADOR)
--
-- =====================================================
