/** Máximos según schema Prisma (`auditoria_admin`). */
export const AUDIT_IP_MAX_LEN = 45;
export const AUDIT_DETALLES_MAX_LEN = 500;

/** Recorta IP / cadena de proxy para `auditoria_admin.ip_address` (VarChar 45). */
export function sanitizeAuditIp(ip: string | undefined | null): string | null {
  if (!ip?.trim()) return null;
  let trimmed = ip.trim();
  if (trimmed.includes(',')) {
    trimmed = trimmed.split(',')[0]?.trim() ?? trimmed;
  }
  if (trimmed.length <= AUDIT_IP_MAX_LEN) return trimmed;
  return trimmed.slice(0, AUDIT_IP_MAX_LEN);
}

export function truncateAuditDetalles(detalles: string): string {
  if (detalles.length <= AUDIT_DETALLES_MAX_LEN) return detalles;
  return `${detalles.slice(0, AUDIT_DETALLES_MAX_LEN - 3)}...`;
}

export function resolveAuditAdminId(user: {
  userId?: number;
  id?: number;
}): number | null {
  const id = user.userId ?? user.id;
  return typeof id === 'number' && Number.isFinite(id) ? id : null;
}
