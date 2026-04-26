import { Router } from 'express';
import { crearObservacion } from '../controllers/observacionController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Crear observación (solo médicos)
router.post('/', authenticateToken, crearObservacion);

export default router;
