import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ShiftItem {
  id: string
  name: string      // e.g. "Shift Pagi"
  startTime: string // e.g. "13:00"
  endTime: string   // e.g. "20:00"
}

const STORAGE_KEY = 'earflow_shifts'

const DEFAULT_SHIFTS: ShiftItem[] = [
  { id: 'shift_7_14', name: 'Shift Pagi (07:00 - 14:00)', startTime: '07:00', endTime: '14:00' },
  { id: 'shift_pagi', name: 'Shift Pagi (06:00 - 13:00)', startTime: '06:00', endTime: '13:00' },
  { id: 'shift_siang', name: 'Shift Siang (13:00 - 20:00)', startTime: '13:00', endTime: '20:00' }
]

function loadFromStorage(): ShiftItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ShiftItem[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        const has714 = parsed.some(s => s.startTime === '07:00' && s.endTime === '14:00') || parsed.some(s => s.id === 'shift_7_14')
        if (!has714) {
          parsed.unshift({ id: 'shift_7_14', name: 'Shift Pagi (07:00 - 14:00)', startTime: '07:00', endTime: '14:00' })
          saveToStorage(parsed)
        }
        return parsed
      }
    }
  } catch {}
  return [...DEFAULT_SHIFTS]
}

function saveToStorage(shifts: ShiftItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts))
  } catch {}
}

export const useShiftStore = defineStore('shift', () => {
  const shifts = ref<ShiftItem[]>(loadFromStorage())

  // Returns time range string e.g. "13:00 - 20:00"
  function getTimeRange(shift: ShiftItem): string {
    return `${shift.startTime} - ${shift.endTime}`
  }

  // For team shift combobox: { label: "Shift Pagi (13:00 - 20:00)", value: "Shift Pagi (13:00 - 20:00)" }
  const teamShiftOptions = computed(() =>
    shifts.value.map(s => ({
      label: `${s.name} (${getTimeRange(s)})`,
      value: `${s.name} (${getTimeRange(s)})`
    }))
  )

  // For worker shift combobox: { label: "Shift Pagi (13:00 - 20:00)", value: "Shift Pagi (13:00 - 20:00)" }
  const workerShiftOptions = computed(() =>
    shifts.value.map(s => ({
      label: `${s.name} (${getTimeRange(s)})`,
      value: `${s.name} (${getTimeRange(s)})`
    }))
  )

  // For sheet tab lists in modals: { id, name, time }
  const sheetTabOptions = computed(() =>
    shifts.value.map(s => ({
      id: s.id,
      name: s.name,
      time: getTimeRange(s)
    }))
  )

  const firstShiftId = computed(() => shifts.value[0]?.id ?? 'shift_pagi')

  function formatShiftDisplay(val?: string): string {
    if (!val || val === '-' || val.trim() === '') return '-'
    const clean = val.trim().toLowerCase()
    
    // 1. Match by shift name
    let found = shifts.value.find(s => s.name.toLowerCase() === clean)
    // 2. Match by time range
    if (!found) {
      found = shifts.value.find(s => getTimeRange(s).toLowerCase() === clean)
    }
    // 3. Match by inclusion
    if (!found) {
      found = shifts.value.find(s => clean.includes(s.name.toLowerCase()) || clean.includes(getTimeRange(s).toLowerCase()))
    }
    if (found) {
      return `${found.name} (${getTimeRange(found)})`
    }
    return val
  }

  function addShift(name: string, startTime: string, endTime: string) {
    const id = `shift_${Date.now()}`
    shifts.value.push({ id, name: name.trim(), startTime: startTime.trim(), endTime: endTime.trim() })
    saveToStorage(shifts.value)
    return id
  }

  function editShift(id: string, name: string, startTime: string, endTime: string) {
    const item = shifts.value.find(s => s.id === id)
    if (!item) return
    item.name = name.trim()
    item.startTime = startTime.trim()
    item.endTime = endTime.trim()
    saveToStorage(shifts.value)
  }

  function deleteShift(id: string) {
    if (shifts.value.length <= 1) return // keep at least one
    shifts.value = shifts.value.filter(s => s.id !== id)
    saveToStorage(shifts.value)
  }

  function getShiftById(id: string): ShiftItem | undefined {
    return shifts.value.find(s => s.id === id)
  }

  // Find shift by name or formatted label (for worker shift lookup)
  // Priority: 1. Time range match, 2. Exact name match, 3. Partial name match
  function getShiftByName(name: string): ShiftItem | undefined {
    if (!name) return undefined
    const cleanInput = name.trim().toLowerCase()

    // 1. Try matching a time range embedded in the input string (e.g. "07:00 - 14:00")
    const timeMatch = cleanInput.match(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/)
    if (timeMatch) {
      const inputTime = timeMatch[0].replace(/\s/g, '')
      const foundByTime = shifts.value.find(s => {
        const sTime = getTimeRange(s).toLowerCase().replace(/\s/g, '')
        return sTime === inputTime
      })
      if (foundByTime) return foundByTime
    }

    // 2. Exact full string match (e.g. "Shift Pagi (07:00 - 14:00)")
    const foundExact = shifts.value.find(s => {
      const full = `${s.name} (${getTimeRange(s)})`.toLowerCase()
      return full === cleanInput || s.name.toLowerCase() === cleanInput
    })
    if (foundExact) return foundExact

    // 3. Partial name match (only if input has NO time range — avoids cross-shift confusion)
    if (!timeMatch) {
      const cleanName = cleanInput.replace(/\([^)]*\)/g, '').trim()
      return shifts.value.find(s => {
        const sName = s.name.toLowerCase().replace(/\([^)]*\)/g, '').trim()
        return sName === cleanName || sName.includes(cleanName) || cleanName.includes(sName)
      })
    }

    return undefined
  }

  // Get time range by shift name
  function getTimeRangeByName(name: string): string {
    const s = getShiftByName(name)
    return s ? getTimeRange(s) : name
  }

  function reloadFromStorage() {
    shifts.value = loadFromStorage()
  }

  return {
    shifts,
    teamShiftOptions,
    workerShiftOptions,
    sheetTabOptions,
    firstShiftId,
    formatShiftDisplay,
    addShift,
    editShift,
    deleteShift,
    getShiftById,
    getShiftByName,
    getTimeRange,
    getTimeRangeByName,
    reloadFromStorage
  }
})
