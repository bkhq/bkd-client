import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WebViewScreenProps {
  url: string;
  onMenuPress: () => void;
}

export function WebViewScreen({ url, onMenuPress }: WebViewScreenProps) {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const insets = useSafeAreaInsets();

  const handleReload = useCallback(() => {
    setHasError(false);
    setLoading(true);
    webViewRef.current?.reload();
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setLoading(false);
  }, []);

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={[styles.toolbar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          testID="refresh-button"
          style={styles.toolbarButton}
          onPress={handleReload}
        >
          <Text style={styles.toolbarIcon}>↻</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="menu-button"
          style={styles.toolbarButton}
          onPress={onMenuPress}
        >
          <Text style={styles.toolbarIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* WebView or Error */}
      {hasError ? (
        <View testID="error-view" style={styles.errorContainer}>
          <Text style={styles.errorText}>页面加载失败</Text>
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
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          startInLoadingState={false}
        />
      )}

      {/* Loading overlay */}
      {loading && !hasError && (
        <View style={styles.loadingOverlay}>
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 4,
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  toolbarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarIcon: {
    color: '#ffffff',
    fontSize: 20,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#888888',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
