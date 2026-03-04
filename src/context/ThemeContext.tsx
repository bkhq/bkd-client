import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  toolbarBg: string;
  toolbarText: string;
  toolbarBorder: string;
  pillBg: string;
  statusBarStyle: 'light' | 'dark';
}

const LIGHT: ThemeColors = {
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#666666',
  border: '#e0e0e0',
  primary: '#3b82f6',
  toolbarBg: '#f5f5f5',
  toolbarText: '#333333',
  toolbarBorder: '#d0d0d0',
  pillBg: '#e8e8e8',
  statusBarStyle: 'dark',
};

const DARK: ThemeColors = {
  background: '#1a1a2e',
  surface: '#2a2a3e',
  text: '#ffffff',
  textSecondary: '#888888',
  border: '#3b3b5c',
  primary: '#3b82f6',
  toolbarBg: '#1a1a2e',
  toolbarText: '#ffffff',
  toolbarBorder: '#3b3b5c',
  pillBg: '#2a2a3e',
  statusBarStyle: 'light',
};

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  colors: DARK,
  isDark: true,
  setMode: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    (async () => {
      try {
        const row = await db.getFirstAsync<{ value: string }>(
          "SELECT value FROM settings WHERE key = 'theme'"
        );
        if (row) setModeState(row.value as ThemeMode);
      } catch {
        // table may not exist yet, use default
      }
    })();
  }, [db]);

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await db.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('theme', ?)",
        [newMode]
      );
    } catch {
      // ignore
    }
  }, [db]);

  // For 'system' mode, read directly from Appearance API (not affected by our override)
  const resolvedScheme = mode === 'system'
    ? (systemScheme ?? Appearance.getColorScheme() ?? 'light')
    : mode;
  const isDark = resolvedScheme === 'dark';
  const colors = isDark ? DARK : LIGHT;

  // Sync system UI (keyboard, alerts, action sheets) with our theme
  useEffect(() => {
    if (mode === 'system') {
      // Clear override so useColorScheme() follows the OS setting again
      Appearance.setColorScheme(null);
    } else {
      Appearance.setColorScheme(mode);
    }
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, colors, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
