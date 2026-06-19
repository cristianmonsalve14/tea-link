import { createContext, useContext, type ReactNode } from "react";
import { resolveRoleTheme, type RoleTheme } from "../theme/roleTheme";

const RoleThemeContext = createContext<RoleTheme>(resolveRoleTheme(null));

export function RoleThemeProvider({
  rol,
  children
}: {
  rol: string | null | undefined;
  children: ReactNode;
}) {
  const theme = resolveRoleTheme(rol);
  return (
    <RoleThemeContext.Provider value={theme}>{children}</RoleThemeContext.Provider>
  );
}

export function useRoleTheme(): RoleTheme {
  return useContext(RoleThemeContext);
}
