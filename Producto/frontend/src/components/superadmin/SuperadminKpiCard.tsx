import { cn } from "../../theme/cn";

type Accent = "indigo" | "violet" | "amber" | "emerald" | "slate";

const accentStyles: Record<
  Accent,
  { card: string; icon: string; value: string; label: string; ring: string }
> = {
  indigo: {
    card: "bg-white border-indigo-100/80",
    icon: "bg-indigo-600 text-white shadow-indigo-200",
    value: "text-indigo-950",
    label: "text-indigo-600/80",
    ring: "hover:ring-indigo-200"
  },
  violet: {
    card: "bg-white border-violet-100/80",
    icon: "bg-violet-600 text-white shadow-violet-200",
    value: "text-violet-950",
    label: "text-violet-600/80",
    ring: "hover:ring-violet-200"
  },
  amber: {
    card: "bg-white border-amber-100/80",
    icon: "bg-amber-500 text-white shadow-amber-200",
    value: "text-amber-950",
    label: "text-amber-700/80",
    ring: "hover:ring-amber-200"
  },
  emerald: {
    card: "bg-white border-emerald-100/80",
    icon: "bg-emerald-600 text-white shadow-emerald-200",
    value: "text-emerald-950",
    label: "text-emerald-700/80",
    ring: "hover:ring-emerald-200"
  },
  slate: {
    card: "bg-white border-slate-200/80",
    icon: "bg-slate-700 text-white shadow-slate-200",
    value: "text-slate-900",
    label: "text-slate-500",
    ring: "hover:ring-slate-200"
  }
};

type Props = {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: Accent;
  subtitle?: string;
  onClick?: () => void;
  loading?: boolean;
};

export function SuperadminKpiCard({
  label,
  value,
  icon,
  accent = "indigo",
  subtitle,
  onClick,
  loading
}: Props) {
  const styles = accentStyles[accent];
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 text-left shadow-sm transition-all duration-200",
        styles.card,
        onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5 ring-1 ring-transparent",
        onClick && styles.ring
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={cn("text-xs font-semibold uppercase tracking-wider", styles.label)}>{label}</p>
          <p className={cn("text-3xl sm:text-4xl font-extrabold mt-2 tabular-nums", styles.value)}>
            {loading ? "—" : typeof value === "number" ? value.toLocaleString("es-CL") : value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1.5 font-medium">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-xl p-3 shadow-lg shrink-0", styles.icon)}>{icon}</div>
      </div>
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-linear-to-br from-white/0 to-slate-100/60 pointer-events-none" />
    </Comp>
  );
}
