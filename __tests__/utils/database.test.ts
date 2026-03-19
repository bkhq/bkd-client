import type { SQLiteDatabase } from 'expo-sqlite'
import type { Server } from '@/types/server'
import { addServer, getServers, removeServer, updateServer } from '@/utils/database'

const mockExecAsync = jest.fn()
const mockGetAllAsync = jest.fn()
const mockRunAsync = jest.fn()
const mockGetFirstAsync = jest.fn()

const mockDb = {
  execAsync: mockExecAsync,
  getAllAsync: mockGetAllAsync,
  runAsync: mockRunAsync,
  getFirstAsync: mockGetFirstAsync,
} as unknown as SQLiteDatabase

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getServers', () => {
  it('returns all servers ordered by createdAt desc', async () => {
    const mockRows: Server[] = [
      { id: '1', name: 'Server 1', url: 'https://s1.example.com', createdAt: 2000 },
      { id: '2', name: 'Server 2', url: 'https://s2.example.com', createdAt: 1000 },
    ]
    mockGetAllAsync.mockResolvedValue(mockRows)

    const result = await getServers(mockDb)

    expect(mockGetAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM servers'),
    )
    expect(result).toEqual(mockRows)
  })

  it('returns empty array when no servers exist', async () => {
    mockGetAllAsync.mockResolvedValue([])

    const result = await getServers(mockDb)

    expect(result).toEqual([])
  })
})

describe('addServer', () => {
  it('inserts a server with generated id and timestamp', async () => {
    const now = 1709520000000
    jest.spyOn(Date, 'now').mockReturnValue(now)
    mockGetFirstAsync.mockResolvedValue({
      id: 'generated-id',
      name: 'https://ai.fr.ds.cc',
      url: 'https://ai.fr.ds.cc',
      createdAt: now,
    })

    const result = await addServer(mockDb, 'https://ai.fr.ds.cc')

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO servers'),
      expect.arrayContaining([expect.any(String), 'https://ai.fr.ds.cc', 'https://ai.fr.ds.cc', now]),
    )
    expect(result.id).toBeDefined()
    expect(result.url).toBe('https://ai.fr.ds.cc')
  })

  it('uses custom name when provided', async () => {
    const now = 1709520000000
    jest.spyOn(Date, 'now').mockReturnValue(now)
    mockGetFirstAsync.mockResolvedValue({
      id: 'generated-id',
      name: 'My Server',
      url: 'https://ai.fr.ds.cc',
      createdAt: now,
    })

    const result = await addServer(mockDb, 'https://ai.fr.ds.cc', 'My Server')

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO servers'),
      expect.arrayContaining([expect.any(String), 'My Server', 'https://ai.fr.ds.cc', now]),
    )
    expect(result.name).toBe('My Server')
  })
})

describe('updateServer', () => {
  it('updates server name', async () => {
    mockGetFirstAsync.mockResolvedValue({
      id: '1',
      name: 'Updated Name',
      url: 'https://old.com',
      createdAt: 1000,
    })

    const result = await updateServer(mockDb, '1', { name: 'Updated Name' })

    expect(mockRunAsync).toHaveBeenCalled()
    expect(result.name).toBe('Updated Name')
  })

  it('updates server url', async () => {
    mockGetFirstAsync.mockResolvedValue({
      id: '1',
      name: 'Server',
      url: 'https://new.com',
      createdAt: 1000,
    })

    const result = await updateServer(mockDb, '1', { url: 'https://new.com' })

    expect(mockRunAsync).toHaveBeenCalled()
    expect(result.url).toBe('https://new.com')
  })

  it('throws when no fields to update', async () => {
    await expect(updateServer(mockDb, '1', {})).rejects.toThrow()
  })
})

describe('removeServer', () => {
  it('deletes a server by id', async () => {
    await removeServer(mockDb, '1')

    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM servers'),
      expect.arrayContaining(['1']),
    )
  })
})
