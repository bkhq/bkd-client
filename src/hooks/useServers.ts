import type { Server } from '@/types/server'
import { useSQLiteContext } from 'expo-sqlite'
import { useCallback, useEffect, useState } from 'react'
import { addServer as dbAddServer, removeServer as dbRemoveServer, updateServer as dbUpdateServer, getServers } from '@/utils/database'

export function useServers() {
  const db = useSQLiteContext()
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const list = await getServers(db)
    setServers(list)
  }, [db])

  // Load initial data on mount — intentional setState in effect
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().then(() => setLoading(false))
  }, [refresh])

  const addServer = useCallback(async (url: string, name?: string) => {
    await dbAddServer(db, url, name)
    await refresh()
  }, [db, refresh])

  const updateServer = useCallback(async (id: string, updates: Partial<Pick<Server, 'name' | 'url'>>) => {
    await dbUpdateServer(db, id, updates)
    await refresh()
  }, [db, refresh])

  const removeServer = useCallback(async (id: string) => {
    await dbRemoveServer(db, id)
    await refresh()
  }, [db, refresh])

  return {
    servers,
    loading,
    addServer,
    updateServer,
    removeServer,
  }
}
