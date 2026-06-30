import { Router } from 'express';
import {
  crearPerfil,
  buscarPerfilPorRut,
  obtenerPerfiles,
  obtenerPerfilPorId,
  obtenerDetallePerfil,
  actualizarPerfil,
  eliminarPerfil,
  cederCustodiaPerfil,
  vincularMiembroEquipo,
  listPerfilesTutorFamilia,
  obtenerConsentimientoPerfil,
  registrarConsentimientoPerfil,
  listApoderadosPerfil,
  invitarApoderadoPerfil
} from '../controllers/perfilController';
import {
  listInstitucionesInvitables,
  listInstitucionesRed,
  listSolicitudesEnviadasPerfil,
  crearSolicitudInstitucion,
  listSolicitudesRecibidas,
  responderSolicitudInstitucion,
  listPerfilesCompartidos,
  listMiembrosAsignadosPerfil,
  asignarMiembroColaboracion
} from '../controllers/solicitudInstitucionController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.get(
  '/familia/tutor',
  authenticateToken,
  authorizeRoles('FAMILIA'),
  listPerfilesTutorFamilia
);

router.get(
  '/instituciones-invitables',
  authenticateToken,
  authorizeRoles('ADMINISTRADOR'),
  listInstitucionesInvitables
);

router.get(
  '/instituciones-red',
  authenticateToken,
  authorizeRoles('ADMINISTRADOR'),
  listInstitucionesRed
);

router.get(
  '/solicitudes-recibidas',
  authenticateToken,
  authorizeRoles('ADMINISTRADOR'),
  listSolicitudesRecibidas
);

router.get(
  '/compartidos',
  authenticateToken,
  authorizeRoles('ADMINISTRADOR'),
  listPerfilesCompartidos
);

router.post(
  '/solicitudes-institucion/:solicitudId/responder',
  authenticateToken,
  authorizeRoles('ADMINISTRADOR'),
  responderSolicitudInstitucion
);

router.get('/', authenticateToken, obtenerPerfiles);

router.get(
  '/buscar-rut',
  authenticateToken,
  authorizeRoles('ADMINISTRADOR'),
  buscarPerfilPorRut
);

router.post('/', authenticateToken, authorizeRoles('ADMINISTRADOR'), crearPerfil);

router.get(
  '/:id/consentimiento',
  authenticateToken,
  authorizeRoles('FAMILIA'),
  obtenerConsentimientoPerfil
);

router.post(
  '/:id/consentimiento',
  authenticateToken,
  authorizeRoles('FAMILIA'),
  registrarConsentimientoPerfil
);

router.get(
  '/:id/apoderados',
  authenticateToken,
  authorizeRoles('FAMILIA'),
  listApoderadosPerfil
);

router.post(
  '/:id/apoderados',
  authenticateToken,
  authorizeRoles('FAMILIA'),
  invitarApoderadoPerfil
);

router.get(
  '/:id/solicitudes-institucion',
  authenticateToken,
  authorizeRoles('ADMINISTRADOR'),
  listSolicitudesEnviadasPerfil
);

router.post(
  '/:id/solicitudes-institucion',
  authenticateToken,
  authorizeRoles('ADMINISTRADOR'),
  crearSolicitudInstitucion
);

router.get(
  '/:id/miembros-equipo',
  authenticateToken,
  authorizeRoles('ADMINISTRADOR'),
  listMiembrosAsignadosPerfil
);

router.post(
  '/:id/asignar-miembro',
  authenticateToken,
  authorizeRoles('ADMINISTRADOR'),
  asignarMiembroColaboracion
);

router.post(
  '/:id/vincular-equipo',
  authenticateToken,
  authorizeRoles('ADMINISTRADOR'),
  vincularMiembroEquipo
);

router.get(
  '/:id/detalle',
  authenticateToken,
  authorizeRoles('ADMINISTRADOR', 'MEDICO', 'PROFESIONAL', 'EDUCADOR'),
  obtenerDetallePerfil
);

router.get('/:id', authenticateToken, obtenerPerfilPorId);

router.put('/:id', authenticateToken, authorizeRoles('ADMINISTRADOR'), actualizarPerfil);

router.post(
  '/:id/ceder-custodia',
  authenticateToken,
  authorizeRoles('ADMINISTRADOR'),
  cederCustodiaPerfil
);

router.delete('/:id', authenticateToken, authorizeRoles('SUPERADMIN'), eliminarPerfil);

export default router;
