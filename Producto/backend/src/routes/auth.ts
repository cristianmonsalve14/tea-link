// Eliminar administrador por superadmin

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, authorizeRoles } from '../middleware/authMiddleware';
import { getComunasPorRegion, getLocalidadesPorComuna } from '../controllers/ubicacionController';
import {
  register,
  login,
  cambiarPasswordInicial,
  updateUser,
  getUsuarioDetalle,
  resetUserPasswordByAdmin,
  deleteUser,
  listUsuariosInstitucion,
  createEducadorByAdmin,
  createInstitucion,
  listInstituciones,
  updateInstitucion,
  deleteInstitucion,
  getMiInstitucion,
  updateMiInstitucionContacto,
  getSuperadminStats,
  getSuperadminOverview,
  getUltimasAccionesAuditoria,
  createAdministradorBySuperadmin,
  listAdministradores,
  resetAdminPasswordBySuperadmin,
  updateAdministradorBySuperadmin,
  deleteAdministradorBySuperadmin,
  getConsentimientoEstado,
  aceptarConsentimiento
} from '../controllers/authController';
import {
  listSuperadminPerfiles,
  getSuperadminPerfilDetalle
} from '../controllers/superadminPerfilController';
import { getAuditoriaObservaciones } from '../controllers/auditoriaObservacionController';

const prisma = new PrismaClient();
const router = Router();

router.get('/ubicacion/comunas', getComunasPorRegion);
router.get('/ubicacion/localidades', getLocalidadesPorComuna);

// Eliminar administrador por superadmin
router.delete('/superadmin/administrador/:id', authenticateToken, authorizeRoles('SUPERADMIN'), deleteAdministradorBySuperadmin);



// --- DASHBOARD SUPERADMIN ---
router.get('/superadmin/stats', authenticateToken, authorizeRoles('SUPERADMIN'), getSuperadminStats);
router.get('/superadmin/overview', authenticateToken, authorizeRoles('SUPERADMIN'), getSuperadminOverview);
router.get('/superadmin/perfiles', authenticateToken, authorizeRoles('SUPERADMIN'), listSuperadminPerfiles);
router.get(
  '/superadmin/perfiles/:id',
  authenticateToken,
  authorizeRoles('SUPERADMIN'),
  getSuperadminPerfilDetalle
);
router.get('/superadmin/auditoria', authenticateToken, authorizeRoles('SUPERADMIN'), getUltimasAccionesAuditoria);
router.get(
  '/superadmin/auditoria-observaciones',
  authenticateToken,
  authorizeRoles('SUPERADMIN'),
  getAuditoriaObservaciones
);

// Crear administrador por superadmin
router.post('/superadmin/administrador', authenticateToken, authorizeRoles('SUPERADMIN'), createAdministradorBySuperadmin);
// Listar administradores (superadmin)
router.get('/superadmin/administradores', authenticateToken, authorizeRoles('SUPERADMIN'), listAdministradores);
// Resetear contraseña de administrador (superadmin)
router.post('/superadmin/administrador/:id/reset-password', authenticateToken, authorizeRoles('SUPERADMIN'), resetAdminPasswordBySuperadmin);
// Editar datos de administrador (superadmin)
router.put('/superadmin/administrador/:id', authenticateToken, authorizeRoles('SUPERADMIN'), updateAdministradorBySuperadmin);

// Crear institución (público para pruebas, restringir en producción)
router.post('/institucion', authenticateToken, authorizeRoles('SUPERADMIN'), createInstitucion);

// Listar instituciones
router.get('/instituciones', authenticateToken, authorizeRoles('SUPERADMIN'), listInstituciones);

// Editar institución
router.put('/institucion/:id', authenticateToken, authorizeRoles('SUPERADMIN'), updateInstitucion);

// Eliminar institución
router.delete('/institucion/:id', authenticateToken, authorizeRoles('SUPERADMIN'), deleteInstitucion);

// Ruta solo para MEDICO
router.get('/solo-medico', authenticateToken, authorizeRoles('MEDICO'), async (req: AuthRequest, res) => {
	try {
		await prisma.auditoriaAdmin.create({
			data: {
				admin_id: req.user.userId,
				accion: 'Acceso a solo-medico',
				entidad: 'solo-medico',
				entidad_id: null,
				detalles: 'Acceso a ruta protegida solo para médicos',
				ip_address: req.ip || null,
			}
		});
		res.json({ message: 'Solo los médicos pueden ver esto', user: req.user });
	} catch (error) {
		res.status(500).json({ error: 'Error al registrar auditoría' });
	}
});

// Usuarios de la institución (administrador del colegio)
router.get('/usuarios', authenticateToken, authorizeRoles('ADMINISTRADOR'), listUsuariosInstitucion);
router.get('/mi-institucion', authenticateToken, authorizeRoles('ADMINISTRADOR'), getMiInstitucion);
router.patch(
  '/mi-institucion/contacto',
  authenticateToken,
  authorizeRoles('ADMINISTRADOR'),
  updateMiInstitucionContacto
);
router.post('/educadores', authenticateToken, authorizeRoles('ADMINISTRADOR'), createEducadorByAdmin);
router.post('/register', authenticateToken, authorizeRoles('ADMINISTRADOR'), register);

// Login de usuario
router.post('/login', login);

// Cambio obligatorio de contraseña (primer ingreso con clave temporal)
router.post(
  '/cambiar-password-inicial',
  authenticateToken,
  cambiarPasswordInicial
);

// Consentimiento informado — padres/tutores (FAMILIA)
router.get('/consentimiento/estado', authenticateToken, getConsentimientoEstado);
router.post('/consentimiento/aceptar', authenticateToken, aceptarConsentimiento);

// Detalle de usuario del equipo (solo admin de la misma institución)
router.get('/usuario/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), getUsuarioDetalle);

// Editar usuario (solo admin de la misma institución)
router.put('/usuario/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), updateUser);

// Resetear contraseña de usuario operativo (solo admin de la misma institución)
router.post('/usuario/:id/reset-password', authenticateToken, authorizeRoles('ADMINISTRADOR'), resetUserPasswordByAdmin);

// Eliminar usuario (solo admin de la misma institución)
router.delete('/usuario/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), deleteUser);

// Ruta protegida de ejemplo (cualquier usuario autenticado)
router.get('/protegida', authenticateToken, async (req: AuthRequest, res) => {
	// Auditoría de acceso genérico
	try {
		await prisma.auditoriaAdmin.create({
			data: {
				admin_id: req.user.userId,
				accion: 'Acceso a protegida',
				entidad: 'protegida',
				entidad_id: null,
				detalles: 'Acceso a ruta protegida para cualquier usuario',
				ip_address: req.ip || null,
			}
		});
	} catch (e) { /* opcional: ignorar error de auditoría */ }
	res.json({ message: 'Acceso autorizado a ruta protegida', user: req.user });
});

// Ruta solo para FAMILIA
router.get('/solo-familia', authenticateToken, authorizeRoles('FAMILIA'), async (req: AuthRequest, res) => {
	try {
		await prisma.auditoriaAdmin.create({
			data: {
				admin_id: req.user.userId,
				accion: 'Acceso a solo-familia',
				entidad: 'solo-familia',
				entidad_id: null,
				detalles: 'Acceso a ruta protegida solo para familia',
				ip_address: req.ip || null,
			}
		});
		res.json({ message: 'Solo las familias pueden ver esto', user: req.user });
	} catch (error) {
		res.status(500).json({ error: 'Error al registrar auditoría' });
	}
});
// Ruta solo para EDUCADOR
router.get('/solo-educador', authenticateToken, authorizeRoles('EDUCADOR'), async (req: AuthRequest, res) => {
	try {
		await prisma.auditoriaAdmin.create({
			data: {
				admin_id: req.user.userId,
				accion: 'Acceso a solo-educador',
				entidad: 'solo-educador',
				entidad_id: null,
				detalles: 'Acceso a ruta protegida solo para educadores',
				ip_address: req.ip || null,
			}
		});
		res.json({ message: 'Solo los educadores pueden ver esto', user: req.user });
	} catch (error) {
		res.status(500).json({ error: 'Error al registrar auditoría' });
	}
});

// Ruta solo para PROFESIONAL
router.get('/solo-profesional', authenticateToken, authorizeRoles('PROFESIONAL'), async (req: AuthRequest, res) => {
	try {
		await prisma.auditoriaAdmin.create({
			data: {
				admin_id: req.user.userId,
				accion: 'Acceso a solo-profesional',
				entidad: 'solo-profesional',
				entidad_id: null,
				detalles: 'Acceso a ruta protegida solo para profesionales',
				ip_address: req.ip || null,
			}
		});
		res.json({ message: 'Solo los profesionales pueden ver esto', user: req.user });
	} catch (error) {
		res.status(500).json({ error: 'Error al registrar auditoría' });
	}
});

// Ruta solo para ADMINISTRADOR con registro de auditoría
router.get('/solo-admin', authenticateToken, authorizeRoles('ADMINISTRADOR'), async (req: AuthRequest, res) => {
	try {
		// Registrar acción en AuditoriaAdmin
		await prisma.auditoriaAdmin.create({
			data: {
				admin_id: req.user.userId,
				accion: 'Acceso a solo-admin',
				entidad: 'solo-admin',
				entidad_id: null,
				detalles: 'Acceso a ruta protegida solo para administradores',
				ip_address: req.ip || null,
			}
		});
		res.json({ message: 'Solo los administradores pueden ver esto', user: req.user });
	} catch (error) {
		res.status(500).json({ error: 'Error al registrar auditoría' });
	}
});

export default router;
