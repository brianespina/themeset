"use client";

import { useTheme } from "./ThemeProvider";
import { THEMES } from "@/lib/seed-data";

export function PopularThemes() {
  const { themeName, setThemeName } = useTheme();

  return (
    <div className="grid grid-cols-7 gap-2.5">
      {THEMES.slice(0, 7).map((t) => {
        const selected = t.name === themeName;
        return (
          <button
            key={t.name}
            type="button"
            onClick={() => setThemeName(t.name)}
            className="border bg-surface px-3.5 pb-3.5 pt-4 text-left hover:border-border-hover"
            style={{ borderColor: selected ? "var(--acc)" : "#29292F" }}
          >
            <div className="flex gap-1.5">
              {t.swatch.map((hex, i) => (
                <span key={i} className="h-4 w-4" style={{ background: hex }} />
              ))}
            </div>
            <div className="mt-3 text-[13.5px] font-medium">{t.name}</div>
            <div className="mt-1 text-[10.5px] uppercase tracking-[0.16em] text-ink-muted">
              {t.count} sets
            </div>
          </button>
        );
      })}
    </div>
  );
}
