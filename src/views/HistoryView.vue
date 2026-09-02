<template>
  <div class="space-y-3 sm:space-y-4 pb-safe">
    <!-- Search Bar & Collapsible Unified Konfigurasi, Tools & Filter Panel (Sticky Bar) -->
    <div class="sticky top-14 z-30 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-lg p-2.5 sm:p-3 space-y-2.5 shadow-md transition-all">
      <!-- Search Input + Filter & Tools Toggle Button -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1 min-w-0">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            ref="searchInputRef"
            type="text"
            v-model="searchQueryInput"
            @input="onSearchInput"
            :placeholder="t('history.searchPlaceholder')"
            @focus="isSearchFocused = true"
            @click="isSearchFocused = true"
            @blur="handleSearchBlur"
            class="w-full h-9 pl-9 pr-9 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:border-teal-400 focus:outline-none placeholder:text-slate-500"
          />
          <button
            v-if="isSearchFocused || searchQueryInput"
            type="button"
            @mousedown.prevent
            @click="clearAndBlurSearch"
            class="absolute right-0 top-0 bottom-0 w-9 rounded-r-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 active:bg-slate-800 transition active:scale-95 flex items-center justify-center"
            title="Bersihkan Pencarian"
          >
            <X class="w-4 h-4 text-slate-400 hover:text-slate-200 stroke-[2.5]" />
          </button>
        </div>
      </div>

      <!-- Collapsible Panel: Filter Controls and Tools & Actions -->
      <div v-if="showFilterConfig" class="pt-2.5 border-t border-slate-800/80 space-y-3 font-mono">
        <!-- Filter Controls Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <!-- Filter Tim -->
          <div class="space-y-1">
            <label class="block text-[10px] sm:text-[11px] font-semibold text-slate-400">Filter Tim</label>
            <CustomSelect
              v-model="selectedTeamFilter"
              :options="teamFilterOptions"
              placeholder="Pilih tim..."
            />
          </div>

          <!-- Filter Bulan -->
          <div class="space-y-1">
            <label class="block text-[10px] sm:text-[11px] font-semibold text-slate-400">Filter Bulan</label>
            <CustomSelect
              v-model="selectedMonthFilter"
              :options="monthFilterOptions"
              placeholder="Pilih bulan..."
            />
          </div>

          <!-- Filter Tanggal Spesifik -->
          <div class="space-y-1">
            <label class="block text-[10px] sm:text-[11px] font-semibold text-slate-400">Tanggal Spesifik</label>
            <input
              type="date"
              v-model="selectedDateFilter"
              class="w-full h-9 bg-slate-950 border border-slate-700 rounded-lg px-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>
        </div>

        <!-- Tools & Laporan Actions Section -->
        <div class="pt-2.5 border-t border-slate-800/80 space-y-2">
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <Wrench class="w-3.5 h-3.5 text-teal-400" />
              <span>Tools & Laporan</span>
            </div>
            <button
              v-if="selectedTeamFilter || selectedMonthFilter || selectedDateFilter"
              type="button"
              @click="selectedTeamFilter = ''; selectedMonthFilter = ''; selectedDateFilter = ''"
              class="text-[9px] text-teal-400 hover:underline font-bold"
            >
              Reset Filter
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <!-- Action 1: Rekap Bulanan -->
            <button
              @click="showMonthlyRecapModal = true"
              class="h-9 px-3 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-xs hover:border-emerald-400"
            >
              <Table class="w-4 h-4 text-emerald-400 stroke-[2.5] shrink-0" />
              <span>{{ t('dashboard.monthlyRecapSheet') }}</span>
            </button>

            <!-- Action 2: Unduh Rekap (Excel) -->
            <button
              @click="exportCsv"
              class="h-9 px-3 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-teal-300 border border-teal-500/40 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-xs hover:border-teal-400"
            >
              <Download class="w-4 h-4 text-teal-400 stroke-[2.5] shrink-0" />
              <span>{{ t('history.exportCsv') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW A: DESKTOP WIDE TABLE (Visible on md screens and up) -->
    <div class="hidden md:block bg-slate-900/40 border border-slate-800/80 rounded-md overflow-hidden shadow-xl max-h-[75vh] overflow-y-auto custom-scrollbar overscroll-contain">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left text-xs table-fixed">
          <thead class="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md text-slate-400 font-mono border-b border-slate-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th class="p-3 w-20">{{ t('history.tableProof') }}</th>
              <th class="p-3 w-44">{{ t('history.tableTeam') }}</th>
              <th class="p-3 w-24">{{ t('history.tableTime') }}</th>
              <th class="p-3 text-right w-24">{{ t('history.tableTotal') }}</th>
              <th class="p-3 text-center w-24">{{ t('history.tablePresent') }}</th>
              <th class="p-3 text-right w-36">{{ t('history.tablePerWorker') }}</th>
              <th class="p-3 text-center w-28">{{ t('history.tableStatus') }}</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-800/60 font-sans">
            <tr v-if="filteredLogs.length === 0">
              <td colspan="7" class="p-8 text-center text-slate-500">
                {{ t('history.noData') }}
              </td>
            </tr>

            <tr
              v-for="log in filteredLogs"
              :key="log.id"
              class="hover:bg-slate-800/40 transition"
            >
              <td class="p-3">
                <div v-if="log.photo_url" class="w-9 h-9 rounded-md overflow-hidden border border-slate-800 bg-slate-950">
                  <img :src="log.photo_url" class="w-full h-full object-cover" />
                </div>
                <span v-else class="text-slate-600 text-xs">-</span>
              </td>

              <td class="p-3 font-semibold text-slate-200 truncate" :title="log.team_name">
                {{ log.team_name }}
                <p class="text-[10px] text-slate-500 font-normal mt-0.5">{{ log.date }}</p>
              </td>

              <td class="p-3 font-mono text-teal-300 font-bold whitespace-nowrap">
                {{ formatLogTime(log.created_at) }}
              </td>

              <td class="p-3 text-right font-mono font-extrabold text-slate-100 text-sm whitespace-nowrap">
                {{ log.total_qty }} Pcs
              </td>

              <td class="p-3 text-center font-mono text-slate-300 whitespace-nowrap">
                {{ log.present_count }}
              </td>

              <td class="p-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                {{ Math.floor(log.total_qty / (log.present_count || 1)) }} Pcs / Org
              </td>

              <td class="p-3 text-center">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold inline-flex items-center gap-1"
                  :class="log.synced ? 'bg-slate-800 text-slate-400' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'"
                >
                  <Check v-if="log.synced" class="w-3 h-3 text-slate-400" />
                  <Clock v-else class="w-3 h-3 text-amber-400" />
                  <span>{{ log.synced ? t('history.synced') : t('history.local') }}</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- VIEW B: MOBILE RESPONSIVE CARDS (Visible only on Mobile screens) -->
    <div class="block md:hidden space-y-3">
      <div v-if="filteredLogs.length === 0" class="p-8 text-center text-slate-500 bg-slate-900/40 border border-slate-800/80 rounded-md">
        {{ t('history.noData') }}
      </div>

      <div
        v-for="log in filteredLogs"
        :key="log.id"
        class="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-md space-y-3 shadow-sm"
      >
        <!-- Card Header: Team Name, Date, and Sync State -->
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h4 class="font-bold text-slate-100 text-xs font-mono leading-tight truncate" :title="log.team_name">
              {{ log.team_name }}
            </h4>
            <p class="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-slate-500" />
              <span>{{ log.date }}</span>
              <span>•</span>
              <Clock class="w-3.5 h-3.5 text-teal-400" />
              <span class="text-teal-300 font-bold">{{ formatLogTime(log.created_at) }}</span>
            </p>
          </div>

          <span
            class="px-2 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0 inline-flex items-center gap-1"
            :class="log.synced 
              ? 'bg-slate-800 text-slate-400 border-slate-700' 
              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'"
          >
            <Check v-if="log.synced" class="w-2.5 h-2.5" />
            <Clock v-else class="w-2.5 h-2.5" />
            <span>{{ log.synced ? t('history.synced') : t('history.local') }}</span>
          </span>
        </div>

        <!-- Metrics Row -->
        <div class="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded border border-slate-800/60 text-center font-mono">
          <div>
            <span class="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">{{ t('history.labelTotal') }}</span>
            <span class="text-slate-100 font-extrabold text-xs whitespace-nowrap">{{ log.total_qty }} Pcs</span>
          </div>
          <div>
            <span class="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">{{ t('history.labelPresent') }}</span>
            <span class="text-slate-300 font-bold text-xs whitespace-nowrap">{{ log.present_count }}</span>
          </div>
          <div>
            <span class="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">{{ t('history.labelPerPerson') }}</span>
            <span class="text-emerald-400 font-extrabold text-xs whitespace-nowrap">{{ Math.floor(log.total_qty / (log.present_count || 1)) }} Pcs</span>
          </div>
        </div>

        <!-- Card Footer: Proof Photo & Notes -->
        <div class="flex items-center justify-between gap-3 text-[10px] pt-1.5 border-t border-slate-800/60">
          <div class="flex items-center gap-2 min-w-0">
            <!-- Thumbnail proof photo -->
            <div v-if="log.photo_url" class="w-6 h-6 rounded overflow-hidden border border-slate-700 shrink-0 bg-slate-950">
              <img :src="log.photo_url" class="w-full h-full object-cover" />
            </div>
            <p class="text-slate-400 italic truncate" :title="log.notes">
              {{ log.notes || t('history.noNotes') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <MonthlyProductionRecapModal
      :show="showMonthlyRecapModal"
      @close="showMonthlyRecapModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductionStore, getLocalDateStr } from '@/stores/productionStore'
import { useTeamStore } from '@/stores/teamStore'
import CustomSelect, { type SelectOption } from '@/components/CustomSelect.vue'
import MonthlyProductionRecapModal from '@/components/MonthlyProductionRecapModal.vue'
import { Download, Search, Check, Clock, Calendar, Table, X, Wrench } from 'lucide-vue-next'

const { t } = useI18n()
const productionStore = useProductionStore()
const teamStore = useTeamStore()
const showMonthlyRecapModal = ref(false)
const showFilterConfig = ref(false)

const searchQueryInput = ref('')
const searchQuery = ref('')
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  if (!searchQueryInput.value) {
    searchQuery.value = ''
    return
  }
  searchDebounceTimer = setTimeout(() => {
    searchQuery.value = searchQueryInput.value
  }, 120)
}

const searchInputRef = ref<HTMLInputElement | null>(null)
const isSearchFocused = ref(false)

function handleSearchBlur() {
  setTimeout(() => {
    isSearchFocused.value = false
  }, 150)
}

function clearAndBlurSearch() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchQueryInput.value = ''
  searchQuery.value = ''
  isSearchFocused.value = false
  if (searchInputRef.value) {
    searchInputRef.value.blur()
  }
}

const selectedTeamFilter = ref<string>('')
const selectedMonthFilter = ref<string>('')
const selectedDateFilter = ref<string>('')

onMounted(async () => {
  await teamStore.loadTeams()
  await productionStore.loadLogs()
})

function formatLogTime(createdAt: string) {
  if (!createdAt) return '--.--.--'
  const date = new Date(createdAt)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}.${minutes}.${seconds}`
}

const teamFilterOptions = computed<SelectOption[]>(() => {
  return [
    { label: t('history.allTeams'), value: '' },
    ...teamStore.teams.map(t => ({ label: t.name, value: t.id }))
  ]
})

const monthFilterOptions = computed<SelectOption[]>(() => {
  const opts: SelectOption[] = [{ label: t('history.allMonths'), value: '' }]
  const months = [
    t('time.jan'), t('time.feb'), t('time.mar'), t('time.apr'),
    t('time.may'), t('time.jun'), t('time.jul'), t('time.aug'),
    t('time.sep'), t('time.oct'), t('time.nov'), t('time.dec')
  ]

  // Extract unique months from logs
  const monthsSet = new Set<string>()
  productionStore.logs.forEach(log => {
    if (log.date && log.date.includes('-')) {
      const [y, m] = log.date.split('-')
      monthsSet.add(`${y}-${m}`)
    }
  })

  // Standard current months fallback
  const currentYear = new Date().getFullYear()
  for (let m = 1; m <= 12; m++) {
    monthsSet.add(`${currentYear}-${m.toString().padStart(2, '0')}`)
  }

  // Sort and build options
  Array.from(monthsSet).sort().forEach(val => {
    const [y, m] = val.split('-')
    const mIdx = parseInt(m) - 1
    opts.push({
      value: val,
      label: `${months[mIdx]} ${y}`
    })
  })

  return opts
})

const filteredLogs = computed(() => {
  return productionStore.logs.filter(log => {
    const matchesQuery = log.team_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (log.notes && log.notes.toLowerCase().includes(searchQuery.value.toLowerCase()))
    const matchesTeam = !selectedTeamFilter.value || log.team_id === selectedTeamFilter.value || log.team_name.toLowerCase().includes(selectedTeamFilter.value.toLowerCase())
    
    // Filter by specific date
    const matchesDate = !selectedDateFilter.value || log.date === selectedDateFilter.value

    // Filter by month (YYYY-MM)
    const matchesMonth = !selectedMonthFilter.value || log.date.startsWith(selectedMonthFilter.value)

    return matchesQuery && matchesTeam && matchesDate && matchesMonth
  })
})

import { exportToXlsx } from '@/utils/excelExport'

function exportCsv() {
  const headers = ['Tanggal', 'Realisasi Waktu', 'Tim', 'Total Qty Tim', 'Anggota Hadir', 'Hasil Per Orang', 'Catatan', 'Status Sync']
  const rows = filteredLogs.value.map(log => [
    log.date,
    formatLogTime(log.created_at),
    log.team_name,
    log.total_qty,
    log.present_count,
    Math.floor(log.total_qty / (log.present_count || 1)),
    log.notes || '',
    log.synced ? 'Synced' : 'Pending'
  ])

  exportToXlsx(`Rekap_Riwayat_Produksi_${getLocalDateStr()}.xlsx`, 'Riwayat Produksi', headers, rows)
}

function handleHeaderMenuToggle() {
  showFilterConfig.value = !showFilterConfig.value
}

onMounted(() => {
  window.addEventListener('toggle-header-menu', handleHeaderMenuToggle)
})

onUnmounted(() => {
  window.removeEventListener('toggle-header-menu', handleHeaderMenuToggle)
})
</script>
