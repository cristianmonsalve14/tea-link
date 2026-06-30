import { useCallback, useEffect, useState } from "react";
import { Field } from "../ui/Field";
import { Select } from "../ui/Select";
import type { RegionChile } from "../../utils/regionChile";
import { fetchComunasPorRegion } from "../../utils/ubicacionChile";

type Props = {
  region: RegionChile | "";
  value: string;
  onChange: (comuna: string) => void;
  label?: string;
};

export function ComunaChileSelect({
  region,
  value,
  onChange,
  label = "Comuna"
}: Props) {
  const [comunas, setComunas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async (r: RegionChile) => {
    setLoading(true);
    try {
      setComunas(await fetchComunasPorRegion(r));
    } catch {
      setComunas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!region) {
      setComunas([]);
      return;
    }
    void cargar(region);
  }, [region, cargar]);

  return (
    <Field label={label}>
      <Select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={!region || loading}
      >
        <option value="">
          {!region ? "Seleccione región primero" : loading ? "Cargando..." : "Todas las comunas"}
        </option>
        {comunas.map(c => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
    </Field>
  );
}
