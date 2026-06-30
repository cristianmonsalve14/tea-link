import { useState } from "react";
import { FaChevronDown, FaChevronUp, FaSearch, FaTimes } from "react-icons/fa";
import { cn } from "../../theme/cn";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export type FilterChip = {
  key: string;
  label: string;
};

type Props = {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  chips?: FilterChip[];
  onRemoveChip?: (key: string) => void;
  onClearAll?: () => void;
  filteredCount?: number;
  totalCount?: number;
  entityLabel?: string;
  advanced?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function SuperadminFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  chips = [],
  onRemoveChip,
  onClearAll,
  filteredCount,
  totalCount,
  entityLabel = "registros",
  advanced,
  actions,
  className
}: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const hasAdvanced = Boolean(advanced);
  const hasChips = chips.length > 0;
  const showStats =
    filteredCount != null && totalCount != null && (hasChips || (search?.trim() ?? ""));

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden",
        className
      )}
    >
      <div className="p-4 flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {onSearchChange != null && (
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <FaSearch aria-hidden />
              </span>
              <Input
                value={search ?? ""}
                onChange={e => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9 bg-slate-50/80 border-slate-200 focus:bg-white"
              />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {hasAdvanced && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdvancedOpen(v => !v)}
                className="border-slate-200 text-slate-700"
              >
                Filtros avanzados
                {advancedOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </Button>
            )}
            {hasChips && onClearAll && (
              <Button type="button" variant="ghost" size="sm" onClick={onClearAll}>
                Limpiar todo
              </Button>
            )}
            {actions}
          </div>
        </div>

        {hasChips && (
          <div className="flex flex-wrap gap-2">
            {chips.map(chip => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-100"
              >
                {chip.label}
                {onRemoveChip && (
                  <button
                    type="button"
                    onClick={() => onRemoveChip(chip.key)}
                    className="p-1 rounded-full hover:bg-indigo-100 transition-colors"
                    aria-label={`Quitar filtro ${chip.label}`}
                  >
                    <FaTimes size={10} />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {showStats && (
          <p className="text-xs text-slate-500 font-medium">
            Mostrando{" "}
            <span className="text-slate-800">{filteredCount!.toLocaleString("es-CL")}</span> de{" "}
            <span className="text-slate-800">{totalCount!.toLocaleString("es-CL")}</span> {entityLabel}
          </p>
        )}
      </div>

      {hasAdvanced && advancedOpen && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 bg-slate-50/50">
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-5 items-start">
            {advanced}
          </div>
        </div>
      )}
    </div>
  );
}
