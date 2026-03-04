import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface EmptyStateProps {
  onAddServer: () => void;
}

export function EmptyState({ onAddServer }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BitK</Text>
      <Text style={styles.subtitle}>尚未添加服务器</Text>
      <TouchableOpacity
        testID="add-server-button"
        style={styles.button}
        onPress={onAddServer}
      >
        <Text style={styles.buttonText}>+ 添加服务器</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
