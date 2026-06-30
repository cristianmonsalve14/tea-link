import { cn } from "../../theme/cn";

type ScrollableTableProps = {
  children: React.ReactNode;
  className?: string;
};

/** Contenedor de tabla con scroll horizontal en pantallas estrechas sin romper el layout. */
export function ScrollableTable({ children, className }: ScrollableTableProps) {
  return (
    <div className={cn("w-full min-w-0 overflow-x-auto touch-pan-x", className)}>
      {children}
    </div>
  );
}
