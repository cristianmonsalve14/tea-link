import { Response } from 'express';
import { z } from 'zod';

import { listarComunasPorRegion } from '../utils/ubicacionChile';
import { regionChileSchema } from '../utils/regionChile';

const comunasQuerySchema = z.object({
  region: regionChileSchema
});

/** Catálogo de comunas oficiales por región (346 comunas de Chile). */
export const getComunasPorRegion = (req: { query: unknown }, res: Response) => {
  try {
    const { region } = comunasQuerySchema.parse(req.query);
    return res.json({ comunas: listarComunasPorRegion(region) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al listar comunas' });
  }
};
