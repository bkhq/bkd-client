import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { Server } from '@/types/server';
import { useTheme } from '@/context/ThemeContext';

interface ServerListProps {
  servers: Server[];
  onSelect: (server: Server) => void;
  onEdit: (server: Server) => void;
  onDelete: (server: Server) => void;
  onAdd: () => void;
}

export function ServerList({ servers, onSelect, onEdit, onDelete, onAdd }: ServerListProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <FlatList
        data={servers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, { backgroundColor: colors.surface }]}
            onPress={() => onSelect(item)}
            onLongPress={() => onDelete(item)}
          >
            <View style={styles.itemHeader}>
              <View style={styles.itemInfo}>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.url, { color: colors.textSecondary }]}>{item.url}</Text>
              </View>
              <TouchableOpacity
                style={[styles.editButton, { borderColor: colors.border }]}
                onPress={() => onEdit(item)}
              >
                <Text style={[styles.editText, { color: colors.primary }]}>编辑</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        testID="add-server-button"
        style={[styles.addButton, { borderColor: colors.border }]}
        onPress={onAdd}
      >
        <Text style={[styles.addText, { color: colors.primary }]}>+ 添加服务器</Text>
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
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
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
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3b3b5c',
  },
  editText: {
    color: '#3b82f6',
    fontSize: 14,
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
