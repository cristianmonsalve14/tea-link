-- Restaurar rol SUPERADMIN eliminado en migración anterior
ALTER TYPE "rol_enum" ADD VALUE 'SUPERADMIN';
