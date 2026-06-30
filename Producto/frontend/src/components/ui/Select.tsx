import { forwardRef } from "react";
import { cn } from "../../theme/cn";
import { useRoleTheme } from "../../context/RoleThemeContext";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    const theme = useRoleTheme();
    return (
      <select
        ref={ref}
        className={cn(
          "w-full min-h-touch px-3 py-2 rounded-lg border text-sm text-neutral-gray",
          "border-neutral-gray-medium bg-neutral-white",
          theme.inputFocus,
          error && "border-status-error",
          "disabled:bg-neutral-gray-light disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";
