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

function getLastSyncAt(): string | null {
  return localStorage.getItem(LAST_SYNC_AT_KEY)
}

function setLastSyncAt(isoStr: string) {
  localStorage.setItem(LAST_SYNC_AT_KEY, isoStr)
}

export const isCloudEnabled = computed(() => isSupabaseConfigured)

// ─── Helper: compare ISO timestamps ────────────────────────────────────────
function isNewer(a?: string, b?: string): boolean {
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

// ─── DELTA PULL (Last-Write-Wins) ──────────────────────────────────────────

/**
 * Pull only rows that changed in Supabase since lastSyncAt.
 * Uses last-write-wins: cloud row replaces local only if cloud updated_at is newer.
 *
 * @param sinceIso - ISO timestamp to filter (only rows updated after this).
 *                   null = full pull (first time or explicit force download).
 */
export async function pullCloudDataFromSupabase(sinceIso?: string | null): Promise<{
  success: boolean
  logsCount: number
  teamsCount: number
  overridesCount: number
}> {
  if (!isCloudEnabled.value || !navigator.onLine) {
    return { success: false, logsCount: 0, teamsCount: 0, overridesCount: 0 }
  }

  try {
    const db = await getDB()
    let pulledLogs = 0
    let pulledTeams = 0
    let pulledOverrides = 0

    // ── 1. Production Logs (delta or full) ──────────────────────────────────
    let logsQuery = supabase
      .from('production_logs')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5000)

    if (sinceIso) {
      logsQuery = logsQuery.gt('updated_at', sinceIso)
    }

    const { data: cloudLogs, error: logErr } = await logsQuery
    if (!logErr && Array.isArray(cloudLogs) && cloudLogs.length > 0) {
      const tx = db.transaction('logs', 'readwrite')
      for (const cl of cloudLogs) {
        const cloudUpdatedAt = cl.updated_at || cl.created_at || new Date().toISOString()
        // Last-write-wins: skip if local version is newer
        const existingLocal = await tx.objectStore('logs').get(cl.id)
        if (existingLocal && isNewer(existingLocal.updated_at, cloudUpdatedAt)) {
          continue // local is newer — keep it
        }
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
          created_at: cl.created_at,
          updated_at: cloudUpdatedAt
        }
        await tx.objectStore('logs').put(localLog)
        pulledLogs++
      }
      await tx.done
    }

    // ── 2. Teams (delta or full) ─────────────────────────────────────────────
    let teamsQuery = supabase.from('teams').select('*')
    if (sinceIso) {
      teamsQuery = teamsQuery.gt('updated_at', sinceIso)
    }

    const { data: cloudTeams, error: teamErr } = await teamsQuery
    if (!teamErr && Array.isArray(cloudTeams) && cloudTeams.length > 0) {
      const tx = db.transaction('teams', 'readwrite')
      for (const ct of cloudTeams) {
        const cloudUpdatedAt = ct.updated_at || new Date().toISOString()
        // Last-write-wins
        const existingLocal = await tx.objectStore('teams').get(ct.id)
        if (existingLocal && isNewer(existingLocal.updated_at, cloudUpdatedAt)) {
          continue // local is newer — keep it
        }
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
      await tx.done
    }

    // ── 3. Overrides (delta or full) ─────────────────────────────────────────
    let ovrQuery = supabase.from('overrides').select('*')
    if (sinceIso) {
      ovrQuery = ovrQuery.gt('updated_at', sinceIso)
    }

    const { data: cloudOverrides, error: ovrErr } = await ovrQuery
    if (!ovrErr && Array.isArray(cloudOverrides) && cloudOverrides.length > 0) {
      const tx = db.transaction('overrides', 'readwrite')
      for (const co of cloudOverrides) {
        const cloudUpdatedAt = co.updated_at || new Date().toISOString()
        const existingLocal = await tx.objectStore('overrides').get(co.key)
        if (existingLocal && isNewer(existingLocal.updated_at, cloudUpdatedAt)) {
          continue
        }
        const localOvr: LocalOverrideRecord = {
          key: co.key,
          type: co.type || 'daily',
          data: co.data || {},
          updated_at: cloudUpdatedAt
        }
        await tx.objectStore('overrides').put(localOvr)
        pulledOverrides++
      }
      await tx.done
    }

    // ── 4. Shifts ────────────────────────────────────────────────────────────
    let shiftsQuery = supabase.from('shifts').select('*')
    if (sinceIso) {
      shiftsQuery = shiftsQuery.gt('updated_at', sinceIso)
    }
    const { data: cloudShifts, error: shiftErr } = await shiftsQuery
    if (!shiftErr && Array.isArray(cloudShifts) && cloudShifts.length > 0) {
      const mappedShifts = cloudShifts.map(s => ({
        id: s.id,
        name: s.name,
        startTime: s.start_time,
        endTime: s.end_time
      }))
      // Merge with existing local shifts (don't overwrite all if delta)
      if (sinceIso) {
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
    let settingsQuery = supabase.from('app_settings').select('*')
    if (sinceIso) {
      settingsQuery = settingsQuery.gt('updated_at', sinceIso)
    }
    const { data: cloudSettings, error: setErr } = await settingsQuery
    if (!setErr && Array.isArray(cloudSettings) && cloudSettings.length > 0) {
      for (const setting of cloudSettings) {
        if (setting.key && setting.value !== undefined && setting.value !== null) {
          const valToStore = typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value)
          localStorage.setItem(setting.key, valToStore)
        }
      }
    }

    // ── 6. Audit Logs ────────────────────────────────────────────────────────
    let auditQuery = supabase.from('audit_logs').select('*').limit(500)
    if (sinceIso) {
      auditQuery = auditQuery.gt('timestamp', sinceIso)
    }
    const { data: cloudAudits, error: auditErr } = await auditQuery
    if (!auditErr && Array.isArray(cloudAudits) && cloudAudits.length > 0) {
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

    return { success: true, logsCount: pulledLogs, teamsCount: pulledTeams, overridesCount: pulledOverrides }
  } catch (err: any) {
    console.warn('[Sync] Error in pullCloudDataFromSupabase:', err)
    return { success: false, logsCount: 0, teamsCount: 0, overridesCount: 0 }
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
  'earflow_role_options'
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
      if (val !== null && val !== undefined) {
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

// ─── DELTA SYNC (startup / periodic) ───────────────────────────────────────

/**
 * Efficient delta sync: flush outbox + push settings & shifts + pull only rows changed since last sync.
 * Does NOT do a full table dump — only fetches changed rows.
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

    // 1.5. Push local settings and shifts to cloud so local changes aren't lost
    await pushAllAppSettingsToCloud()
    await pushAllShiftsToCloud()

    // 2. Delta pull — only rows updated since last successful sync
    const sinceIso = getLastSyncAt()
    const pullResult = await pullCloudDataFromSupabase(sinceIso)

    // 3. Record sync timestamp for next delta
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

    const pullMsg = pullResult.logsCount > 0 || pullResult.teamsCount > 0
      ? ` | ${pullResult.teamsCount} tim & ${pullResult.logsCount} log baru diunduh`
      : ' | Tidak ada perubahan baru'
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
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        const tableName = payload.table
        clearTimeout(realtimeDebounceTimer)
        realtimeDebounceTimer = setTimeout(async () => {
          // If we are currently pushing/uploading or syncing, ignore echoes
          if (isSyncInProgress) return

          // Delta pull — only fetch what changed since last sync
          const sinceIso = getLastSyncAt()
          await pullCloudDataFromSupabase(sinceIso)
          setLastSyncAt(new Date().toISOString())
          if (onCloudChange) onCloudChange(tableName)
        }, 1200)
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

// ─── AUTO-INIT (network listeners) ─────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    syncStatus.value = 'syncing'
    // Flush outbox first, then delta pull
    await flushOutbox()
    await performFullSync()
  })

  window.addEventListener('offline', () => {
    syncStatus.value = 'offline'
    isCloudConnected.value = false
  })

  // Initial sync on load
  setTimeout(async () => {
    if (navigator.onLine && isCloudEnabled.value) {
      await performFullSync()
      initSupabaseRealtime()
    }
  }, 1000)
}
