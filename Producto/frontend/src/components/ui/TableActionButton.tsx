import { cn } from "../../theme/cn";
import { useRoleTheme } from "../../context/RoleThemeContext";

type TableActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "danger";
};

export function TableActionButton({
  className,
  variant = "default",
  children,
  type = "button",
  ...props
}: TableActionButtonProps) {
  const theme = useRoleTheme();

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-lg",
        "border border-current bg-transparent transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "default" ? cn(theme.link, "hover:bg-black/5") : "text-status-error hover:bg-red-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
