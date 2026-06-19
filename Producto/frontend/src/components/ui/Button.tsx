import { cn } from "../../theme/cn";
import { useRoleTheme } from "../../context/RoleThemeContext";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm min-h-9 rounded-lg",
  md: "px-5 py-2.5 text-sm min-h-touch rounded-xl font-semibold",
  lg: "px-6 py-3 text-base min-h-12 rounded-xl font-semibold"
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  fullWidth,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const theme = useRoleTheme();

  const variantClasses: Record<Variant, string> = {
    primary: cn(theme.btnPrimary, theme.btnPrimaryHover, "text-white shadow-sm"),
    secondary: "bg-neutral-gray-light text-neutral-gray hover:bg-gray-200",
    outline: cn(theme.btnOutline, "bg-transparent"),
    ghost: "bg-transparent text-neutral-gray hover:bg-neutral-gray-light",
    danger: "bg-status-error text-white hover:opacity-90"
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
