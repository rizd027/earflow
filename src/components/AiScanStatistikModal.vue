<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col font-sans overflow-hidden animate-fadeIn text-slate-100"
    >
      <!-- Modal Header -->
      <div class="py-3 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 gap-3 min-h-[58px]">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 shadow-xs">
            <ScanText class="w-5 h-5 text-teal-400" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h2 class="text-xs sm:text-sm font-bold text-slate-100 font-mono leading-tight truncate">
                AI Scan Statistik Produksi
              </h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 hidden sm:inline-flex items-center gap-1">
                <Sparkles class="w-2.5 h-2.5" /> Groq Qwen Vision
              </span>
            </div>
            <p class="text-[11px] text-slate-400 leading-tight truncate">
              Pindai lembar fisik & update data karyawan secara instan
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Close Button -->
          <button
            type="button"
            @click="handleClose"
            class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 shrink-0"
            title="Tutup"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Main Modal Body -->
      <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-3 sm:p-6 bg-slate-950/60 flex flex-col">
        
        <!-- STEP 1: Upload / Take Picture -->
        <div v-if="step === 'upload'" class="max-w-xl w-full mx-auto my-auto space-y-4">
          <!-- Drag & Drop Zone -->
          <div
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            class="relative rounded-2xl border-2 border-dashed p-6 sm:p-10 text-center transition-all flex flex-col items-center justify-center gap-4 bg-slate-900/60"
            :class="isDragging ? 'border-teal-400 bg-teal-500/10 scale-[1.01]' : 'border-slate-700 hover:border-slate-500'"
          >
            <div class="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-inner">
              <Camera class="w-8 h-8" />
            </div>

            <div class="space-y-1 text-center">
              <h3 class="text-sm sm:text-base font-bold text-slate-100">
                Ambil Foto atau Pilih Gambar Lembar Statistik
              </h3>
              <p class="text-xs text-slate-400 max-w-sm mx-auto">
                Foto lembar <strong>"Tabel Statistik Produksi"</strong> fisik dengan pencahayaan yang cukup dan tegak lurus.
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap items-center justify-center gap-3 w-full max-w-xs pt-2">
              <!-- Camera Capture Button (Opens Camera directly on Mobile) -->
              <label class="flex-1 min-w-[130px] h-10 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                <Camera class="w-4 h-4" />
                <span>Foto Kamera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="hidden"
                  @change="handleFileInput"
                />
              </label>

              <!-- Gallery / File Browse Button -->
              <label class="flex-1 min-w-[130px] h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                <ImagePlus class="w-4 h-4 text-teal-400" />
                <span>Pilih File</span>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleFileInput"
                />
              </label>
            </div>
          </div>

          <!-- Quick Guidelines Banner -->
          <div class="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 flex items-start gap-3 text-xs text-slate-400">
            <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div class="space-y-1">
              <span class="font-bold text-slate-200">Tips untuk Hasil Scan Optimal:</span>
              <p class="text-[11px] leading-relaxed">
                Pastikan teks bagian header (Nama, No Karyawan, Bulan) dan angka tabel (Tgl, Jam Kerja, Proses, Target, Qty Prod) terbaca jelas tanpa blur atau bayangan tebal.
              </p>
            </div>
          </div>

          <!-- Pre-selected Worker Info if passed -->
          <div v-if="targetWorker" class="text-center text-xs text-slate-400">
            Target Karyawan Awal: <span class="font-bold text-teal-400">{{ targetWorker.full_name }}</span>
          </div>
        </div>

        <!-- STEP 2: Processing Animation -->
        <div v-else-if="step === 'scanning'" class="max-w-md w-full mx-auto my-auto text-center space-y-6">
          <div class="relative w-32 h-32 mx-auto flex items-center justify-center">
            <!-- Ambient Breathing Glow -->
            <div class="absolute inset-0 rounded-full bg-teal-500/15 animate-ping [animation-duration:2.5s]"></div>
            
            <!-- Rotating Gradient Orbit Ring -->
            <div class="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-teal-500/40 via-emerald-400/20 to-teal-300/40 animate-spin [animation-duration:4s] blur-[1px]"></div>
            
            <!-- Secondary Dashed Radar Ring -->
            <div class="absolute -inset-1 rounded-full border border-dashed border-teal-400/40 animate-spin [animation-duration:12s] [animation-direction:reverse]"></div>

            <!-- Inner Scanner Sphere Container -->
            <div class="w-28 h-28 rounded-full bg-slate-900/90 border-2 border-teal-500/50 flex items-center justify-center shadow-[0_0_25px_rgba(20,184,166,0.25)] relative overflow-hidden backdrop-blur-sm">
              <!-- Radial background pulse -->
              <div class="absolute inset-0 bg-radial from-teal-500/10 to-transparent animate-pulse"></div>

              <!-- Center Scan Icon -->
              <ScanText class="w-12 h-12 text-teal-400 relative z-10 scanner-icon-anim" />

              <!-- Sweeping Smooth Laser Line -->
              <div class="scanner-laser-bar absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-teal-300 to-transparent shadow-[0_0_10px_#2dd4bf] z-20"></div>
            </div>
          </div>

          <div class="space-y-2">
            <h3 class="text-base font-bold text-slate-100 font-mono">
              {{ scanningStatusText }}
            </h3>
            <p class="text-xs text-slate-400">
              Groq AI sedang membaca tabel statistik produksi dari foto Anda...
            </p>
          </div>

          <!-- Image Preview Thumbnail -->
          <div v-if="previewImageSrc" class="w-32 h-44 mx-auto rounded-lg overflow-hidden border border-slate-700 shadow-md">
            <img :src="previewImageSrc" alt="Preview" class="w-full h-full object-cover opacity-80" />
          </div>
        </div>

        <!-- STEP 3: Review & Edit Table Data -->
        <div v-else-if="step === 'review'" class="flex-1 flex flex-col gap-4 max-w-6xl w-full mx-auto">
          
          <!-- Top Control & Matching Bar -->
          <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <!-- Worker Selector with Match Badge -->
            <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              
              <!-- Worker Selection -->
              <div class="space-y-1">
                <label class="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center justify-between">
                  <span>Karyawan Target</span>
                  <span v-if="isWorkerAutoMatched" class="text-emerald-400 text-[9px] font-bold flex items-center gap-0.5">
                    <Check class="w-2.5 h-2.5" /> Terdeteksi AI
                  </span>
                </label>
                <select
                  v-model="selectedWorkerId"
                  class="w-full h-9 px-2.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold font-mono text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="" disabled>-- Pilih Karyawan --</option>
                  <option
                    v-for="w in allWorkers"
                    :key="w.id"
                    :value="w.id"
                  >
                    {{ w.full_name }} {{ w.no_karyawan ? `(${w.no_karyawan})` : '' }}
                  </option>
                </select>
              </div>

              <!-- Month Selection -->
              <div class="space-y-1">
                <label class="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center justify-between">
                  <span>Bulan / Periode</span>
                  <span v-if="scannedResult?.rawMonth" class="text-teal-400 text-[9px] font-bold">
                    Foto: {{ scannedResult.rawMonth }}
                  </span>
                </label>
                <select
                  v-model="selectedMonthStr"
                  class="w-full h-9 px-2.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold font-mono text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option v-for="m in monthOptions" :key="m.value" :value="m.value">
                    {{ m.label }}
                  </option>
                </select>
              </div>

              <!-- Shift Selection -->
              <div class="space-y-1">
                <label class="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  Shift
                </label>
                <select
                  v-model="selectedShiftKey"
                  class="w-full h-9 px-2.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold font-mono text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="default">Default / Semua Shift</option>
                  <option v-for="s in shiftStore.shifts" :key="s.id" :value="s.id">
                    {{ s.name }} ({{ s.startTime }} - {{ s.endTime }})
                  </option>
                </select>

              </div>

            </div>

            <!-- View Toggle: Table / Split Photo -->
            <div class="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-800">
              <button
                type="button"
                @click="showPhotoSplit = !showPhotoSplit"
                class="h-9 px-3 rounded-lg border text-xs font-bold font-mono transition flex items-center gap-1.5"
                :class="showPhotoSplit ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'"
              >
                <ImageIcon class="w-3.5 h-3.5" />
                <span>{{ showPhotoSplit ? 'Sembunyikan Foto' : 'Lihat Foto' }}</span>
              </button>
            </div>
          </div>

          <!-- Main Layout: Photo + Table -->
          <div class="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
            
            <!-- Left: Scanned Photo Preview Drawer (collapsible or side-by-side) -->
            <div
              v-if="showPhotoSplit"
              class="w-full lg:w-72 xl:w-80 h-48 lg:h-auto rounded-xl bg-slate-900/80 border border-slate-800 p-2 flex flex-col shrink-0 overflow-hidden shadow-inner"
            >
              <div class="text-[10px] font-mono font-bold text-slate-400 uppercase px-1 pb-1 flex items-center justify-between">
                <span>Foto Lembar Asli</span>
                <span class="text-[9px] text-slate-500">Bisa di-zoom/geser</span>
              </div>
              <div class="flex-1 min-h-0 overflow-auto rounded-lg bg-slate-950 flex items-center justify-center relative">
                <img
                  v-if="previewImageSrc"
                  :src="previewImageSrc"
                  alt="Scanned Sheet"
                  class="max-w-full max-h-full object-contain cursor-zoom-in hover:scale-125 transition-transform"
                />
              </div>
            </div>

            <!-- Right: Editable Scanned Table -->
            <div class="flex-1 min-h-0 flex flex-col rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
              
              <!-- Table Action Header -->
              <div class="py-2.5 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold font-mono text-slate-200">
                    Data Baris Terdeteksi ({{ editableRows.length }} Hari)
                  </span>
                  <button
                    type="button"
                    @click="addNewRow"
                    class="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/30 transition flex items-center gap-1"
                  >
                    <Plus class="w-2.5 h-2.5" /> Tambah Tgl
                  </button>
                </div>

                <!-- Stats Badges -->
                <div class="flex items-center gap-3 text-[11px] font-mono">
                  <div class="text-slate-400">
                    Total Qty: <span class="font-bold text-teal-300">{{ totalScannedProdQty.toLocaleString('id-ID') }}</span>
                  </div>
                </div>
              </div>

              <!-- Scrollable Table -->
              <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-2">
                <table class="w-full border-collapse text-left text-xs font-mono">
                  <thead>
                    <tr class="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[10.5px]">
                      <th class="p-2 w-8 text-center">
                        <input
                          type="checkbox"
                          :checked="isAllSelected"
                          @change="toggleSelectAll"
                          class="rounded border-slate-700 text-teal-500 focus:ring-0"
                        />
                      </th>
                      <th class="p-2 w-14 text-center">Tgl</th>
                      <th class="p-2 w-24">Jam Kerja</th>
                      <th class="p-2 w-28">Proses</th>
                      <th class="p-2 w-24 text-right">Target</th>
                      <th class="p-2 w-28 text-right">Hasil (Prod)</th>
                      <th class="p-2">Keterangan</th>
                      <th class="p-2 w-10 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, idx) in editableRows"
                      :key="idx"
                      class="border-b border-slate-800/60 hover:bg-slate-800/40 transition"
                      :class="row.selected ? 'text-slate-100' : 'opacity-40 text-slate-500'"
                    >
                      <!-- Checkbox -->
                      <td class="p-2 text-center">
                        <input
                          type="checkbox"
                          v-model="row.selected"
                          class="rounded border-slate-700 text-teal-500 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <!-- Day -->
                      <td class="p-1 text-center">
                        <input
                          type="number"
                          min="1"
                          max="31"
                          v-model.number="row.day"
                          class="w-12 h-7 px-1 text-center rounded bg-slate-950 border border-slate-700 text-xs font-bold text-amber-300 focus:outline-none focus:border-teal-500"
                        />
                      </td>

                      <!-- Work Hours -->
                      <td class="p-1">
                        <input
                          type="text"
                          v-model="row.workHours"
                          placeholder="7-14"
                          class="w-full h-7 px-2 rounded bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                        />
                      </td>

                      <!-- Process -->
                      <td class="p-1">
                        <input
                          type="text"
                          v-model="row.process"
                          placeholder="A1 / Solder"
                          class="w-full h-7 px-2 rounded bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                        />
                      </td>

                      <!-- Target Qty -->
                      <td class="p-1 text-right">
                        <input
                          type="number"
                          v-model.number="row.targetQty"
                          placeholder="0"
                          class="w-full h-7 px-2 text-right rounded bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                        />
                      </td>

                      <!-- Prod Qty -->
                      <td class="p-1 text-right">
                        <input
                          type="number"
                          v-model.number="row.prodQty"
                          placeholder="0"
                          class="w-full h-7 px-2 text-right rounded bg-slate-950 border border-emerald-500/50 text-xs font-black text-emerald-400 focus:outline-none focus:border-teal-400"
                        />
                      </td>

                      <!-- Remark -->
                      <td class="p-1">
                        <input
                          type="text"
                          v-model="row.remark"
                          placeholder="Catatan..."
                          class="w-full h-7 px-2 rounded bg-slate-950 border border-slate-700 text-[11px] text-slate-400 focus:outline-none focus:border-teal-500"
                        />
                      </td>

                      <!-- Delete Row Button -->
                      <td class="p-1 text-center">
                        <button
                          type="button"
                          @click="removeRow(idx)"
                          class="w-6 h-6 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition border border-rose-500/20 mx-auto"
                          title="Hapus Baris Ini"
                        >
                          <Trash2 class="w-3 h-3" />
                        </button>
                      </td>
                    </tr>

                    <tr v-if="editableRows.length === 0">
                      <td colspan="8" class="p-6 text-center text-slate-500 font-mono text-xs">
                        Tidak ada baris yang terdeteksi. Klik "Tambah Tgl" untuk menambahkan baris manual.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

          </div>

        </div>

      </div>

      <!-- Modal Bottom Actions Bar -->
      <div class="py-3 px-4 sm:px-6 border-t border-slate-800 bg-slate-900 shrink-0 flex items-center justify-between gap-3">
        <!-- Left button -->
        <div>
          <button
            v-if="step === 'review'"
            type="button"
            @click="step = 'upload'"
            class="h-9 px-3 sm:px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition flex items-center gap-1.5 border border-slate-700"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>Scan Foto Lain</span>
          </button>
        </div>

        <!-- Right Action Button -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="handleClose"
            class="h-9 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-bold text-xs transition border border-slate-700"
          >
            Batal
          </button>

          <button
            v-if="step === 'review'"
            type="button"
            @click="saveScannedData"
            :disabled="isSaving || !selectedWorkerId || activeSelectedRowsCount === 0"
            class="h-9 px-4 sm:px-5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Save class="w-4 h-4" />
            <span>{{ isSaving ? 'Menyimpan...' : `Simpan ke EarFlow (${activeSelectedRowsCount} Hari)` }}</span>
          </button>
        </div>
      </div>

    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  X, Camera, ImagePlus, ScanText, Sparkles, Check, CheckCircle2,
  Image as ImageIcon, Plus, Trash2, RotateCcw, Save
} from 'lucide-vue-next'
import { useTeamStore } from '@/stores/teamStore'

import { useOverrideStore } from '@/stores/overrideStore'
import { useShiftStore } from '@/stores/shiftStore'
import { getLocalDateStr } from '@/stores/productionStore'
import {
  compressImageToBase64,
  scanProductionSheetWithGroq,
  findBestWorkerMatch,
  type ScannedSheetResult,
  type ScannedRowData
} from '@/services/groqVisionService'

const props = defineProps<{
  show: boolean
  targetWorker?: {
    id: string
    full_name: string
    no_karyawan?: string
    role?: string
  } | null
  initialMonthStr?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', data: { workerId: string; monthStr: string; updatedCount: number }): void
}>()

const teamStore = useTeamStore()
const overrideStore = useOverrideStore()
const shiftStore = useShiftStore()

type Step = 'upload' | 'scanning' | 'review'
const step = ref<Step>('upload')
const isDragging = ref(false)
const isSaving = ref(false)
const scanningStatusText = ref('Mempersiapkan gambar...')
const previewImageSrc = ref('')
const showPhotoSplit = ref(true)

const scannedResult = ref<ScannedSheetResult | null>(null)
const isWorkerAutoMatched = ref(false)

const selectedWorkerId = ref('')
const selectedMonthStr = ref(getLocalDateStr().slice(0, 7))
const selectedShiftKey = ref('default')

interface EditableRow extends ScannedRowData {
  selected: boolean
}
const editableRows = ref<EditableRow[]>([])

// All active workers list from teams + unassigned
const allWorkers = computed(() => {
  const list: Array<{ id: string; full_name: string; no_karyawan?: string; role: string }> = []
  for (const t of teamStore.teams) {
    for (const m of (t.members || [])) {
      list.push(m)
    }
  }
  for (const m of teamStore.unassignedMembers) {
    list.push(m)
  }
  return list
})

// Generate Month Options: Current month, past 5 months, next 2 months
const monthOptions = computed(() => {
  const options = []
  const now = new Date()
  for (let i = -5; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const val = `${y}-${m}`
    const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    options.push({ value: val, label })
  }
  return options
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    step.value = 'upload'
    previewImageSrc.value = ''
    scannedResult.value = null
    isWorkerAutoMatched.value = false
    
    if (props.targetWorker) {
      selectedWorkerId.value = props.targetWorker.id
    }
    if (props.initialMonthStr) {
      selectedMonthStr.value = props.initialMonthStr
    } else {
      selectedMonthStr.value = getLocalDateStr().slice(0, 7)
    }
  }
}, { immediate: true })

function handleClose() {
  emit('close')
}

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    processImageFile(target.files[0])
  }
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    processImageFile(e.dataTransfer.files[0])
  }
}

async function processImageFile(file: File) {
  try {
    step.value = 'scanning'
    scanningStatusText.value = 'Mengompres dan memproses gambar...'

    // 1. Compress image to optimal base64
    const base64Data = await compressImageToBase64(file)
    previewImageSrc.value = base64Data

    // 2. Call Groq Vision API
    scanningStatusText.value = 'Groq Vision sedang membaca tabel...'
    const result = await scanProductionSheetWithGroq(base64Data, undefined, (status) => {
      scanningStatusText.value = status
    })
    scannedResult.value = result

    // 3. Worker matching
    scanningStatusText.value = 'Mencocokkan nama karyawan...'
    let matched = findBestWorkerMatch(result.rawWorkerName, result.rawWorkerNo, allWorkers.value)
    
    if (!matched && props.targetWorker) {
      matched = props.targetWorker
    }

    if (matched) {
      selectedWorkerId.value = matched.id
      isWorkerAutoMatched.value = true
    } else if (allWorkers.value.length > 0) {
      selectedWorkerId.value = allWorkers.value[0].id
      isWorkerAutoMatched.value = false
    }

    // 4. Month Matching
    if (result.parsedMonthNumber) {
      const year = new Date().getFullYear()
      const mPad = String(result.parsedMonthNumber).padStart(2, '0')
      selectedMonthStr.value = `${year}-${mPad}`
    }

    // 5. Populate Rows
    editableRows.value = result.rows.map(r => ({
      ...r,
      selected: true
    }))

    step.value = 'review'
  } catch (err: any) {
    console.error('Scan error:', err)
    alert(`Gagal memindai: ${err.message || 'Terjadi kesalahan saat memproses gambar.'}`)
    step.value = 'upload'
  }
}

function addNewRow() {
  const nextDay = editableRows.value.length > 0
    ? Math.min(31, Math.max(...editableRows.value.map(r => r.day)) + 1)
    : 1

  editableRows.value.push({
    day: nextDay,
    workHours: '7-14',
    process: 'A1',
    targetQty: 0,
    prodQty: 0,
    remark: '',
    selected: true
  })
}

function removeRow(idx: number) {
  editableRows.value.splice(idx, 1)
}

const activeSelectedRowsCount = computed(() => {
  return editableRows.value.filter(r => r.selected).length
})

const isAllSelected = computed(() => {
  return editableRows.value.length > 0 && editableRows.value.every(r => r.selected)
})

function toggleSelectAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  editableRows.value.forEach(r => r.selected = checked)
}

const totalScannedProdQty = computed(() => {
  return editableRows.value
    .filter(r => r.selected)
    .reduce((acc, cur) => acc + (Number(cur.prodQty) || 0), 0)
})

async function saveScannedData() {
  if (!selectedWorkerId.value) {
    alert('Pilih karyawan target terlebih dahulu.')
    return
  }

  const selectedRows = editableRows.value.filter(r => r.selected)
  if (selectedRows.length === 0) {
    alert('Pilih minimal 1 baris tanggal yang ingin disimpan.')
    return
  }

  isSaving.value = true
  try {
    const workerId = selectedWorkerId.value
    const monthPrefix = selectedMonthStr.value // e.g. "2026-08"
    const shiftKey = selectedShiftKey.value

    for (const row of selectedRows) {
      const dayPad = String(row.day).padStart(2, '0')
      const dateStr = `${monthPrefix}-${dayPad}`

      if (row.workHours !== undefined) {
        overrideStore.setDailyOverride(workerId, dateStr, 'workHours', row.workHours, shiftKey)
      }
      if (row.process !== undefined) {
        overrideStore.setDailyOverride(workerId, dateStr, 'process', row.process, shiftKey)
      }
      if (row.targetQty !== undefined) {
        overrideStore.setDailyOverride(workerId, dateStr, 'targetQty', Number(row.targetQty) || 0, shiftKey)
      }
      if (row.prodQty !== undefined) {
        overrideStore.setDailyOverride(workerId, dateStr, 'prodQty', Number(row.prodQty) || 0, shiftKey)
      }
      if (row.remark !== undefined) {
        overrideStore.setDailyOverride(workerId, dateStr, 'remark', row.remark, shiftKey)
      }
    }

    emit('saved', {
      workerId,
      monthStr: monthPrefix,
      updatedCount: selectedRows.length
    })

    alert(`Berhasil memperbarui ${selectedRows.length} data statistik untuk periode ${selectedMonthStr.value}!`)
    handleClose()
  } catch (err: any) {
    console.error('Failed saving scanned overrides:', err)
    alert(`Gagal menyimpan data: ${err.message}`)
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.scanner-laser-bar {
  animation: scanLaser 2s ease-in-out infinite alternate;
}

@keyframes scanLaser {
  0% {
    top: 10px;
    opacity: 0.4;
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    top: calc(100% - 12px);
    opacity: 0.4;
  }
}

.scanner-icon-anim {
  animation: scanPulse 2.4s ease-in-out infinite;
}

@keyframes scanPulse {
  0%, 100% {
    transform: scale(0.95);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
}
</style>
