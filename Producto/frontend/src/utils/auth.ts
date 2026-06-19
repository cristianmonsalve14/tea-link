const TOKEN_KEY = 'token';
const ROL_KEY = 'rol';
const INSTITUCION_KEY = 'institucion';
const INSTITUCION_TIPO_KEY = 'institucion_tipo';
const MUST_CHANGE_PASSWORD_KEY = 'must_change_password';
const USER_NAME_KEY = 'nombre_usuario';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

type JwtPayload = {
  rol?: string;
  exp?: number;
  institucion_id?: number;
};

function getJwtPayload(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1])) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenValid(token: string): boolean {
  const payload = getJwtPayload(token);
  if (!payload) return false;
  if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
    return false;
  }
  return true;
}

/** Rol desde localStorage o, si falta, desde el JWT */
export function getRole(): string | null {
  const stored = localStorage.getItem(ROL_KEY);
  if (stored) return stored;

  const token = getToken();
  if (!token || !isTokenValid(token)) return null;

  const rol = getJwtPayload(token)?.rol ?? null;
  if (rol) localStorage.setItem(ROL_KEY, rol);
  return rol;
}

export function syncSessionFromToken(): void {
  const token = getToken();
  if (!token || !isTokenValid(token)) return;
  const payload = getJwtPayload(token);
  if (payload?.rol) localStorage.setItem(ROL_KEY, payload.rol);
}

export function isAuthenticated(): boolean {
  const token = getToken();
  return !!token && isTokenValid(token);
}

export function mustChangePassword(): boolean {
  return localStorage.getItem(MUST_CHANGE_PASSWORD_KEY) === 'true';
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROL_KEY);
  localStorage.removeItem(INSTITUCION_KEY);
  localStorage.removeItem(INSTITUCION_TIPO_KEY);
  localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY);
  localStorage.removeItem(USER_NAME_KEY);
}

export function getUserName(): string | null {
  return localStorage.getItem(USER_NAME_KEY);
}

export function saveSession(
  token: string,
  rol?: string,
  institucion?: string,
  institucionTipo?: string,
  debeCambiarPassword?: boolean,
  nombreCompleto?: string
): void {
  localStorage.setItem(TOKEN_KEY, token);
  if (rol) localStorage.setItem(ROL_KEY, rol);
  if (institucion) localStorage.setItem(INSTITUCION_KEY, institucion);
  if (institucionTipo) localStorage.setItem(INSTITUCION_TIPO_KEY, institucionTipo);
  if (nombreCompleto?.trim()) {
    localStorage.setItem(USER_NAME_KEY, nombreCompleto.trim());
  }
  if (debeCambiarPassword) {
    localStorage.setItem(MUST_CHANGE_PASSWORD_KEY, 'true');
  } else {
    localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY);
  }
}

export function clearMustChangePassword(): void {
  localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY);
}
