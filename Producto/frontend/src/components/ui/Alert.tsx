import { cn } from "../../theme/cn";

type AlertVariant = "error" | "success" | "warning" | "info";

const variants: Record<AlertVariant, string> = {
  error: "text-status-error bg-red-50 border-red-200",
  success: "text-secondary-dark bg-secondary/10 border-secondary/30",
  warning: "text-amber-800 bg-amber-50 border-amber-200",
  info: "text-primary-dark bg-primary/5 border-primary/20"
};

export function Alert({
  variant = "error",
  children,
  className
}: {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-sm border rounded-lg px-3 py-2 mb-4",
        variants[variant],
        className
      )}
      role="alert"
    >
      {children}
    </div>
  );
}
