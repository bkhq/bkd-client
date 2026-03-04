import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import type { Server } from '@/types/server';

let _db: SQLiteDatabase | null = null;

function getDb(): SQLiteDatabase {
  if (!_db) {
    _db = openDatabaseSync('bitk.db');
  }
  return _db;
}

export function initDatabase(): void {
  getDb().execSync(`
    CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);
}

export function getServers(): Server[] {
  return getDb().getAllSync<Server>('SELECT * FROM servers ORDER BY createdAt DESC');
}

export function addServer(url: string, name?: string): Server {
  const db = getDb();
  const id = uuidv4();
  const createdAt = Date.now();
  const serverName = name ?? url;

  db.runSync(
    'INSERT INTO servers (id, name, url, createdAt) VALUES (?, ?, ?, ?)',
    [id, serverName, url, createdAt]
  );

  return db.getFirstSync<Server>(
    'SELECT * FROM servers WHERE id = ?',
    [id]
  )!;
}

export function updateServer(id: string, updates: Partial<Pick<Server, 'name' | 'url'>>): Server {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.url !== undefined) {
    fields.push('url = ?');
    values.push(updates.url);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  db.runSync(
    `UPDATE servers SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return db.getFirstSync<Server>(
    'SELECT * FROM servers WHERE id = ?',
    [id]
  )!;
}

export function removeServer(id: string): void {
  getDb().runSync('DELETE FROM servers WHERE id = ?', [id]);
}
