import type { ReactNode } from 'react'
import { useSQLiteContext } from 'expo-sqlite'
import { createContext, use, useCallback, useEffect, useState } from 'react'
import { Appearance, useColorScheme } from 'react-native'

export type ThemeMode = 'system' | 'light' | 'dark'

interface ThemeColors {
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  primary: string
  toolbarBg: string
  toolbarText: string
  toolbarBorder: string
  pillBg: string
  statusBarStyle: 'light' | 'dark'
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
}

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
}

interface ThemeContextValue {
  mode: ThemeMode
  colors: ThemeColors
  isDark: boolean
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  colors: DARK,
  isDark: true,
  setMode: () => {},
})

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return use(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext()
  const systemScheme = useColorScheme()
  const [mode, setMode] = useState<ThemeMode>('system')

  useEffect(() => {
    (async () => {
      try {
        const row = await db.getFirstAsync<{ value: string }>(
          'SELECT value FROM settings WHERE key = \'theme\'',
        )
        if (row)
          setMode(row.value as ThemeMode)
      }
      catch {
        // table may not exist yet, use default
      }
    })()
  }, [db])

  const persistMode = useCallback(async (newMode: ThemeMode) => {
    setMode(newMode)
    try {
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (\'theme\', ?)',
        [newMode],
      )
    }
    catch {
      // ignore
    }
  }, [db])

  // For 'system' mode, read directly from Appearance API (not affected by our override)
  const resolvedScheme = mode === 'system'
    ? (systemScheme ?? Appearance.getColorScheme() ?? 'light')
    : mode
  const isDark = resolvedScheme === 'dark'
  const colors = isDark ? DARK : LIGHT

  // Sync system UI (keyboard, alerts, action sheets) with our theme
  useEffect(() => {
    if (mode === 'system') {
      // Clear override so useColorScheme() follows the OS setting again
      Appearance.setColorScheme(null as unknown as 'light' | 'dark')
    }
    else {
      Appearance.setColorScheme(mode)
    }
  }, [mode])

  return (
    <ThemeContext value={{ mode, colors, isDark, setMode: persistMode }}>
      {children}
    </ThemeContext>
  )
}
