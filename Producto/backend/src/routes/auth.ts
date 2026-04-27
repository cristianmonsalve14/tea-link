
import { Router } from 'express';
import { register, login, updateUser, deleteUser, createInstitucion, listInstituciones } from '../controllers/authController';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, authorizeRoles } from '../middleware/authMiddleware';

const prisma = new PrismaClient();
const router = Router();

// Crear institución (público para pruebas, restringir en producción)
router.post('/institucion', createInstitucion);

// Listar instituciones
router.get('/instituciones', listInstituciones);

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

// Registro de usuario
router.post('/register', register);

// Login de usuario
router.post('/login', login);

// Editar usuario (solo admin de la misma institución)
router.put('/usuario/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), updateUser);

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
