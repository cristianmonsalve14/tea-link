import { useCallback, useEffect, useState } from "react";
import { Field } from "../ui/Field";
import { Select } from "../ui/Select";
import { RegionChileSelect } from "./RegionChileSelect";
import type { RegionChile } from "../../utils/regionChile";
import type { ErroresUbicacionInstitucion } from "../../utils/ubicacionChile";
import { fetchComunasPorRegion, fetchLocalidadesPorComuna } from "../../utils/ubicacionChile";

export type UbicacionInstitucionValue = {
  region: RegionChile | "";
  comuna: string;
  localidad: string;
};

type Props = {
  value: UbicacionInstitucionValue;
  onChange: (value: UbicacionInstitucionValue) => void;
  required?: boolean;
  disabled?: boolean;
  errors?: ErroresUbicacionInstitucion;
  onComunasLoaded?: (comunas: string[]) => void;
};

export function UbicacionInstitucionFields({
  value,
  onChange,
  required = true,
  disabled = false,
  errors,
  onComunasLoaded
}: Props) {
  const [comunas, setComunas] = useState<string[]>([]);
  const [loadingComunas, setLoadingComunas] = useState(false);
  const [errorComunas, setErrorComunas] = useState<string | null>(null);
  const [localidades, setLocalidades] = useState<string[]>([]);
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);
  const [errorLocalidades, setErrorLocalidades] = useState<string | null>(null);

  const cargarComunas = useCallback(async (region: RegionChile) => {
    setLoadingComunas(true);
    setErrorComunas(null);
    try {
      const lista = await fetchComunasPorRegion(region);
      setComunas(lista);
      onComunasLoaded?.(lista);
    } catch {
      setComunas([]);
      setErrorComunas("No se pudieron cargar las comunas de la región.");
    } finally {
      setLoadingComunas(false);
    }
  }, [onComunasLoaded]);

  const cargarLocalidades = useCallback(async (region: RegionChile, comuna: string) => {
    setLoadingLocalidades(true);
    setErrorLocalidades(null);
    try {
      const lista = await fetchLocalidadesPorComuna(region, comuna);
      setLocalidades(lista);
      return lista;
    } catch {
      setLocalidades([]);
      setErrorLocalidades("No se pudieron cargar las localidades de la comuna.");
      return [];
    } finally {
      setLoadingLocalidades(false);
    }
  }, []);

  useEffect(() => {
    if (!value.region) {
      setComunas([]);
      return;
    }
    void cargarComunas(value.region);
  }, [value.region, cargarComunas]);

  useEffect(() => {
    if (!value.region || !value.comuna) {
      setLocalidades([]);
      return;
    }
    let cancelled = false;
    void cargarLocalidades(value.region, value.comuna).then(lista => {
      if (cancelled) return;
      if (lista.length === 0 && value.localidad) {
        onChange({ ...value, localidad: "" });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [value.region, value.comuna, cargarLocalidades]);

  const mostrarLocalidad = Boolean(
    value.comuna && (loadingLocalidades || localidades.length > 0)
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <RegionChileSelect
        value={value.region}
        onChange={region => {
          onChange({ region, comuna: "", localidad: "" });
        }}
        required={required}
        allowTodas={false}
        error={errors?.region}
      />
      <Field label="Comuna" required={required} error={errors?.comuna}>
        <Select
          value={value.comuna}
          onChange={e => onChange({ ...value, comuna: e.target.value, localidad: "" })}
          required={required}
          disabled={disabled || !value.region || loadingComunas}
        >
          <option value="">
            {!value.region
              ? "Seleccione una región primero"
              : loadingComunas
                ? "Cargando comunas..."
                : "Seleccione comuna..."}
          </option>
          {comunas.map(comuna => (
            <option key={comuna} value={comuna}>
              {comuna}
            </option>
          ))}
        </Select>
        {errorComunas && (
          <p className="text-xs text-red-600 mt-1">{errorComunas}</p>
        )}
      </Field>
      {mostrarLocalidad && (
        <Field label="Localidad" error={errors?.localidad}>
          <Select
            value={value.localidad}
            onChange={e => onChange({ ...value, localidad: e.target.value })}
            disabled={disabled || loadingLocalidades}
            className="max-h-48"
          >
            <option value="">
              {loadingLocalidades ? "Cargando localidades..." : "Sin localidad (opcional)"}
            </option>
            {localidades.map(localidad => (
              <option key={localidad} value={localidad}>
                {localidad}
              </option>
            ))}
          </Select>
          {errorLocalidades && (
            <p className="text-xs text-red-600 mt-1">{errorLocalidades}</p>
          )}
          {!errors?.localidad && !errorLocalidades && (
            <p className="text-xs text-neutral-gray-medium mt-1">
              Opcional. Lista según establecimientos del catálogo oficial en esta comuna.
            </p>
          )}
        </Field>
      )}
    </div>
  );
}
