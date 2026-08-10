import type { LocalProductionLog } from '@/services/db'

export const DEFAULT_DAILY_TARGET = 500

/**
 * Determines whether a worker is included in a specific production log.
 * If present_member_ids exists and is non-empty, the worker MUST be explicitly listed.
 * Otherwise, fallback to matching team_id or team_name (legacy log support).
 */
export function isWorkerInLog(
  log: LocalProductionLog,
  worker: { id: string; no_karyawan?: string; full_name: string; team_id?: string; team_name?: string }
): boolean {
  if (!log || log.total_qty <= 0 || log.hour_slot === 'Reset Hasil Tim') return false

  const wId = worker.id ? worker.id.toLowerCase().trim() : ''
  const wNo = worker.no_karyawan ? worker.no_karyawan.toLowerCase().trim() : ''
  const wName = worker.full_name ? worker.full_name.toLowerCase().trim() : ''

  const wNumId = wId.replace(/\D/g, '')
  const wNumNo = wNo.replace(/\D/g, '')

  const hasPresentList = Array.isArray(log.present_member_ids) && log.present_member_ids.length > 0
  if (hasPresentList) {
    const matchesPresent = log.present_member_ids.some(id => {
      if (!id) return false
      const idClean = id.toLowerCase().trim()
      const idNum = idClean.replace(/\D/g, '')

      if (wId && idClean === wId) return true
      if (wNo && idClean === wNo) return true
      if (wName && (idClean === wName || idClean.includes(wName) || wName.includes(idClean))) return true
      if (idNum && ((wNumId && idNum === wNumId) || (wNumNo && idNum === wNumNo))) return true

      return false
    })

    if (matchesPresent) return true
  }

  // Fallback for legacy logs or matching team membership
  const teamIdMatch = !!log.team_id && !!worker.team_id && log.team_id === worker.team_id
  const teamNameMatch = !!log.team_name && !!worker.team_name && log.team_name.toLowerCase().trim() === worker.team_name.toLowerCase().trim()
  return teamIdMatch || teamNameMatch
}

/**
 * Calculates the individual production output share for a worker from a log.
 */
export function getWorkerShareForLog(
  log: LocalProductionLog,
  teamMemberCount: number = 1
): number {
  if (!log || log.total_qty <= 0 || log.hour_slot === 'Reset Hasil Tim') return 0
  const count = log.present_count || (log.present_member_ids && log.present_member_ids.length > 0 ? log.present_member_ids.length : teamMemberCount) || 1
  return Math.floor(log.total_qty / Math.max(1, count))
}

/**
 * High-performance O(Logs + Workers) calculator for worker production shares on a specific date.
 * Replaces O(Workers * Logs) nested filtering for instant UI performance.
 */
export function calculateWorkerProdMap(
  dateStr: string,
  allWorkers: Array<{ id: string; no_karyawan?: string; full_name: string; team_id?: string; team_name?: string }>,
  logs: LocalProductionLog[]
): Map<string, number> {
  const prodMap = new Map<string, number>()

  if (!logs || logs.length === 0 || !allWorkers || allWorkers.length === 0) {
    return prodMap
  }

  // Pre-filter logs for the target date
  const logsForDate = logs.filter(
    l => l.date === dateStr && l.total_qty > 0 && l.hour_slot !== 'Reset Hasil Tim'
  )

  if (logsForDate.length === 0) return prodMap

  // Pre-build worker lookup indexes for instant matching
  const idToWorker = new Map<string, typeof allWorkers[0]>()
  const teamToWorkers = new Map<string, Array<typeof allWorkers[0]>>()

  for (const w of allWorkers) {
    prodMap.set(w.id, 0)
    if (w.id) idToWorker.set(w.id.toLowerCase().trim(), w)
    if (w.no_karyawan) idToWorker.set(w.no_karyawan.toLowerCase().trim(), w)
    if (w.full_name) idToWorker.set(w.full_name.toLowerCase().trim(), w)

    const teamKey = w.team_id || (w.team_name ? w.team_name.toLowerCase().trim() : '')
    if (teamKey) {
      let tList = teamToWorkers.get(teamKey)
      if (!tList) {
        tList = []
        teamToWorkers.set(teamKey, tList)
      }
      tList.push(w)
    }
  }

  for (const log of logsForDate) {
    const hasPresentList = Array.isArray(log.present_member_ids) && log.present_member_ids.length > 0
    let matchedWorkers: Array<typeof allWorkers[0]> = []

    if (hasPresentList) {
      for (const rawId of log.present_member_ids!) {
        if (!rawId) continue
        const cleanId = rawId.toLowerCase().trim()
        const directMatch = idToWorker.get(cleanId)
        if (directMatch) {
          if (!matchedWorkers.includes(directMatch)) matchedWorkers.push(directMatch)
        } else {
          for (const w of allWorkers) {
            if (isWorkerInLog(log, w) && !matchedWorkers.includes(w)) {
              matchedWorkers.push(w)
            }
          }
        }
      }
    } else {
      const tKey = log.team_id || (log.team_name ? log.team_name.toLowerCase().trim() : '')
      if (tKey && teamToWorkers.has(tKey)) {
        matchedWorkers = teamToWorkers.get(tKey)!
      }
    }

    if (matchedWorkers.length > 0) {
      const share = getWorkerShareForLog(log, matchedWorkers.length)
      for (const w of matchedWorkers) {
        const curr = prodMap.get(w.id) || 0
        prodMap.set(w.id, curr + share)
      }
    }
  }

  return prodMap
}

/**
 * Checks whether a worker belongs to a specific shift (by worker shift or team shift).
 * 
 * Matching priority:
 * 1. Shift ID match (e.g. 'shift_pagi' === worker.shift)
 * 2. Shift Name match (e.g. worker.shift contains 'Shift Pagi')
 * 3. Shift Time match (e.g. worker.shift contains '06:00 - 13:00')
 * 4. Fallback: no shift on worker or team → show on all shift tabs
 */
export function isWorkerMatchingShift(
  worker: { shift?: string; team_id?: string },
  shiftObj: { id?: string; name: string; time?: string } | undefined,
  teams: Array<{ id: string; shift?: string }> = []
): boolean {
  if (!shiftObj || !shiftObj.name) return true

  const targetId   = (shiftObj.id   || '').trim().toLowerCase()
  const targetName = (shiftObj.name || '').trim().toLowerCase()
  const targetTime = (shiftObj.time || '').trim().toLowerCase()

  const timeInTargetMatch = targetName.match(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/)
  const extractedTargetTime = targetTime || (timeInTargetMatch ? timeInTargetMatch[0] : '')

  const workerShift = (worker.shift || '').trim().toLowerCase()
  const workerTeam  = teams.find(t => t.id === worker.team_id)
  const teamShift   = (workerTeam?.shift || '').trim().toLowerCase()

  function matches(str: string): boolean {
    if (!str) return false
    const strLower = str.toLowerCase().trim()

    // 1. Exact ID or Name match
    if (targetId && (strLower === targetId || strLower.replace(/_/g, ' ') === targetId.replace(/_/g, ' '))) {
      return true
    }
    if (targetName && strLower === targetName) {
      return true
    }

    // 2. Time string match: e.g. '07:00 - 14:00'
    if (extractedTargetTime && strLower.includes(extractedTargetTime.toLowerCase())) {
      return true
    }

    // 3. Name match when time is not conflicting
    const cleanTargetName = targetName.replace(/\([^)]*\)/g, '').trim()
    const strClean = strLower.replace(/\([^)]*\)/g, '').trim()
    const strTimeMatch = strLower.match(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/)

    // If both target and str have explicit time ranges, and they don't match, don't match!
    if (extractedTargetTime && strTimeMatch && extractedTargetTime.toLowerCase() !== strTimeMatch[0].toLowerCase()) {
      return false
    }

    if (cleanTargetName && strClean && (strClean.includes(cleanTargetName) || cleanTargetName.includes(strClean))) {
      return true
    }

    return false
  }

  // 1. Check worker's own shift field
  if (workerShift && matches(workerShift)) return true

  // 2. Fallback: check team's shift field
  if (teamShift && matches(teamShift)) return true

  // 3. Worker and team have no shift assigned → show on ALL shift tabs
  if (!workerShift && !teamShift) return true

  return false
}

/**
 * Calculates working days count relative to a targetDate (defaults to today).
 */
export function getWorkerWorkingDays(joinedDateStr?: string, targetDateStr?: string): number {
  if (!joinedDateStr) return 1
  const joinedDate = new Date(joinedDateStr)
  if (isNaN(joinedDate.getTime())) return 1
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date()
  if (isNaN(targetDate.getTime())) return 1

  const d1 = new Date(joinedDate.getFullYear(), joinedDate.getMonth(), joinedDate.getDate())
  const d2 = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
  const diffTime = d2.getTime() - d1.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays + 1)
}

/**
 * Determines whether a worker is in their initial 7-day "Baru" (New) interval relative to a target date.
 */
export function isWorkerNewOnDate(joinedDateStr?: string, targetDateStr?: string, maxDays: number = 7): boolean {
  if (!joinedDateStr) return false
  const joinedDate = new Date(joinedDateStr)
  if (isNaN(joinedDate.getTime())) return false
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date()
  if (isNaN(targetDate.getTime())) return false

  const d1 = new Date(joinedDate.getFullYear(), joinedDate.getMonth(), joinedDate.getDate())
  const d2 = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
  const diffDays = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays < maxDays
}

