import { useCallback, useEffect, useState } from "react";
import type { Accent, CardStyle, Density, Prefs, Theme } from "../types";

const STORAGE_KEY = "hangar-prefs";

const DEFAULT_PREFS: Prefs = {
  theme: "dark",
  accent: "neon",
  density: "comfortable",
  cardStyle: "minimal",
};

const THEMES: readonly Theme[] = ["dark", "light"];
const ACCENTS: readonly Accent[] = ["neon", "ember", "violet", "ice", "paper"];
const DENSITIES: readonly Density[] = ["comfortable", "compact"];
const CARD_STYLES: readonly CardStyle[] = ["minimal", "bordered", "glow"];

function read(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      theme: THEMES.includes(parsed.theme as Theme) ? (parsed.theme as Theme) : DEFAULT_PREFS.theme,
      accent: ACCENTS.includes(parsed.accent as Accent) ? (parsed.accent as Accent) : DEFAULT_PREFS.accent,
      density: DENSITIES.includes(parsed.density as Density) ? (parsed.density as Density) : DEFAULT_PREFS.density,
      cardStyle: CARD_STYLES.includes(parsed.cardStyle as CardStyle) ? (parsed.cardStyle as CardStyle) : DEFAULT_PREFS.cardStyle,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(read);

  // Persist + sync to body data-attrs (CSS reads these for theming).
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    const { dataset } = document.body;
    dataset.theme = prefs.theme;
    dataset.accent = prefs.accent;
    dataset.density = prefs.density;
    dataset.cardstyle = prefs.cardStyle;
  }, [prefs]);

  const setPref = useCallback(<K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  }, []);

  return [prefs, setPref] as const;
}
