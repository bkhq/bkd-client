import { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useServers } from '@/hooks/useServers';
import { probeServer } from '@/utils/probe';
import { EmptyState } from '@/components/EmptyState';
import { ServerList } from '@/components/ServerList';
import { ServerForm } from '@/components/ServerForm';
import type { Server } from '@/types/server';

export default function HomeScreen() {
  const { servers, addServer, updateServer, removeServer } = useServers();
  const router = useRouter();

  const [formVisible, setFormVisible] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);

  const handleSelect = useCallback(async (server: Server) => {
    const result = await probeServer(server.url);
    if (result.ok) {
      router.push({
        pathname: '/webview',
        params: { id: server.id, url: server.url },
      });
    } else {
      Alert.alert('连接失败', `无法连接到 ${server.url}\n${result.error ?? ''}`, [
        { text: '确定' },
      ]);
    }
  }, [router]);

  const handleFormSubmit = useCallback((url: string, name: string) => {
    if (editingServer) {
      updateServer(editingServer.id, {
        url,
        name: name || url,
      });
    } else {
      addServer(url, name || undefined);
    }
    setFormVisible(false);
    setEditingServer(null);
  }, [editingServer, addServer, updateServer]);

  const handleEdit = useCallback((server: Server) => {
    setEditingServer(server);
    setFormVisible(true);
  }, []);

  const handleDelete = useCallback((server: Server) => {
    Alert.alert('删除服务器', `确定要删除 "${server.name}" 吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => removeServer(server.id),
      },
    ]);
  }, [removeServer]);

  const handleAdd = useCallback(() => {
    setEditingServer(null);
    setFormVisible(true);
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {servers.length === 0 ? (
          <EmptyState onAddServer={handleAdd} />
        ) : (
          <ServerList
            servers={servers}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
        )}
      </SafeAreaView>

      <ServerForm
        visible={formVisible}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setFormVisible(false);
          setEditingServer(null);
        }}
        initialUrl={editingServer?.url}
        initialName={editingServer?.name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  safe: {
    flex: 1,
  },
});
