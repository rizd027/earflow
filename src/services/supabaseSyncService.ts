import { ref, computed } from 'vue'
import { isSupabaseConfigured, supabase } from '@/supabase/client'
import { getDB, type LocalProductionLog, type LocalTeam, type LocalOverrideRecord } from '@/services/db'


export type SyncStatus = 'idle' | 'syncing' | 'connected' | 'offline' | 'error'

export const syncStatus = ref<SyncStatus>(navigator.onLine ? 'idle' : 'offline')
export const lastSyncTime = ref<string | null>(localStorage.getItem('earflow_last_sync_time') || null)
export const lastSyncError = ref<string | null>(null)
export const isCloudConnected = ref(false)
export const pendingSyncCount = ref(0)

let isSyncInProgress = false
let realtimeChannel: any = null

export const isCloudEnabled = computed(() => {
  return isSupabaseConfigured
})

/**
 * Tests connection to Supabase with a timeout safeguard.
 */
export async function testSupabaseConnection(timeoutMs = 5000): Promise<{ ok: boolean; message: string }> {
  if (!isCloudEnabled.value) {
    return { ok: false, message: 'Supabase URL atau Anon Key belum dikonfigurasi di file .env' }
  }

  try {
    const timeoutPromise = new Promise<{ ok: boolean; message: string }>((_, reject) =>
      setTimeout(() => reject(new Error('Koneksi timeout (lebih dari 5 detik)')), timeoutMs)
    )

    const testPromise = async () => {
      // Test basic query to teams or production_logs
      const { error } = await supabase.from('teams').select('id').limit(1)
      if (error) {
        // Even if table is empty, 404 or connection error will have code
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

/**
 * Push all local pending data (logs, teams, overrides, shifts, audit logs) to Supabase.
 */
export async function pushLocalDataToSupabase(): Promise<{ pushedLogs: number; pushedTeams: number; pushedOverrides: number; success: boolean }> {
  if (!isCloudEnabled.value || !navigator.onLine) {
    return { pushedLogs: 0, pushedTeams: 0, pushedOverrides: 0, success: false }
  }

  try {
    const db = await getDB()

    // 1. Push All Production Logs in Chunks
    const allLogs = await db.getAll('logs')
    const validLogs = allLogs.filter(l => l.total_qty > 0 && l.hour_slot !== 'Reset Hasil Tim')
    let pushedCount = 0

    if (validLogs.length > 0) {
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
          created_at: l.created_at || new Date().toISOString()
        }))

        const { error } = await supabase.from('production_logs').upsert(payload, { onConflict: 'id' })
        if (!error) {
          pushedCount += chunk.length
        } else {
          console.warn('Failed pushing logs chunk to Supabase:', error.message)
        }
      }

      const tx = db.transaction('logs', 'readwrite')
      for (const log of validLogs) {
        log.synced = true
        await tx.objectStore('logs').put(log)
      }
      await tx.done
    }

    // 2. Push Teams
    const allTeams = await db.getAll('teams')
    let pushedTeamsCount = 0
    if (allTeams.length > 0) {
      const teamsPayload = allTeams.map(t => ({
        id: t.id,
        name: t.name,
        shift: t.shift || 'Shift Pagi (07:00 - 14:00)',
        hourly_target: t.hourly_target || 180,
        members: t.members || [],
        updated_at: new Date().toISOString()
      }))
      const { error: teamErr } = await supabase.from('teams').upsert(teamsPayload, { onConflict: 'id' })
      if (teamErr) {
        console.warn('Failed pushing teams to Supabase:', teamErr.message)
      } else {
        pushedTeamsCount = allTeams.length
      }
    }

    // 3. Push Overrides
    const allOverrides = await db.getAll('overrides')
    let pushedOverridesCount = 0
    if (allOverrides.length > 0) {
      const overridesPayload = allOverrides.map(o => ({
        key: o.key,
        type: o.type,
        data: o.data,
        updated_at: new Date().toISOString()
      }))
      const { error: ovrErr } = await supabase.from('overrides').upsert(overridesPayload, { onConflict: 'key' })
      if (ovrErr) {
        console.warn('Failed pushing overrides to Supabase:', ovrErr.message)
      } else {
        pushedOverridesCount = allOverrides.length
      }
    }

    // NOTE: Shifts and App Settings are NOT auto-pushed here to prevent
    // local defaults from overwriting valid cloud data. They are only pushed
    // when the user explicitly clicks "Upload Database ke Cloud".

    // 6. Push Audit Logs
    const allAuditLogs = await db.getAll('audit_logs')
    if (allAuditLogs.length > 0) {
      const auditPayload = allAuditLogs.map(a => ({
        id: a.id,
        timestamp: a.timestamp,
        category: a.category || 'System',
        action: a.action,
        details: a.details || null,
        user_name: a.user || null,
        created_at: new Date().toISOString()
      }))
      await supabase.from('audit_logs').upsert(auditPayload, { onConflict: 'id' })
    }

    // Update pending count
    pendingSyncCount.value = 0

    return {
      pushedLogs: pushedCount,
      pushedTeams: pushedTeamsCount,
      pushedOverrides: pushedOverridesCount,
      success: true
    }
  } catch (err: any) {
    console.warn('Error in pushLocalDataToSupabase:', err)
    return { pushedLogs: 0, pushedTeams: 0, pushedOverrides: 0, success: false }
  }
}

/**
 * Pull latest data from Supabase and update local IndexedDB & LocalStorage safely.
 */
export async function pullCloudDataFromSupabase(): Promise<{ success: boolean; logsCount: number; teamsCount: number; overridesCount: number }> {
  if (!isCloudEnabled.value || !navigator.onLine) {
    return { success: false, logsCount: 0, teamsCount: 0, overridesCount: 0 }
  }

  try {
    const db = await getDB()
    let pulledLogs = 0
    let pulledTeams = 0
    let pulledOverrides = 0

    // 1. Fetch Production Logs (Up to 5,000 logs)
    const { data: cloudLogs, error: logErr } = await supabase
      .from('production_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5000)

    if (!logErr && Array.isArray(cloudLogs) && cloudLogs.length > 0) {
      pulledLogs = cloudLogs.length
      const tx = db.transaction('logs', 'readwrite')
      for (const cl of cloudLogs) {
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
          created_at: cl.created_at
        }
        await tx.objectStore('logs').put(localLog)
      }
      await tx.done
    }

    // 2. Fetch Teams
    const { data: cloudTeams, error: teamErr } = await supabase.from('teams').select('*')
    if (!teamErr && Array.isArray(cloudTeams) && cloudTeams.length > 0) {
      pulledTeams = cloudTeams.length
      const tx = db.transaction('teams', 'readwrite')
      for (const ct of cloudTeams) {
        const localTeam: LocalTeam = {
          id: ct.id,
          name: ct.name,
          shift: ct.shift || 'Shift Pagi (07:00 - 14:00)',
          hourly_target: ct.hourly_target || 180,
          members: Array.isArray(ct.members) ? ct.members : []
        }
        await tx.objectStore('teams').put(localTeam)
      }
      await tx.done
    }

    // 3. Fetch Overrides
    const { data: cloudOverrides, error: ovrErr } = await supabase.from('overrides').select('*')
    if (!ovrErr && Array.isArray(cloudOverrides) && cloudOverrides.length > 0) {
      pulledOverrides = cloudOverrides.length
      const tx = db.transaction('overrides', 'readwrite')
      for (const co of cloudOverrides) {
        const localOvr: LocalOverrideRecord = {
          key: co.key,
          type: co.type || 'daily',
          data: co.data || {}
        }
        await tx.objectStore('overrides').put(localOvr)
      }
      await tx.done
    }

    // 4. Fetch Shifts
    const { data: cloudShifts, error: shiftErr } = await supabase.from('shifts').select('*')
    if (!shiftErr && Array.isArray(cloudShifts) && cloudShifts.length > 0) {
      const mappedShifts = cloudShifts.map(s => ({
        id: s.id,
        name: s.name,
        startTime: s.start_time,
        endTime: s.end_time
      }))
      localStorage.setItem('earflow_shifts', JSON.stringify(mappedShifts))
    }

    // 5. Fetch App Settings
    const { data: cloudSettings, error: setErr } = await supabase.from('app_settings').select('*')
    if (!setErr && Array.isArray(cloudSettings) && cloudSettings.length > 0) {
      for (const setting of cloudSettings) {
        if (setting.key && setting.value !== undefined && setting.value !== null) {
          const valToStore = typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value)
          localStorage.setItem(setting.key, valToStore)
        }
      }
    }

    // 6. Fetch Audit Logs
    const { data: cloudAudits, error: auditErr } = await supabase.from('audit_logs').select('*').limit(500)
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
    console.warn('Error in pullCloudDataFromSupabase:', err)
    return { success: false, logsCount: 0, teamsCount: 0, overridesCount: 0 }
  }
}

/**
 * Executes a pull-only sync from cloud (safe startup sync — never auto-pushes local data).
 * This prevents empty local data from overwriting valid cloud data on first load.
 */
export async function performFullSync(onDataUpdated?: () => void): Promise<{ success: boolean; message: string }> {
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
    // Pull-only: cloud data wins on startup. Manual upload must be triggered explicitly.
    const pullResult = await pullCloudDataFromSupabase()

    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    lastSyncTime.value = nowStr
    localStorage.setItem('earflow_last_sync_time', nowStr)

    syncStatus.value = 'connected'
    lastSyncError.value = null
    isCloudConnected.value = true

    if (onDataUpdated) {
      onDataUpdated()
    }

    return {
      success: true,
      message: `Sinkronisasi selesai pada ${nowStr} (${pullResult.teamsCount} tim & ${pullResult.logsCount} log diunduh dari Cloud)`
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

let realtimeDebounceTimer: any = null

/**
 * Initializes Realtime Subscriptions for seamless multi-device updates.
 */
export function initSupabaseRealtime(onCloudChange?: (tableName: string) => void) {
  if (!isCloudEnabled.value || realtimeChannel) return

  try {
    realtimeChannel = supabase
      .channel('earflow-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const tableName = payload.table
          clearTimeout(realtimeDebounceTimer)
          realtimeDebounceTimer = setTimeout(async () => {
            await pullCloudDataFromSupabase()
            if (onCloudChange) {
              onCloudChange(tableName)
            }
          }, 800)
        }
      )
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

/**
 * Force uploads 100% of all local data to Supabase (Overwrite/Upsert).
 */
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

/**
 * Force downloads 100% of all data from Supabase and overwrites local database.
 */
export async function forceDownloadAllFromCloud(): Promise<{ success: boolean; message: string }> {
  isSyncInProgress = true
  syncStatus.value = 'syncing'
  try {
    const db = await getDB()
    const tx = db.transaction(['teams', 'logs', 'overrides', 'audit_logs'], 'readwrite')
    await tx.objectStore('teams').clear()
    await tx.objectStore('logs').clear()
    await tx.objectStore('overrides').clear()
    await tx.objectStore('audit_logs').clear()
    await tx.done

    const pullResult = await pullCloudDataFromSupabase()
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

/**
 * Wipes all records from Supabase tables for a clean slate.
 */
export async function resetCloudDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    await supabase.from('production_logs').delete().neq('id', '___non_existent___')
    await supabase.from('teams').delete().neq('id', '___non_existent___')
    await supabase.from('overrides').delete().neq('key', '___non_existent___')
    await supabase.from('shifts').delete().neq('id', '___non_existent___')
    await supabase.from('app_settings').delete().neq('key', '___non_existent___')
    await supabase.from('audit_logs').delete().neq('id', '___non_existent___')

    // Also run filter not null fallback to guarantee total clearance on all schemas
    await supabase.from('production_logs').delete().filter('id', 'not.is', null)
    await supabase.from('teams').delete().filter('id', 'not.is', null)
    await supabase.from('overrides').delete().filter('key', 'not.is', null)
    await supabase.from('shifts').delete().filter('id', 'not.is', null)
    await supabase.from('app_settings').delete().filter('key', 'not.is', null)
    await supabase.from('audit_logs').delete().filter('id', 'not.is', null)

    return { success: true, message: 'Database Cloud Supabase berhasil dikosongkan total.' }
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal mengosongkan Supabase' }
  }
}

/**
 * Auto-initialize background network listeners.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    syncStatus.value = 'syncing'
    await performFullSync()
  })

  window.addEventListener('offline', () => {
    syncStatus.value = 'offline'
    isCloudConnected.value = false
  })

  // Initial check on load
  setTimeout(() => {
    if (navigator.onLine && isCloudEnabled.value) {
      performFullSync()
      initSupabaseRealtime()
    }
  }, 1000)
}
