import { useState, useEffect, useCallback } from 'react';
import { initDatabase, getServers, addServer as dbAddServer, updateServer as dbUpdateServer, removeServer as dbRemoveServer } from '@/utils/database';
import type { Server } from '@/types/server';

export function useServers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setServers(getServers());
  }, []);

  useEffect(() => {
    initDatabase();
    refresh();
    setLoading(false);
  }, [refresh]);

  const addServer = useCallback((url: string, name?: string) => {
    dbAddServer(url, name);
    refresh();
  }, [refresh]);

  const updateServer = useCallback((id: string, updates: Partial<Pick<Server, 'name' | 'url'>>) => {
    dbUpdateServer(id, updates);
    refresh();
  }, [refresh]);

  const removeServer = useCallback((id: string) => {
    dbRemoveServer(id);
    refresh();
  }, [refresh]);

  return {
    servers,
    loading,
    addServer,
    updateServer,
    removeServer,
  };
}
