import { nivel_educacional_enum } from '@prisma/client';
import { z } from 'zod';
import { especialidadEducadorSchema } from './especialidadEducador';
import {
  profesionalEquipoBodySchema,
  requiereProfesionEquipo
} from './profesionProfesional';
import {
  NIVELES_EDUCACIONALES,
  NIVEL_EDUCACIONAL_LABEL,
  nivelEducacionalSchema
} from './nivelEducacional';

export function educadorAtiendeNivelPerfil(
  nivelesEducador: nivel_educacional_enum[] | null | undefined,
  nivelPerfil: nivel_educacional_enum | null | undefined
): boolean {
  if (!nivelPerfil) return true;
  if (!nivelesEducador?.length) return false;
  return nivelesEducador.includes(nivelPerfil);
}

export function mensajeEducadorSinNivelPerfil(nivelPerfil: nivel_educacional_enum): string {
  const etiqueta = NIVEL_EDUCACIONAL_LABEL[nivelPerfil] ?? nivelPerfil;
  return `Solo puede asignar educadores que tengan el nivel «${etiqueta}» en su ficha.`;
}
export const educadorEquipoBodySchema = z.object({
  niveles_educacionales: z
    .array(nivelEducacionalSchema)
    .min(1, 'Seleccione al menos un nivel educacional'),
  especialidad: especialidadEducadorSchema
});

export const educadorEquipoUpdateSchema = z.object({
  niveles_educacionales: z.array(nivelEducacionalSchema).min(1).optional(),
  especialidad: especialidadEducadorSchema.optional()
});

export function resumenNivelesEducador(
  niveles: nivel_educacional_enum[] | null | undefined
): string {
  if (!niveles?.length) return 'Sin nivel asignado';
  return niveles.map(n => NIVEL_EDUCACIONAL_LABEL[n]).join(', ');
}

export function ordenarNivelesEducador(
  niveles: nivel_educacional_enum[]
): nivel_educacional_enum[] {
  const orden = new Map(NIVELES_EDUCACIONALES.map((n, i) => [n, i]));
  return [...niveles].sort((a, b) => (orden.get(a) ?? 0) - (orden.get(b) ?? 0));
}

export function requiereDatosEducadorColegio(
  rol: string,
  tipoInstitucion: string
): boolean {
  return rol === 'EDUCADOR' && tipoInstitucion === 'CENTRO_EDUCACIONAL';
}

export function datosEquipoParaPersistir(
  rol: string,
  tipoInstitucion: string,
  body: { niveles_educacionales?: string[]; especialidad?: string }
) {
  if (requiereDatosEducadorColegio(rol, tipoInstitucion)) {
    const parsed = educadorEquipoBodySchema.parse({
      niveles_educacionales: body.niveles_educacionales ?? [],
      especialidad: body.especialidad
    });
    return {
      niveles_educacionales: ordenarNivelesEducador(parsed.niveles_educacionales),
      especialidad: parsed.especialidad
    };
  }
  if (requiereProfesionEquipo(rol, tipoInstitucion)) {
    const parsed = profesionalEquipoBodySchema.parse({
      especialidad: body.especialidad
    });
    return { niveles_educacionales: [], especialidad: parsed.especialidad };
  }
  return { niveles_educacionales: [], especialidad: null as null };
}

/** @deprecated Use datosEquipoParaPersistir */
export function datosEducadorParaPersistir(
  rol: string,
  tipoInstitucion: string,
  body: { niveles_educacionales?: string[]; especialidad?: string }
) {
  return datosEquipoParaPersistir(rol, tipoInstitucion, body);
}
