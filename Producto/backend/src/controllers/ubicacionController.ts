import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

import {
  comunaNombreSchema,
  comunaValidaEnRegion,
  listarComunasPorRegion,
  normalizarComuna
} from '../utils/ubicacionChile';
import { regionChileSchema } from '../utils/regionChile';

const prisma = new PrismaClient();

const comunasQuerySchema = z.object({
  region: regionChileSchema
});

const localidadesQuerySchema = z.object({
  region: regionChileSchema,
  comuna: comunaNombreSchema
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

/** Localidades distintas del catálogo oficial para una región y comuna. */
export const getLocalidadesPorComuna = async (req: { query: unknown }, res: Response) => {
  try {
    const { region, comuna } = localidadesQuerySchema.parse(req.query);
    if (!comunaValidaEnRegion(region, comuna)) {
      return res.json({ localidades: [] });
    }
    const comunaNorm = normalizarComuna(region, comuna);
    if (!comunaNorm) {
      return res.json({ localidades: [] });
    }

    const rows = await prisma.catalogoEstablecimiento.findMany({
      where: {
        region,
        comuna: { equals: comunaNorm, mode: 'insensitive' },
        vigente: true,
        localidad: { not: null }
      },
      select: { localidad: true },
      distinct: ['localidad'],
      orderBy: { localidad: 'asc' }
    });

    const vistos = new Set<string>();
    const localidades: string[] = [];
    for (const row of rows) {
      const loc = row.localidad?.trim();
      if (!loc || loc.length < 2) continue;
      const key = loc.toLocaleLowerCase('es');
      if (vistos.has(key)) continue;
      vistos.add(key);
      localidades.push(loc);
    }
    localidades.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'accent' }));

    return res.json({ localidades });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Error al listar localidades' });
  }
};
