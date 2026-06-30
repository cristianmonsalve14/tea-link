import { FaEnvelope, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import type { InstitucionContacto } from "../../utils/institucionContacto";
import { etiquetaTipoInstitucion, tieneDatosContacto } from "../../utils/institucionContacto";
import { cn } from "../../theme/cn";

type Props = {
  institucion: InstitucionContacto;
  className?: string;
  showTipo?: boolean;
};

export function InstitucionContactoCard({ institucion, className, showTipo = true }: Props) {
  const tipo = institucion.tipo_label ?? etiquetaTipoInstitucion(institucion.tipo);

  return (
    <div className={cn("text-sm", className)}>
      <p className="font-semibold text-neutral-gray">{institucion.nombre}</p>
      {showTipo && (
        <p className="text-xs text-neutral-gray-medium mt-0.5">
          {tipo}
          {institucion.ubicacion_label ? ` · ${institucion.ubicacion_label}` : ""}
        </p>
      )}
      {tieneDatosContacto(institucion) ? (
        <ul className="mt-2 space-y-1.5 text-neutral-gray-medium">
          {institucion.ubicacion_label && !showTipo && (
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-neutral-gray-medium/80" aria-hidden>
                <FaMapMarkerAlt />
              </span>
              <span>{institucion.ubicacion_label}</span>
            </li>
          )}
          {institucion.direccion && (
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-neutral-gray-medium/80" aria-hidden>
                <FaMapMarkerAlt />
              </span>
              <span>{institucion.direccion}</span>
            </li>
          )}
          {institucion.email_contacto && (
            <li className="flex items-center gap-2">
              <span className="shrink-0 text-neutral-gray-medium/80" aria-hidden>
                <FaEnvelope />
              </span>
              <a
                href={`mailto:${institucion.email_contacto}`}
                className="text-primary hover:underline break-all"
              >
                {institucion.email_contacto}
              </a>
            </li>
          )}
          {institucion.telefono_contacto && (
            <li className="flex items-center gap-2">
              <span className="shrink-0 text-neutral-gray-medium/80" aria-hidden>
                <FaPhone />
              </span>
              <a
                href={`tel:${institucion.telefono_contacto.replace(/\s/g, "")}`}
                className="text-primary hover:underline"
              >
                {institucion.telefono_contacto}
              </a>
            </li>
          )}
        </ul>
      ) : (
        <p className="text-xs text-neutral-gray-medium mt-2 italic">
          Sin datos de contacto registrados.
        </p>
      )}
    </div>
  );
}
