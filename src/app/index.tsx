import type { ThemeMode } from '@/context/ThemeContext'
import type { Server } from '@/types/server'
import Constants from 'expo-constants'
import * as Updates from 'expo-updates'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BottomSheet } from '@/components/BottomSheet'
import { EmptyState } from '@/components/EmptyState'
import { ServerForm } from '@/components/ServerForm'
import { ServerList } from '@/components/ServerList'
import { WebViewScreen } from '@/components/WebViewScreen'
import { useTheme } from '@/context/ThemeContext'
import { useServers } from '@/hooks/useServers'

const THEME_OPTIONS: { value: ThemeMode, label: string, icon: string }[] = [
  { value: 'system', label: '跟随系统', icon: '📱' },
  { value: 'light', label: '浅色模式', icon: '☀️' },
  { value: 'dark', label: '深色模式', icon: '🌙' },
]

export default function HomeScreen() {
  const { servers, addServer, updateServer, removeServer } = useServers()
  const { mode, colors, setMode } = useTheme()

  // Home UI state
  const [formVisible, setFormVisible] = useState(false)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [editingServer, setEditingServer] = useState<Server | null>(null)

  // OTA update state
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'downloading' | 'ready' | 'error'>('idle')
  const [updateMessage, setUpdateMessage] = useState('')

  const handleCheckUpdate = useCallback(async () => {
    try {
      setUpdateStatus('checking')
      setUpdateMessage('Checking for updates...')
      const check = await Updates.checkForUpdateAsync()
      if (check.isAvailable) {
        setUpdateStatus('downloading')
        setUpdateMessage('Downloading update...')
        await Updates.fetchUpdateAsync()
        setUpdateStatus('ready')
        setUpdateMessage('Update ready! Restart to apply.')
      }
      else {
        setUpdateStatus('idle')
        setUpdateMessage('Already up to date.')
        setTimeout(setUpdateMessage, 3000, '')
      }
    }
    catch (e) {
      setUpdateStatus('error')
      setUpdateMessage(`Error: ${e instanceof Error ? e.message : String(e)}`)
    }
  }, [])

  const handleApplyUpdate = useCallback(async () => {
    await Updates.reloadAsync()
  }, [])

  // WebView state — once set, WebView stays mounted
  const [activeUrl, setActiveUrl] = useState<string | null>(null)
  const [activeServerName, setActiveServerName] = useState<string | null>(null)
  const [activeServerId, setActiveServerId] = useState<string | null>(null)
  const [showHome, setShowHome] = useState(true)
  const [debugMode, setDebugMode] = useState(false)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [sheetMode, setSheetMode] = useState<'servers' | 'menu'>('servers')

  // --- Home handlers ---

  const handleSelect = useCallback((server: Server) => {
    setActiveUrl(server.url)
    setActiveServerName(server.name)
    setActiveServerId(server.id)
    setShowHome(false)
  }, [])

  const handleFormSubmit = useCallback(async (url: string, name: string) => {
    try {
      if (editingServer) {
        await updateServer(editingServer.id, { url, name: name || url })
      }
      else {
        await addServer(url, name || undefined)
      }
      setFormVisible(false)
      setEditingServer(null)
    }
    catch (e) {
      Alert.alert('错误', String(e))
    }
  }, [editingServer, addServer, updateServer])

  const handleEdit = useCallback((server: Server) => {
    setEditingServer(server)
    setFormVisible(true)
  }, [])

  const handleDelete = useCallback((server: Server) => {
    Alert.alert('删除服务器', `确定要删除 "${server.name}" 吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => removeServer(server.id),
      },
    ])
  }, [removeServer])

  const handleAdd = useCallback(() => {
    setEditingServer(null)
    setFormVisible(true)
  }, [])

  // --- WebView handlers ---

  const handleGoHome = useCallback(() => {
    setShowHome(true)
  }, [])

  const handleSwitchServer = useCallback((server: Server) => {
    setActiveUrl(server.url)
    setActiveServerName(server.name)
    setActiveServerId(server.id)
    setShowHome(false)
  }, [])

  const openServers = useCallback(() => {
    setSheetMode('servers')
    setSheetVisible(true)
  }, [])

  const openMenu = useCallback(() => {
    setSheetMode('menu')
    setSheetVisible(true)
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* WebView layer — stays mounted once activated */}
      {activeUrl && (
        <View style={[StyleSheet.absoluteFill, { zIndex: showHome ? 0 : 1 }]} pointerEvents={showHome ? 'none' : 'auto'}>
          <WebViewScreen
            url={activeUrl}
            serverName={activeServerName ?? undefined}
            debugMode={debugMode}
            onHomePress={handleGoHome}
            onMorePress={openMenu}
            onUrlPillSwipeUp={openServers}
          />
        </View>
      )}

      {/* Home layer — overlays WebView when visible */}
      {showHome && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 2, backgroundColor: colors.background }]}>
          <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>BKD</Text>
              <TouchableOpacity
                testID="settings-button"
                style={[styles.settingsButton, { backgroundColor: colors.surface }]}
                onPress={() => setSettingsVisible(true)}
              >
                <Text style={styles.settingsIcon}>⚙️</Text>
              </TouchableOpacity>
            </View>

            {servers.length === 0
              ? (
                  <EmptyState onAddServer={handleAdd} />
                )
              : (
                  <ServerList
                    servers={servers}
                    onSelect={handleSelect}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAdd={handleAdd}
                  />
                )}
          </SafeAreaView>

          {/* Settings sheet (home) */}
          <Modal visible={settingsVisible} transparent animationType="slide" onRequestClose={() => setSettingsVisible(false)}>
            <TouchableOpacity
              style={styles.settingsOverlay}
              activeOpacity={1}
              onPress={() => setSettingsVisible(false)}
            >
              <View style={[styles.settingsSheet, { backgroundColor: colors.surface }]}>
                <View style={styles.settingsHandle} />
                <Text style={[styles.settingsTitle, { color: colors.text }]}>Settings</Text>

                {/* Theme section */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Theme</Text>
                {THEME_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.themeOption,
                      mode === opt.value && { backgroundColor: `${colors.primary}20` },
                    ]}
                    onPress={() => setMode(opt.value)}
                  >
                    <Text style={styles.themeIcon}>{opt.icon}</Text>
                    <Text style={[styles.themeLabel, { color: colors.text }]}>{opt.label}</Text>
                    {mode === opt.value && (
                      <Text style={[styles.themeCheck, { color: colors.primary }]}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}

                {/* Update section */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>Update</Text>
                <View style={styles.updateSection}>
                  {updateStatus === 'ready'
                    ? (
                        <TouchableOpacity
                          style={[styles.updateButton, { backgroundColor: '#22c55e' }]}
                          onPress={handleApplyUpdate}
                        >
                          <Text style={styles.updateButtonText}>Restart to Apply</Text>
                        </TouchableOpacity>
                      )
                    : (
                        <TouchableOpacity
                          style={[styles.updateButton, { backgroundColor: colors.primary, opacity: updateStatus === 'checking' || updateStatus === 'downloading' ? 0.6 : 1 }]}
                          onPress={handleCheckUpdate}
                          disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
                        >
                          {(updateStatus === 'checking' || updateStatus === 'downloading')
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.updateButtonText}>Check for Updates</Text>}
                        </TouchableOpacity>
                      )}
                  {updateMessage
                    ? (
                        <Text style={[styles.updateMessage, { color: updateStatus === 'error' ? '#ef4444' : colors.textSecondary }]}>
                          {updateMessage}
                        </Text>
                      )
                    : null}
                  {Updates.updateId
                    ? (
                        <Text style={[styles.updateInfo, { color: colors.textSecondary }]}>
                          {`OTA: ${Updates.updateId.slice(0, 8)}`}
                        </Text>
                      )
                    : null}
                </View>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Version info */}
          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>
              {`v${Constants.expoConfig?.version ?? '?'} build ${Constants.expoConfig?.extra?.buildNumber ?? '?'} (${Constants.expoConfig?.extra?.commitHash ?? '?'})`}
            </Text>
          </View>

          <ServerForm
            visible={formVisible}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setFormVisible(false)
              setEditingServer(null)
            }}
            initialUrl={editingServer?.url}
            initialName={editingServer?.name}
          />
        </View>
      )}

      {/* BottomSheet for WebView (servers / menu) */}
      <BottomSheet
        visible={sheetVisible}
        mode={sheetMode}
        servers={servers}
        currentServerId={activeServerId ?? ''}
        currentUrl={activeUrl ?? ''}
        debugMode={debugMode}
        onSelectServer={handleSwitchServer}
        onToggleDebug={() => setDebugMode(prev => !prev)}
        onGoHome={handleGoHome}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  settingsSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  settingsHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#555',
    alignSelf: 'center',
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 12,
  },
  themeIcon: {
    fontSize: 20,
  },
  themeLabel: {
    flex: 1,
    fontSize: 16,
  },
  themeCheck: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  updateSection: {
    paddingHorizontal: 12,
    gap: 8,
  },
  updateButton: {
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  updateMessage: {
    fontSize: 12,
    textAlign: 'center',
  },
  updateInfo: {
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.6,
  },
  versionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 11,
    opacity: 0.6,
  },
})
