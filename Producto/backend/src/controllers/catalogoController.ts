import { Response } from 'express';
import { ZodError } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  buscarCatalogoEstablecimientos,
  catalogoBusquedaSchema,
  metaFiltrosCatalogo,
  obtenerCatalogoEstablecimientoPorId
} from '../utils/catalogoSearch';

export const getCatalogoMeta = async (_req: AuthRequest, res: Response) => {
  try {
    const meta = await metaFiltrosCatalogo();
    return res.json(meta);
  } catch {
    return res.status(500).json({ error: 'No se pudo obtener metadata del catálogo' });
  }
};

export const buscarCatalogo = async (req: AuthRequest, res: Response) => {
  try {
    const query = catalogoBusquedaSchema.parse(req.query);
    const data = await buscarCatalogoEstablecimientos(query);
    return res.json(data);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al buscar en el catálogo oficial' });
  }
};

export const getCatalogoPorId = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const item = await obtenerCatalogoEstablecimientoPorId(id);
    if (!item) return res.status(404).json({ error: 'Registro no encontrado en catálogo' });
    return res.json({ item });
  } catch {
    return res.status(500).json({ error: 'Error al obtener registro del catálogo' });
  }
};
