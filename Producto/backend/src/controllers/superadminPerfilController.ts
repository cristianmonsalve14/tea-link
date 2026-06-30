import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  superadminPerfilesListQuerySchema,
  listarPerfilesSuperadminNacional,
  obtenerDetallePerfilSuperadmin
} from '../utils/superadminPerfilesQuery';

export const listSuperadminPerfiles = async (req: AuthRequest, res: Response) => {
  try {
    const query = superadminPerfilesListQuerySchema.parse(req.query);
    const result = await listarPerfilesSuperadminNacional(query);
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('[SUPERADMIN][PERFILES]', error);
    return res.status(500).json({ error: 'Error al listar el registro nacional de perfiles' });
  }
};

export const getSuperadminPerfilDetalle = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const perfil = await obtenerDetallePerfilSuperadmin(id);
    if (!perfil) {
      return res.status(404).json({ error: 'Perfil no encontrado en el registro nacional' });
    }
    return res.json({ perfil });
  } catch (error) {
    console.error('[SUPERADMIN][PERFIL_DETALLE]', error);
    return res.status(500).json({ error: 'Error al obtener detalle del perfil' });
  }
};
