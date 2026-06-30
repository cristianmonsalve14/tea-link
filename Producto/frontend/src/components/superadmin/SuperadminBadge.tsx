import { cn } from "../../theme/cn";

type Tone = "default" | "success" | "warning" | "info" | "neutral";

const toneClasses: Record<Tone, string> = {
  default: "bg-indigo-50 text-indigo-800 border-indigo-100",
  success: "bg-emerald-50 text-emerald-800 border-emerald-100",
  warning: "bg-amber-50 text-amber-900 border-amber-100",
  info: "bg-sky-50 text-sky-800 border-sky-100",
  neutral: "bg-slate-100 text-slate-700 border-slate-200"
};

type Props = {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
};

export function SuperadminBadge({ children, tone = "default", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
