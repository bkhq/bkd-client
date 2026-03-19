import type { Server } from '@/types/server'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { useServers } from '@/hooks/useServers'
import * as database from '@/utils/database'

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: jest.fn(() => ({})),
}))

jest.mock('@/utils/database')

const mockDatabase = database as jest.Mocked<typeof database>

const mockServers: Server[] = [
  { id: '1', name: 'Server 1', url: 'https://s1.example.com', createdAt: 2000 },
  { id: '2', name: 'Server 2', url: 'https://s2.example.com', createdAt: 1000 },
]

beforeEach(() => {
  jest.clearAllMocks()
  mockDatabase.getServers.mockResolvedValue([])
})

describe('useServers', () => {
  it('loads servers on mount', async () => {
    mockDatabase.getServers.mockResolvedValue(mockServers)

    const { result } = renderHook(() => useServers())

    await waitFor(() => {
      expect(result.current.servers).toEqual(mockServers)
    })
  })

  it('starts with loading true then becomes false', async () => {
    const { result } = renderHook(() => useServers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('addServer adds a server and refreshes list', async () => {
    const newServer: Server = {
      id: '3',
      name: 'https://new.com',
      url: 'https://new.com',
      createdAt: 3000,
    }
    mockDatabase.addServer.mockResolvedValue(newServer)
    mockDatabase.getServers.mockResolvedValue([])

    const { result } = renderHook(() => useServers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    mockDatabase.getServers.mockResolvedValue([newServer])

    await act(async () => {
      await result.current.addServer('https://new.com')
    })

    expect(mockDatabase.addServer).toHaveBeenCalledWith(expect.anything(), 'https://new.com', undefined)
    expect(result.current.servers).toEqual([newServer])
  })

  it('addServer accepts optional name', async () => {
    const newServer: Server = {
      id: '3',
      name: 'My Server',
      url: 'https://new.com',
      createdAt: 3000,
    }
    mockDatabase.addServer.mockResolvedValue(newServer)
    mockDatabase.getServers
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([newServer])

    const { result } = renderHook(() => useServers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.addServer('https://new.com', 'My Server')
    })

    expect(mockDatabase.addServer).toHaveBeenCalledWith(expect.anything(), 'https://new.com', 'My Server')
  })

  it('updateServer updates and refreshes list', async () => {
    const updated: Server = {
      id: '1',
      name: 'Updated',
      url: 'https://s1.example.com',
      createdAt: 2000,
    }
    mockDatabase.updateServer.mockResolvedValue(updated)
    mockDatabase.getServers.mockResolvedValue(mockServers)

    const { result } = renderHook(() => useServers())

    await waitFor(() => {
      expect(result.current.servers).toEqual(mockServers)
    })

    mockDatabase.getServers.mockResolvedValue([updated, mockServers[1]])

    await act(async () => {
      await result.current.updateServer('1', { name: 'Updated' })
    })

    expect(mockDatabase.updateServer).toHaveBeenCalledWith(expect.anything(), '1', { name: 'Updated' })
    expect(result.current.servers[0].name).toBe('Updated')
  })

  it('removeServer removes and refreshes list', async () => {
    mockDatabase.removeServer.mockResolvedValue(undefined)
    mockDatabase.getServers.mockResolvedValue(mockServers)

    const { result } = renderHook(() => useServers())

    await waitFor(() => {
      expect(result.current.servers).toEqual(mockServers)
    })

    mockDatabase.getServers.mockResolvedValue([mockServers[1]])

    await act(async () => {
      await result.current.removeServer('1')
    })

    expect(mockDatabase.removeServer).toHaveBeenCalledWith(expect.anything(), '1')
    expect(result.current.servers).toEqual([mockServers[1]])
  })
})
