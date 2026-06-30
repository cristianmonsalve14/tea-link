import { Field } from "../ui/Field";
import { Select } from "../ui/Select";
import { REGIONES_CHILE_GRUPOS, etiquetaRegionChile } from "../../utils/regionChile";
import type { RegionChile } from "../../utils/regionChile";

type Props = {
  value: RegionChile | "";
  onChange: (value: RegionChile | "") => void;
  label?: string;
  required?: boolean;
  allowTodas?: boolean;
  error?: string;
};

export function RegionChileSelect({
  value,
  onChange,
  label = "Región",
  required = false,
  allowTodas = true,
  error
}: Props) {
  return (
    <Field label={label} required={required} error={error}>
      <Select
        value={value}
        onChange={e => onChange(e.target.value as RegionChile | "")}
        required={required}
      >
        {allowTodas && <option value="">Todas las regiones</option>}
        {!allowTodas && <option value="">Seleccione región...</option>}
        {REGIONES_CHILE_GRUPOS.map(grupo => (
          <optgroup key={grupo.label} label={grupo.label}>
            {grupo.regiones.map(region => (
              <option key={region} value={region}>
                {etiquetaRegionChile(region)}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
    </Field>
  );
}
