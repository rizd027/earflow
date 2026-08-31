import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getDB, seedInitialLocalData, addToOutbox, type LocalProductionLog } from '@/services/db'
import { isSupabaseConfigured, supabase } from '@/supabase/client'
import { isCloudEnabled, performFullSync } from '@/services/supabaseSyncService'


export function getLocalDateStr(dateObj: Date = new Date()): string {
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}


/**
 * Generates hourly slot labels for a shift based on its start and end time.
 * e.g. startHour=7, endHour=14 → ['07:00 - 08:00', '08:00 - 09:00', ..., '13:00 - 14:00']
 */
export function generateShiftSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = []
  for (let h = startHour; h < endHour; h++) {
    const from = String(h).padStart(2, '0') + ':00'
    const to = String((h + 1) % 24).padStart(2, '0') + ':00'
    slots.push(`${from} - ${to}`)
  }
  return slots
}

// Legacy alias kept for any external reference
export const SHIFT_SLOTS = generateShiftSlots(13, 20)

export const useProductionStore = defineStore('production', () => {
  const logs = ref<LocalProductionLog[]>([])
  const isLoading = ref(false)
  const isOnline = ref(navigator.onLine)
  const currentDateStr = ref(getLocalDateStr())

  function checkDateTransition() {
    const today = getLocalDateStr()
    if (today !== currentDateStr.value) {
      currentDateStr.value = today
    }
  }

  if (typeof window !== 'undefined') {
    setInterval(checkDateTransition, 10000)
    window.addEventListener('focus', checkDateTransition)
  }

  // Listen to network changes
  window.addEventListener('online', () => {
    isOnline.value = true
    syncPendingLogs()
  })
  window.addEventListener('offline', () => {
    isOnline.value = false
  })

  const isLoaded = ref(false)

  async function loadLogs(force = false) {
    if (isLoaded.value && !force && logs.value.length > 0) return
    isLoading.value = true
    try {
      await seedInitialLocalData()
      const db = await getDB()
      const allLogs = await db.getAll('logs')
      
      // Clean up legacy negative/reset logs to prevent negative values in calculations
      const legacyResetLogs = allLogs.filter(l => l.total_qty < 0 || l.hour_slot === 'Reset Hasil Tim' || (l.notes && l.notes.includes('Reset hasil')))
      if (legacyResetLogs.length > 0) {
        const tx = db.transaction('logs', 'readwrite')
        for (const badLog of legacyResetLogs) {
          await tx.objectStore('logs').delete(badLog.id)
        }
        await tx.done
      }

      const validLogs = allLogs
        .filter(l => l.total_qty > 0 && l.hour_slot !== 'Reset Hasil Tim')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      logs.value = validLogs
      isLoaded.value = true
    } catch (err) {
      console.error('Failed loading production logs:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function addProductionLog(payload: {
    team_id: string
    team_name: string
    hour_slot: string
    total_qty: number
    present_member_ids: string[]
    photo_url?: string
    notes?: string
  }) {
    if (payload.total_qty <= 0) return

    const todayStr = currentDateStr.value
    const present_count = payload.present_member_ids.length || 1
    const now = new Date().toISOString()

    const newLog: LocalProductionLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      team_id: payload.team_id,
      team_name: payload.team_name,
      date: todayStr,
      hour_slot: payload.hour_slot,
      total_qty: payload.total_qty,
      present_count,
      present_member_ids: [...payload.present_member_ids],
      photo_url: payload.photo_url,
      notes: payload.notes,
      synced: false,
      created_at: now,
      updated_at: now   // ← delta sync timestamp
    }

    // Save locally to IndexedDB immediately for zero latency & offline resilience
    const db = await getDB()
    await db.put('logs', JSON.parse(JSON.stringify(newLog)))

    // Unshift to reactive list
    logs.value.unshift(newLog)

    // Try immediate push to Supabase if online
    if (isOnline.value && isSupabaseConfigured) {
      await syncSingleLogToSupabase(newLog)
    } else {
      // Queue in outbox for auto-flush when online
      await addToOutbox('logs', 'upsert', {
        id: newLog.id,
        team_id: newLog.team_id,
        team_name: newLog.team_name,
        date: newLog.date,
        hour_slot: newLog.hour_slot,
        total_qty: newLog.total_qty,
        present_count: newLog.present_count,
        present_member_ids: newLog.present_member_ids,
        photo_url: newLog.photo_url || null,
        notes: newLog.notes || null,
        created_at: newLog.created_at,
        updated_at: newLog.updated_at
      })
    }
  }

  async function resetTeamTodayLogs(teamId: string) {
    const today = currentDateStr.value
    const db = await getDB()
    
    // Find logs for today for this team
    const toRemove = logs.value.filter(l => l.team_id === teamId && l.date === today)
    if (toRemove.length > 0) {
      const tx = db.transaction('logs', 'readwrite')
      for (const log of toRemove) {
        await tx.objectStore('logs').delete(log.id)
      }
      await tx.done

      const logIds = toRemove.map(l => l.id)
      if (isCloudEnabled.value && navigator.onLine) {
        supabase.from('production_logs').delete().in('id', logIds).then()
      } else if (isCloudEnabled.value) {
        for (const id of logIds) {
          await addToOutbox('logs', 'delete', { id })
        }
      }
    }

    logs.value = logs.value.filter(l => !(l.team_id === teamId && l.date === today))
  }

  async function setTeamTodayOutput(teamId: string, teamName: string, targetOutput: number, presentMemberIds: string[]) {
    await resetTeamTodayLogs(teamId)
    if (targetOutput > 0) {
      await addProductionLog({
        team_id: teamId,
        team_name: teamName,
        hour_slot: 'Hasil Input Tim',
        total_qty: targetOutput,
        present_member_ids: presentMemberIds,
        notes: 'Input hasil produksi tim'
      })
    }
  }

  async function syncSingleLogToSupabase(log: LocalProductionLog) {
    if (!isCloudEnabled.value || !isOnline.value) return
    try {
      const now = new Date().toISOString()
      const { error } = await supabase.from('production_logs').upsert({
        id: log.id,
        team_id: log.team_id,
        team_name: log.team_name,
        date: log.date,
        hour_slot: log.hour_slot,
        total_qty: log.total_qty,
        present_count: log.present_count,
        present_member_ids: log.present_member_ids || [],
        photo_url: log.photo_url || null,
        notes: log.notes || null,
        created_at: log.created_at,
        updated_at: log.updated_at || now   // ← include updated_at for delta sync
      }, { onConflict: 'id' })

      if (!error) {
        log.synced = true
        const db = await getDB()
        await db.put('logs', JSON.parse(JSON.stringify(log)))
      } else {
        console.warn('Supabase production log sync notice:', error.message)
      }
    } catch (err) {
      console.warn('Background sync exception:', err)
    }
  }

  async function syncPendingLogs() {
    if (!isOnline.value || !isCloudEnabled.value) return
    try {
      await performFullSync(() => loadLogs(true))
    } catch (e) {
      console.warn('Full sync warning in production store:', e)
    }
  }


  // Analytics Computations for current date (today)
  const todayLogs = computed(() => {
    const today = currentDateStr.value
    return logs.value.filter(l => l.date === today && l.total_qty > 0)
  })

  const totalShiftOutput = computed(() => {
    return todayLogs.value.reduce((acc, log) => acc + log.total_qty, 0)
  })

  const pendingSyncCount = computed(() => {
    return logs.value.filter(l => !l.synced).length
  })

  const hourlyAverage = computed(() => {
    if (todayLogs.value.length === 0) return 0
    return Math.round(totalShiftOutput.value / todayLogs.value.length)
  })

  return {
    logs,
    isLoading,
    isOnline,
    currentDateStr,
    todayLogs,
    totalShiftOutput,
    pendingSyncCount,
    hourlyAverage,
    loadLogs,
    addProductionLog,
    resetTeamTodayLogs,
    setTeamTodayOutput,
    syncPendingLogs
  }
})
