export function normalizarRutChileno(input: string): string | null {
  const cleaned = input.replace(/\./g, "").replace(/\s/g, "").replace(/-/g, "").trim().toUpperCase();
  if (cleaned.length < 2) return null;
  const dv = cleaned.slice(-1);
  const body = cleaned.slice(0, -1);
  if (!/^\d{7,8}$/.test(body)) return null;
  if (!/^[\dK]$/.test(dv)) return null;
  return `${body}-${dv}`;
}

function calcularDvRutChileno(cuerpo: string): string {
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
}

export function validarRutChileno(input: string): boolean {
  const norm = normalizarRutChileno(input);
  if (!norm) return false;
  const [body, dv] = norm.split("-");
  return calcularDvRutChileno(body) === dv;
}

export function formatearRutChileno(input: string): string {
  const norm = normalizarRutChileno(input);
  if (!norm) return input.trim();
  const [body, dv] = norm.split("-");
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
}

export function mensajeErrorRut(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return "El RUT es obligatorio";
  if (!validarRutChileno(trimmed)) {
    return "RUT inválido. Verifique el número y el dígito verificador.";
  }
  return null;
}
