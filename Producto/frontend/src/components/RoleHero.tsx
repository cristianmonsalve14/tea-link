import type { IconType } from "react-icons";
import { useRoleTheme } from "../context/RoleThemeContext";
import { cn } from "../theme/cn";
import type { RolPanelConfig } from "../config/rolPanelConfig";

type Props = {
  config: RolPanelConfig;
  icon: IconType;
};

export function RoleHero({ config, icon: Icon }: Props) {
  const theme = useRoleTheme();

  return (
    <section
      className={cn(
        "rounded-2xl border p-6 mb-6 shadow-sm",
        theme.accentBorder,
        theme.accentBgSubtle
      )}
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
        <div
          className={cn(
            "shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm",
            theme.btnPrimary,
            "text-white"
          )}
        >
          <Icon />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className={cn("text-xl font-bold", theme.accentTextStrong)}>
            {config.heroTitle}
          </h2>
          <p className="text-sm text-neutral-gray-medium mt-1">{config.heroSubtitle}</p>
          <ul className="mt-4 grid sm:grid-cols-3 gap-2">
            {config.features.map(f => (
              <li
                key={f}
                className={cn(
                  "text-xs font-medium px-3 py-2 rounded-lg border bg-neutral-white",
                  theme.accentBorder,
                  theme.accentText
                )}
              >
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
