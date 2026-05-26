import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';
import {
  listReportes,
  listMisReportes,
  createReporte,
  getReporteById,
  exportReporte,
  updateReporte,
  deleteReporte
} from '../controllers/reporteController';

const router = Router();

const rolesEquipo = ['EDUCADOR', 'FAMILIA', 'PROFESIONAL', 'MEDICO'] as const;

router.get('/mis', authenticateToken, authorizeRoles(...rolesEquipo), listMisReportes);
router.post('/', authenticateToken, authorizeRoles(...rolesEquipo), createReporte);

router.get('/', authenticateToken, authorizeRoles('SUPERADMIN'), listReportes);
router.get(
  '/:id/export',
  authenticateToken,
  authorizeRoles('SUPERADMIN', ...rolesEquipo),
  exportReporte
);
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('SUPERADMIN', ...rolesEquipo),
  getReporteById
);
router.put('/:id', authenticateToken, authorizeRoles('SUPERADMIN'), updateReporte);
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('SUPERADMIN', ...rolesEquipo),
  deleteReporte
);

export default router;
