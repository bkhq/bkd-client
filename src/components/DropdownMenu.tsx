import type { Server } from '@/types/server'
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface DropdownMenuProps {
  visible: boolean
  servers: Server[]
  currentServerId: string
  onSelectServer: (server: Server) => void
  onGoHome: () => void
  onClose: () => void
}

export function DropdownMenu({
  visible,
  servers,
  currentServerId,
  onSelectServer,
  onGoHome,
  onClose,
}: DropdownMenuProps) {
  const insets = useSafeAreaInsets()

  if (!visible)
    return null

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.menu, { top: insets.top + 48 }]}>
          {servers.map(server => (
            <TouchableOpacity
              key={server.id}
              style={[
                styles.menuItem,
                server.id === currentServerId && styles.menuItemActive,
              ]}
              onPress={() => {
                onSelectServer(server)
                onClose()
              }}
            >
              <Text
                style={[
                  styles.menuText,
                  server.id === currentServerId && styles.menuTextActive,
                ]}
                numberOfLines={1}
              >
                {server.name}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onGoHome()
              onClose()
            }}
          >
            <Text style={styles.menuText}>← 返回首页</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menu: {
    position: 'absolute',
    right: 12,
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  menuText: {
    color: '#ffffff',
    fontSize: 15,
  },
  menuTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#3b3b5c',
    marginVertical: 4,
  },
})
