import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export interface LocalProductionLog {
  id: string
  team_id: string
  team_name: string
  date: string
  hour_slot: string
  total_qty: number
  present_count: number
  present_member_ids: string[]
  photo_url?: string
  notes?: string
  synced: boolean
  created_at: string
  updated_at: string   // ISO timestamp — used for delta sync & conflict resolution
}

export interface LocalUser {
  id: string
  email: string
  full_name: string
  role: 'mandor' | 'pekerja'
  avatar_url?: string
}

export interface LocalTeam {
  id: string
  name: string
  shift: string
  hourly_target: number
  updated_at: string   // ISO timestamp — used for delta sync & conflict resolution
  members: Array<{
    id: string
    full_name: string
    role: string
    avatar_url?: string
    no_karyawan?: string
    joined_date?: string
    phone_number?: string
    shift?: string
    status?: string
    exit_date?: string // YYYY-MM format: the month this worker exited
  }>
}

export interface LocalAuditLog {
  id: string
  timestamp: string
  category: 'Target' | 'Absensi' | 'Tim' | 'Pekerja' | 'System'
  action: string
  details: string
  user?: string
}

export interface LocalOverrideRecord {
  key: string // e.g. "daily_w1_2026-07-29" or "worker_w1"
  type: 'daily' | 'worker'
  data: any
  updated_at: string   // ISO timestamp — used for delta sync & conflict resolution
}

// Outbox: stores pending writes when offline
export interface OutboxRecord {
  id: string             // unique operation id
  table: 'logs' | 'teams' | 'overrides'
  operation: 'upsert' | 'delete'
  payload: any
  created_at: string
}

interface EarFlowDB extends DBSchema {
  logs: {
    key: string
    value: LocalProductionLog
    indexes: { 'by-date': string; 'by-synced': any; 'by-updated-at': string }
  }
  teams: {
    key: string
    value: LocalTeam
    indexes: { 'by-updated-at': string }
  }
  users: {
    key: string
    value: LocalUser
  }
  overrides: {
    key: string
    value: LocalOverrideRecord
    indexes: { 'by-updated-at': string }
  }
  audit_logs: {
    key: string
    value: LocalAuditLog
    indexes: { 'by-timestamp': string }
  }
  outbox: {
    key: string
    value: OutboxRecord
    indexes: { 'by-created-at': string }
  }
}

const DB_NAME = 'earflow_local_db'
const DB_VERSION = 4

let dbPromise: Promise<IDBPDatabase<EarFlowDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<EarFlowDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 2) {
          if (db.objectStoreNames.contains('logs')) db.deleteObjectStore('logs')
          if (db.objectStoreNames.contains('teams')) db.deleteObjectStore('teams')
          if (db.objectStoreNames.contains('users')) db.deleteObjectStore('users')
        }

        // Logs store
        if (!db.objectStoreNames.contains('logs')) {
          const logStore = db.createObjectStore('logs', { keyPath: 'id' })
          logStore.createIndex('by-date', 'date')
          logStore.createIndex('by-synced', 'synced')
          logStore.createIndex('by-updated-at', 'updated_at')
        } else if (oldVersion < 4) {
          // Add missing index on existing store (v3 → v4)
          const logStore = (db as any).transaction.objectStore('logs')
          if (!logStore.indexNames.contains('by-updated-at')) {
            logStore.createIndex('by-updated-at', 'updated_at')
          }
        }

        // Teams store
        if (!db.objectStoreNames.contains('teams')) {
          const teamsStore = db.createObjectStore('teams', { keyPath: 'id' })
          teamsStore.createIndex('by-updated-at', 'updated_at')
        }

        // Users store
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' })
        }

        // Overrides store
        if (!db.objectStoreNames.contains('overrides')) {
          const ovrStore = db.createObjectStore('overrides', { keyPath: 'key' })
          ovrStore.createIndex('by-updated-at', 'updated_at')
        }

        // Audit logs store
        if (!db.objectStoreNames.contains('audit_logs')) {
          const auditStore = db.createObjectStore('audit_logs', { keyPath: 'id' })
          auditStore.createIndex('by-timestamp', 'timestamp')
        }

        // Outbox store (new in v4) — pending writes for offline support
        if (!db.objectStoreNames.contains('outbox')) {
          const outboxStore = db.createObjectStore('outbox', { keyPath: 'id' })
          outboxStore.createIndex('by-created-at', 'created_at')
        }
      }
    })
  }
  return dbPromise
}

// ─── Outbox helpers ────────────────────────────────────────────────────────

export async function addToOutbox(
  table: OutboxRecord['table'],
  operation: OutboxRecord['operation'],
  payload: any
): Promise<void> {
  try {
    const db = await getDB()
    const record: OutboxRecord = {
      id: `ob_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      table,
      operation,
      payload,
      created_at: new Date().toISOString()
    }
    await db.put('outbox', record)
  } catch (e) {
    console.warn('[Outbox] Failed to add record:', e)
  }
}

export async function getPendingOutbox(): Promise<OutboxRecord[]> {
  try {
    const db = await getDB()
    return await db.getAll('outbox')
  } catch {
    return []
  }
}

export async function removeFromOutbox(id: string): Promise<void> {
  try {
    const db = await getDB()
    await db.delete('outbox', id)
  } catch (e) {
    console.warn('[Outbox] Failed to remove record:', e)
  }
}

export async function clearOutbox(): Promise<void> {
  try {
    const db = await getDB()
    await db.clear('outbox')
  } catch {}
}

// ─── Seed (clean slate) ────────────────────────────────────────────────────

export async function seedInitialLocalData() {
  // Clean slate: no mock data populated for clean application launch
}

// ─── Backup / Restore ──────────────────────────────────────────────────────

export interface BackupPayload {
  app: string
  version: number
  timestamp: string
  data: {
    teams: LocalTeam[]
    logs: LocalProductionLog[]
    users: LocalUser[]
    overrides?: LocalOverrideRecord[]
    audit_logs?: LocalAuditLog[]
    localStorageData?: Record<string, string>
  }
}

export async function exportBackupData(): Promise<BackupPayload> {
  const db = await getDB()
  const teams = await db.getAll('teams')
  const logs = await db.getAll('logs')
  const users = await db.getAll('users')
  const overrides = await db.getAll('overrides')
  const auditLogs = await db.getAll('audit_logs')

  const localStore: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) localStore[key] = localStorage.getItem(key) || ''
  }

  return {
    app: 'EarFlow',
    version: DB_VERSION,
    timestamp: new Date().toISOString(),
    data: {
      teams: JSON.parse(JSON.stringify(teams)),
      logs: JSON.parse(JSON.stringify(logs)),
      users: JSON.parse(JSON.stringify(users)),
      overrides: JSON.parse(JSON.stringify(overrides)),
      audit_logs: JSON.parse(JSON.stringify(auditLogs)),
      localStorageData: localStore
    }
  }
}

export async function importBackupData(payload: BackupPayload): Promise<boolean> {
  if (!payload || typeof payload !== 'object' || !payload.data) {
    throw new Error('Format file backup tidak valid')
  }

  const db = await getDB()
  const tx = db.transaction(['teams', 'logs', 'users', 'overrides', 'audit_logs', 'outbox'], 'readwrite')

  await tx.objectStore('teams').clear()
  await tx.objectStore('logs').clear()
  await tx.objectStore('users').clear()
  await tx.objectStore('overrides').clear()
  await tx.objectStore('audit_logs').clear()
  await tx.objectStore('outbox').clear()

  const now = new Date().toISOString()

  if (Array.isArray(payload.data.teams)) {
    for (const team of payload.data.teams) {
      await tx.objectStore('teams').put({ ...team, updated_at: team.updated_at || now })
    }
  }
  if (Array.isArray(payload.data.logs)) {
    for (const log of payload.data.logs) {
      await tx.objectStore('logs').put({ ...log, updated_at: log.updated_at || log.created_at || now })
    }
  }
  if (Array.isArray(payload.data.users)) {
    for (const user of payload.data.users) {
      await tx.objectStore('users').put(user)
    }
  }
  if (Array.isArray(payload.data.overrides)) {
    for (const override of payload.data.overrides) {
      await tx.objectStore('overrides').put({ ...override, updated_at: (override as any).updated_at || now })
    }
  }
  if (Array.isArray(payload.data.audit_logs)) {
    for (const auditLog of payload.data.audit_logs) {
      await tx.objectStore('audit_logs').put(auditLog)
    }
  }

  await tx.done

  // Restore localStorage
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith('earflow_') || key === 'foreman_name')) keysToRemove.push(key)
  }
  keysToRemove.forEach(k => localStorage.removeItem(k))

  if (payload.data.localStorageData && typeof payload.data.localStorageData === 'object') {
    for (const [key, val] of Object.entries(payload.data.localStorageData)) {
      if (val !== undefined && val !== null) localStorage.setItem(key, val)
    }
  }

  return true
}

// ─── Full Reset ─────────────────────────────────────────────────────────────

export async function clearAllLocalData(): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction(['teams', 'logs', 'users', 'overrides', 'audit_logs', 'outbox'], 'readwrite')
    await tx.objectStore('teams').clear()
    await tx.objectStore('logs').clear()
    await tx.objectStore('users').clear()
    await tx.objectStore('overrides').clear()
    await tx.objectStore('audit_logs').clear()
    await tx.objectStore('outbox').clear()
    await tx.done
  } catch (e) {
    console.warn('IDB clear error:', e)
  }

  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) keysToRemove.push(key)
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
  } catch (e) {
    console.warn('LocalStorage clear error:', e)
  }
}
