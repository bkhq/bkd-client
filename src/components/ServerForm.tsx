import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface ServerFormProps {
  visible: boolean;
  onSubmit: (url: string, name: string) => void;
  onCancel: () => void;
  initialUrl?: string;
  initialName?: string;
}

export function ServerForm({
  visible,
  onSubmit,
  onCancel,
  initialUrl = '',
  initialName = '',
}: ServerFormProps) {
  const { colors } = useTheme();
  const [url, setUrl] = useState(initialUrl || 'https://');
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (visible) {
      setUrl(initialUrl || 'https://');
      setName(initialName);
    }
  }, [visible, initialUrl, initialName]);

  const handleSubmit = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl || trimmedUrl === 'https://' || trimmedUrl === 'http://') {
      return;
    }
    onSubmit(trimmedUrl, name.trim());
    setUrl('https://');
    setName('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {initialUrl ? '编辑服务器' : '添加服务器'}
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="https://"
            placeholderTextColor={colors.textSecondary}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="名称（可选）"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />

          <View style={styles.actions}>
            <TouchableOpacity
              testID="cancel-button"
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>取消</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="submit-button"
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitText}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 24,
  },
  container: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#3b3b5c',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b3b5c',
    alignItems: 'center',
  },
  cancelText: {
    color: '#888888',
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
