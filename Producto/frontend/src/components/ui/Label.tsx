import { cn } from "../../theme/cn";
import { useRoleTheme } from "../../context/RoleThemeContext";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export function Label({ className, children, required, ...props }: LabelProps) {
  const theme = useRoleTheme();
  return (
    <label
      className={cn(
        "block text-sm font-semibold mb-1",
        theme.accentText,
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-status-error ml-0.5">*</span>}
    </label>
  );
}
