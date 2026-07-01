const raw = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const API_BASE = String(raw).replace(/\/$/, '');

/** Ruta relativa al host del API, p. ej. `/api/auth/login`. */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}
