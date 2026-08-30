import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'mandor' | 'pekerja'
  avatar_url?: string
}

export interface ProcessCodeGroup {
  code: string
  roles: string[]
}

const DEFAULT_PROCESS_GROUPS: ProcessCodeGroup[] = [
  { code: 'A1', roles: ['SOLDER', 'LEM'] },
  { code: 'A2', roles: ['GULUNG', 'CANGKANG'] },
  { code: 'A3', roles: ['PACKING', 'CHECK'] }
]

const DEFAULT_PROCESS_TYPES = ['SOLDER', 'LEM', 'GULUNG', 'Cangkang', 'PACKING', 'CHECK']

export const useAuthStore = defineStore('auth', () => {
  const foremanName = ref(
    localStorage.getItem('earflow_foreman_name') ||
    localStorage.getItem('foreman_name') ||
    ''
  )

  const savedProcessTypes = localStorage.getItem('earflow_process_types')
  let initialProcessTypes = DEFAULT_PROCESS_TYPES
  try {
    if (savedProcessTypes) {
      const parsed = JSON.parse(savedProcessTypes)
      if (Array.isArray(parsed) && parsed.length > 0) initialProcessTypes = parsed
    }
  } catch {}
  const processTypes = ref<string[]>(initialProcessTypes)

  const savedProcessGroups = localStorage.getItem('earflow_process_groups')
  let initialProcessGroups = DEFAULT_PROCESS_GROUPS
  try {
    if (savedProcessGroups) {
      const parsed = JSON.parse(savedProcessGroups)
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.some(g => g.roles && g.roles.length > 0)) {
        initialProcessGroups = parsed
      }
    }
  } catch {}
  const processGroups = ref<ProcessCodeGroup[]>(JSON.parse(JSON.stringify(initialProcessGroups)))

  function saveProcessGroups() {
    localStorage.setItem('earflow_process_groups', JSON.stringify(processGroups.value))
  }

  function getProcessCodeForRole(roleName?: string): string {
    if (!roleName) return 'A1'
    const clean = roleName.trim().toUpperCase()

    // 1. Check if input is already a code (e.g. "A1", "A2", "A3")
    const matchCodeDirect = processGroups.value.find(g => g.code.toUpperCase() === clean)
    if (matchCodeDirect) return matchCodeDirect.code

    // 2. Check if input matches any role inside a group (e.g. "SOLDER" -> "A1")
    for (const group of processGroups.value) {
      if (group.roles.some(r => r.toUpperCase() === clean || clean.includes(r.toUpperCase()))) {
        return group.code
      }
    }

    // 3. Fallback for "SOLDER" or "LEM" to "A1"
    if (clean.includes('SOLDER') || clean.includes('LEM')) return 'A1'
    if (clean.includes('GULUNG') || clean.includes('CANGKANG')) return 'A2'
    if (clean.includes('PACKING') || clean.includes('CHECK')) return 'A3'

    return roleName
  }

  function addProcessCodeGroup(code: string) {
    const trimmed = code.trim().toUpperCase()
    if (trimmed && !processGroups.value.some(g => g.code === trimmed)) {
      processGroups.value.push({ code: trimmed, roles: [] })
      saveProcessGroups()
    }
  }

  function updateProcessCodeGroup(oldCode: string, newCode: string) {
    const cleanOld = oldCode.trim().toUpperCase()
    const cleanNew = newCode.trim().toUpperCase()
    if (!cleanOld || !cleanNew || cleanOld === cleanNew) return
    const group = processGroups.value.find(g => g.code.toUpperCase() === cleanOld)
    if (group) {
      group.code = cleanNew
      saveProcessGroups()
    }
  }

  function removeProcessCodeGroup(code: string) {
    processGroups.value = processGroups.value.filter(g => g.code !== code)
    saveProcessGroups()
  }

  function addRoleToGroup(code: string, role: string) {
    const trimmedRole = role.trim().toUpperCase()
    if (!trimmedRole) return
    const group = processGroups.value.find(g => g.code === code)
    if (group && !group.roles.includes(trimmedRole)) {
      group.roles.push(trimmedRole)
      saveProcessGroups()
    }
  }

  function removeRoleFromGroup(code: string, role: string) {
    const group = processGroups.value.find(g => g.code === code)
    if (group) {
      group.roles = group.roles.filter(r => r !== role)
      saveProcessGroups()
    }
  }

  function resetProcessGroups() {
    processGroups.value = JSON.parse(JSON.stringify(DEFAULT_PROCESS_GROUPS))
    saveProcessGroups()
    processTypes.value = [...DEFAULT_PROCESS_TYPES]
    localStorage.setItem('earflow_process_types', JSON.stringify(processTypes.value))
  }

  const currentUser = ref<UserProfile>({
    id: 'm1',
    email: 'mandor.hendra@earflow.com',
    full_name: foremanName.value,
    role: 'mandor',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  })

  const isMandor = ref(true)

  function setForemanName(name: string) {
    const trimmed = name.trim() || 'Karen & Lala'
    foremanName.value = trimmed
    localStorage.setItem('earflow_foreman_name', trimmed)
    localStorage.setItem('foreman_name', trimmed)
    if (currentUser.value && isMandor.value) {
      currentUser.value.full_name = trimmed
    }
  }

  function addProcessType(type: string) {
    const trimmed = type.trim()
    if (trimmed && !processTypes.value.includes(trimmed)) {
      processTypes.value.push(trimmed)
      localStorage.setItem('earflow_process_types', JSON.stringify(processTypes.value))
    }
  }

  function removeProcessType(type: string) {
    processTypes.value = processTypes.value.filter(t => t !== type)
    localStorage.setItem('earflow_process_types', JSON.stringify(processTypes.value))
  }

  function resetProcessTypes() {
    processTypes.value = [...DEFAULT_PROCESS_TYPES]
    localStorage.setItem('earflow_process_types', JSON.stringify(processTypes.value))
  }

  function loginAsMandor() {
    currentUser.value = {
      id: 'm1',
      email: 'mandor.hendra@earflow.com',
      full_name: foremanName.value,
      role: 'mandor',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    }
    isMandor.value = true
  }

  function loginAsWorker() {
    currentUser.value = {
      id: 'w1',
      email: 'budi.santoso@earflow.com',
      full_name: 'Budi Santoso (Pekerja Tim Alpha)',
      role: 'pekerja',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    }
    isMandor.value = false
  }

  function switchRole(role: 'mandor' | 'pekerja') {
    if (role === 'mandor') loginAsMandor()
    else loginAsWorker()
  }

  function reloadFromStorage() {
    const fName = localStorage.getItem('earflow_foreman_name') || localStorage.getItem('foreman_name') || ''
    foremanName.value = fName
    if (currentUser.value && isMandor.value) {
      currentUser.value.full_name = fName
    }

    const savedTypes = localStorage.getItem('earflow_process_types')
    let parsedTypes: string[] | null = null
    try {
      if (savedTypes) parsedTypes = JSON.parse(savedTypes)
    } catch {}
    if (parsedTypes && Array.isArray(parsedTypes) && parsedTypes.length > 0) {
      processTypes.value = parsedTypes
    } else {
      // Don't write defaults back to localStorage — cloud pull will populate it
      processTypes.value = [...DEFAULT_PROCESS_TYPES]
    }

    const savedGroups = localStorage.getItem('earflow_process_groups')
    let parsedGroups: ProcessCodeGroup[] | null = null
    try {
      if (savedGroups) parsedGroups = JSON.parse(savedGroups)
    } catch {}
    if (parsedGroups && Array.isArray(parsedGroups) && parsedGroups.length > 0 && parsedGroups.some(g => g.roles && g.roles.length > 0)) {
      processGroups.value = parsedGroups
    } else {
      // Don't write defaults back to localStorage — cloud pull will populate it
      processGroups.value = JSON.parse(JSON.stringify(DEFAULT_PROCESS_GROUPS))
    }
  }

  return {
    currentUser,
    isMandor,
    foremanName,
    processTypes,
    processGroups,
    setForemanName,
    addProcessType,
    removeProcessType,
    resetProcessTypes,
    getProcessCodeForRole,
    addProcessCodeGroup,
    updateProcessCodeGroup,
    removeProcessCodeGroup,
    addRoleToGroup,
    removeRoleFromGroup,
    resetProcessGroups,
    loginAsMandor,
    loginAsWorker,
    switchRole,
    reloadFromStorage
  }
})
