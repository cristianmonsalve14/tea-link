import { Router } from 'express';
import {
  crearObservacion,
  getUltimasObservaciones,
  listObservaciones,
  actualizarObservacion,
  eliminarObservacion
} from '../controllers/observacionController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.get('/ultimas', authenticateToken, authorizeRoles('SUPERADMIN'), getUltimasObservaciones);

router.get(
  '/',
  authenticateToken,
  authorizeRoles('EDUCADOR', 'FAMILIA', 'PROFESIONAL', 'MEDICO'),
  listObservaciones
);
router.post(
  '/',
  authenticateToken,
  authorizeRoles('EDUCADOR', 'FAMILIA', 'PROFESIONAL', 'MEDICO'),
  crearObservacion
);
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('EDUCADOR', 'FAMILIA', 'PROFESIONAL', 'MEDICO'),
  actualizarObservacion
);
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('EDUCADOR', 'FAMILIA', 'PROFESIONAL', 'MEDICO'),
  eliminarObservacion
);

export default router;
