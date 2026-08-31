<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="printable-report-modal fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col font-sans overflow-hidden animate-fadeIn text-slate-100"
    >
      <!-- Modal Header (Hidden on Print & Edit Cell Mode) -->
      <div v-if="!isEditing" class="py-3.5 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 gap-3 min-h-[60px] print:hidden">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
            <Printer class="w-5 h-5 text-teal-400" />
          </div>
          <div class="min-w-0">
            <h2 class="text-xs sm:text-base font-bold text-slate-100 font-mono leading-tight">
              {{ t('workerReport.modalTitle') }}
            </h2>
            <p class="text-[11px] text-slate-400 leading-tight">
              {{ t('workerReport.officialReport', { name: worker?.full_name }) }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Close Button -->
          <button
            type="button"
            @click="$emit('close')"
            class="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 shrink-0"
            title="Tutup"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Scrollable Document Container (Printable) -->
      <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 sm:p-6 print:p-0 print:overflow-visible print:h-auto print:block">
        <!-- Official Printable Paper Sheet (Clipboard Style A4 layout) -->
        <div
          class="mx-auto bg-white text-slate-900 rounded-sm shadow-2xl border border-slate-300 font-sans transition-all duration-300 print:shadow-none print:border-none print:p-2 print:max-w-none print:w-full max-w-4xl p-3 sm:p-8"
        >
          <!-- Sheet Header Bar -->
          <div class="border-b-2 border-slate-900 pb-2 mb-3 text-center">
            <h1 class="text-lg sm:text-2xl font-black font-mono tracking-wider uppercase text-slate-900">
              {{ t('workerReport.sheetTitle') }}
            </h1>
          </div>

          <!-- Metadata Section -->
          <div class="grid grid-cols-2 max-w-md sm:max-w-lg gap-x-2 sm:gap-x-6 gap-y-1.5 text-[11px] sm:text-xs font-mono mb-3 pb-2.5 border-b border-slate-400">
            <div class="flex items-center min-w-0">
              <span class="w-16 sm:w-20 text-slate-600 font-semibold shrink-0">{{ t('workerReport.workerNo') }}</span>
              <span class="font-bold text-slate-950 truncate">: {{ (worker?.no_karyawan && !isTempWorkerNo(worker?.no_karyawan) && worker?.no_karyawan !== '-') ? worker?.no_karyawan : '-' }}</span>
            </div>

            <div class="flex items-center min-w-0">
              <span class="w-16 sm:w-20 text-slate-600 font-semibold shrink-0">{{ t('workerReport.month') }}</span>
              <span class="font-bold text-slate-950 whitespace-nowrap">: {{ selectedMonthLabel }}</span>
            </div>

            <div class="flex items-center min-w-0">
              <span class="w-16 sm:w-20 text-slate-600 font-semibold shrink-0">{{ t('workerReport.name') }}</span>
              <span class="font-bold text-slate-950 uppercase truncate">: {{ worker?.full_name || '-' }}</span>
            </div>

            <div class="flex items-center min-w-0">
              <span class="w-16 sm:w-20 text-slate-600 font-semibold shrink-0">{{ t('workerReport.joinedDate') }}</span>
              <span class="font-bold text-slate-950 whitespace-nowrap">: {{ workerDateJoined }}</span>
            </div>

            <div class="flex items-center min-w-0 col-span-2 mt-0.5">
              <span class="w-16 sm:w-20 text-slate-600 font-semibold shrink-0">Shift</span>
              <span class="font-extrabold text-amber-950 bg-amber-200/90 border border-amber-500 px-2 py-0.5 rounded text-[11px] uppercase tracking-wide">: {{ workerShiftDisplay }}</span>
            </div>

            <!-- Worker Status Badge -->
            <div class="flex items-center min-w-0 col-span-2 mt-0.5">
              <span class="w-16 sm:w-20 text-slate-600 font-semibold shrink-0">Status</span>
              <span
                class="font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide border"
                :class="workerStatusBadgeClass"
              >: {{ workerStatusDisplayText }}</span>
            </div>

            <!-- Attendance summary -->
            <div class="flex items-center min-w-0 col-span-2 mt-0.5">
              <span class="w-16 sm:w-20 text-slate-600 font-semibold shrink-0">Hadir</span>
              <span class="font-bold text-slate-950 text-[11px]">: {{ totalPresenceDays }} hari dari {{ totalEligibleDays }} hari kerja</span>
            </div>
          </div>

          <!-- Main Daily Records Table (31 Rows) -->
          <div class="overflow-x-auto print:overflow-visible -mx-2 sm:mx-0 px-2 sm:px-0">
            <div v-if="isEditing" class="sm:hidden mb-2 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] font-mono text-amber-900 flex items-center gap-1.5 shadow-xs">
              <span class="text-sm">👉</span>
              <span>Geser ke kanan untuk melihat & mengisi semua kolom</span>
            </div>
            <table class="w-full min-w-[720px] border-collapse border border-slate-900 text-[11px] font-mono">
              <thead>
                <tr class="bg-slate-100 text-slate-900 text-center uppercase tracking-tight font-bold border-b border-slate-900">
                  <th class="sticky left-0 z-10 border border-slate-900 p-1 w-9 sm:w-8 bg-slate-100 shadow-[1px_0_0_0_#0f172a]">{{ t('workerReport.colDay') }}</th>
                  <th class="border border-slate-900 p-1 w-32 sm:w-28">{{ t('workerReport.colWorkHours') }}</th>
                  <th class="border border-slate-900 p-1 w-14 sm:w-16">{{ t('workerReport.colCumHours') }}</th>
                  <th class="border border-slate-900 p-1 w-32 sm:w-28">{{ t('workerReport.colProcess') }}</th>
                  <th class="border border-slate-900 p-1 w-20 sm:w-22">{{ t('workerReport.colTargetQty') }}</th>
                  <th class="border border-slate-900 p-1 w-20 sm:w-22">{{ t('workerReport.colProdQty') }}</th>
                  <th class="border border-slate-900 p-1 w-20 sm:w-22">{{ t('workerReport.colCumProdQty') }}</th>
                  <th class="border border-slate-900 p-1 w-14 sm:w-12">{{ t('workerReport.colSigned') }}</th>
                  <th class="border border-slate-900 p-1 min-w-[140px]">{{ t('workerReport.colRemark') }}</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="row in dailyReportRows"
                  :key="row.day"
                  class="text-center transition"
                  :class="row.isSunday && !row.isWorking ? 'bg-rose-500/15 text-rose-950 font-bold print:bg-rose-100/50' : 'hover:bg-amber-100/70 hover:text-black'"
                >
                  <td class="sticky left-0 z-10 border border-slate-900 p-1 font-bold shadow-[1px_0_0_0_#0f172a]" :class="row.isSunday && !row.isWorking ? 'text-rose-700 font-black bg-rose-100' : 'text-slate-950 bg-white'">{{ row.day }}</td>

                  <!-- Jam Kerja -->
                  <td class="border border-slate-900 p-0.5 whitespace-nowrap">
                    <input
                      v-if="isEditing"
                      :value="row.workHours === '-' ? '' : row.workHours"
                      placeholder="-"
                      @focus="($event.target as HTMLInputElement).select()"
                      @input="saveCellOverride(row.day, 'workHours', ($event.target as HTMLInputElement).value)"
                      class="w-full h-8 sm:h-6 px-1.5 text-center rounded-xs text-xs sm:text-[10.5px] font-mono font-bold text-slate-950 focus:outline-none transition-all shadow-inner"
                      :class="isDayFieldEdited(row.day, 'workHours')
                        ? 'bg-amber-300 text-amber-950 font-black border-2 border-amber-600'
                        : 'bg-amber-500/10 border border-amber-500/60 focus:border-amber-600 focus:bg-white'"
                    />
                    <span v-else-if="row.isSunday && !row.isWorking" class="text-rose-700 font-extrabold italic uppercase tracking-wider text-[10px]">{{ t('workerReport.sunday') }}</span>
                    <span v-else class="font-semibold text-slate-950">{{ row.isWorking ? row.workHours : '-' }}</span>
                  </td>

                  <!-- Kumulatif Jam: hanya tampil jika isWorking & hasWorkActivity -->
                  <td class="border border-slate-900 p-1 font-semibold text-slate-900">
                    {{ (row.isWorking && row.hasWorkActivity && row.cumHours) ? row.cumHours : '' }}
                  </td>

                  <!-- Proses Produksi (Fast Native Select Edit Synchronized with Settings) -->
                  <td class="border border-slate-900 p-0.5 text-center" :title="row.process">
                    <div v-if="isEditing" class="w-full px-0.5">
                      <select
                        :value="row.process || workerDefaultProcess"
                        @change="saveCellOverride(row.day, 'process', ($event.target as HTMLSelectElement).value)"
                        class="w-full h-8 sm:h-6 px-1 text-center font-bold font-mono text-xs sm:text-[10.5px] rounded-xs bg-amber-500/10 border border-amber-500/60 focus:border-amber-600 focus:bg-white text-slate-950 focus:outline-none"
                      >
                        <option
                          v-if="row.process && !roleComboboxOptions.some(o => o.value === row.process)"
                          :value="row.process"
                        >
                          {{ row.process }}
                        </option>
                        <option v-for="opt in roleComboboxOptions" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </option>
                      </select>
                    </div>
                    <span v-else class="px-1 font-bold text-slate-950 text-center block truncate">{{ row.isWorking ? (row.process || '-') : '' }}</span>
                  </td>

                  <!-- Target Qty -->
                  <td class="border border-slate-900 p-0.5 text-right px-1">
                    <input
                      v-if="isEditing"
                      type="number"
                      :value="row.targetQty === 0 ? '' : row.targetQty"
                      placeholder="0"
                      @focus="($event.target as HTMLInputElement).select()"
                      @input="saveCellOverride(row.day, 'targetQty', ($event.target as HTMLInputElement).value)"
                      class="w-full h-8 sm:h-6 px-1.5 text-right rounded-xs text-xs sm:text-[10.5px] font-mono font-bold text-slate-950 focus:outline-none transition-all shadow-inner"
                      :class="isDayFieldEdited(row.day, 'targetQty')
                        ? 'bg-amber-300 text-amber-950 font-black border-2 border-amber-600'
                        : 'bg-amber-500/10 border border-amber-500/60 focus:border-amber-600 focus:bg-white'"
                    />
                    <span v-else class="font-semibold text-slate-900">{{ row.isWorking && row.targetQty ? row.targetQty.toLocaleString('id-ID') : '' }}</span>
                  </td>

                  <!-- Prod Qty (Hasil) -->
                  <td class="border border-slate-900 p-0.5 text-right px-1 font-bold text-slate-950">
                    <input
                      v-if="isEditing"
                      type="number"
                      :value="row.prodQty === 0 ? '' : row.prodQty"
                      placeholder="0"
                      @focus="($event.target as HTMLInputElement).select()"
                      @input="saveCellOverride(row.day, 'prodQty', ($event.target as HTMLInputElement).value)"
                      class="w-full h-8 sm:h-6 px-1.5 text-right rounded-xs text-xs sm:text-[10.5px] font-mono font-extrabold focus:outline-none transition-all shadow-inner"
                      :class="isDayFieldEdited(row.day, 'prodQty')
                        ? 'bg-amber-300 text-amber-950 font-black border-2 border-amber-600'
                        : 'bg-emerald-500/10 border border-emerald-500/80 focus:border-emerald-600 focus:bg-white text-emerald-950'"
                    />
                    <span v-else class="font-bold text-slate-950">{{ row.isWorking && row.prodQty ? row.prodQty.toLocaleString('id-ID') : '' }}</span>
                  </td>

                  <!-- Kumulatif Produksi: hanya tampil jika isWorking & hasWorkActivity -->
                  <td class="border border-slate-900 p-1 text-right px-1 font-extrabold text-slate-950">
                    {{ (row.isWorking && row.hasWorkActivity && row.cumProdQty) ? row.cumProdQty.toLocaleString('id-ID') : '' }}
                  </td>

                  <td class="border border-slate-900 p-1 text-slate-600 text-[10px] sm:text-[9px] font-bold">
                    {{ row.signed ? '✓ Mandor' : '' }}
                  </td>

                  <!-- Remark / Catatan -->
                  <td class="border border-slate-900 p-0.5 text-left px-1 text-[10px] sm:text-[9px] text-slate-600 min-w-[140px]" :title="row.remark">
                    <input
                      v-if="isEditing"
                      :value="row.remark === '-' ? '' : row.remark"
                      placeholder="-"
                      @focus="($event.target as HTMLInputElement).select()"
                      @input="saveCellOverride(row.day, 'remark', ($event.target as HTMLInputElement).value)"
                      class="w-full h-8 sm:h-6 px-1.5 text-left rounded-xs text-[11px] sm:text-[9px] font-mono focus:outline-none transition-all shadow-inner"
                      :class="isDayFieldEdited(row.day, 'remark')
                        ? 'bg-amber-300 text-amber-950 font-black border-2 border-amber-600'
                        : 'bg-amber-500/10 border border-amber-500/60 focus:border-amber-600 focus:bg-white'"
                    />
                    <span v-else class="font-semibold block truncate max-w-[160px]" :class="row.isSunday && !row.isWorking ? 'text-rose-700 italic font-bold' : 'text-slate-800'">{{ row.remark || '' }}</span>
                  </td>
                </tr>


                <!-- Summary Total Footer Row -->
                <tr class="bg-slate-200 text-slate-950 font-black border-t-2 border-slate-900 text-center">
                  <td colspan="2" class="sticky left-0 z-10 border border-slate-900 p-1.5 uppercase text-right pr-2 bg-slate-200 shadow-[1px_0_0_0_#0f172a]">{{ t('workerReport.total') }}</td>
                  <td class="border border-slate-900 p-1.5">{{ totalWorkHours }} Jam</td>
                  <td class="border border-slate-900 p-1.5 text-left px-2 text-[10px]">{{ t('workerReport.efficiency') }} {{ overallEfficiency }}%</td>
                  <td class="border border-slate-900 p-1.5 text-right px-1">{{ totalTargetQty.toLocaleString('id-ID') }}</td>
                  <td class="border border-slate-900 p-1.5 text-right px-1 text-teal-800 print:text-black">{{ totalProdQty.toLocaleString('id-ID') }}</td>
                  <td class="border border-slate-900 p-1.5 text-right px-1 text-teal-900 print:text-black">{{ totalProdQty.toLocaleString('id-ID') }}</td>
                  <td colspan="2" class="border border-slate-900 p-1.5"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Signatures Footer -->
          <div class="mt-8 pt-4 flex items-end justify-between text-xs font-mono border-t border-slate-300 print:mt-12">
            <div class="text-center space-y-12">
              <p class="text-slate-600">{{ t('workerReport.signatureWorker') }}</p>
              <p class="font-bold underline uppercase">{{ worker?.full_name || '....................' }}</p>
            </div>

            <div class="text-center space-y-12">
              <p class="text-slate-600">{{ t('workerReport.signatureMandor') }}</p>
              <p class="font-bold underline uppercase">{{ authStore.foremanName || 'Pak Hendra' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Accordion Controls Drawer Panel (Toggled via Titik 3 Button) -->
      <transition
        enter-active-class="transition-opacity duration-150 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showOptionsPanel"
          class="border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl p-4 sm:p-5 shrink-0 print:hidden z-20 shadow-2xl space-y-3"
        >
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <SlidersHorizontal class="w-4 h-4 text-amber-400" />
              <span class="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">Pengaturan Laporan Karyawan</span>
            </div>
            <button
              type="button"
              @click="showOptionsPanel = false"
              class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <!-- Filter 1: Month & Year Picker -->
            <div class="space-y-1">
              <label class="block text-[11px] font-semibold text-slate-400 font-mono">Pilih Bulan & Tahun</label>
              <CustomSelect
                v-model="selectedMonthYear"
                :options="monthOptions"
                :placeholder="t('workerReport.selectMonth')"
              />
            </div>

            <!-- Edit & Reset Controls -->
            <div class="space-y-1 flex flex-col justify-end">
              <label class="block text-[11px] font-semibold text-slate-400 font-mono">Opsi Data</label>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="showAiScanModal = true"
                  class="h-9 px-3.5 rounded-md font-bold text-xs transition inline-flex items-center gap-1.5 border shadow-sm bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border-teal-500/40"
                  title="Scan Lembar Cetak Statistik dengan AI"
                >
                  <ScanText class="w-3.5 h-3.5 text-teal-400" />
                  <span>AI Scan Formulir</span>
                </button>

                <button
                  type="button"
                  @click="isEditing = !isEditing"
                  class="h-9 px-3.5 rounded-md font-bold text-xs transition inline-flex items-center gap-1.5 border shadow-sm"
                  :class="isEditing ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-teal-300'"
                >
                  <Pencil class="w-3.5 h-3.5" />
                  <span>{{ isEditing ? 'Selesai' : 'Edit Cell' }}</span>
                </button>

                <button
                  v-if="hasOverrides"
                  type="button"
                  @click="resetCellOverrides"
                  class="h-9 px-3 rounded-md bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-xs transition flex items-center gap-1.5"
                >
                  <RotateCcw class="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-800/80 flex justify-end">
            <button
              type="button"
              @click="showOptionsPanel = false"
              class="h-8 px-3 rounded text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Tutup Pengaturan ▲
            </button>
          </div>
        </div>
      </transition>

      <!-- Modal Bottom Bar (Primary Action + Titik 3 Toggle Button) -->
      <div class="py-2.5 px-4 sm:px-6 border-t border-slate-800 bg-slate-900 shrink-0 shadow-2xl z-10 print:hidden flex items-center justify-between gap-3">
        <!-- Active Status / Filter Badge Indicator & 3-Dots Button -->
        <div class="flex items-center gap-2 min-w-0">
          <!-- Titik 3 / Accordion Toggle Button -->
          <button
            type="button"
            @click="showOptionsPanel = !showOptionsPanel"
            class="h-9 px-3 rounded-md border transition flex items-center gap-1.5 text-xs font-bold font-mono shrink-0 shadow-sm relative"
            :class="showOptionsPanel
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-2 ring-amber-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'"
            title="Buka Pengaturan & Filter Laporan"
          >
            <MoreVertical class="w-4 h-4 text-amber-400 shrink-0" />
            <span class="hidden sm:inline">Option</span>
            <ChevronUp v-if="showOptionsPanel" class="w-3.5 h-3.5 text-amber-400" />
            <ChevronDown v-else class="w-3.5 h-3.5 text-slate-400" />

            <!-- Active indicator dot if filtering/editing active -->
            <span v-if="isEditing || hasOverrides" class="w-2.5 h-2.5 rounded-full bg-amber-400 absolute -top-1 -right-1 animate-pulse border-2 border-slate-900"></span>
          </button>

          <!-- Active Filter Summary Text -->
          <div class="text-[11px] font-mono text-slate-400 truncate flex items-center gap-1.5">
            <span class="text-teal-400 font-bold">{{ selectedMonthLabel }}</span>
            <span v-if="isEditing" class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">EDIT MODE</span>
          </div>
        </div>

        <!-- Primary Action Buttons (AI Scan, Excel & PDF) -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            @click="showAiScanModal = true"
            class="h-9 px-3 sm:px-3.5 rounded-md bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/50 font-bold text-xs shadow-md transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer"
            title="Scan AI Formulir Fisik Karyawan"
          >
            <ScanText class="w-4 h-4 text-teal-400 shrink-0" />
            <span class="hidden sm:inline">AI Scan</span>
          </button>

          <button
            type="button"
            @click="exportExcel"
            class="h-9 px-3.5 sm:px-4 rounded-md bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40 font-bold text-xs shadow-md transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer"
            title="Download Laporan Format Excel (.csv)"
          >
            <FileSpreadsheet class="w-4 h-4 text-teal-400 shrink-0" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            @click="triggerPrint"
            class="h-9 px-3.5 sm:px-4 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer"
            title="Cetak PDF / Print A4"
          >
            <Printer class="w-4 h-4 stroke-[2.5]" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      <!-- AI Scan Modal -->
      <AiScanStatistikModal
        :show="showAiScanModal"
        :target-worker="worker"
        :initial-month-str="selectedMonthYear"
        @close="showAiScanModal = false"
        @saved="onAiScanSaved"
      />

    </div>
  </Teleport>
</template>


<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Printer, X, Pencil, RotateCcw, MoreVertical, SlidersHorizontal, ChevronUp, ChevronDown, FileSpreadsheet, ScanText } from 'lucide-vue-next'
import { useProductionStore, getLocalDateStr } from '@/stores/productionStore'
import { useTeamStore } from '@/stores/teamStore'
import { useAuthStore } from '@/stores/authStore'
import { useOverrideStore, type DailyOverride } from '@/stores/overrideStore'
import { type ComboboxOption } from '@/components/CustomCombobox.vue'
import CustomSelect from '@/components/CustomSelect.vue'
import AiScanStatistikModal from '@/components/AiScanStatistikModal.vue'
import { isWorkerInLog, getWorkerShareForLog, DEFAULT_DAILY_TARGET, isWorkerNewOnDate, getWorkerWorkingDays } from '@/utils/reportUtils'
import { useShiftStore } from '@/stores/shiftStore'
import { isTempWorkerNo } from '@/data/noKaryawanData'

const showAiScanModal = ref(false)

function onAiScanSaved() {
  overrideStore.loadFromStorage(true)
}


const props = defineProps<{
  show: boolean
  worker: {
    id: string
    full_name: string
    role: string
    team_name?: string
    team_id?: string
    avatar_url?: string
    no_karyawan?: string
    joined_date?: string
    phone_number?: string
    shift?: string
    status?: string
  } | null
}>() 

const showOptionsPanel = ref(false)

defineEmits(['close'])

watch(() => props.show, (newVal) => {
  if (newVal) {
    document.documentElement.style.setProperty('overflow', 'hidden', 'important')
    document.body.style.setProperty('overflow', 'hidden', 'important')
  } else {
    document.documentElement.style.removeProperty('overflow')
    document.body.style.removeProperty('overflow')
  }
}, { immediate: true })

onUnmounted(() => {
  document.documentElement.style.removeProperty('overflow')
  document.body.style.removeProperty('overflow')
})

const { t } = useI18n()

// Default selected month: Current month YYYY-MM
const selectedMonthYear = ref(getLocalDateStr().slice(0, 7))

const productionStore = useProductionStore()
const teamStore = useTeamStore()
const authStore = useAuthStore()
const overrideStore = useOverrideStore()
const shiftStore = useShiftStore()

const roleComboboxOptions = computed<ComboboxOption[]>(() => {
  const opts: ComboboxOption[] = []

  if (authStore.processGroups && authStore.processGroups.length > 0) {
    for (const group of authStore.processGroups) {
      const codeUpper = group.code.toUpperCase().trim()
      const rolesSummary = group.roles && group.roles.length > 0 ? ` (${group.roles.join(', ')})` : ''
      opts.push({
        label: `${codeUpper}${rolesSummary}`,
        value: codeUpper
      })

      // Add individual roles inside group
      if (group.roles) {
        for (const r of group.roles) {
          const rTrimmed = r.trim().toUpperCase()
          if (rTrimmed && rTrimmed !== codeUpper && !opts.some(o => o.value === rTrimmed)) {
            opts.push({
              label: `${rTrimmed} (${codeUpper})`,
              value: rTrimmed
            })
          }
        }
      }
    }
  } else {
    opts.push(
      { label: 'A1 (SOLDER, LEM)', value: 'A1' },
      { label: 'A2 (GULUNG, CANGKANG)', value: 'A2' },
      { label: 'A3 (PACKING, CHECK)', value: 'A3' }
    )
  }

  return opts
})

const workerDefaultProcess = computed(() => {
  return props.worker?.role ? (authStore.getProcessCodeForRole(props.worker.role) || 'A1') : 'A1'
})

// Edit Cell mode state
const isEditing = ref(false)

function getDateStrForDay(day: number): string {
  const { yearStr, monthStr } = parseMonthYear(selectedMonthYear.value)
  const dayStr = day.toString().padStart(2, '0')
  return `${yearStr}-${monthStr}-${dayStr}`
}

function saveCellOverride(day: number, field: string, value: any) {
  if (!props.worker) return
  const dateStr = getDateStrForDay(day)
  
  if (field === 'workHours') {
    const trimmed = String(value).trim()
    const workHoursVal = (trimmed === '' || trimmed === '-') ? '-' : trimmed
    overrideStore.setDailyOverride(props.worker.id, dateStr, 'workHours', workHoursVal)

    if (workHoursVal !== '-') {
      const existing = overrideStore.getDailyOverride(props.worker.id, dateStr)
      if (!existing?.process) {
        const defaultCode = authStore.getProcessCodeForRole(props.worker.role) || 'A1'
        overrideStore.setDailyOverride(props.worker.id, dateStr, 'process', defaultCode)
      }
      if (existing?.targetQty === undefined || existing.targetQty === 0) {
        const workerTeam = teamStore.teams.find(t => t.id === props.worker?.team_id || t.name === props.worker?.team_name)
        const target = workerTeam ? workerTeam.hourly_target : DEFAULT_DAILY_TARGET
        overrideStore.setDailyOverride(props.worker.id, dateStr, 'targetQty', target)
      }
    }
  } else {
    overrideStore.setDailyOverride(props.worker.id, dateStr, field as keyof DailyOverride, value)
  }
}

function resetCellOverrides() {
  if (props.worker) {
    overrideStore.resetWorkerOverrides(props.worker.id)
  }
}

const hasOverrides = computed(() => {
  if (!props.worker) return false
  const { yearStr, monthStr } = parseMonthYear(selectedMonthYear.value)
  const prefix = `${props.worker.id}_${yearStr}-${monthStr}`
  return Object.keys(overrideStore.dailyMap).some(k => k.startsWith(prefix))
})

const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

const monthOptions = computed(() => {
  const { year } = parseMonthYear(selectedMonthYear.value)
  const opts = []
  for (let m = 1; m <= 12; m++) {
    const mm = m.toString().padStart(2, '0')
    const monthName = t(`time.${monthKeys[m - 1]}`)
    opts.push({
      value: `${year}-${mm}`,
      label: `${monthName} ${year}`
    })
  }
  return opts
})

const selectedMonthLabel = computed(() => {
  const found = monthOptions.value.find(o => o.value === selectedMonthYear.value)
  if (found) return found.label
  const { year, month } = parseMonthYear(selectedMonthYear.value)
  const monthName = t(`time.${monthKeys[month]}`)
  return `${monthName} ${year}`
})

const workerDateJoined = computed(() => {
  if (!props.worker?.joined_date) return `6 ${t('time.jul')} 2026`
  const parts = props.worker.joined_date.split('-')
  if (parts.length === 3) {
    const day = parseInt(parts[2])
    const monthIdx = parseInt(parts[1]) - 1
    const year = parts[0]
    const monthName = t(`time.${monthKeys[monthIdx]}`)
    return `${day} ${monthName} ${year}`
  }
  return props.worker.joined_date
})

const workerShiftDisplay = computed(() => {
  if (!props.worker) return '-'
  const shiftVal = props.worker.shift || 'Shift Pagi'
  return shiftStore.formatShiftDisplay(shiftVal)
})

function parseMonthYear(val: string): { year: number; month: number; yearStr: string; monthStr: string } {
  let y = 2026
  let m = 6 // July (0-indexed)
  if (val) {
    if (val.includes('-')) {
      const parts = val.split('-')
      y = parseInt(parts[0]) || y
      m = (parseInt(parts[1]) || 1) - 1
    } else {
      const monthsIndo = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember']
      const lower = val.toLowerCase()
      const foundIdx = monthsIndo.findIndex(monthName => lower.includes(monthName))
      if (foundIdx !== -1) m = foundIdx
      const matchYear = val.match(/\d{4}/)
      if (matchYear) y = parseInt(matchYear[0])
    }
  }

  const yearStr = y.toString()
  const monthStr = (m + 1).toString().padStart(2, '0')
  return { year: y, month: m, yearStr, monthStr }
}

function parseShiftDuration(val: string): number {
  if (!val || val === '-' || val === '') return 0

  // 1. Match time range like "13 - 20" or "13:00 - 20:00" or "13-20"
  const rangeMatch = val.match(/(\d{1,2})(?::\d{2})?\s*[-–—]\s*(\d{1,2})(?::\d{2})?/)
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1])
    const end = parseInt(rangeMatch[2])
    if (end > start) {
      const elapsed = end - start
      return elapsed >= 4 ? Math.max(1, elapsed - 1) : elapsed
    }
  }

  // 2. Match explicit hour duration like "(6h)" or "6 jam"
  const hMatch = val.match(/(\d+)\s*(?:h|jam)/i)
  if (hMatch) {
    return parseInt(hMatch[1])
  }

  // 3. Fallback to plain number if user entered "6"
  const plainNum = parseInt(val)
  if (!isNaN(plainNum) && plainNum > 0 && plainNum <= 24) {
    return plainNum
  }

  return 6
}

function isDayFieldEdited(day: number, field: string): boolean {
  if (!props.worker) return false
  const { yearStr, monthStr } = parseMonthYear(selectedMonthYear.value)
  const dayStr = day.toString().padStart(2, '0')
  const dateFormatted = `${yearStr}-${monthStr}-${dayStr}`
  return overrideStore.getDailyOverride(props.worker.id, dateFormatted)?.[field as keyof DailyOverride] !== undefined
}

// Calculate daily report rows for 31 days of the selected month
const dailyReportRows = computed(() => {
  if (!props.worker) return []

  const { year, month, yearStr, monthStr } = parseMonthYear(selectedMonthYear.value)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = getLocalDateStr()

  let runningCumHours = 0
  const cumProdByProcess: Record<string, number> = {}

  const rows = []

  const workerTeam = teamStore.teams.find(t =>
    (props.worker?.team_id && t.id === props.worker.team_id) ||
    (props.worker?.team_name && t.name.toLowerCase().trim() === props.worker.team_name.toLowerCase().trim()) ||
    (t.members && t.members.some((m: any) => m.id === props.worker?.id || m.noKaryawan === props.worker?.no_karyawan))
  )
  const dailyTeamTarget = workerTeam && workerTeam.hourly_target > 0 ? workerTeam.hourly_target : DEFAULT_DAILY_TARGET
  const teamMemberCount = workerTeam ? (workerTeam.members ? workerTeam.members.length : 1) : 1

  const workerShiftStr = props.worker?.shift || workerTeam?.shift || 'Shift Pagi'
  const matchedShift = shiftStore.shifts.find((s: any) => {
    if (!s) return false
    const cleanS = (s.name || '').toLowerCase()
    const cleanW = workerShiftStr.toLowerCase()
    return cleanW.includes(cleanS) || cleanS.includes(cleanW) || (s.startTime && cleanW.includes(s.startTime))
  })

  let shiftLabel = '13 - 20 (6h)'
  if (matchedShift && matchedShift.startTime && matchedShift.endTime) {
    const startH = parseInt(matchedShift.startTime.split(':')[0]) || 13
    const endH = parseInt(matchedShift.endTime.split(':')[0]) || 20
    const totalDuration = endH > startH ? (endH - startH) : 7
    const netDuration = totalDuration >= 4 ? Math.max(1, totalDuration - 1) : totalDuration
    const startClean = matchedShift.startTime.replace(':00', '')
    const endClean = matchedShift.endTime.replace(':00', '')
    shiftLabel = `${startClean} - ${endClean} (${netDuration}h)`
  }

  const defaultProcess = authStore.getProcessCodeForRole(props.worker.role) || 'A1'

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day)
    const dayOfWeek = dateObj.getDay()
    const isSunday = dayOfWeek === 0
    const dayStr = day.toString().padStart(2, '0')
    const dateFormatted = `${yearStr}-${monthStr}-${dayStr}`
    const isPastOrToday = dateFormatted <= todayStr

    const override: DailyOverride = overrideStore.getDailyOverride(props.worker.id, dateFormatted) || {}

    // Production logs for this day
    const dateLogs = productionStore.logs.filter(l => l.date === dateFormatted && isWorkerInLog(l, props.worker!))

    let baseProdQty = 0
    if (dateLogs.length > 0) {
      for (const log of dateLogs) {
        baseProdQty += getWorkerShareForLog(log, teamMemberCount)
      }
      baseProdQty = Math.max(0, baseProdQty)
    }

    const prodQty = override.prodQty !== undefined ? override.prodQty : baseProdQty

    const remarkLower = (override.remark || '').toLowerCase().trim()
    const nonWorkingKeywords = [
      'absen', 'sakit', 'izin', 'alfa', 'alpha', 'cuti', 'keluar',
      'belum bergabung', 'tidak hadir', 'tidak masuk', 'libur', 'off'
    ]
    const isExplicitAbsent = nonWorkingKeywords.some(k => remarkLower.includes(k))
    const isExplicitPresent = remarkLower === 'hadir' || remarkLower.includes('hadir')
    const hasWorkActivity = dateLogs.length > 0 || prodQty > 0 || (override.workHours !== undefined && override.workHours !== '' && override.workHours !== '-') || (override.targetQty !== undefined && override.targetQty > 0) || isExplicitPresent

    let isWorking = false
    if (isExplicitAbsent) {
      isWorking = false
    } else if (hasWorkActivity) {
      isWorking = true
    } else if (isPastOrToday && !isSunday) {
      isWorking = hasWorkActivity
    }

    // Only show shift hours when there is actual production data or explicit override
    let baseWorkHours = hasWorkActivity ? shiftLabel : '-'
    // Determine if this date is before the worker's join date
    const workerJoinDate = props.worker?.joined_date || ''
    const isBeforeJoined = !!workerJoinDate && dateFormatted < workerJoinDate

    // Determine worker's current status (Cuti / Keluar / Out)
    const workerStatus = (props.worker?.status || '').toLowerCase()
    const isOnLeave = workerStatus.includes('cuti')
    const isOut = workerStatus.includes('keluar') || workerStatus.includes('out')

    const isNewInInterval = isWorkerNewOnDate(props.worker?.joined_date, dateFormatted, 7)

    let baseRemark = '-'
    if (isSunday) {
      baseRemark = hasWorkActivity ? 'Produksi Hari Minggu' : 'Libur Minggu'
    } else if (isExplicitAbsent) {
      baseRemark = 'Absen'
    } else if (isBeforeJoined && !hasWorkActivity) {
      baseRemark = 'Belum Bergabung'
    } else if (isOut && !hasWorkActivity) {
      baseRemark = 'Keluar'
    } else if (isOnLeave && !hasWorkActivity) {
      baseRemark = 'Cuti'
    } else if (isWorking || hasWorkActivity) {
      if (dateLogs.length > 0) {
        const lastNotes = dateLogs
          .map(l => l.notes)
          .filter(Boolean)
          .filter(n => !n?.includes('Reset hasil'))
          .join('; ')
        const presentText = lastNotes || 'Hadir'
        baseRemark = isNewInInterval ? `${presentText} (Baru)` : presentText
      } else if (hasWorkActivity) {
        baseRemark = isNewInInterval ? 'Hadir (Baru)' : 'Hadir'
      } else {
        baseRemark = 'Absen'
      }
    }

    const workHours = override.workHours !== undefined ? override.workHours : baseWorkHours
    const workHoursStr = String(workHours).trim()

    // Only show process and target when there is actual work activity or explicit override
    const processName: string = override.process !== undefined
      ? (authStore.getProcessCodeForRole(override.process) || '')
      : (hasWorkActivity ? defaultProcess : '')

    const targetQty = override.targetQty !== undefined
      ? override.targetQty
      : (hasWorkActivity ? dailyTeamTarget : 0)

    const remark = override.remark !== undefined ? override.remark : baseRemark
    const hasActualData = dateLogs.length > 0 || Object.keys(override).length > 0

    let rowCumProd = 0
    if (isWorking) {
      // Only accumulate hours if there is actual production data or explicit work hours override
      if (hasWorkActivity && workHoursStr !== '-' && workHoursStr !== '') {
        const parsedHours = parseShiftDuration(workHoursStr)
        runningCumHours += parsedHours
      }

      // Accumulate production separately per distinct process code
      if (hasWorkActivity && processName) {
        const processKey = processName.trim().toUpperCase()
        if (prodQty > 0) {
          cumProdByProcess[processKey] = (cumProdByProcess[processKey] || 0) + prodQty
          rowCumProd = cumProdByProcess[processKey]
        } else if (cumProdByProcess[processKey]) {
          rowCumProd = cumProdByProcess[processKey]
        }
      }
    }

    rows.push({
      day,
      dateFormatted,
      isPastOrToday,
      isSunday,
      isWorking,
      hasWorkActivity,
      workHours,
      cumHours: runningCumHours,
      process: processName,
      targetQty,
      prodQty,
      cumProdQty: rowCumProd,
      signed: prodQty > 0 || dateLogs.length > 0 || isExplicitPresent,
      remark,
      hasActualData
    })
  }

  return rows
})

const totalWorkHours = computed(() => {
  // Only use final cumHours from rows that actually have work activity
  const activeRows = dailyReportRows.value.filter(r => r.hasWorkActivity)
  return activeRows.length > 0 ? activeRows[activeRows.length - 1].cumHours : 0
})

const totalTargetQty = computed(() => {
  // Only sum target for rows with actual work activity (jam kerja terisi)
  return dailyReportRows.value.reduce((acc, r) => {
    return acc + (r.hasWorkActivity ? (r.targetQty || 0) : 0)
  }, 0)
})

const totalProdQty = computed(() => {
  // Sum of all produced quantities for active working rows in the month
  return dailyReportRows.value.reduce((acc, r) => {
    return acc + (r.hasWorkActivity ? (r.prodQty || 0) : 0)
  }, 0)
})

const overallEfficiency = computed(() => {
  if (!totalTargetQty.value) return 0
  return Math.round((totalProdQty.value / totalTargetQty.value) * 100)
})

// Count days the worker was present (hasWorkActivity) from their joined_date onwards
const totalPresenceDays = computed(() => {
  const joinDate = props.worker?.joined_date || ''
  return dailyReportRows.value.filter(r =>
    r.hasWorkActivity &&
    !r.isSunday &&
    (!joinDate || r.dateFormatted >= joinDate)
  ).length
})

// Count total eligible working days (non-Sunday, after joined_date, up to today)
const totalEligibleDays = computed(() => {
  const joinDate = props.worker?.joined_date || ''
  return dailyReportRows.value.filter(r =>
    !r.isSunday &&
    r.isPastOrToday &&
    (!joinDate || r.dateFormatted >= joinDate)
  ).length
})

const workerWorkingDaysCount = computed(() => {
  return getWorkerWorkingDays(props.worker?.joined_date)
})

const workerStatusDisplayText = computed(() => {
  if (!props.worker) return '-'
  const statusLower = (props.worker.status || '').toLowerCase()
  if (statusLower.includes('keluar') || statusLower.includes('out')) return 'Keluar'
  if (statusLower.includes('cuti')) return 'Sedang Cuti'

  const days = workerWorkingDaysCount.value
  const isNew = isWorkerNewOnDate(props.worker.joined_date, undefined, 7) || statusLower.includes('baru')
  return isNew ? `Baru (${days} Hari)` : `Aktif (${days} Hari)`
})

const workerStatusBadgeClass = computed(() => {
  if (!props.worker) return 'text-slate-700 bg-slate-100 border-slate-400'
  const statusLower = (props.worker.status || '').toLowerCase()
  if (statusLower.includes('keluar') || statusLower.includes('out')) {
    return 'text-red-900 bg-red-100 border-red-400'
  }
  if (statusLower.includes('cuti')) {
    return 'text-orange-900 bg-orange-100 border-orange-400'
  }
  const isNew = isWorkerNewOnDate(props.worker.joined_date, undefined, 7) || statusLower.includes('baru')
  if (isNew) {
    return 'text-blue-900 bg-blue-100 border-blue-400'
  }
  return 'text-emerald-900 bg-emerald-100 border-emerald-400'
})

import { exportToXlsx } from '@/utils/excelExport'

function exportExcel() {
  if (!props.worker) return
  const headers = ['TGL', 'JM KERJA', 'JML KUM JAM', 'PROSES PRODUKSI', 'JML TARGET', 'JML PROD', 'JML KUM PROD', 'MEMERIKSA / REMARK']
  const rows = dailyReportRows.value.map((d: any) => [
    d.day,
    d.workHours || '-',
    d.cumHours || 0,
    d.process || '',
    d.targetQty || 0,
    d.prodQty || 0,
    d.cumProdQty || 0,
    d.remark || ''
  ])

  const workerName = (props.worker.full_name || 'karyawan').replace(/\s+/g, '_')
  const filename = `laporan_bulanan_${workerName}_${selectedMonthYear.value}.xlsx`
  exportToXlsx(filename, workerName.slice(0, 30), headers, rows)
}

function triggerPrint() {
  window.print()
}
</script>

<style>
@media print {
  @page {
    size: A4 portrait !important;
    margin: 5mm 5mm !important;
  }

  /* Hide the entire Vue app layout and backgrounds */
  #app, 
  header, 
  nav, 
  footer, 
  .print\:hidden {
    display: none !important;
  }

  /* Make sure the teleported report modal is the only visible node */
  body > .printable-report-modal {
    display: block !important;
    position: relative !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: auto !important;
    background: white !important;
    color: black !important;
    overflow: visible !important;
    z-index: 9999999 !important;
    padding: 2mm !important;
    margin: 0 auto !important;
    box-sizing: border-box !important;
  }

  .printable-report-modal table {
    width: 100% !important;
    min-width: 100% !important;
    max-width: 100% !important;
    table-layout: auto !important;
  }

  .printable-report-modal th,
  .printable-report-modal td {
    font-size: 8px !important;
    padding: 1.5px 2px !important;
  }

  /* Override text colors to pure black for printable elements */
  .printable-report-modal,
  .printable-report-modal * {
    color: #000000 !important;
    background: transparent !important;
    box-shadow: none !important;
    border-color: #000000 !important;
  }

  /* Hide print buttons and selects inside modal */
  .printable-report-modal button,
  .printable-report-modal select,
  .printable-report-modal .print\:hidden {
    display: none !important;
  }

  .printable-report-modal input {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    outline: none !important;
    appearance: none !important;
    -webkit-appearance: none !important;
    padding: 0 !important;
    margin: 0 !important;
    font-size: inherit !important;
    font-family: inherit !important;
    font-weight: inherit !important;
    color: #000000 !important;
  }
}
</style>
