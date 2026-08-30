import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getDB, seedInitialLocalData, type LocalTeam } from '@/services/db'
import { getLocalDateStr } from '@/stores/productionStore'
import { NO_KARYAWAN_LIST, matchWorkerToNikRecord, isTempWorkerNo } from '@/data/noKaryawanData'
import { useShiftStore } from '@/stores/shiftStore'
import { supabase } from '@/supabase/client'
import { isCloudEnabled } from '@/services/supabaseSyncService'


export interface WorkerItem {
  id: string
  full_name: string
  role: string
  avatar_url?: string
  team_id: string
  team_name: string
  no_karyawan?: string
  joined_date?: string
  phone_number?: string
  shift?: string
  status?: string
  exit_date?: string // YYYY-MM: month this worker exited
}

export const UNASSIGNED_TEAM_ID = 'unassigned'
export const UNASSIGNED_TEAM_NAME = 'Belum Masuk Tim'

export const useTeamStore = defineStore('team', () => {
  const teams = ref<LocalTeam[]>([])
  const unassignedMembers = ref<Array<{
    id: string
    full_name: string
    role: string
    avatar_url?: string
    no_karyawan?: string
    joined_date?: string
    phone_number?: string
    shift?: string
    status?: string
    exit_date?: string
  }>>([])
  const isLoading = ref(false)
  const isLoaded = ref(false)

  async function loadTeams(force = false) {
    if (isLoaded.value && !force && teams.value.length > 0) return
    isLoading.value = true
    try {
      await seedInitialLocalData()
      const db = await getDB()
      const fetched = await db.getAll('teams')

      // Separate real production teams from unassigned pseudo-team if stored
      const realTeams: LocalTeam[] = []
      let unassignedList: Array<{ id: string; full_name: string; role: string; avatar_url?: string; no_karyawan?: string; joined_date?: string; phone_number?: string; shift?: string; status?: string; exit_date?: string }> = []

      for (const team of fetched) {
        if (team.id === UNASSIGNED_TEAM_ID) {
          unassignedList = team.members || []
        } else {
          realTeams.push(team)
        }
      }

      teams.value = realTeams
      unassignedMembers.value = unassignedList

      // Auto-sync worker NIKs against master no_karyawan list
      await autoSyncNoKaryawan(realTeams, unassignedList)
      isLoaded.value = true
    } catch (err) {
      console.error('Failed to load teams from local db:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function autoSyncNoKaryawan(realTeamsList: LocalTeam[], unassignedList: any[]) {
    let hasChanges = false
    const existingNiks = new Set<string>()

    const EXITED_WORKER_NAMES = new Set([
      'fikriarifin', 'fikriarifini',
      'anggunlestari',
      'dheniakbar', 'dheniakbark',
      'natama',
      'sevvi',
      'nadhira',
      'ichanandalifola',
      'fatimaaprilia', 'fatimaaprillia',
      'anesaputri',
      'saskia',
      'nabiladwi',
      'nurulafidatun',
      'sindysetya',
      'putriajarsari', 'putrianjarsarisulasmi',
      'anandaputri', 'anandaputrieronika',
      'dwisintya', 'dwisintyaindah'
    ])

    // 1. Process real teams
    for (const team of realTeamsList) {
      let teamChanged = false
      for (const member of team.members) {
        if (member.no_karyawan && !isTempWorkerNo(member.no_karyawan)) {
          existingNiks.add(member.no_karyawan.trim())
        }
        const matched = matchWorkerToNikRecord(member.full_name)
        if (matched && member.no_karyawan !== matched.no_karyawan) {
          member.no_karyawan = matched.no_karyawan
          existingNiks.add(matched.no_karyawan)
          teamChanged = true
          hasChanges = true
        }

        const cleanName = member.full_name.toLowerCase().replace(/\\/g, '').replace(/[^a-z0-9]/g, '')
        if (EXITED_WORKER_NAMES.has(cleanName) && member.status !== 'Keluar') {
          member.status = 'Keluar'
          // Mark as exited before the current month so they're hidden from now on
          if (!member.exit_date) member.exit_date = '2026-07'
          teamChanged = true
          hasChanges = true
        } else if (EXITED_WORKER_NAMES.has(cleanName) && member.status === 'Keluar' && !member.exit_date) {
          member.exit_date = '2026-07'
          teamChanged = true
          hasChanges = true
        }
      }
      if (teamChanged) {
        await saveTeamToDB(team)
      }
    }

    // 2. Process unassigned pool
    let unassignedChanged = false
    for (const member of unassignedList) {
      if (member.no_karyawan && !isTempWorkerNo(member.no_karyawan)) {
        existingNiks.add(member.no_karyawan.trim())
      }
      const matched = matchWorkerToNikRecord(member.full_name)
      if (matched && member.no_karyawan !== matched.no_karyawan) {
        member.no_karyawan = matched.no_karyawan
        existingNiks.add(matched.no_karyawan)
        unassignedChanged = true
        hasChanges = true
      }

      const cleanName = member.full_name.toLowerCase().replace(/\\/g, '').replace(/[^a-z0-9]/g, '')
      if (EXITED_WORKER_NAMES.has(cleanName) && member.status !== 'Keluar') {
        member.status = 'Keluar'
        if (!member.exit_date) member.exit_date = '2026-07'
        unassignedChanged = true
        hasChanges = true
      } else if (EXITED_WORKER_NAMES.has(cleanName) && member.status === 'Keluar' && !member.exit_date) {
        member.exit_date = '2026-07'
        unassignedChanged = true
        hasChanges = true
      }
    }

    // 3. Add missing records from NO_KARYAWAN_LIST if not seeded yet or if DB has 0 workers
    const totalWorkersInDB = existingNiks.size
    const isAlreadySeeded = localStorage.getItem('earflow_initial_nik_seeded_v1') === 'true'
    if (!isAlreadySeeded || totalWorkersInDB === 0) {
      for (const rec of NO_KARYAWAN_LIST) {
        if (!existingNiks.has(rec.no_karyawan)) {
          const cleanRecName = rec.nama.trim().replace(/\\/g, '').toLowerCase()
          const cleanKey = cleanRecName.replace(/[^a-z0-9]/g, '')
          const existsByName = unassignedList.some(m => m.full_name.trim().replace(/\\/g, '').toLowerCase() === cleanRecName) ||
            realTeamsList.some(t => t.members.some(m => m.full_name.trim().replace(/\\/g, '').toLowerCase() === cleanRecName))

          if (!existsByName) {
            const isExited = EXITED_WORKER_NAMES.has(cleanKey)
            unassignedList.push({
              id: `W-${rec.no_karyawan}`,
              full_name: rec.nama.trim().replace(/\\/g, ''),
              role: 'Operator Solder',
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(rec.nama)}`,
              no_karyawan: rec.no_karyawan,
              joined_date: '2026-07-06',
              phone_number: '-',
              shift: 'Shift Pagi (07:00 - 14:00)',
              status: isExited ? 'Keluar' : 'Aktif',
              exit_date: isExited ? '2026-07' : undefined
            })
            existingNiks.add(rec.no_karyawan)
            unassignedChanged = true
            hasChanges = true
          }
        }
      }
      localStorage.setItem('earflow_initial_nik_seeded_v1', 'true')
    }

    if (unassignedChanged) {
      unassignedMembers.value = unassignedList
      await saveUnassignedToDB()
    }
    if (hasChanges) {
      // Auto-sync completed
    }
  }

  async function saveTeamToDB(team: LocalTeam) {
    const db = await getDB()
    const payload = JSON.parse(JSON.stringify(team))
    await db.put('teams', payload)
    if (isCloudEnabled.value && navigator.onLine) {
      supabase.from('teams').upsert({
        id: team.id,
        name: team.name,
        shift: team.shift || 'Shift Pagi (07:00 - 14:00)',
        hourly_target: team.hourly_target || 180,
        members: team.members || [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' }).then()
    }
  }

  async function saveUnassignedToDB() {
    const db = await getDB()
    const unassignedTeamObj: LocalTeam = {
      id: UNASSIGNED_TEAM_ID,
      name: UNASSIGNED_TEAM_NAME,
      shift: '-',
      hourly_target: 0,
      members: JSON.parse(JSON.stringify(unassignedMembers.value))
    }
    await db.put('teams', JSON.parse(JSON.stringify(unassignedTeamObj)))
    if (isCloudEnabled.value && navigator.onLine) {
      supabase.from('teams').upsert({
        id: UNASSIGNED_TEAM_ID,
        name: UNASSIGNED_TEAM_NAME,
        shift: '-',
        hourly_target: 0,
        members: unassignedTeamObj.members,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' }).then()
    }
  }


  async function addTeam(name: string, target: number, shift?: string) {
    const shiftStore = useShiftStore()
    const defaultShift = shift || (shiftStore.shifts[0] ? `${shiftStore.shifts[0].name} (${shiftStore.shifts[0].startTime} - ${shiftStore.shifts[0].endTime})` : '13:00 - 20:00')
    const newTeam: LocalTeam = {
      id: `team_${Date.now()}`,
      name,
      shift: defaultShift,
      hourly_target: target,
      members: []
    }
    teams.value.push(newTeam)
    await saveTeamToDB(newTeam)
  }

  async function updateTeam(teamId: string, name: string, target: number, shift?: string) {
    const team = teams.value.find(t => t.id === teamId)
    if (!team) return
    team.name = name
    team.hourly_target = target
    if (shift) team.shift = shift
    await saveTeamToDB(team)
  }

  async function deleteTeam(teamId: string) {
    const teamToDelete = teams.value.find(t => t.id === teamId)
    if (teamToDelete && teamToDelete.members.length > 0) {
      // Move members of deleted team to unassigned pool
      unassignedMembers.value.push(...teamToDelete.members)
      await saveUnassignedToDB()
    }
    teams.value = teams.value.filter(t => t.id !== teamId)
    const db = await getDB()
    await db.delete('teams', teamId)
    if (isCloudEnabled.value && navigator.onLine) {
      supabase.from('teams').delete().eq('id', teamId).then()
    }
  }

  async function deleteAllTeams() {
    // Move all members from every team into the unassigned pool first
    for (const team of teams.value) {
      if (team.members.length > 0) {
        unassignedMembers.value.push(...team.members)
      }
    }
    if (unassignedMembers.value.length > 0) {
      await saveUnassignedToDB()
    }

    // Delete all team records from DB
    const db = await getDB()
    const teamIds = teams.value.map(t => t.id)
    for (const id of teamIds) {
      await db.delete('teams', id)
    }
    if (isCloudEnabled.value && navigator.onLine && teamIds.length > 0) {
      supabase.from('teams').delete().in('id', teamIds).then()
    }
    teams.value = []
  }


  // Add new worker directly to Master Directory without assigning to any team yet
  async function addUnassignedWorker(
    memberName: string, 
    role: string, 
    noKaryawan?: string, 
    joinedDate?: string, 
    phoneNumber?: string,
    shift?: string,
    status?: string
  ) {
    const cleanName = memberName.trim()
    const cleanNo = noKaryawan && !isTempWorkerNo(noKaryawan) && noKaryawan !== '-' ? noKaryawan.trim() : ''

    // BUG FIX: Only prevent duplicate by NIK (unique identifier).
    // Name is NOT a unique key — multiple workers can share the same name.
    // If NIK is empty, always allow adding as a new distinct worker.
    const existing = cleanNo
      ? allWorkers.value.find(w =>
          w.no_karyawan &&
          !isTempWorkerNo(w.no_karyawan) &&
          w.no_karyawan.trim().toLowerCase() === cleanNo.toLowerCase()
        )
      : undefined

    if (existing) {
      // NIK collision: update existing worker data instead of creating duplicate
      await editMember(
        existing.team_id,
        existing.id,
        cleanName,
        role || existing.role,
        UNASSIGNED_TEAM_ID,
        cleanNo || existing.no_karyawan,
        joinedDate || existing.joined_date,
        phoneNumber || existing.phone_number,
        shift || existing.shift,
        status || 'Baru'
      )
      return
    }

    const workerId = cleanNo ? `W-${cleanNo}` : `w_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    const newWorker = {
      id: workerId,
      full_name: cleanName,
      role: role || 'Operator Solder',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`,
      no_karyawan: cleanNo || '',
      joined_date: joinedDate || getLocalDateStr(),
      phone_number: phoneNumber || '-',
      shift: shift || 'Shift Pagi',
      status: status || 'Baru'
    }
    unassignedMembers.value.push(newWorker)
    await saveUnassignedToDB()
  }

  async function addMemberToTeam(
    teamId: string, 
    memberName: string, 
    role: string, 
    noKaryawan?: string, 
    joinedDate?: string, 
    phoneNumber?: string,
    shift?: string,
    status?: string
  ) {
    const team = teams.value.find(t => t.id === teamId)
    if (!team) return

    const cleanName = memberName.trim()
    const cleanNo = noKaryawan && !isTempWorkerNo(noKaryawan) && noKaryawan !== '-' ? noKaryawan.trim() : ''

    // BUG FIX: Only prevent duplicate by NIK — never by name alone.
    const existing = cleanNo
      ? allWorkers.value.find(w =>
          w.no_karyawan &&
          !isTempWorkerNo(w.no_karyawan) &&
          w.no_karyawan.trim().toLowerCase() === cleanNo.toLowerCase()
        )
      : undefined

    const targetShift = shift || existing?.shift || 'Shift Pagi'

    if (existing) {
      // NIK collision: move existing worker to target team
      await editMember(
        existing.team_id,
        existing.id,
        cleanName,
        role || existing.role,
        teamId,
        cleanNo || existing.no_karyawan,
        joinedDate || existing.joined_date,
        phoneNumber || existing.phone_number,
        targetShift,
        status || existing.status || 'Aktif'
      )
      return
    }

    const workerId = cleanNo ? `W-${cleanNo}` : `w_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    const newMember = {
      id: workerId,
      full_name: cleanName,
      role: role || 'Operator Solder',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`,
      no_karyawan: cleanNo || '',
      joined_date: joinedDate || getLocalDateStr(),
      phone_number: phoneNumber || '-',
      shift: targetShift,
      status: status || 'Aktif'
    }
    team.members.push(newMember)
    await saveTeamToDB(team)
  }

  async function assignOrAddMemberToTeam(
    targetTeamId: string, 
    nameOrId: string, 
    role: string, 
    noKaryawan?: string, 
    joinedDate?: string, 
    phoneNumber?: string,
    shift?: string,
    status?: string
  ) {
    const searchKey = nameOrId.trim().toLowerCase()
    const cleanNo = noKaryawan && !isTempWorkerNo(noKaryawan) && noKaryawan !== '-'
      ? noKaryawan.trim().toLowerCase()
      : ''

    // BUG FIX: Match by ID first, then by NIK only (not by name — name is not unique).
    const existingWorker = allWorkers.value.find(w =>
      w.id.toLowerCase() === searchKey ||
      (cleanNo && w.no_karyawan && !isTempWorkerNo(w.no_karyawan) && w.no_karyawan.trim().toLowerCase() === cleanNo)
    )

    const targetShift = shift || existingWorker?.shift || 'Shift Pagi'

    if (existingWorker) {
      await editMember(
        existingWorker.team_id, 
        existingWorker.id, 
        existingWorker.full_name, 
        role || existingWorker.role, 
        targetTeamId, 
        noKaryawan || existingWorker.no_karyawan, 
        joinedDate || existingWorker.joined_date, 
        phoneNumber || existingWorker.phone_number,
        targetShift,
        status || existingWorker.status
      )
    } else {
      if (targetTeamId === UNASSIGNED_TEAM_ID || !targetTeamId) {
        await addUnassignedWorker(nameOrId, role, noKaryawan, joinedDate, phoneNumber, targetShift, status)
      } else {
        await addMemberToTeam(targetTeamId, nameOrId, role, noKaryawan, joinedDate, phoneNumber, targetShift, status)
      }
    }
  }

  async function editMember(
    currentTeamId: string, 
    memberId: string, 
    newName: string, 
    newRole: string, 
    newTeamId?: string,
    noKaryawan?: string,
    joinedDate?: string,
    phoneNumber?: string,
    shift?: string,
    status?: string
  ) {
    let memberObj: { 
      id: string; 
      full_name: string; 
      role: string; 
      avatar_url?: string;
      no_karyawan?: string;
      joined_date?: string;
      phone_number?: string;
      shift?: string;
      status?: string;
      exit_date?: string;
    } | null = null

    const targetTeamId = newTeamId || currentTeamId

    // 1. Search unassigned members pool — by ID only to avoid hitting wrong member with same name
    const unassignedIdx = unassignedMembers.value.findIndex(m => m.id === memberId)
    if (unassignedIdx !== -1) {
      memberObj = unassignedMembers.value[unassignedIdx]
      memberObj.full_name = newName
      memberObj.role = newRole
      const cleanNo = noKaryawan && !isTempWorkerNo(noKaryawan) && noKaryawan !== '-' ? noKaryawan.trim() : ''
      if (noKaryawan !== undefined) memberObj.no_karyawan = cleanNo
      if (joinedDate !== undefined && joinedDate !== '') memberObj.joined_date = joinedDate
      memberObj.phone_number = phoneNumber !== undefined ? (phoneNumber || '-') : (memberObj.phone_number || '-')
      if (shift !== undefined && shift !== '') memberObj.shift = shift
      if (status !== undefined && status !== '') {
        // Auto-record the exit month when status is first changed to 'Keluar'
        const isBecomingExited = (status.toLowerCase().includes('keluar') || status.toLowerCase().includes('out'))
        const wasNotExited = !(memberObj.status || '').toLowerCase().includes('keluar')
        if (isBecomingExited && wasNotExited && !memberObj.exit_date) {
          const now = new Date()
          memberObj.exit_date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        }
        memberObj.status = status
      }

      if (targetTeamId && targetTeamId !== UNASSIGNED_TEAM_ID) {
        unassignedMembers.value.splice(unassignedIdx, 1)
        await saveUnassignedToDB()

        const targetTeam = teams.value.find(t => t.id === targetTeamId)
        if (targetTeam) {
          targetTeam.members.push(memberObj)
          await saveTeamToDB(targetTeam)
        }
      } else {
        await saveUnassignedToDB()
      }
      return
    }

    // 2. Search across assigned teams — by ID only to avoid hitting wrong member with same name
    let sourceTeam = teams.value.find(t => t.id === currentTeamId)
    let memberIndex = sourceTeam ? sourceTeam.members.findIndex(m => m.id === memberId) : -1

    if (!sourceTeam || memberIndex === -1) {
      for (const t of teams.value) {
        const idx = t.members.findIndex(m => m.id === memberId)
        if (idx !== -1) {
          sourceTeam = t
          memberIndex = idx
          break
        }
      }
    }

    if (!sourceTeam || memberIndex === -1) return

    memberObj = sourceTeam.members[memberIndex]
    memberObj.full_name = newName
    memberObj.role = newRole
    const cleanNo = noKaryawan && !isTempWorkerNo(noKaryawan) && noKaryawan !== '-' ? noKaryawan.trim() : ''
    if (noKaryawan !== undefined) memberObj.no_karyawan = cleanNo
    if (joinedDate !== undefined && joinedDate !== '') memberObj.joined_date = joinedDate
    memberObj.phone_number = phoneNumber !== undefined ? (phoneNumber || '-') : (memberObj.phone_number || '-')
    if (shift !== undefined && shift !== '') memberObj.shift = shift
    if (status !== undefined && status !== '') {
      // Auto-record the exit month when status is first changed to 'Keluar'
      const isBecomingExited = (status.toLowerCase().includes('keluar') || status.toLowerCase().includes('out'))
      const wasNotExited = !(memberObj.status || '').toLowerCase().includes('keluar')
      if (isBecomingExited && wasNotExited && !memberObj.exit_date) {
        const now = new Date()
        memberObj.exit_date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      }
      memberObj.status = status
    }

    if (targetTeamId !== sourceTeam.id) {
      sourceTeam.members.splice(memberIndex, 1)
      await saveTeamToDB(sourceTeam)

      if (targetTeamId === UNASSIGNED_TEAM_ID) {
        unassignedMembers.value.push(memberObj)
        await saveUnassignedToDB()
      } else {
        const targetTeam = teams.value.find(t => t.id === targetTeamId)
        if (targetTeam) {
          targetTeam.members.push(memberObj)
          await saveTeamToDB(targetTeam)
        }
      }
    } else {
      await saveTeamToDB(sourceTeam)
    }
  }

  async function deleteMember(teamId: string, memberId: string, permanent: boolean = false) {
    if (teamId === UNASSIGNED_TEAM_ID || permanent) {
      unassignedMembers.value = unassignedMembers.value.filter(m => m.id !== memberId)
      await saveUnassignedToDB()

      // Clean up from any assigned teams if forcing permanent deletion
      for (const team of teams.value) {
        const hasMember = team.members.some(m => m.id === memberId)
        if (hasMember) {
          team.members = team.members.filter(m => m.id !== memberId)
          await saveTeamToDB(team)
        }
      }
      return
    }

    const team = teams.value.find(t => t.id === teamId)
    if (!team) return
    const memberObj = team.members.find(m => m.id === memberId)
    if (memberObj) {
      team.members = team.members.filter(m => m.id !== memberId)
      await saveTeamToDB(team)
      
      unassignedMembers.value.push(memberObj)
      await saveUnassignedToDB()
    }
  }

  // All Workers Master List (Assigned + Unassigned)
  const allWorkers = computed<WorkerItem[]>(() => {
    const list: WorkerItem[] = []

    // 1. Unassigned workers
    for (const member of unassignedMembers.value) {
      const cleanNo = (member.no_karyawan && !isTempWorkerNo(member.no_karyawan) && member.no_karyawan !== '-') ? member.no_karyawan.trim() : ''
      list.push({
        id: member.id,
        full_name: member.full_name,
        role: member.role,
        avatar_url: member.avatar_url,
        team_id: UNASSIGNED_TEAM_ID,
        team_name: UNASSIGNED_TEAM_NAME,
        no_karyawan: cleanNo,
        joined_date: member.joined_date || getLocalDateStr(),
        phone_number: member.phone_number || '-',
        shift: member.shift || 'Shift Pagi',
        status: member.status,
        exit_date: member.exit_date
      })
    }

    // 2. Assigned workers by team
    for (const team of teams.value) {
      for (const member of team.members) {
        const cleanNo = (member.no_karyawan && !isTempWorkerNo(member.no_karyawan) && member.no_karyawan !== '-') ? member.no_karyawan.trim() : ''
        list.push({
          id: member.id,
          full_name: member.full_name,
          role: member.role,
          avatar_url: member.avatar_url,
          team_id: team.id,
          team_name: team.name,
          no_karyawan: cleanNo,
          joined_date: member.joined_date || getLocalDateStr(),
          phone_number: member.phone_number || '-',
          shift: member.shift || 'Shift Pagi',
          status: member.status,
          exit_date: member.exit_date
        })
      }
    }
    return list
  })

  // Active Workers Master List (Workers who have NOT exited)
  const activeWorkers = computed<WorkerItem[]>(() => {
    return allWorkers.value.filter(w => {
      const status = (w.status || '').toLowerCase()
      return !status.includes('keluar') && !status.includes('out')
    })
  })

  return {
    teams,
    unassignedMembers,
    allWorkers,
    activeWorkers,
    isLoading,
    loadTeams,
    addTeam,
    updateTeam,
    deleteTeam,
    deleteAllTeams,
    addUnassignedWorker,
    addMemberToTeam,
    assignOrAddMemberToTeam,
    editMember,
    deleteMember
  }
})
