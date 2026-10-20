"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_THEME, THEMES, themeByName } from "@/lib/seed-data";

interface ThemeContextValue {
  themeName: string;
  setThemeName: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "themeset.theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeNameState] = useState(DEFAULT_THEME);

  // Restore the last-picked theme client-side only, to avoid an SSR/CSR
  // mismatch (localStorage isn't available during the server render).
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.some((t) => t.name === stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off hydration read, not a sync loop
      setThemeNameState(stored);
    }
  }, []);

  useEffect(() => {
    const accent = themeByName(themeName).accent;
    document.documentElement.style.setProperty("--acc", accent);
  }, [themeName]);

  const setThemeName = (name: string) => {
    setThemeNameState(name);
    window.localStorage.setItem(STORAGE_KEY, name);
  };

  const value = useMemo(() => ({ themeName, setThemeName }), [themeName]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
