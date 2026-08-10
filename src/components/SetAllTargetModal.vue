<template>
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden"
      @click.self="close"
    >
      <div class="relative w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-mono text-slate-200">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 bg-slate-950/70 border-b border-slate-800 shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Target class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-100">Konfigurasi Target Massal Karyawan</h3>
              <p class="text-[11px] text-slate-400 font-sans">Isi & atur target harian semua karyawan sekaligus</p>
            </div>
          </div>
          <button
            @click="close"
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Scrollable Modal Body Container -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs no-scrollbar">
          <!-- Warning Alert if Read Only -->
          <div v-if="isReadOnly" class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-start gap-2">
            <Lock class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>Mode Edit Terkunci untuk tanggal ini. Harap buka kunci mode edit pada banner di atas terlebih dahulu.</span>
          </div>

          <!-- Input Nominal Target -->
          <div class="space-y-1.5">
            <label class="block font-semibold text-slate-300 flex items-center justify-between">
              <span>Target Harian (Pcs / Karyawan)</span>
              <span class="text-[11px] text-teal-400 font-bold">Pcs</span>
            </label>
            <div class="relative">
              <input
                type="number"
                v-model.number="targetInput"
                :disabled="isReadOnly"
                min="0"
                step="50"
                placeholder="Contoh: 1000"
                class="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-teal-300 text-sm font-black focus:border-teal-400 focus:outline-none shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <!-- Quick Preset Buttons -->
            <div class="flex items-center gap-1.5 flex-wrap pt-1">
              <span class="text-[10px] text-slate-500 font-sans">Pilihan Cepat:</span>
              <button
                v-for="preset in presets"
                :key="preset"
                type="button"
                :disabled="isReadOnly"
                @click="targetInput = preset"
                class="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="targetInput === preset
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'"
              >
                {{ formatNumber(preset) }} Pcs
              </button>
            </div>
          </div>

          <!-- Scope Selection (Cakupan Karyawan) -->
          <div class="space-y-1.5">
            <label class="block font-semibold text-slate-300">Cakupan Karyawan (Scope)</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                :disabled="isReadOnly"
                @click="scopeMode = 'all'"
                class="p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition active:scale-98 disabled:opacity-50"
                :class="scopeMode === 'all'
                  ? 'bg-teal-500/10 text-teal-300 border-teal-500/50 ring-1 ring-teal-500/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800/50'"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-xs">Semua Karyawan</span>
                  <CheckCircle2 v-if="scopeMode === 'all'" class="w-3.5 h-3.5 text-teal-400" />
                </div>
                <span class="text-[10px] text-slate-500 font-sans">{{ totalWorkersCount }} Karyawan</span>
              </button>

              <button
                type="button"
                :disabled="isReadOnly"
                @click="scopeMode = 'filtered'"
                class="p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition active:scale-98 disabled:opacity-50"
                :class="scopeMode === 'filtered'
                  ? 'bg-teal-500/10 text-teal-300 border-teal-500/50 ring-1 ring-teal-500/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800/50'"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-xs">Hasil Filter</span>
                  <CheckCircle2 v-if="scopeMode === 'filtered'" class="w-3.5 h-3.5 text-teal-400" />
                </div>
                <span class="text-[10px] text-slate-500 font-sans">{{ filteredWorkersCount }} Karyawan</span>
              </button>

              <button
                type="button"
                :disabled="isReadOnly"
                @click="scopeMode = 'team'"
                class="p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition active:scale-98 disabled:opacity-50"
                :class="scopeMode === 'team'
                  ? 'bg-teal-500/10 text-teal-300 border-teal-500/50 ring-1 ring-teal-500/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800/50'"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-xs">Tim / Line</span>
                  <CheckCircle2 v-if="scopeMode === 'team'" class="w-3.5 h-3.5 text-teal-400" />
                </div>
                <span class="text-[10px] text-slate-500 font-sans">Per Tim tertentu</span>
              </button>
            </div>
          </div>

          <!-- Select Team Dropdown (Visible if scopeMode === 'team') -->
          <div v-if="scopeMode === 'team'" class="space-y-1 pt-1">
            <label class="block text-[11px] font-semibold text-slate-400">Pilih Tim / Line Target</label>
            <CustomSelect
              v-model="selectedTeamId"
              :options="teamOptions"
              placeholder="Pilih Tim..."
            />
          </div>

          <!-- Additional Filter Checkbox: Hanya Karyawan Hadir -->
          <div class="pt-1">
            <label class="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                v-model="onlyPresent"
                :disabled="isReadOnly"
                class="w-4 h-4 rounded bg-slate-950 border-slate-700 text-teal-500 focus:ring-teal-400 focus:ring-offset-slate-900 disabled:opacity-50"
              />
              <span class="text-xs">Terapkan hanya untuk karyawan yang <strong>Hadir</strong></span>
            </label>
          </div>

          <!-- Summary Impact Box -->
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div class="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Karyawan Terpengaruh:</span>
              <strong class="text-teal-300 font-mono">{{ affectedWorkerCount }} Karyawan</strong>
            </div>
            <div class="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Tanggal Pengisian:</span>
              <strong class="text-slate-200 font-mono">{{ formattedDate }}</strong>
            </div>
            <div class="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/80">
              <span>Total Target Akumulasi:</span>
              <strong class="text-emerald-400 text-xs font-mono font-bold">{{ formatNumber(totalAccumulatedTarget) }} Pcs</strong>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-950/70 border-t border-slate-800 shrink-0">
          <button
            type="button"
            @click="close"
            class="px-4 py-2 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 text-xs font-bold transition active:scale-95"
          >
            Batal
          </button>
          <button
            type="button"
            @click="applyTarget"
            :disabled="isReadOnly || affectedWorkerCount === 0 || !targetInput || targetInput < 0"
            class="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-black flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-teal-500/20"
          >
            <Zap class="w-4 h-4 text-slate-950 fill-slate-950" />
            <span>Terapkan & Auto-Isi Semua Target</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import CustomSelect, { type SelectOption } from '@/components/CustomSelect.vue'
import { Target, X, CheckCircle2, Zap, Lock } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
  selectedDate: string
  teamOptions: SelectOption[]
  allWorkers: any[]
  filteredWorkers: any[]
  currentTeamId?: string
  isReadOnly?: boolean
}>()

const emit = defineEmits(['close', 'apply'])
const { t } = useI18n()

const targetInput = ref<number>(1000)
const scopeMode = ref<'all' | 'filtered' | 'team'>('all')
const selectedTeamId = ref<string>('')
const onlyPresent = ref<boolean>(false)

const presets = [500, 800, 1000, 1200, 1500, 2000]

watch(() => props.show, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
    if (props.currentTeamId) {
      scopeMode.value = 'team'
      selectedTeamId.value = props.currentTeamId
    } else {
      scopeMode.value = 'all'
    }
  } else {
    document.body.style.overflow = ''
  }
}, { immediate: true })

onUnmounted(() => {
  document.body.style.overflow = ''
})

function formatNumber(val: number) {
  return new Intl.NumberFormat('id-ID').format(val || 0)
}

const totalWorkersCount = computed(() => props.allWorkers.length)
const filteredWorkersCount = computed(() => props.filteredWorkers.length)

const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const formattedDate = computed(() => {
  if (!props.selectedDate) return '-'
  const parts = props.selectedDate.split('-')
  if (parts.length !== 3) return props.selectedDate
  const day = parseInt(parts[2])
  const monthIdx = parseInt(parts[1]) - 1
  const year = parts[0]
  const monthName = t(`time.${monthKeys[monthIdx]}`)
  return `${day} ${monthName} ${year}`
})

const targetWorkers = computed(() => {
  let workers = []
  if (scopeMode.value === 'all') {
    workers = [...props.allWorkers]
  } else if (scopeMode.value === 'filtered') {
    workers = [...props.filteredWorkers]
  } else if (scopeMode.value === 'team') {
    if (selectedTeamId.value) {
      workers = props.allWorkers.filter(w => (w.team_id && w.team_id === selectedTeamId.value) || (w.teamId && w.teamId === selectedTeamId.value))
    } else {
      workers = [...props.allWorkers]
    }
  }

  if (onlyPresent.value) {
    workers = workers.filter(w => w.isPresent)
  }

  return workers
})

const affectedWorkerCount = computed(() => targetWorkers.value.length)
const totalAccumulatedTarget = computed(() => affectedWorkerCount.value * (targetInput.value || 0))

function close() {
  emit('close')
}

function applyTarget() {
  if (props.isReadOnly || !targetInput.value || targetInput.value < 0 || affectedWorkerCount.value === 0) return
  emit('apply', {
    targetQty: targetInput.value,
    workerIds: targetWorkers.value.map(w => w.workerId || w.id)
  })
  close()
}
</script>
