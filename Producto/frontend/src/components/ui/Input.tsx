import { forwardRef } from "react";
import { cn } from "../../theme/cn";
import { useRoleTheme } from "../../context/RoleThemeContext";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    const theme = useRoleTheme();
    return (
      <input
        ref={ref}
        className={cn(
          "w-full min-h-touch px-4 py-2.5 rounded-lg border text-neutral-gray",
          "border-neutral-gray-medium bg-neutral-white placeholder:text-neutral-gray-medium/80",
          theme.inputFocus,
          error && "border-status-error focus:border-status-error focus:ring-status-error/20",
          "disabled:bg-neutral-gray-light disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
