export function canViewReporte(
  userRol: string | undefined,
  userId: number | undefined,
  creadorId: number
): boolean {
  if (userRol === 'SUPERADMIN' || userRol === 'ADMINISTRADOR') return false;
  if (userId == null) return false;
  return userId === creadorId;
}

export function isValidNumericId(value: unknown): value is number {
  const id = Number(value);
  return Number.isInteger(id) && id > 0;
}
