import { ref, computed } from 'vue'
import { isSupabaseConfigured, supabase } from '@/supabase/client'
import {
  getDB,
  getPendingOutbox,
  removeFromOutbox,
  clearOutbox,
  type LocalProductionLog,
  type LocalTeam,
  type LocalOverrideRecord
} from '@/services/db'

// ─── State ─────────────────────────────────────────────────────────────────

export type SyncStatus = 'idle' | 'syncing' | 'connected' | 'offline' | 'error'

export const syncStatus = ref<SyncStatus>(navigator.onLine ? 'idle' : 'offline')
export const lastSyncTime = ref<string | null>(localStorage.getItem('earflow_last_sync_time') || null)
export const lastSyncError = ref<string | null>(null)
export const isCloudConnected = ref(false)
export const pendingSyncCount = ref(0)

let isSyncInProgress = false
let realtimeChannel: any = null
let realtimeDebounceTimer: any = null

// ISO timestamp of the last successful sync — used for delta queries
const LAST_SYNC_AT_KEY = 'earflow_last_sync_at'

export function getLastSyncAt(): string | null {
  return localStorage.getItem(LAST_SYNC_AT_KEY)
}

export function setLastSyncAt(isoStr: string) {
  localStorage.setItem(LAST_SYNC_AT_KEY, isoStr)
}

export const isCloudEnabled = computed(() => isSupabaseConfigured)

// ─── Helper: compare ISO timestamps ────────────────────────────────────────
export function isNewer(a?: string, b?: string): boolean {
  if (!a) return false
  if (!b) return true
  return new Date(a).getTime() >= new Date(b).getTime()
}

// ─── Connection Test ────────────────────────────────────────────────────────

export async function testSupabaseConnection(
  timeoutMs = 5000
): Promise<{ ok: boolean; message: string }> {
  if (!isCloudEnabled.value) {
    return { ok: false, message: 'Supabase URL atau Anon Key belum dikonfigurasi di file .env' }
  }

  try {
    const timeoutPromise = new Promise<{ ok: boolean; message: string }>((_, reject) =>
      setTimeout(() => reject(new Error('Koneksi timeout (lebih dari 5 detik)')), timeoutMs)
    )

    const testPromise = async () => {
      const { error } = await supabase.from('teams').select('id').limit(1)
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('0 rows')) {
          return { ok: true, message: 'Terhubung ke Supabase (Tabel Siap)' }
        }
        return { ok: false, message: `Supabase Error: ${error.message} (Code: ${error.code})` }
      }
      return { ok: true, message: 'Koneksi ke Supabase Berhasil & Aktif' }
    }

    const res = await Promise.race([testPromise(), timeoutPromise])
    isCloudConnected.value = res.ok
    if (res.ok) {
      syncStatus.value = 'connected'
      lastSyncError.value = null
    } else {
      syncStatus.value = 'error'
      lastSyncError.value = res.message
    }
    return res
  } catch (err: any) {
    isCloudConnected.value = false
    syncStatus.value = 'error'
    const msg = err?.message || 'Gagal terhubung ke Supabase'
    lastSyncError.value = msg
    return { ok: false, message: msg }
  }
}

// ─── DELTA & FULL PULL (Supabase Source-of-Truth) ─────────────────────────

/**
 * Helper to fetch all rows with automatic pagination (1,000 rows per chunk).
 * This completely avoids Supabase PostgREST default limit (1,000) which would truncate data.
 */
async function fetchAllRows(tableName: string, orderCol?: string, filterIso?: string | null): Promise<any[]> {
  const all: any[] = []
  let from = 0
  const step = 1000
  while (true) {
    let query = supabase.from(tableName).select('*').range(from, from + step - 1)
    if (filterIso) {
      query = query.gt('updated_at', filterIso)
    }
    if (orderCol) {
      query = query.order(orderCol, { ascending: false })
    }
    const { data, error } = await query
    if (error) {
      console.warn(`[Sync] Error fetching ${tableName} range [${from}, ${from + step - 1}]:`, error.message)
      break
    }
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < step) break
    from += step
  }
  return all
}

/**
 * Pull rows from Supabase into local IndexedDB and localStorage.
 * - If sinceIso is provided: delta pull (only updated rows).
 * - If sinceIso is null/undefined: full sync with deletion reconciliation.
 */
export async function pullCloudDataFromSupabase(sinceIso?: string | null): Promise<{
  success: boolean
  logsCount: number
  teamsCount: number
  overridesCount: number
  usersCount: number
}> {
  if (!isCloudEnabled.value || !navigator.onLine) {
    return { success: false, logsCount: 0, teamsCount: 0, overridesCount: 0, usersCount: 0 }
  }

  try {
    const db = await getDB()
    const isFullReconcile = !sinceIso
    const pendingOutbox = await getPendingOutbox()
    const pendingTeamIds = new Set(pendingOutbox.filter(o => o.table === 'teams').map(o => o.payload?.id || o.payload))
    const pendingLogIds = new Set(pendingOutbox.filter(o => o.table === 'logs').map(o => o.payload?.id || o.payload))
    const pendingOvrKeys = new Set(pendingOutbox.filter(o => o.table === 'overrides').map(o => o.payload?.key || o.payload))

    let pulledLogs = 0
    let pulledTeams = 0
    let pulledOverrides = 0
    let pulledUsers = 0

    // Apply safety buffer (2 minutes before sinceIso) to prevent clock drift between devices from dropping records
    let filterIso = sinceIso
    if (filterIso) {
      const bufferTime = new Date(new Date(filterIso).getTime() - 2 * 60 * 1000).toISOString()
      filterIso = bufferTime
    }

    // ── 0. Users (Foreman / Profile) ──────────────────────────────────────────
    const cloudUsers = await fetchAllRows('users', undefined, filterIso)
    if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
      const tx = db.transaction('users', 'readwrite')
      for (const cu of cloudUsers) {
        await tx.objectStore('users').put({
          id: cu.id,
          email: cu.email || '',
          full_name: cu.full_name || '',
          role: cu.role || 'mandor',
          avatar_url: cu.avatar_url || undefined
        })
        if (cu.role === 'mandor' && cu.full_name) {
          localStorage.setItem('earflow_foreman_name', cu.full_name)
          localStorage.setItem('foreman_name', cu.full_name)
        }
        pulledUsers++
      }
      await tx.done
    }

    // ── 1. Production Logs (paginated) ──────────────────────────────────────
    const cloudLogs = await fetchAllRows('production_logs', 'date', filterIso)
    if (Array.isArray(cloudLogs)) {
      const tx = db.transaction('logs', 'readwrite')
      const cloudLogIds = new Set<string>()

      for (const cl of cloudLogs) {
        cloudLogIds.add(cl.id)
        const cloudUpdatedAt = cl.updated_at || cl.created_at || new Date().toISOString()
        const localLog: LocalProductionLog = {
          id: cl.id,
          team_id: cl.team_id,
          team_name: cl.team_name || '',
          date: cl.date,
          hour_slot: cl.hour_slot,
          total_qty: cl.total_qty,
          present_count: cl.present_count || 1,
          present_member_ids: Array.isArray(cl.present_member_ids) ? cl.present_member_ids : [],
          photo_url: cl.photo_url || undefined,
          notes: cl.notes || undefined,
          synced: true,
          created_at: cl.created_at || cloudUpdatedAt,
          updated_at: cloudUpdatedAt
        }
        await tx.objectStore('logs').put(localLog)
        pulledLogs++
      }

      // Reconcile deletions if doing full pull: delete local logs that no longer exist in Supabase
      if (isFullReconcile) {
        const localLogs = await db.getAll('logs')
        for (const ll of localLogs) {
          if (!cloudLogIds.has(ll.id) && !pendingLogIds.has(ll.id)) {
            await tx.objectStore('logs').delete(ll.id)
          }
        }
      }

      await tx.done
    }

    // ── 2. Teams (paginated) ────────────────────────────────────────────────
    const cloudTeams = await fetchAllRows('teams', undefined, filterIso)
    if (Array.isArray(cloudTeams)) {
      const tx = db.transaction('teams', 'readwrite')
      const cloudTeamIds = new Set<string>()

      for (const ct of cloudTeams) {
        cloudTeamIds.add(ct.id)
        const cloudUpdatedAt = ct.updated_at || new Date().toISOString()
        const localTeam: LocalTeam = {
          id: ct.id,
          name: ct.name,
          shift: ct.shift || '',
          hourly_target: ct.hourly_target || 180,
          members: Array.isArray(ct.members) ? ct.members : [],
          updated_at: cloudUpdatedAt
        }
        await tx.objectStore('teams').put(localTeam)
        pulledTeams++
      }

      // Reconcile deletions if doing full pull: delete local teams that no longer exist in Supabase
      if (isFullReconcile) {
        const localTeams = await db.getAll('teams')
        for (const lt of localTeams) {
          if (!cloudTeamIds.has(lt.id) && !pendingTeamIds.has(lt.id)) {
            await tx.objectStore('teams').delete(lt.id)
          }
        }
      }

      await tx.done
    }

    // ── 3. Overrides (paginated, full 5,000+ records) ────────────────────────
    const cloudOverrides = await fetchAllRows('overrides', undefined, filterIso)
    if (Array.isArray(cloudOverrides)) {
      const tx = db.transaction('overrides', 'readwrite')
      const cloudOvrKeys = new Set<string>()

      for (const co of cloudOverrides) {
        cloudOvrKeys.add(co.key)
        const cloudUpdatedAt = co.updated_at || new Date().toISOString()
        const localOvr: LocalOverrideRecord = {
          key: co.key,
          type: co.type || 'daily',
          data: co.data || {},
          updated_at: cloudUpdatedAt
        }
        await tx.objectStore('overrides').put(localOvr)
        pulledOverrides++
      }

      // Reconcile deletions if doing full pull: delete local overrides that no longer exist in Supabase
      if (isFullReconcile) {
        const localOverrides = await db.getAll('overrides')
        for (const lo of localOverrides) {
          if (!cloudOvrKeys.has(lo.key) && !pendingOvrKeys.has(lo.key)) {
            await tx.objectStore('overrides').delete(lo.key)
          }
        }
      }

      await tx.done
    }

    // ── 4. Shifts ────────────────────────────────────────────────────────────
    const cloudShifts = await fetchAllRows('shifts', undefined, filterIso)
    if (Array.isArray(cloudShifts) && cloudShifts.length > 0) {
      const mappedShifts = cloudShifts.map(s => ({
        id: s.id,
        name: s.name,
        startTime: s.start_time,
        endTime: s.end_time
      }))
      if (filterIso) {
        const existing = JSON.parse(localStorage.getItem('earflow_shifts') || '[]')
        const merged = [...existing]
        for (const cs of mappedShifts) {
          const idx = merged.findIndex((s: any) => s.id === cs.id)
          if (idx >= 0) merged[idx] = cs
          else merged.push(cs)
        }
        localStorage.setItem('earflow_shifts', JSON.stringify(merged))
      } else {
        localStorage.setItem('earflow_shifts', JSON.stringify(mappedShifts))
      }
    }

    // ── 5. App Settings ──────────────────────────────────────────────────────
    const cloudSettings = await fetchAllRows('app_settings', undefined, filterIso)
    if (Array.isArray(cloudSettings) && cloudSettings.length > 0) {
      for (const setting of cloudSettings) {
        if (setting.key && setting.value !== undefined && setting.value !== null) {
          const valToStore = typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value)
          localStorage.setItem(setting.key, valToStore)
        }
      }
    }

    // ── 6. Audit Logs ────────────────────────────────────────────────────────
    const cloudAudits = await fetchAllRows('audit_logs', 'created_at', filterIso)
    if (Array.isArray(cloudAudits) && cloudAudits.length > 0) {
      const tx = db.transaction('audit_logs', 'readwrite')
      for (const ca of cloudAudits) {
        await tx.objectStore('audit_logs').put({
          id: ca.id,
          timestamp: ca.timestamp,
          category: ca.category || 'System',
          action: ca.action,
          details: ca.details || '',
          user: ca.user_name || undefined
        })
      }
      await tx.done
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('supabase-data-updated'))
    }

    return { success: true, logsCount: pulledLogs, teamsCount: pulledTeams, overridesCount: pulledOverrides, usersCount: pulledUsers }
  } catch (err: any) {
    console.warn('[Sync] Error in pullCloudDataFromSupabase:', err)
    return { success: false, logsCount: 0, teamsCount: 0, overridesCount: 0, usersCount: 0 }
  }
}

// ─── OUTBOX FLUSH ──────────────────────────────────────────────────────────

/**
 * Flushes all pending offline writes from the outbox to Supabase.
 * Called automatically when the device comes back online.
 */
export async function flushOutbox(): Promise<{ flushed: number; failed: number }> {
  if (!isCloudEnabled.value || !navigator.onLine) {
    return { flushed: 0, failed: 0 }
  }

  const pending = await getPendingOutbox()
  if (pending.length === 0) return { flushed: 0, failed: 0 }

  let flushed = 0
  let failed = 0

  for (const record of pending) {
    try {
      if (record.operation === 'upsert') {
        if (record.table === 'logs') {
          const { error } = await supabase
            .from('production_logs')
            .upsert(record.payload, { onConflict: 'id' })
          if (error) throw error
          // Mark as synced in IDB
          const db = await getDB()
          const existing = await db.get('logs', record.payload.id)
          if (existing) {
            await db.put('logs', { ...existing, synced: true })
          }
        } else if (record.table === 'teams') {
          const { error } = await supabase
            .from('teams')
            .upsert(record.payload, { onConflict: 'id' })
          if (error) throw error
        } else if (record.table === 'overrides') {
          const { error } = await supabase
            .from('overrides')
            .upsert(record.payload, { onConflict: 'key' })
          if (error) throw error
        }
      } else if (record.operation === 'delete') {
        const idToDelete = record.payload?.id || record.payload?.key || record.payload
        if (record.table === 'logs') {
          const { error } = await supabase
            .from('production_logs')
            .delete()
            .eq('id', idToDelete)
          if (error) throw error
        } else if (record.table === 'teams') {
          const { error } = await supabase
            .from('teams')
            .delete()
            .eq('id', idToDelete)
          if (error) throw error
        } else if (record.table === 'overrides') {
          const { error } = await supabase
            .from('overrides')
            .delete()
            .eq('key', idToDelete)
          if (error) throw error
        }
      }
      await removeFromOutbox(record.id)
      flushed++
    } catch (err: any) {
      console.warn(`[Outbox] Failed to flush record ${record.id}:`, err?.message)
      failed++
    }
  }

  pendingSyncCount.value = failed
  return { flushed, failed }
}

// ─── USERS / FOREMAN CLOUD SYNC ─────────────────────────────────────────────

export async function syncUserProfileToCloud(): Promise<boolean> {
  if (!isCloudEnabled.value || !navigator.onLine) {
    return false
  }
  try {
    const foremanName = localStorage.getItem('earflow_foreman_name') || localStorage.getItem('foreman_name') || 'Mandor'
    const now = new Date().toISOString()
    const { error } = await supabase.from('users').upsert({
      id: 'm1',
      email: 'mandor.hendra@earflow.com',
      full_name: foremanName,
      role: 'mandor',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      updated_at: now
    }, { onConflict: 'id' })
    return !error
  } catch (err) {
    return false
  }
}

// ─── SHIFTS CLOUD SYNC ──────────────────────────────────────────────────────

/**
 * Push all shifts stored in localStorage to Supabase shifts table.
 */
export async function pushAllShiftsToCloud(): Promise<boolean> {
  if (!isCloudEnabled.value || !navigator.onLine) {
    return false
  }
  try {
    const now = new Date().toISOString()
    const localShiftsRaw = localStorage.getItem('earflow_shifts')
    if (localShiftsRaw) {
      const shiftsArr = JSON.parse(localShiftsRaw)
      if (Array.isArray(shiftsArr) && shiftsArr.length > 0) {
        const payload = shiftsArr.map(s => ({
          id: s.id,
          name: s.name,
          start_time: s.startTime,
          end_time: s.endTime,
          updated_at: now
        }))
        const { error } = await supabase.from('shifts').upsert(payload, { onConflict: 'id' })
        if (error) {
          console.warn('[Sync] Failed to push shifts:', error.message)
          return false
        }
      }
    }
    return true
  } catch (err) {
    console.warn('[Sync] Error pushing shifts:', err)
    return false
  }
}

// ─── APP SETTINGS CLOUD SYNC ────────────────────────────────────────────────

export const APP_SETTING_KEYS = [
  'earflow_foreman_name',
  'foreman_name',
  'earflow_process_groups',
  'earflow_process_types',
  'earflow_worker_status_options',
  'earflow_role_options',
  'earflow_salary_rates_v1',
  'earflow_worker_salary_config_v1'
]

/**
 * Synchronize a single application setting directly to Supabase app_settings table.
 */
export async function syncAppSettingToCloud(key: string, value: any): Promise<boolean> {
  if (!isCloudEnabled.value || !navigator.onLine) {
    return false
  }
  try {
    const now = new Date().toISOString()
    let parsedVal = value
    if (typeof value === 'string') {
      try {
        parsedVal = JSON.parse(value)
      } catch {
        parsedVal = value
      }
    }
    const { error } = await supabase.from('app_settings').upsert({
      key,
      value: parsedVal,
      updated_at: now
    }, { onConflict: 'key' })

    if (error) {
      console.warn(`[Sync] Failed to sync setting ${key} to Supabase:`, error.message)
      return false
    }
    return true
  } catch (err: any) {
    console.warn(`[Sync] Error syncing setting ${key}:`, err)
    return false
  }
}

/**
 * Push all application settings stored in localStorage to Supabase app_settings table.
 */
export async function pushAllAppSettingsToCloud(): Promise<boolean> {
  if (!isCloudEnabled.value || !navigator.onLine) {
    return false
  }
  try {
    const now = new Date().toISOString()
    const settingsPayload: Array<{ key: string; value: any; updated_at: string }> = []
    for (const key of APP_SETTING_KEYS) {
      const val = localStorage.getItem(key)
      if (val !== null && val !== undefined && val !== '') {
        let parsedVal: any = val
        try { parsedVal = JSON.parse(val) } catch {}
        settingsPayload.push({ key, value: parsedVal, updated_at: now })
      }
    }
    if (settingsPayload.length > 0) {
      const { error } = await supabase.from('app_settings').upsert(settingsPayload, { onConflict: 'key' })
      if (error) {
        console.warn('[Sync] Failed to upsert app settings:', error.message)
        return false
      }
    }
    return true
  } catch (err) {
    console.warn('[Sync] Error pushing all app settings:', err)
    return false
  }
}

// ─── FULL SYNC (startup / periodic / manual) ───────────────────────────────

/**
 * Bidirectional full sync:
 * 1. Flush pending offline writes in outbox
 * 2. Pull all authoritative data from Supabase with complete deletion reconciliation
 * 3. Sync user profile
 * 4. Update sync timestamp and notify all active stores
 */
export async function performFullSync(onDataUpdated?: () => void): Promise<{
  success: boolean
  message: string
}> {
  if (isSyncInProgress) {
    return { success: false, message: 'Sinkronisasi sedang berjalan...' }
  }
  if (!isCloudEnabled.value) {
    syncStatus.value = 'offline'
    return { success: false, message: 'Supabase belum diaktifkan.' }
  }
  if (!navigator.onLine) {
    syncStatus.value = 'offline'
    return { success: false, message: 'Perangkat sedang offline.' }
  }

  isSyncInProgress = true
  syncStatus.value = 'syncing'

  try {
    // 1. Flush pending offline writes first
    const { flushed } = await flushOutbox()

    // 2. Full pull and reconcile from Supabase (null = full pull, complete reconciliation)
    const pullResult = await pullCloudDataFromSupabase(null)

    // 3. Sync current user profile
    await syncUserProfileToCloud()

    // 4. Record sync timestamp
    const nowIso = new Date().toISOString()
    setLastSyncAt(nowIso)

    const nowStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
    lastSyncTime.value = nowStr
    localStorage.setItem('earflow_last_sync_time', nowStr)

    syncStatus.value = 'connected'
    lastSyncError.value = null
    isCloudConnected.value = true

    if (onDataUpdated) onDataUpdated()

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('supabase-data-updated'))
    }

    const pullMsg = (pullResult.logsCount > 0 || pullResult.teamsCount > 0 || pullResult.overridesCount > 0)
      ? ` | ${pullResult.teamsCount} tim, ${pullResult.logsCount} log, ${pullResult.overridesCount} override tersinkron`
      : ' | Sinkron'
    const pushMsg = flushed > 0 ? `${flushed} antrian berhasil dikirim` : ''

    return {
      success: true,
      message: `Sync selesai ${nowStr}${pushMsg ? '. ' + pushMsg : ''}${pullMsg}`
    }
  } catch (err: any) {
    syncStatus.value = 'error'
    const msg = err?.message || 'Gagal menyinkronkan data dengan Supabase'
    lastSyncError.value = msg
    return { success: false, message: msg }
  } finally {
    isSyncInProgress = false
  }
}

// ─── FORCE UPLOAD (full — explicit user action only) ───────────────────────

/**
 * Push ALL local data to Supabase regardless of sync status.
 * Only called when user explicitly clicks "Upload Database ke Cloud".
 */
export async function pushLocalDataToSupabase(): Promise<{
  pushedLogs: number
  pushedTeams: number
  pushedOverrides: number
  success: boolean
}> {
  if (!isCloudEnabled.value || !navigator.onLine) {
    return { pushedLogs: 0, pushedTeams: 0, pushedOverrides: 0, success: false }
  }

  try {
    const db = await getDB()
    const now = new Date().toISOString()

    // 0. User Profile / Foreman
    await syncUserProfileToCloud()

    // 1. All production logs (chunked)
    const allLogs = await db.getAll('logs')
    const validLogs = allLogs.filter(l => l.total_qty > 0 && l.hour_slot !== 'Reset Hasil Tim')
    let pushedCount = 0
    for (let i = 0; i < validLogs.length; i += 100) {
      const chunk = validLogs.slice(i, i + 100)
      const payload = chunk.map(l => ({
        id: l.id,
        team_id: l.team_id,
        team_name: l.team_name,
        date: l.date,
        hour_slot: l.hour_slot,
        total_qty: l.total_qty,
        present_count: l.present_count || 1,
        present_member_ids: l.present_member_ids || [],
        photo_url: l.photo_url || null,
        notes: l.notes || null,
        created_at: l.created_at || now,
        updated_at: l.updated_at || now
      }))
      const { error } = await supabase.from('production_logs').upsert(payload, { onConflict: 'id' })
      if (!error) {
        pushedCount += chunk.length
      } else {
        console.warn('[ForceUpload] Failed chunk:', error.message)
      }
    }
    // Mark all as synced
    if (validLogs.length > 0) {
      const tx = db.transaction('logs', 'readwrite')
      for (const log of validLogs) {
        await tx.objectStore('logs').put({ ...log, synced: true })
      }
      await tx.done
    }

    // 2. All teams
    const allTeams = await db.getAll('teams')
    let pushedTeamsCount = 0
    if (allTeams.length > 0) {
      const payload = allTeams.map(t => ({
        id: t.id,
        name: t.name,
        shift: t.shift || '',
        hourly_target: t.hourly_target || 180,
        members: t.members || [],
        updated_at: t.updated_at || now
      }))
      const { error } = await supabase.from('teams').upsert(payload, { onConflict: 'id' })
      if (!error) pushedTeamsCount = allTeams.length
      else console.warn('[ForceUpload] Failed teams:', error.message)
    }

    // 3. All overrides
    const allOverrides = await db.getAll('overrides')
    let pushedOverridesCount = 0
    if (allOverrides.length > 0) {
      const payload = allOverrides.map(o => ({
        key: o.key,
        type: o.type,
        data: o.data,
        updated_at: o.updated_at || now
      }))
      const { error } = await supabase.from('overrides').upsert(payload, { onConflict: 'key' })
      if (!error) pushedOverridesCount = allOverrides.length
      else console.warn('[ForceUpload] Failed overrides:', error.message)
    }

    // 4. Shifts
    const localShiftsRaw = localStorage.getItem('earflow_shifts')
    if (localShiftsRaw) {
      try {
        const shiftsArr = JSON.parse(localShiftsRaw)
        if (Array.isArray(shiftsArr) && shiftsArr.length > 0) {
          const payload = shiftsArr.map(s => ({
            id: s.id,
            name: s.name,
            start_time: s.startTime,
            end_time: s.endTime,
            updated_at: now
          }))
          await supabase.from('shifts').upsert(payload, { onConflict: 'id' })
        }
      } catch {}
    }

    // 5. App Settings
    const settingKeys = [
      'earflow_foreman_name', 'foreman_name', 'earflow_process_groups',
      'earflow_process_types', 'earflow_worker_status_options', 'earflow_role_options'
    ]
    const settingsPayload: Array<{ key: string; value: any; updated_at: string }> = []
    for (const key of settingKeys) {
      const val = localStorage.getItem(key)
      if (val !== null && val !== undefined) {
        let parsedVal: any = val
        try { parsedVal = JSON.parse(val) } catch {}
        settingsPayload.push({ key, value: parsedVal, updated_at: now })
      }
    }
    if (settingsPayload.length > 0) {
      await supabase.from('app_settings').upsert(settingsPayload, { onConflict: 'key' })
    }

    // 6. Audit logs
    const allAuditLogs = await db.getAll('audit_logs')
    if (allAuditLogs.length > 0) {
      const payload = allAuditLogs.map(a => ({
        id: a.id,
        timestamp: a.timestamp,
        category: a.category || 'System',
        action: a.action,
        details: a.details || null,
        user_name: a.user || null,
        created_at: now
      }))
      await supabase.from('audit_logs').upsert(payload, { onConflict: 'id' })
    }

    // Clear outbox — everything is now in Supabase
    await clearOutbox()
    pendingSyncCount.value = 0

    // Update delta sync timestamp
    setLastSyncAt(now)

    return { pushedLogs: pushedCount, pushedTeams: pushedTeamsCount, pushedOverrides: pushedOverridesCount, success: true }
  } catch (err: any) {
    console.warn('[ForceUpload] Error:', err)
    return { pushedLogs: 0, pushedTeams: 0, pushedOverrides: 0, success: false }
  }
}

export async function forceUploadAllToCloud(): Promise<{ success: boolean; message: string }> {
  isSyncInProgress = true
  syncStatus.value = 'syncing'
  try {
    const pushResult = await pushLocalDataToSupabase()
    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    lastSyncTime.value = nowStr
    localStorage.setItem('earflow_last_sync_time', nowStr)
    syncStatus.value = 'connected'
    isCloudConnected.value = true
    return {
      success: true,
      message: `Berhasil mengunggah ${pushResult.pushedTeams} tim, ${pushResult.pushedLogs} log, dan ${pushResult.pushedOverrides} override ke Supabase!`
    }
  } catch (err: any) {
    syncStatus.value = 'error'
    const msg = err?.message || 'Gagal mengunggah data ke Supabase'
    lastSyncError.value = msg
    return { success: false, message: msg }
  } finally {
    isSyncInProgress = false
  }
}

// ─── FORCE DOWNLOAD (explicit — clears local first) ────────────────────────

export async function forceDownloadAllFromCloud(): Promise<{ success: boolean; message: string }> {
  isSyncInProgress = true
  syncStatus.value = 'syncing'
  try {
    const db = await getDB()
    const tx = db.transaction(['teams', 'logs', 'overrides', 'audit_logs', 'outbox'], 'readwrite')
    await tx.objectStore('teams').clear()
    await tx.objectStore('logs').clear()
    await tx.objectStore('overrides').clear()
    await tx.objectStore('audit_logs').clear()
    await tx.objectStore('outbox').clear()
    await tx.done

    // Full pull — no delta filter
    const pullResult = await pullCloudDataFromSupabase(null)
    const now = new Date().toISOString()
    setLastSyncAt(now)

    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    lastSyncTime.value = nowStr
    localStorage.setItem('earflow_last_sync_time', nowStr)
    syncStatus.value = 'connected'
    isCloudConnected.value = true

    return {
      success: true,
      message: `Berhasil mengunduh ${pullResult.teamsCount} tim, ${pullResult.logsCount} log, dan ${pullResult.overridesCount} override dari Supabase!`
    }
  } catch (err: any) {
    syncStatus.value = 'error'
    const msg = err?.message || 'Gagal mengunduh data dari Supabase'
    lastSyncError.value = msg
    return { success: false, message: msg }
  } finally {
    isSyncInProgress = false
  }
}

// ─── CLOUD RESET ───────────────────────────────────────────────────────────

export async function resetCloudDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    await supabase.from('production_logs').delete().neq('id', '___non_existent___')
    await supabase.from('teams').delete().neq('id', '___non_existent___')
    await supabase.from('overrides').delete().neq('key', '___non_existent___')
    await supabase.from('shifts').delete().neq('id', '___non_existent___')
    await supabase.from('app_settings').delete().neq('key', '___non_existent___')
    await supabase.from('audit_logs').delete().neq('id', '___non_existent___')

    await supabase.from('production_logs').delete().filter('id', 'not.is', null)
    await supabase.from('teams').delete().filter('id', 'not.is', null)
    await supabase.from('overrides').delete().filter('key', 'not.is', null)
    await supabase.from('shifts').delete().filter('id', 'not.is', null)
    await supabase.from('app_settings').delete().filter('key', 'not.is', null)
    await supabase.from('audit_logs').delete().filter('id', 'not.is', null)

    // Reset delta cursor so next sync pulls everything
    localStorage.removeItem(LAST_SYNC_AT_KEY)

    return { success: true, message: 'Database Cloud Supabase berhasil dikosongkan total.' }
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal mengosongkan Supabase' }
  }
}

// ─── REALTIME ──────────────────────────────────────────────────────────────

export function initSupabaseRealtime(onCloudChange?: (tableName: string) => void) {
  if (!isCloudEnabled.value || realtimeChannel) return

  try {
    realtimeChannel = supabase
      .channel('earflow-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, async (payload) => {
        const table = payload.table
        const eventType = payload.eventType
        const newRecord = payload.new as any
        const oldRecord = payload.old as any

        try {
          const db = await getDB()
          if (table === 'teams') {
            if (eventType === 'DELETE') {
              const id = oldRecord?.id
              if (id) await db.delete('teams', id)
            } else if (newRecord && newRecord.id) {
              await db.put('teams', {
                id: newRecord.id,
                name: newRecord.name,
                shift: newRecord.shift || '',
                hourly_target: newRecord.hourly_target || 180,
                members: Array.isArray(newRecord.members) ? newRecord.members : [],
                updated_at: newRecord.updated_at || new Date().toISOString()
              })
            }
          } else if (table === 'production_logs') {
            if (eventType === 'DELETE') {
              const id = oldRecord?.id
              if (id) await db.delete('logs', id)
            } else if (newRecord && newRecord.id) {
              await db.put('logs', {
                id: newRecord.id,
                team_id: newRecord.team_id,
                team_name: newRecord.team_name || '',
                date: newRecord.date,
                hour_slot: newRecord.hour_slot,
                total_qty: newRecord.total_qty,
                present_count: newRecord.present_count || 1,
                present_member_ids: Array.isArray(newRecord.present_member_ids) ? newRecord.present_member_ids : [],
                photo_url: newRecord.photo_url || undefined,
                notes: newRecord.notes || undefined,
                synced: true,
                created_at: newRecord.created_at,
                updated_at: newRecord.updated_at || new Date().toISOString()
              })
            }
          } else if (table === 'overrides') {
            if (eventType === 'DELETE') {
              const key = oldRecord?.key
              if (key) await db.delete('overrides', key)
            } else if (newRecord && newRecord.key) {
              await db.put('overrides', {
                key: newRecord.key,
                type: newRecord.type || 'daily',
                data: newRecord.data || {},
                updated_at: newRecord.updated_at || new Date().toISOString()
              })
            }
          } else if (table === 'shifts') {
            const { data: cloudShifts } = await supabase.from('shifts').select('*')
            if (cloudShifts && Array.isArray(cloudShifts)) {
              const mapped = cloudShifts.map(s => ({
                id: s.id,
                name: s.name,
                startTime: s.start_time,
                endTime: s.end_time
              }))
              localStorage.setItem('earflow_shifts', JSON.stringify(mapped))
            }
          } else if (table === 'app_settings') {
            if (newRecord && newRecord.key) {
              const val = typeof newRecord.value === 'string' ? newRecord.value : JSON.stringify(newRecord.value)
              localStorage.setItem(newRecord.key, val)
            }
          } else if (table === 'users') {
            if (newRecord && newRecord.role === 'mandor' && newRecord.full_name) {
              localStorage.setItem('earflow_foreman_name', newRecord.full_name)
              localStorage.setItem('foreman_name', newRecord.full_name)
            }
          }
        } catch (err) {
          console.warn('[Realtime] Error applying immediate payload:', err)
        }

        // Notify app and stores
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('supabase-data-updated'))
        }
        if (onCloudChange) onCloudChange(table)

        // Debounced safety reconciliation
        clearTimeout(realtimeDebounceTimer)
        realtimeDebounceTimer = setTimeout(async () => {
          if (!isSyncInProgress && navigator.onLine) {
            await performFullSync()
          }
        }, 3000)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isCloudConnected.value = true
          syncStatus.value = 'connected'
        }
      })
  } catch (e) {
    console.warn('Realtime subscription warning:', e)
  }
}

// ─── PENDING COUNT ─────────────────────────────────────────────────────────

export async function updatePendingCount(): Promise<void> {
  try {
    const pending = await getPendingOutbox()
    pendingSyncCount.value = pending.length
  } catch {
    pendingSyncCount.value = 0
  }
}

// ─── AUTO-INIT (network & tab focus listeners) ──────────────────────────────

let isSyncServiceInitialized = false

export function initSyncService(onDataUpdated?: () => void) {
  if (typeof window === 'undefined') return

  if (!isSyncServiceInitialized) {
    isSyncServiceInitialized = true

    // 1. Network listeners
    window.addEventListener('online', async () => {
      syncStatus.value = 'syncing'
      await flushOutbox()
      await performFullSync(onDataUpdated)
    })

    window.addEventListener('offline', () => {
      syncStatus.value = 'offline'
      isCloudConnected.value = false
    })

    // 2. Tab focus / Visibility change listener (instant re-sync when user switches back to app)
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine && isCloudEnabled.value && !isSyncInProgress) {
        performFullSync(onDataUpdated)
      }
    })
    window.addEventListener('focus', () => {
      if (navigator.onLine && isCloudEnabled.value && !isSyncInProgress) {
        performFullSync(onDataUpdated)
      }
    })
  }

  // 3. IMMEDIATELY trigger sync on load without 1000ms delay!
  if (navigator.onLine && isCloudEnabled.value) {
    performFullSync(onDataUpdated)
    initSupabaseRealtime((_tableName) => {
      if (onDataUpdated) onDataUpdated()
    })
  }
}

// Immediate run on startup
if (typeof window !== 'undefined') {
  initSyncService()
}
