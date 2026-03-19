import type { SQLiteDatabase } from 'expo-sqlite'
import type { Server } from '@/types/server'

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const segments = [8, 4, 4, 4, 12]
  return segments
    .map(len =>
      Array.from({ length: len }).fill(chars[Math.floor(Math.random() * chars.length)]).join(''),
    )
    .join('-')
}

export async function getServers(db: SQLiteDatabase): Promise<Server[]> {
  return db.getAllAsync<Server>('SELECT * FROM servers ORDER BY createdAt DESC')
}

export async function addServer(db: SQLiteDatabase, url: string, name?: string): Promise<Server> {
  const id = generateId()
  const createdAt = Date.now()
  const serverName = name ?? url

  await db.runAsync(
    'INSERT INTO servers (id, name, url, createdAt) VALUES (?, ?, ?, ?)',
    [id, serverName, url, createdAt],
  )

  return (await db.getFirstAsync<Server>(
    'SELECT * FROM servers WHERE id = ?',
    [id],
  ))!
}

export async function updateServer(db: SQLiteDatabase, id: string, updates: Partial<Pick<Server, 'name' | 'url'>>): Promise<Server> {
  const fields: string[] = []
  const values: (string | number)[] = []

  if (updates.name !== undefined) {
    fields.push('name = ?')
    values.push(updates.name)
  }
  if (updates.url !== undefined) {
    fields.push('url = ?')
    values.push(updates.url)
  }

  if (fields.length === 0) {
    throw new Error('No fields to update')
  }

  values.push(id)
  await db.runAsync(
    `UPDATE servers SET ${fields.join(', ')} WHERE id = ?`,
    values,
  )

  return (await db.getFirstAsync<Server>(
    'SELECT * FROM servers WHERE id = ?',
    [id],
  ))!
}

export async function removeServer(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM servers WHERE id = ?', [id])
}
