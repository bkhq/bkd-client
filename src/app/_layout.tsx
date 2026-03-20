import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { SQLiteProvider } from 'expo-sqlite'
import { StatusBar } from 'expo-status-bar'
import * as React from 'react'
import { Suspense, useCallback } from 'react'
import { Platform, ScrollView, Text, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'

// Prevent splash screen from auto-hiding before app is ready
SplashScreen.preventAutoHideAsync()

async function migrateDb(db: import('expo-sqlite').SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

function ThemedStatusBar() {
  const { colors } = useTheme()
  return (
    <StatusBar
      style={colors.statusBarStyle}
      translucent={Platform.OS === 'android'}
      backgroundColor="transparent"
    />
  )
}

function LoadingFallback() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
      <Text style={{ color: '#ffffff' }}>Loading...</Text>
    </View>
  )
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#1a1a2e', padding: 24, paddingTop: 80 }}>
          <Text style={{ color: '#ff6b6b', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
            Error
          </Text>
          <ScrollView>
            <Text style={{ color: '#ffffff', fontSize: 14 }} selectable>
              {this.state.error.message}
            </Text>
            <Text style={{ color: '#888', fontSize: 12, marginTop: 12 }} selectable>
              {this.state.error.stack}
            </Text>
          </ScrollView>
        </View>
      )
    }
    return this.props.children
  }
}

export default function RootLayout() {
  const onLayoutReady = useCallback(async () => {
    await SplashScreen.hideAsync()
  }, [])

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <Suspense fallback={<LoadingFallback />}>
          <SQLiteProvider
            databaseName="bkd.db"
            onInit={migrateDb}
            useSuspense
          >
            <ThemeProvider>
              <ThemedStatusBar />
              <View style={{ flex: 1 }} onLayout={onLayoutReady}>
                <Stack screenOptions={{ headerShown: false }} />
              </View>
            </ThemeProvider>
          </SQLiteProvider>
        </Suspense>
      </SafeAreaProvider>
    </ErrorBoundary>
  )
}
