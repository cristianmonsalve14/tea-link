import { useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { cn } from "../../theme/cn";
import {
  PROFESION_PROFESIONAL_GRUPOS,
  PROFESION_PROFESIONAL_LABEL,
  type ProfesionProfesional
} from "../../utils/profesionProfesional";

type Props = {
  value: ProfesionProfesional | "";
  onChange: (value: ProfesionProfesional) => void;
  label?: string;
  required?: boolean;
};

export function ProfesionProfesionalSelect({
  value,
  onChange,
  label = "Profesión",
  required = false
}: Props) {
  const [busqueda, setBusqueda] = useState("");

  const q = busqueda.trim().toLowerCase();

  const gruposFiltrados = useMemo(() => {
    if (!q) return PROFESION_PROFESIONAL_GRUPOS;
    return PROFESION_PROFESIONAL_GRUPOS.map(grupo => ({
      ...grupo,
      profesiones: grupo.profesiones.filter(p => {
        const texto = `${PROFESION_PROFESIONAL_LABEL[p]} ${p}`.toLowerCase();
        return texto.includes(q);
      })
    })).filter(g => g.profesiones.length > 0);
  }, [q]);

  return (
    <Field label={label} required={required}>
      <div className="relative mb-2">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-gray-medium pointer-events-none">
          <FaSearch aria-hidden />
        </span>
        <Input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar profesión..."
          className="pl-9"
          aria-label="Buscar profesión"
        />
      </div>
      <div
        className="rounded-lg border border-gray-200 max-h-52 overflow-y-auto bg-neutral-gray-light/30 divide-y divide-gray-100"
        role="listbox"
        aria-label="Lista de profesiones"
      >
        {gruposFiltrados.length === 0 ? (
          <p className="text-sm text-neutral-gray-medium p-3 text-center">
            Ninguna profesión coincide con la búsqueda.
          </p>
        ) : (
          gruposFiltrados.map(grupo => (
            <div key={grupo.label} className="p-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-gray-medium px-1 mb-1.5">
                {grupo.label}
              </p>
              <div className="space-y-1">
                {grupo.profesiones.map(profesion => {
                  const selected = value === profesion;
                  return (
                    <button
                      key={profesion}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => onChange(profesion)}
                      className={cn(
                        "w-full text-left text-sm px-3 py-2 rounded-md transition-colors",
                        selected
                          ? "bg-primary/15 text-primary-dark font-semibold ring-1 ring-primary/30"
                          : "hover:bg-white text-slate-700"
                      )}
                    >
                      {PROFESION_PROFESIONAL_LABEL[profesion]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
      {value && (
        <p className="text-xs text-neutral-gray-medium mt-1.5">
          Seleccionado: <strong>{PROFESION_PROFESIONAL_LABEL[value]}</strong>
        </p>
      )}
    </Field>
  );
}
