import { initDatabase, getServers, addServer, updateServer, removeServer } from '@/utils/database';
import type { Server } from '@/types/server';

// Mock expo-sqlite
const mockExecSync = jest.fn();
const mockGetAllSync = jest.fn();
const mockRunSync = jest.fn();
const mockGetFirstSync = jest.fn();

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: mockExecSync,
    getAllSync: mockGetAllSync,
    runSync: mockRunSync,
    getFirstSync: mockGetFirstSync,
  })),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-001'),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('initDatabase', () => {
  it('creates servers table if not exists', () => {
    initDatabase();
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS servers')
    );
  });

  it('creates table with correct columns', () => {
    initDatabase();
    const sql = mockExecSync.mock.calls[0][0] as string;
    expect(sql).toContain('id TEXT PRIMARY KEY');
    expect(sql).toContain('name TEXT NOT NULL');
    expect(sql).toContain('url TEXT NOT NULL');
    expect(sql).toContain('createdAt INTEGER NOT NULL');
  });
});

describe('getServers', () => {
  it('returns all servers ordered by createdAt desc', () => {
    const mockRows: Server[] = [
      { id: '1', name: 'Server 1', url: 'https://s1.example.com', createdAt: 2000 },
      { id: '2', name: 'Server 2', url: 'https://s2.example.com', createdAt: 1000 },
    ];
    mockGetAllSync.mockReturnValue(mockRows);

    const result = getServers();

    expect(mockGetAllSync).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM servers')
    );
    expect(result).toEqual(mockRows);
  });

  it('returns empty array when no servers exist', () => {
    mockGetAllSync.mockReturnValue([]);

    const result = getServers();

    expect(result).toEqual([]);
  });
});

describe('addServer', () => {
  it('inserts a server with generated id and timestamp', () => {
    const now = 1709520000000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    mockGetFirstSync.mockReturnValue({
      id: 'test-uuid-001',
      name: 'https://ai.fr.ds.cc',
      url: 'https://ai.fr.ds.cc',
      createdAt: now,
    });

    const result = addServer('https://ai.fr.ds.cc');

    expect(mockRunSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO servers'),
      expect.arrayContaining(['test-uuid-001', 'https://ai.fr.ds.cc', 'https://ai.fr.ds.cc', now])
    );
    expect(result.id).toBe('test-uuid-001');
    expect(result.url).toBe('https://ai.fr.ds.cc');
  });

  it('uses custom name when provided', () => {
    const now = 1709520000000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    mockGetFirstSync.mockReturnValue({
      id: 'test-uuid-001',
      name: 'My Server',
      url: 'https://ai.fr.ds.cc',
      createdAt: now,
    });

    const result = addServer('https://ai.fr.ds.cc', 'My Server');

    expect(mockRunSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO servers'),
      expect.arrayContaining(['test-uuid-001', 'My Server', 'https://ai.fr.ds.cc', now])
    );
    expect(result.name).toBe('My Server');
  });
});

describe('updateServer', () => {
  it('updates server name', () => {
    mockGetFirstSync.mockReturnValue({
      id: '1',
      name: 'Updated Name',
      url: 'https://old.com',
      createdAt: 1000,
    });

    const result = updateServer('1', { name: 'Updated Name' });

    expect(mockRunSync).toHaveBeenCalled();
    expect(result.name).toBe('Updated Name');
  });

  it('updates server url', () => {
    mockGetFirstSync.mockReturnValue({
      id: '1',
      name: 'Server',
      url: 'https://new.com',
      createdAt: 1000,
    });

    const result = updateServer('1', { url: 'https://new.com' });

    expect(mockRunSync).toHaveBeenCalled();
    expect(result.url).toBe('https://new.com');
  });

  it('throws when no fields to update', () => {
    expect(() => updateServer('1', {})).toThrow();
  });
});

describe('removeServer', () => {
  it('deletes a server by id', () => {
    removeServer('1');

    expect(mockRunSync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM servers'),
      expect.arrayContaining(['1'])
    );
  });
});
