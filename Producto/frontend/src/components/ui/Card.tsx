import { cn } from "../../theme/cn";
import { useRoleTheme } from "../../context/RoleThemeContext";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  action?: React.ReactNode;
  description?: string;
};

export function Card({ children, className, title, action, description }: CardProps) {
  const theme = useRoleTheme();
  return (
    <section
      className={cn(
        "bg-neutral-white rounded-2xl shadow-md p-4 sm:p-6 border",
        theme.accentBorder,
        className
      )}
    >
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          {title && (
            <h2 className={cn("text-xl font-semibold flex items-center gap-2", theme.accentText)}>
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {description && (
        <p className="text-sm text-neutral-gray-medium mb-4">{description}</p>
      )}
      {children}
    </section>
  );
}
