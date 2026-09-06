import { defineStore } from 'pinia'
import { ref } from 'vue'

export type SalaryMethod = 'hourly' | 'piece' | 'daily'

export interface WorkerSalaryConfig {
  method: SalaryMethod
  customHourlyRate?: number | null
  customDailyRate?: number | null // legacy alias
  customPieceRate?: number | null
  allowance: number
  bonus: number
  deduction: number
  notes?: string
}

export interface SalaryRatesConfig {
  defaultHourlyRate: number
  defaultDailyRate?: number // legacy alias
  defaultPieceRate: number
  rolePieceRates: Record<string, number>
}

const STORAGE_KEY_CONFIG = 'earflow_salary_rates_v1'
const STORAGE_KEY_WORKERS = 'earflow_worker_salary_config_v1'

export const useSalaryStore = defineStore('salary', () => {
  // Global rates configuration
  const ratesConfig = ref<SalaryRatesConfig>({
    defaultHourlyRate: 12000,
    defaultPieceRate: 150,
    rolePieceRates: {
      'SOLDER': 150,
      'SOLDER AI': 160,
      'A1': 140,
      'QC': 120,
      'CHECK': 120,
      'PACKAGING': 110,
      'ASSEMBLY': 130
    }
  })

  // Worker-specific salary configurations (workerId -> WorkerSalaryConfig)
  const workerConfigs = ref<Record<string, WorkerSalaryConfig>>({})

  // Initialize from localStorage
  function loadFromStorage() {
    try {
      const savedRates = localStorage.getItem(STORAGE_KEY_CONFIG)
      if (savedRates) {
        const parsed = JSON.parse(savedRates)
        // If legacy defaultDailyRate exists and defaultHourlyRate is not set, set defaultHourlyRate to 12000 or derive
        if (parsed.defaultDailyRate && !parsed.defaultHourlyRate) {
          parsed.defaultHourlyRate = parsed.defaultHourlyRate || 12000
        }
        ratesConfig.value = { ...ratesConfig.value, ...parsed }
      }

      const savedWorkers = localStorage.getItem(STORAGE_KEY_WORKERS)
      if (savedWorkers) {
        workerConfigs.value = JSON.parse(savedWorkers)
      }
    } catch (e) {
      console.warn('Failed to load salary config from localStorage:', e)
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(ratesConfig.value))
      localStorage.setItem(STORAGE_KEY_WORKERS, JSON.stringify(workerConfigs.value))
    } catch (e) {
      console.warn('Failed to save salary config to localStorage:', e)
    }
  }

  loadFromStorage()

  function getWorkerConfig(workerId: string): WorkerSalaryConfig {
    if (!workerConfigs.value[workerId]) {
      return {
        method: 'piece', // Default to borongan/piece
        customHourlyRate: null,
        customPieceRate: null,
        allowance: 0,
        bonus: 0,
        deduction: 0,
        notes: ''
      }
    }
    const c = workerConfigs.value[workerId]
    if (c.method === 'daily') c.method = 'hourly'
    return c
  }

  function setWorkerMethod(workerId: string, method: SalaryMethod) {
    const existing = getWorkerConfig(workerId)
    workerConfigs.value[workerId] = {
      ...existing,
      method: method === 'daily' ? 'hourly' : method
    }
    saveToStorage()
  }

  function setWorkerConfig(workerId: string, partial: Partial<WorkerSalaryConfig>) {
    const existing = getWorkerConfig(workerId)
    workerConfigs.value[workerId] = {
      ...existing,
      ...partial
    }
    saveToStorage()
  }

  function updateGlobalRates(newRates: Partial<SalaryRatesConfig>) {
    ratesConfig.value = {
      ...ratesConfig.value,
      ...newRates
    }
    saveToStorage()
  }

  function getEffectiveHourlyRate(workerId: string): number {
    const config = getWorkerConfig(workerId)
    if (config.customHourlyRate != null && config.customHourlyRate > 0) {
      return config.customHourlyRate
    }
    if (config.customDailyRate != null && config.customDailyRate > 0) {
      return config.customDailyRate
    }
    return ratesConfig.value.defaultHourlyRate || 12000
  }

  // legacy alias
  function getEffectiveDailyRate(workerId: string): number {
    return getEffectiveHourlyRate(workerId)
  }

  function getEffectivePieceRate(workerId: string, role?: string): number {
    const config = getWorkerConfig(workerId)
    if (config.customPieceRate != null && config.customPieceRate > 0) {
      return config.customPieceRate
    }

    if (role) {
      const normalizedRole = role.trim().toUpperCase()
      for (const [key, rate] of Object.entries(ratesConfig.value.rolePieceRates)) {
        if (normalizedRole.includes(key.toUpperCase())) {
          return rate
        }
      }
    }

    return ratesConfig.value.defaultPieceRate
  }

  function calculateSalary(params: {
    workerId: string
    role?: string
    attendanceDays: number
    totalWorkHours: number
    totalProdQty: number
  }) {
    const config = getWorkerConfig(params.workerId)
    const method = config.method === 'daily' ? 'hourly' : config.method
    const hourlyRate = getEffectiveHourlyRate(params.workerId)
    const pieceRate = getEffectivePieceRate(params.workerId, params.role)

    let grossAmount = 0
    let rateUsed = 0
    let formulaStr = ''

    if (method === 'hourly') {
      rateUsed = hourlyRate
      grossAmount = params.totalWorkHours * hourlyRate
      formulaStr = `${params.totalWorkHours} Jam × Rp ${hourlyRate.toLocaleString('id-ID')}`
    } else {
      rateUsed = pieceRate
      grossAmount = params.totalProdQty * pieceRate
      formulaStr = `${params.totalProdQty.toLocaleString('id-ID')} Pcs × Rp ${pieceRate.toLocaleString('id-ID')}`
    }

    const allowance = Number(config.allowance) || 0
    const bonus = Number(config.bonus) || 0
    const deduction = Number(config.deduction) || 0
    const netAmount = Math.max(0, grossAmount + allowance + bonus - deduction)

    return {
      method,
      rateUsed,
      grossAmount,
      allowance,
      bonus,
      deduction,
      netAmount,
      formulaStr,
      notes: config.notes || ''
    }
  }

  return {
    ratesConfig,
    workerConfigs,
    getWorkerConfig,
    setWorkerMethod,
    setWorkerConfig,
    updateGlobalRates,
    getEffectiveHourlyRate,
    getEffectiveDailyRate,
    getEffectivePieceRate,
    calculateSalary,
    saveToStorage
  }
})
