import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useServers } from '@/hooks/useServers';
import { WebViewScreen } from '@/components/WebViewScreen';
import { DropdownMenu } from '@/components/DropdownMenu';

export default function WebViewPage() {
  const { id, url } = useLocalSearchParams<{ id: string; url: string }>();
  const router = useRouter();
  const { servers } = useServers();

  const [currentUrl, setCurrentUrl] = useState(url ?? '');
  const [currentId, setCurrentId] = useState(id ?? '');
  const [menuVisible, setMenuVisible] = useState(false);

  const handleSelectServer = useCallback((server: typeof servers[number]) => {
    setCurrentUrl(server.url);
    setCurrentId(server.id);
  }, []);

  const handleGoHome = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.container}>
      <WebViewScreen
        url={currentUrl}
        onMenuPress={() => setMenuVisible(true)}
      />

      <DropdownMenu
        visible={menuVisible}
        servers={servers}
        currentServerId={currentId}
        onSelectServer={handleSelectServer}
        onGoHome={handleGoHome}
        onClose={() => setMenuVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
