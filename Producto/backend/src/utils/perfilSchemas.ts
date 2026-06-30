import { z } from 'zod';
import { nombreCompletoConApellidoSchema } from './nombrePersona';
import { nivelEducacionalSchema } from './nivelEducacional';
import { normalizarRutChileno, validarRutChileno } from './rutChileno';
import {
  camposDiagnosticoPerfilSchema,
  camposDiagnosticoPerfilObjectSchema,
  validarReglasDiagnostico
} from './diagnosticoPerfil';

const rutChilenoSchema = z
  .string()
  .min(1, 'El RUT es obligatorio')
  .superRefine((val, ctx) => {
    if (!validarRutChileno(val)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'RUT inválido' });
    }
  })
  .transform(v => normalizarRutChileno(v)!);

const perfilBaseSchema = z.object({
  rut: rutChilenoSchema,
  nombre: z.string().min(1),
  edad: z.coerce.number().int().min(0).max(120).optional(),
  nivel_educacional: nivelEducacionalSchema.optional(),
  fecha_nacimiento: z.string().optional(),
  notas: z.string().optional(),
  tutor_email: z.string().email().optional(),
  tutor_nombre_completo: nombreCompletoConApellidoSchema.optional()
});

export const crearPerfilSchema = perfilBaseSchema
  .merge(camposDiagnosticoPerfilSchema)
  .refine(
    data =>
      (!data.tutor_email && !data.tutor_nombre_completo) ||
      (Boolean(data.tutor_email) && Boolean(data.tutor_nombre_completo?.trim())),
    {
      message: 'Debe indicar email y nombre del tutor, o dejar ambos vacíos.',
      path: ['tutor_email']
    }
  );

export const actualizarPerfilSchema = z
  .object({
    nombre: z.string().min(1).optional(),
    edad: z.coerce.number().int().min(0).max(120).optional(),
    nivel_educacional: nivelEducacionalSchema.nullable().optional(),
    fecha_nacimiento: z.string().optional(),
    notas: z.string().optional()
  })
  .merge(camposDiagnosticoPerfilObjectSchema.partial())
  .superRefine((data, ctx) => {
    const tieneDiag =
      data.diagnostico_clinico !== undefined ||
      data.diagnostico_secundario !== undefined ||
      data.causa_discapacidad !== undefined ||
      data.grado_discapacidad !== undefined ||
      data.porcentaje_rnd !== undefined ||
      data.tiene_credencial_rnd !== undefined;
    if (!tieneDiag || data.diagnostico_clinico === undefined) return;
    validarReglasDiagnostico(
      {
        diagnostico_clinico: data.diagnostico_clinico,
        diagnostico_secundario: data.diagnostico_secundario ?? null,
        causa_discapacidad: data.causa_discapacidad ?? null,
        grado_discapacidad: data.grado_discapacidad ?? 'NO_CALIFICADO',
        porcentaje_rnd: data.porcentaje_rnd ?? null,
        tiene_credencial_rnd: data.tiene_credencial_rnd ?? false
      },
      ctx
    );
  });

export const consentimientoPerfilSchema = z.object({
  version: z.string().min(1),
  acepto: z.boolean()
});

export function parseCrearPerfilBody(body: unknown) {
  return crearPerfilSchema.parse(body);
}
