import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';
import {
  buscarCatalogo,
  getCatalogoMeta,
  getCatalogoPorId
} from '../controllers/catalogoController';

const router = Router();

router.get('/meta', authenticateToken, authorizeRoles('SUPERADMIN'), getCatalogoMeta);
router.get(
  '/establecimientos',
  authenticateToken,
  authorizeRoles('SUPERADMIN'),
  buscarCatalogo
);
router.get(
  '/establecimientos/:id',
  authenticateToken,
  authorizeRoles('SUPERADMIN'),
  getCatalogoPorId
);

export default router;
