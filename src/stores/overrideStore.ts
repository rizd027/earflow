import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getDB, addToOutbox } from '@/services/db'
import { supabase } from '@/supabase/client'
import { isCloudEnabled } from '@/services/supabaseSyncService'


export interface DailyOverride {
  workHours?: string
  process?: string
  targetQty?: number
  prodQty?: number
  remark?: string
}

export interface WorkerOverride {
  workerNo?: string
  workerName?: string
  process?: string
  target?: string
  remark?: string
}

const STORAGE_KEY = 'earflow_unified_cell_overrides_v1'

export const useOverrideStore = defineStore('override', () => {
  // Key: `${workerId}_${dateStr}` (e.g. "w1_2026-07-24")
  const dailyMap = ref<Record<string, DailyOverride>>({})
  
  // Key: `${workerId}`
  const workerMap = ref<Record<string, WorkerOverride>>({})

  const isLoaded = ref(false)

  /**
   * Load overrides from IndexedDB, with legacy localStorage auto-migration.
   */
  async function loadFromStorage(force = false) {
    if (isLoaded.value && !force) return
    try {
      const db = await getDB()
      const records = await db.getAll('overrides')

      if (records && records.length > 0) {
        const dMap: Record<string, DailyOverride> = {}
        const wMap: Record<string, WorkerOverride> = {}

        for (const rec of records) {
          if (rec.type === 'daily') dMap[rec.key] = rec.data
          else if (rec.type === 'worker') wMap[rec.key] = rec.data
        }

        // Preserve any active in-memory edits currently in pending queue
        for (const [k, v] of pendingPersistMap.entries()) {
          if (v.type === 'daily' && v.data) dMap[k] = v.data
          else if (v.type === 'worker' && v.data) wMap[k] = v.data
        }

        dailyMap.value = dMap
        workerMap.value = wMap
      } else {
        // Migration check from localStorage
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          dailyMap.value = parsed.daily || {}
          workerMap.value = parsed.worker || {}

          // Persist legacy data into IndexedDB
          await saveAllToIndexedDB()
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (e) {
      console.warn('Failed to load cell overrides from IndexedDB:', e)
    } finally {
      isLoaded.value = true
    }
  }

  async function saveAllToIndexedDB() {
    try {
      const db = await getDB()
      const tx = db.transaction('overrides', 'readwrite')
      await tx.objectStore('overrides').clear()

      const now = new Date().toISOString()
      for (const [key, val] of Object.entries(dailyMap.value)) {
        await tx.objectStore('overrides').put({ key, type: 'daily', data: JSON.parse(JSON.stringify(val)), updated_at: now })
      }
      for (const [key, val] of Object.entries(workerMap.value)) {
        await tx.objectStore('overrides').put({ key, type: 'worker', data: JSON.parse(JSON.stringify(val)), updated_at: now })
      }
      await tx.done
    } catch (e) {
      console.warn('Failed to save all cell overrides:', e)
    }
  }

  const pendingPersistMap = new Map<string, { type: 'daily' | 'worker'; data: any }>()
  let persistDebounceTimer: any = null

  async function flushPendingOverrides() {
    if (pendingPersistMap.size === 0) return
    const queue = Array.from(pendingPersistMap.entries())
    pendingPersistMap.clear()

    try {
      const db = await getDB()
      const tx = db.transaction('overrides', 'readwrite')
      const now = new Date().toISOString()
      const cloudUpserts: any[] = []
      const cloudDeletes: string[] = []

      for (const [key, item] of queue) {
        if (!item.data || Object.keys(item.data).length === 0) {
          await tx.objectStore('overrides').delete(key)
          cloudDeletes.push(key)
        } else {
          const payload = JSON.parse(JSON.stringify(item.data))
          // Include updated_at for delta sync & conflict resolution
          await tx.objectStore('overrides').put({ key, type: item.type, data: payload, updated_at: now })
          cloudUpserts.push({
            key,
            type: item.type,
            data: payload,
            updated_at: now
          })
        }
      }
      await tx.done

      if (isCloudEnabled.value && navigator.onLine) {
        if (cloudDeletes.length > 0) {
          for (const k of cloudDeletes) {
            supabase.from('overrides').delete().eq('key', k).then()
          }
        }
        if (cloudUpserts.length > 0) {
          supabase.from('overrides').upsert(cloudUpserts, { onConflict: 'key' }).then()
        }
      } else if (isCloudEnabled.value && !navigator.onLine) {
        // Offline: queue upserts to outbox for auto-flush when online
        for (const upsert of cloudUpserts) {
          await addToOutbox('overrides', 'upsert', upsert)
        }
      }
    } catch (e) {
      console.warn('Failed to flush overrides to IndexedDB:', e)
    }
  }

  function persistSingleOverride(key: string, type: 'daily' | 'worker', data: any) {
    pendingPersistMap.set(key, { type, data })
    clearTimeout(persistDebounceTimer)
    persistDebounceTimer = setTimeout(flushPendingOverrides, 600)
  }


  // Auto load on store creation
  loadFromStorage()

  const prefixIndex = computed<Map<string, string[]>>(() => {
    const map = new Map<string, string[]>()
    for (const key of Object.keys(dailyMap.value)) {
      const dateMatch = key.match(/(\d{4}-\d{2}-\d{2})/)
      if (!dateMatch) continue
      const dateStr = dateMatch[1]
      const dateIdx = key.indexOf(dateStr)
      if (dateIdx <= 0) continue
      const workerId = key.slice(0, dateIdx - 1)
      const prefix = `${workerId}_${dateStr}`
      const arr = map.get(prefix)
      if (arr) arr.push(key)
      else map.set(prefix, [key])
    }
    return map
  })

  function getIdVariants(workerId: string): string[] {
    const alts = [workerId]
    if (workerId.startsWith('w_')) {
      alts.push(workerId.replace('w_', 'W-'), workerId.replace('w_', ''))
    } else if (workerId.startsWith('W-')) {
      alts.push(workerId.replace('W-', 'w_'), workerId.replace('W-', ''))
    } else {
      alts.push(`w_${workerId}`, `W-${workerId}`)
    }
    return alts
  }

  function getDailyOverride(workerId: string, dateStr: string, shiftKey: string = 'default'): DailyOverride | undefined {
    if (!workerId || !dateStr) return undefined

    const altKeys = getIdVariants(workerId)
    const idx = prefixIndex.value

    let shiftMatch: DailyOverride | undefined
    let baseMatch: DailyOverride | undefined
    let allShiftsMatch: DailyOverride | undefined
    const shiftSpecificMatches: DailyOverride[] = []

    for (const wId of altKeys) {
      const prefix = `${wId}_${dateStr}`
      const keysForPrefix = idx.get(prefix)
      if (!keysForPrefix || keysForPrefix.length === 0) continue

      const shiftSpecificKey = (shiftKey && shiftKey !== 'default') ? `${prefix}_${shiftKey}` : null
      const allShiftsKey = `${prefix}_all_shifts`
      const baseKey = prefix

      for (const k of keysForPrefix) {
        if (!shiftMatch && shiftSpecificKey && k === shiftSpecificKey) {
          shiftMatch = dailyMap.value[k]
        } else if (!allShiftsMatch && k === allShiftsKey) {
          allShiftsMatch = dailyMap.value[k]
        } else if (!baseMatch && k === baseKey) {
          baseMatch = dailyMap.value[k]
        } else if (shiftKey === 'default' || shiftKey === 'all_shifts') {
          if (k !== allShiftsKey && k !== baseKey) {
            const entry = dailyMap.value[k]
            if (entry) shiftSpecificMatches.push(entry)
          }
        }
      }

      if (shiftMatch || allShiftsMatch || baseMatch || shiftSpecificMatches.length > 0) break
    }

    if (!shiftMatch && !baseMatch && !allShiftsMatch && shiftSpecificMatches.length === 0) {
      return undefined
    }

    const result: DailyOverride = {}
    const items = (shiftKey && shiftKey !== 'default')
      ? [shiftMatch, allShiftsMatch, ...shiftSpecificMatches, baseMatch].filter(Boolean) as DailyOverride[]
      : [baseMatch, shiftMatch, allShiftsMatch, ...shiftSpecificMatches].filter(Boolean) as DailyOverride[]

    for (const item of items) {
      if (result.prodQty === undefined && item.prodQty !== undefined) result.prodQty = item.prodQty
      if (result.targetQty === undefined && item.targetQty !== undefined) result.targetQty = item.targetQty
      if (result.workHours === undefined && item.workHours !== undefined) result.workHours = item.workHours
      if (result.process === undefined && item.process !== undefined) result.process = item.process
      if (result.remark === undefined && item.remark !== undefined) result.remark = item.remark
    }

    return result
  }

  function setDailyOverride(workerId: string, dateStr: string, field: keyof DailyOverride, value: any, shiftKey: string = 'default') {
    if (!workerId || !dateStr) return
    const altKeys = getIdVariants(workerId)
    const val = (field === 'targetQty' || field === 'prodQty')
      ? (value === '' || value === null || value === undefined ? 0 : (isNaN(Number(value)) ? 0 : Number(value)))
      : value

    const keysToUpdate: string[] = []
    
    if (shiftKey && shiftKey !== 'default') {
      keysToUpdate.push(`${workerId}_${dateStr}_${shiftKey}`)
      // Also update base key so overall worker stats reflect the shift edit
      keysToUpdate.push(`${workerId}_${dateStr}`)
    } else {
      // Find all existing keys for this worker & date (including shift-specific or all_shifts or base keys)
      const idx = prefixIndex.value
      for (const wId of altKeys) {
        const prefix = `${wId}_${dateStr}`
        const existingKeys = idx.get(prefix)
        if (existingKeys && existingKeys.length > 0) {
          for (const k of existingKeys) {
            if (!keysToUpdate.includes(k)) keysToUpdate.push(k)
          }
        }
      }
      // Ensure base key is always included
      const baseKey = `${workerId}_${dateStr}`
      if (!keysToUpdate.includes(baseKey)) {
        keysToUpdate.push(baseKey)
      }
    }

    // Targeted in-place mutation per key — avoids full object replace which would
    // re-trigger all computed watchers (including workerRows) and reset focused inputs.
    for (const key of keysToUpdate) {
      const existing = dailyMap.value[key] ? { ...dailyMap.value[key] } : {}
      existing[field] = val
      // Direct property assignment triggers Vue's reactive proxy for that key only
      dailyMap.value[key] = existing
      persistSingleOverride(key, 'daily', existing)
    }
  }

  function getWorkerOverride(workerId: string): WorkerOverride | undefined {
    if (!workerId) return undefined
    return workerMap.value[workerId]
  }

  function setWorkerOverride(workerId: string, field: keyof WorkerOverride, value: any) {
    if (!workerId) return
    const current = workerMap.value[workerId] ? { ...workerMap.value[workerId] } : {}
    current[field] = value
    // Targeted in-place mutation — avoids full workerMap replace
    workerMap.value[workerId] = current
    persistSingleOverride(workerId, 'worker', current)
  }

  async function updateTargetQtyForAllOverrides(dateStr?: string, newTarget?: number, workerIds?: string[]) {
    if (newTarget === undefined || isNaN(newTarget)) return
    for (const key of Object.keys(dailyMap.value)) {
      if (dateStr && !key.includes(`_${dateStr}`)) continue
      if (workerIds && workerIds.length > 0) {
        const matchesWorker = workerIds.some(wId => key.startsWith(`${wId}_`))
        if (!matchesWorker) continue
      }
      if (dailyMap.value[key].targetQty !== undefined) {
        dailyMap.value[key].targetQty = newTarget
        persistSingleOverride(key, 'daily', dailyMap.value[key])
      }
    }
  }

  async function resetDailyOverridesForDate(dateStr: string) {
    for (const key of Object.keys(dailyMap.value)) {
      if (key.endsWith(`_${dateStr}`)) {
        delete dailyMap.value[key]
        persistSingleOverride(key, 'daily', undefined)
      }
    }
  }

  async function resetWorkerOverrides(workerId: string) {
    delete workerMap.value[workerId]
    persistSingleOverride(workerId, 'worker', undefined)
    for (const key of Object.keys(dailyMap.value)) {
      if (key.startsWith(`${workerId}_`)) {
        delete dailyMap.value[key]
        persistSingleOverride(key, 'daily', undefined)
      }
    }
  }

  async function resetAllOverrides() {
    dailyMap.value = {}
    workerMap.value = {}
    localStorage.removeItem(STORAGE_KEY)
    try {
      const db = await getDB()
      await db.clear('overrides')
    } catch (e) {
      console.warn('Failed to clear overrides store in IndexedDB:', e)
    }
  }

  /**
   * Flush any pending in-memory writes THEN reload from IndexedDB.
   * Use this instead of loadFromStorage(true) after external writes (e.g. AI Scan)
   * to avoid losing in-flight user edits.
   */
  async function flushAndReload() {
    await flushPendingOverrides()
    await loadFromStorage(true)
  }

  const hasAnyOverrides = computed(() => {
    return Object.keys(dailyMap.value).length > 0 || Object.keys(workerMap.value).length > 0
  })

  return {
    dailyMap,
    workerMap,
    hasAnyOverrides,
    isLoaded,
    loadFromStorage,
    getDailyOverride,
    setDailyOverride,
    getWorkerOverride,
    setWorkerOverride,
    flushPendingOverrides,
    flushAndReload,
    saveAllToIndexedDB,
    resetDailyOverridesForDate,
    resetWorkerOverrides,
    updateTargetQtyForAllOverrides,
    resetAllOverrides
  }
})
