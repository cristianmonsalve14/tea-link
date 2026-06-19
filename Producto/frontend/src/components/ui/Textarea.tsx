import { forwardRef } from "react";
import { cn } from "../../theme/cn";
import { useRoleTheme } from "../../context/RoleThemeContext";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    const theme = useRoleTheme();
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full min-h-[3.5rem] max-h-48 px-4 py-2.5 rounded-lg border text-neutral-gray resize-y",
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
Textarea.displayName = "Textarea";
