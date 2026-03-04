import { renderHook, act } from '@testing-library/react-native';
import { useServers } from '@/hooks/useServers';
import * as database from '@/utils/database';
import type { Server } from '@/types/server';

jest.mock('@/utils/database');

const mockDatabase = database as jest.Mocked<typeof database>;

const mockServers: Server[] = [
  { id: '1', name: 'Server 1', url: 'https://s1.example.com', createdAt: 2000 },
  { id: '2', name: 'Server 2', url: 'https://s2.example.com', createdAt: 1000 },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockDatabase.getServers.mockReturnValue([]);
});

describe('useServers', () => {
  it('initializes database and loads servers on mount', () => {
    mockDatabase.getServers.mockReturnValue(mockServers);

    const { result } = renderHook(() => useServers());

    expect(mockDatabase.initDatabase).toHaveBeenCalled();
    expect(result.current.servers).toEqual(mockServers);
  });

  it('starts with loading false after init', () => {
    const { result } = renderHook(() => useServers());

    expect(result.current.loading).toBe(false);
  });

  it('addServer adds a server and refreshes list', () => {
    const newServer: Server = {
      id: '3',
      name: 'https://new.com',
      url: 'https://new.com',
      createdAt: 3000,
    };
    mockDatabase.addServer.mockReturnValue(newServer);
    mockDatabase.getServers
      .mockReturnValueOnce([])
      .mockReturnValueOnce([newServer]);

    const { result } = renderHook(() => useServers());

    act(() => {
      result.current.addServer('https://new.com');
    });

    expect(mockDatabase.addServer).toHaveBeenCalledWith('https://new.com', undefined);
    expect(result.current.servers).toEqual([newServer]);
  });

  it('addServer accepts optional name', () => {
    const newServer: Server = {
      id: '3',
      name: 'My Server',
      url: 'https://new.com',
      createdAt: 3000,
    };
    mockDatabase.addServer.mockReturnValue(newServer);
    mockDatabase.getServers
      .mockReturnValueOnce([])
      .mockReturnValueOnce([newServer]);

    const { result } = renderHook(() => useServers());

    act(() => {
      result.current.addServer('https://new.com', 'My Server');
    });

    expect(mockDatabase.addServer).toHaveBeenCalledWith('https://new.com', 'My Server');
  });

  it('updateServer updates and refreshes list', () => {
    const updated: Server = {
      id: '1',
      name: 'Updated',
      url: 'https://s1.example.com',
      createdAt: 2000,
    };
    mockDatabase.updateServer.mockReturnValue(updated);
    mockDatabase.getServers
      .mockReturnValueOnce(mockServers)
      .mockReturnValueOnce([updated, mockServers[1]]);

    const { result } = renderHook(() => useServers());

    act(() => {
      result.current.updateServer('1', { name: 'Updated' });
    });

    expect(mockDatabase.updateServer).toHaveBeenCalledWith('1', { name: 'Updated' });
    expect(result.current.servers[0].name).toBe('Updated');
  });

  it('removeServer removes and refreshes list', () => {
    mockDatabase.getServers
      .mockReturnValueOnce(mockServers)
      .mockReturnValueOnce([mockServers[1]]);

    const { result } = renderHook(() => useServers());

    act(() => {
      result.current.removeServer('1');
    });

    expect(mockDatabase.removeServer).toHaveBeenCalledWith('1');
    expect(result.current.servers).toEqual([mockServers[1]]);
  });
});
