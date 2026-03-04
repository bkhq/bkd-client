import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { Server } from '@/types/server';

interface ServerListProps {
  servers: Server[];
  onSelect: (server: Server) => void;
  onEdit: (server: Server) => void;
  onDelete: (server: Server) => void;
  onAdd: () => void;
}

export function ServerList({ servers, onSelect, onAdd }: ServerListProps) {
  return (
    <View style={styles.container}>
      <FlatList
        data={servers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => onSelect(item)}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.url}>{item.url}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        testID="add-server-button"
        style={styles.addButton}
        onPress={onAdd}
      >
        <Text style={styles.addText}>+ 添加服务器</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  item: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  url: {
    fontSize: 14,
    color: '#888888',
  },
  addButton: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b3b5c',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
});
