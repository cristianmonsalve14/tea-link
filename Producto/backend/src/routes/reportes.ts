import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';
import {
  listMisReportes,
  createReporte,
  getReporteById,
  exportReporte,
  deleteReporte
} from '../controllers/reporteController';

const router = Router();

const rolesEquipo = ['EDUCADOR', 'FAMILIA', 'PROFESIONAL', 'MEDICO'] as const;

router.get('/mis', authenticateToken, authorizeRoles(...rolesEquipo), listMisReportes);
router.post('/', authenticateToken, authorizeRoles(...rolesEquipo), createReporte);

router.get(
  '/:id/export',
  authenticateToken,
  authorizeRoles(...rolesEquipo),
  exportReporte
);
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles(...rolesEquipo),
  getReporteById
);
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles(...rolesEquipo),
  deleteReporte
);

export default router;
