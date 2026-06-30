import {
  validarDireccion,
  validarEmail,
  validarTelefonoChile
} from "./formValidation";
import type { UbicacionInstitucion } from "./ubicacionChile";
import { validarUbicacionInstitucion, type ErroresUbicacionInstitucion } from "./ubicacionChile";

export type ErroresContactoInstitucion = ErroresUbicacionInstitucion & {
  direccion?: string;
  email_contacto?: string;
  telefono_contacto?: string;
};

export function validarContactoInstitucion(
  ubicacion: UbicacionInstitucion,
  direccion: string,
  email: string,
  telefono: string,
  comunasRegion?: string[]
): ErroresContactoInstitucion {
  return {
    ...validarUbicacionInstitucion(ubicacion, comunasRegion),
    direccion: validarDireccion(direccion) ?? undefined,
    email_contacto: validarEmail(email) ?? undefined,
    telefono_contacto: validarTelefonoChile(telefono) ?? undefined
  };
}

export function contactoInstitucionValido(errors: ErroresContactoInstitucion): boolean {
  return Object.values(errors).every(v => !v);
}
