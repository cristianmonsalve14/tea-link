import { useCallback, useEffect, useState } from "react";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { RegionChileSelect } from "./RegionChileSelect";
import type { RegionChile } from "../../utils/regionChile";
import type { ErroresUbicacionInstitucion } from "../../utils/ubicacionChile";
import { fetchComunasPorRegion } from "../../utils/ubicacionChile";

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

  useEffect(() => {
    if (!value.region) {
      setComunas([]);
      return;
    }
    void cargarComunas(value.region);
  }, [value.region, cargarComunas]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <RegionChileSelect
        value={value.region}
        onChange={region => {
          onChange({ region, comuna: "", localidad: value.localidad });
        }}
        required={required}
        allowTodas={false}
        error={errors?.region}
      />
      <Field label="Comuna" required={required} error={errors?.comuna}>
        <Select
          value={value.comuna}
          onChange={e => onChange({ ...value, comuna: e.target.value })}
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
      <Field label="Localidad" required={required} error={errors?.localidad}>
        <Input
          value={value.localidad}
          onChange={e => onChange({ ...value, localidad: e.target.value })}
          placeholder="Ej.: centro, sector, pueblo o villa"
          maxLength={120}
          required={required}
          disabled={disabled}
          error={Boolean(errors?.localidad)}
        />
        {!errors?.localidad && (
          <p className="text-xs text-neutral-gray-medium mt-1">
            Población, sector o localidad dentro de la comuna (obligatorio para ubicar el centro en
            Chile).
          </p>
        )}
      </Field>
    </div>
  );
}
