import { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Platform,
  type GestureResponderEvent,
} from 'react-native';
import { WebView, type WebViewMessageEvent, type ShouldStartLoadRequest } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/context/ThemeContext';

// Only intercept OAuth providers that explicitly block WebView (popup/origin checks).
// Other auth pages (like login.gid.io) should stay in WebView so cookies work naturally.
const EXTERNAL_AUTH_PATTERNS = [
  'accounts.google.com',
  'appleid.apple.com',
  'github.com/login/oauth',
  'login.microsoftonline.com',
];

interface WebViewScreenProps {
  url: string;
  serverName?: string;
  debugMode?: boolean;
  onHomePress: () => void;
  onMorePress: () => void;
  onUrlPillSwipeUp?: () => void;
}

export function WebViewScreen({ url, serverName, debugMode = false, onHomePress, onMorePress, onUrlPillSwipeUp }: WebViewScreenProps) {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  // Sync when url prop changes (e.g., switching servers)
  useEffect(() => {
    setCurrentUrl(url);
    setHasError(false);
  }, [url]);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const handleReload = useCallback(() => {
    setHasError(false);
    setLoading(true);
    webViewRef.current?.reload();
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setLoading(false);
  }, []);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'console') {
        setConsoleLogs((prev) => [...prev.slice(-99), `[${data.level}] ${data.message}`]);
      }
    } catch {
      // ignore non-JSON messages
    }
  }, []);

  const handleExternalAuth = useCallback(async (authUrl: string) => {
    try {
      const callbackUrl = 'bkd://';
      const result = await WebBrowser.openAuthSessionAsync(authUrl, callbackUrl);
      if (result.type === 'success' || result.type === 'dismiss') {
        webViewRef.current?.reload();
      }
    } catch {
      webViewRef.current?.reload();
    }
  }, []);

  const handleShouldStartLoad = useCallback((request: ShouldStartLoadRequest) => {
    // Always allow Turnstile challenge frames and about: URLs
    if (
      request.url.startsWith('about:') ||
      request.url.includes('challenges.cloudflare.com')
    ) {
      return true;
    }
    const isAuthUrl = EXTERNAL_AUTH_PATTERNS.some((pattern) => request.url.includes(pattern));
    if (isAuthUrl && request.url !== url) {
      handleExternalAuth(request.url);
      return false;
    }
    return true;
  }, [url, handleExternalAuth]);

  // Inject script to capture console logs
  const injectedJS = `
    (function() {
      var origLog = console.log;
      var origWarn = console.warn;
      var origError = console.error;
      function send(level, args) {
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'console',
            level: level,
            message: Array.prototype.map.call(args, function(a) {
              return typeof a === 'object' ? JSON.stringify(a) : String(a);
            }).join(' ')
          }));
        } catch(e) {}
      }
      console.log = function() { send('log', arguments); origLog.apply(console, arguments); };
      console.warn = function() { send('warn', arguments); origWarn.apply(console, arguments); };
      console.error = function() { send('error', arguments); origError.apply(console, arguments); };
      window.onerror = function(msg, src, line, col, err) {
        send('error', [msg + ' at ' + src + ':' + line + ':' + col]);
      };
      window.onunhandledrejection = function(e) {
        send('error', ['Unhandled rejection: ' + (e.reason || e)]);
      };
    })();
    true;
  `;

  return (
    <View style={styles.container}>
      {/* Top safe area — use surface color to blend with web page */}
      <View style={{ height: insets.top, backgroundColor: colors.surface }} />

      {/* WebView or Error — takes full space */}
      {hasError ? (
        <View testID="error-view" style={styles.errorContainer}>
          <Text style={styles.errorText}>页面加载失败</Text>
          <Text style={styles.errorUrl}>{currentUrl}</Text>
          <TouchableOpacity
            testID="retry-button"
            style={styles.retryButton}
            onPress={handleReload}
          >
            <Text style={styles.retryText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          testID="webview"
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={handleError}
          onNavigationStateChange={(navState) => {
            if (navState.url) setCurrentUrl(navState.url);
          }}
          onMessage={handleMessage}
          injectedJavaScript={injectedJS}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          incognito={false}
          cacheEnabled
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          originWhitelist={['https://*', 'http://*', 'about:blank', 'about:srcdoc']}
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          startInLoadingState={false}
          allowsBackForwardNavigationGestures
          allowFileAccess
        />
      )}

      {/* Debug console — above toolbar */}
      {debugMode && (
        <View style={styles.debugPanel}>
          <View style={styles.debugHeader}>
            <Text style={styles.debugTitle}>Console ({consoleLogs.length})</Text>
            <TouchableOpacity onPress={() => setConsoleLogs([])}>
              <Text style={styles.debugClear}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.debugScroll}>
            {consoleLogs.length === 0 ? (
              <Text style={styles.debugEmpty}>No logs yet</Text>
            ) : (
              consoleLogs.map((log, i) => (
                <Text
                  key={i}
                  style={[
                    styles.debugLog,
                    log.startsWith('[error]') && styles.debugError,
                    log.startsWith('[warn]') && styles.debugWarn,
                  ]}
                  selectable
                >
                  {log}
                </Text>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* Bottom toolbar */}
      <View style={[styles.toolbar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8, backgroundColor: colors.toolbarBg, borderTopColor: colors.toolbarBorder }]}>
        <View style={styles.toolbarRow}>
          {/* Home */}
          <TouchableOpacity
            testID="home-button"
            style={[styles.iconButton, { backgroundColor: colors.pillBg }]}
            onPress={onHomePress}
          >
            <Text style={[styles.iconText, { color: colors.toolbarText }]}>⌂</Text>
          </TouchableOpacity>

          {/* URL pill — tap to open server list */}
          <TouchableOpacity
            style={[styles.urlPill, { backgroundColor: colors.pillBg }]}
            onPress={onUrlPillSwipeUp}
            activeOpacity={0.7}
          >
            <Text style={[styles.urlText, { color: colors.toolbarText }]} numberOfLines={1}>
              {serverName || (() => { try { return new URL(currentUrl).hostname; } catch { return currentUrl; } })()}
            </Text>
          </TouchableOpacity>

          {/* Refresh */}
          <TouchableOpacity
            testID="refresh-button"
            style={[styles.iconButton, { backgroundColor: colors.pillBg }]}
            onPress={handleReload}
          >
            <Text style={[styles.iconText, { color: colors.toolbarText }]}>↻</Text>
          </TouchableOpacity>

          {/* More */}
          <TouchableOpacity
            testID="menu-button"
            style={[styles.iconButton, { backgroundColor: colors.pillBg }]}
            onPress={onMorePress}
          >
            <Text style={[styles.iconText, { color: colors.toolbarText }]}>⋯</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading indicator */}
      {loading && !hasError && (
        <View style={styles.loadingCenter} pointerEvents="none">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  toolbar: {
    backgroundColor: '#f5f5f5',
    paddingLeft: 16,
    paddingRight: 24,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d0d0d0',
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  urlPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 44,
  },
  urlText: {
    fontSize: 15,
    fontWeight: '500',
  },
  webview: {
    flex: 1,
  },
  loadingCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 18,
    color: '#888888',
  },
  errorUrl: {
    fontSize: 14,
    color: '#555',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugPanel: {
    height: 200,
    backgroundColor: '#0d0d1a',
    borderTopWidth: 1,
    borderTopColor: '#3b3b5c',
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  debugTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  debugClear: {
    color: '#3b82f6',
    fontSize: 12,
  },
  debugScroll: {
    flex: 1,
    padding: 8,
  },
  debugEmpty: {
    color: '#555',
    fontSize: 12,
    fontStyle: 'italic',
  },
  debugLog: {
    color: '#ccc',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  debugError: {
    color: '#ff6b6b',
  },
  debugWarn: {
    color: '#ffa94d',
  },
});
