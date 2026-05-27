import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import { ThemeMode, loadThemeMode, saveThemeMode } from "@/utils/storage";

interface ThemeContextValue {
  themeMode: ThemeMode;
  resolvedScheme: ColorSchemeName;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [resolvedScheme, setResolvedScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());
  const themeModeRef = useRef<ThemeMode>("system");

  useEffect(() => {
    let cancelled = false;

    loadThemeMode().then((mode) => {
      if (cancelled) return;
      themeModeRef.current = mode;
      setThemeModeState(mode);
      setResolvedScheme(mode === "system" ? Appearance.getColorScheme() : mode);
    });

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const currentMode = themeModeRef.current;
      setResolvedScheme(currentMode === "system" ? colorScheme : currentMode);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    themeModeRef.current = mode;
    setThemeModeState(mode);
    setResolvedScheme(mode === "system" ? Appearance.getColorScheme() : mode);
    await saveThemeMode(mode);
  }, []);

  const value = useMemo(
    () => ({ themeMode, resolvedScheme, setThemeMode }),
    [themeMode, resolvedScheme, setThemeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeProvider");
  return ctx;
}