import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useColorScheme } from "react-native";
import { darkColors, lightColors, ThemeColors } from "./tokens";
import { readJSON, StorageKeys, writeJSON } from "../services/storage";

export type AppThemeMode = "light" | "dark" | "system";

type ThemeContextValue = {
  mode: AppThemeMode;
  setMode: (mode: AppThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<AppThemeMode>("system");
  // Asenkron depolama okuması, kullanıcı bir tema seçtikten SONRA sonuçlanırsa
  // (örn. uygulama açılır açılmaz bir mod seçerse) bu bayrak, kullanıcının
  // taze seçimini eski/bayat kayıtlı değerin ezmesini engeller.
  const userChangedRef = useRef(false);

  useEffect(() => {
    readJSON<AppThemeMode>(StorageKeys.themeMode, "system").then((stored) => {
      if (!userChangedRef.current) setModeState(stored);
    });
  }, []);

  const setMode = (next: AppThemeMode) => {
    userChangedRef.current = true;
    setModeState(next);
    writeJSON(StorageKeys.themeMode, next);
  };

  const isDark = mode === "system" ? systemScheme === "dark" : mode === "dark";
  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({ mode, setMode, colors, isDark }),
    [mode, colors, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within ThemeProvider");
  return ctx;
}
