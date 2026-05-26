import { Router } from 'express';
import { crearPerfil, obtenerPerfiles, obtenerPerfilPorId, actualizarPerfil, eliminarPerfil } from '../controllers/perfilController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();


// Listar todos los perfiles
router.get('/', authenticateToken, obtenerPerfiles);

// Crear perfil
router.post('/', authenticateToken, crearPerfil);

// Obtener perfil por ID
router.get('/:id', authenticateToken, obtenerPerfilPorId);

// Actualizar perfil
router.put('/:id', authenticateToken, actualizarPerfil);

// Eliminar perfil
router.delete('/:id', authenticateToken, eliminarPerfil);


export default router;
