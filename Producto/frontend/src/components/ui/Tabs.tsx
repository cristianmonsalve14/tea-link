import { cn } from "../../theme/cn";
import { useRoleTheme } from "../../context/RoleThemeContext";

export type TabItem<T extends string> = {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
};

type TabsProps<T extends string> = {
  items: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
  /** Pill style (admin) vs underline (observaciones) */
  variant?: "pills" | "underline";
};

export function Tabs<T extends string>({
  items,
  active,
  onChange,
  className,
  variant = "underline"
}: TabsProps<T>) {
  const theme = useRoleTheme();

  if (variant === "pills") {
    return (
      <div className={cn("flex flex-wrap gap-2 mb-6", className)}>
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors",
              active === item.id
                ? cn(theme.btnPrimary, "text-white shadow-sm")
                : cn(theme.btnOutline, "bg-neutral-white")
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 mb-6 border-b pb-px",
        theme.accentBorder,
        className
      )}
    >
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "flex items-center gap-2 px-3 sm:px-4 py-2.5 font-semibold border-b-2 -mb-px transition-colors text-sm sm:text-base",
            active === item.id ? theme.tabActive : theme.tabInactive
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
