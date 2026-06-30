import { PrismaClient, privacidad_observacion_enum } from '@prisma/client';

export const ACCION_AUDITORIA_OBS = {
  CREAR: 'CREAR_OBSERVACION_SENSIBLE',
  EDITAR: 'EDITAR_OBSERVACION_SENSIBLE',
  ELIMINAR: 'ELIMINAR_OBSERVACION_SENSIBLE',
  CONSULTAR: 'CONSULTAR_OBSERVACION_SENSIBLE',
  CONSULTAR_LISTA: 'CONSULTAR_LISTA_SENSIBLE',
  CREAR_REPORTE: 'CREAR_REPORTE_SENSIBLE',
  EXPORTAR_REPORTE: 'EXPORTAR_REPORTE_SENSIBLE'
} as const;

export type AccionAuditoriaObs =
  (typeof ACCION_AUDITORIA_OBS)[keyof typeof ACCION_AUDITORIA_OBS];

export function esPrivacidadAuditable(
  privacidad: privacidad_observacion_enum | null | undefined
): privacidad is 'MULTINIVEL' | 'PRIVADA' {
  return privacidad === 'MULTINIVEL' || privacidad === 'PRIVADA';
}

export function filtrarObservacionesAuditables<
  T extends { privacidad: privacidad_observacion_enum }
>(observaciones: T[]): T[] {
  return observaciones.filter(o => esPrivacidadAuditable(o.privacidad));
}

type RegistrarAuditoriaObsInput = {
  usuarioId: number;
  accion: AccionAuditoriaObs;
  privacidad?: privacidad_observacion_enum | null;
  observacionId?: number | null;
  perfilId?: number | null;
  reporteId?: number | null;
  detalles?: string | null;
  ipAddress?: string | null;
};

export function truncarDetallesAuditoria(texto: string, max = 480): string {
  const t = texto.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export async function registrarAuditoriaObservacion(
  prisma: PrismaClient,
  input: RegistrarAuditoriaObsInput
): Promise<void> {
  try {
    await prisma.auditoriaObservacion.create({
      data: {
        usuario_id: input.usuarioId,
        accion: input.accion,
        observacion_id: input.observacionId ?? null,
        perfil_id: input.perfilId ?? null,
        reporte_id: input.reporteId ?? null,
        privacidad: input.privacidad ?? null,
        detalles: input.detalles ? truncarDetallesAuditoria(input.detalles) : null,
        ip_address: input.ipAddress ?? null
      }
    });
  } catch (err) {
    console.error('[AUDITORIA_OBS]', err);
  }
}

export function ipDesdeRequest(req?: { ip?: string | null }): string | null {
  const ip = req?.ip?.trim();
  return ip || null;
}
