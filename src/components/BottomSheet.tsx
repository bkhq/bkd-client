import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type ThemeMode } from '@/context/ThemeContext';
import type { Server } from '@/types/server';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'system', label: '跟随系统', icon: '📱' },
  { value: 'light', label: '浅色模式', icon: '☀️' },
  { value: 'dark', label: '深色模式', icon: '🌙' },
];

interface BottomSheetProps {
  visible: boolean;
  mode: 'servers' | 'menu';
  servers: Server[];
  currentServerId: string;
  currentUrl: string;
  debugMode: boolean;
  onSelectServer: (server: Server) => void;
  onToggleDebug: () => void;
  onGoHome: () => void;
  onClose: () => void;
}

export function BottomSheet({
  visible,
  mode,
  servers,
  currentServerId,
  currentUrl,
  debugMode,
  onSelectServer,
  onToggleDebug,
  onGoHome,
  onClose,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { mode: themeMode, colors, setMode } = useTheme();
  const [showTheme, setShowTheme] = useState(false);

  const handleSelect = useCallback((server: Server) => {
    onSelectServer(server);
    onClose();
  }, [onSelectServer, onClose]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        url: Platform.OS === 'ios' ? currentUrl : undefined,
        message: Platform.OS === 'android' ? currentUrl : undefined,
      });
    } catch {
      // cancelled
    }
    onClose();
  }, [currentUrl, onClose]);

  const handleClose = useCallback(() => {
    setShowTheme(false);
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, paddingBottom: insets.bottom > 0 ? insets.bottom : 16 },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Handle bar */}
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

          {mode === 'servers' ? (
            /* Server list mode */
            <ScrollView style={styles.serverList} bounces={false}>
              {servers.map((server) => (
                <TouchableOpacity
                  key={server.id}
                  style={[
                    styles.serverItem,
                    server.id === currentServerId && { backgroundColor: colors.primary + '20' },
                  ]}
                  onPress={() => handleSelect(server)}
                >
                  <Text style={styles.serverIcon}>🌐</Text>
                  <View style={styles.serverInfo}>
                    <Text
                      style={[
                        styles.serverName,
                        { color: colors.text },
                        server.id === currentServerId && { color: colors.primary },
                      ]}
                      numberOfLines={1}
                    >
                      {server.name}
                    </Text>
                    <Text style={[styles.serverUrl, { color: colors.textSecondary }]} numberOfLines={1}>
                      {server.url}
                    </Text>
                  </View>
                  {server.id === currentServerId && (
                    <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : showTheme ? (
            /* Theme settings sub-view */
            <>
              <TouchableOpacity
                style={styles.backRow}
                onPress={() => setShowTheme(false)}
              >
                <Text style={[styles.backArrow, { color: colors.primary }]}>‹</Text>
                <Text style={[styles.backText, { color: colors.primary }]}>返回</Text>
              </TouchableOpacity>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>主题设置</Text>
              {THEME_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.themeOption,
                    themeMode === opt.value && { backgroundColor: colors.primary + '20' },
                  ]}
                  onPress={() => setMode(opt.value)}
                >
                  <Text style={styles.themeIcon}>{opt.icon}</Text>
                  <Text style={[styles.themeLabel, { color: colors.text }]}>{opt.label}</Text>
                  {themeMode === opt.value && (
                    <Text style={[styles.themeCheck, { color: colors.primary }]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </>
          ) : (
            /* Menu grid mode */
            <>
              <View style={styles.grid}>
                <TouchableOpacity
                  style={styles.gridItem}
                  onPress={() => { onGoHome(); onClose(); }}
                >
                  <View style={[styles.gridIcon, { backgroundColor: colors.background }]}>
                    <Text style={styles.gridEmoji}>⌂</Text>
                  </View>
                  <Text style={[styles.gridLabel, { color: colors.text }]}>主页</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.gridItem}
                  onPress={() => setShowTheme(true)}
                >
                  <View style={[styles.gridIcon, { backgroundColor: colors.background }]}>
                    <Text style={styles.gridEmoji}>⚙️</Text>
                  </View>
                  <Text style={[styles.gridLabel, { color: colors.text }]}>设置</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.gridItem}
                  onPress={() => { onToggleDebug(); onClose(); }}
                >
                  <View style={[styles.gridIcon, { backgroundColor: debugMode ? colors.primary + '20' : colors.background }]}>
                    <Text style={styles.gridEmoji}>🔧</Text>
                  </View>
                  <Text style={[styles.gridLabel, { color: debugMode ? colors.primary : colors.text }]}>
                    Debug{debugMode ? ' ●' : ''}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.gridItem}
                  onPress={handleShare}
                >
                  <View style={[styles.gridIcon, { backgroundColor: colors.background }]}>
                    <Text style={styles.gridEmoji}>↗</Text>
                  </View>
                  <Text style={[styles.gridLabel, { color: colors.text }]}>分享</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    maxHeight: '60%',
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  /* Server list */
  serverList: {
    paddingHorizontal: 12,
  },
  serverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 10,
  },
  serverIcon: {
    fontSize: 20,
  },
  serverInfo: {
    flex: 1,
    gap: 2,
  },
  serverName: {
    fontSize: 15,
    fontWeight: '500',
  },
  serverUrl: {
    fontSize: 12,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '700',
  },
  /* Menu grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  gridItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  gridIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridEmoji: {
    fontSize: 24,
  },
  gridLabel: {
    fontSize: 12,
  },
  /* Theme sub-view */
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: '600',
  },
  backText: {
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginHorizontal: 12,
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
});
