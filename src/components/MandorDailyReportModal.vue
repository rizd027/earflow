<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="printable-mandor-modal fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col font-sans overflow-hidden animate-fadeIn text-slate-100"
    >
      <!-- Modal Top Action Header (Hidden on Print & Edit Cell Mode) -->
      <div v-if="!isEditing" class="py-3 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 gap-3 min-h-[56px] print:hidden">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
            <ClipboardList class="w-4 h-4 text-teal-400" />
          </div>
          <div class="min-w-0">
            <h2 class="text-xs sm:text-sm font-bold text-slate-100 font-mono leading-tight truncate">
              {{ t('mandorReport.modalTitle') }}
            </h2>
            <p class="text-[11px] text-slate-400 leading-tight truncate">
              {{ t('mandorReport.modalSubtitle') }}
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

      <!-- Scrollable Paper Container -->
      <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-3 sm:p-6 print:p-0 print:overflow-visible print:h-auto print:block bg-slate-950/50">

        <!-- Horizontal Touch Scroll Wrapper for Mobile View -->
        <div class="w-full overflow-x-auto no-scrollbar print:overflow-visible pb-2">
          <!-- Physical Printable A4 Sheet Paper -->
          <div
            class="mx-auto bg-white text-black rounded-sm shadow-2xl border-2 border-slate-900 font-mono transition-all duration-300 print:shadow-none print:border-none print:p-2 print:max-w-none print:w-full min-w-[750px] print:min-w-0 max-w-4xl p-4 sm:p-7"
          >
          
          <!-- Sheet Shift Switcher Bar (Excel-like Sheet Tabs, hidden on print) -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 border-b border-black/10 print:hidden">
            <div class="text-[11px] font-bold font-mono text-slate-700 uppercase tracking-wider shrink-0 mr-1">
              Shift:
            </div>
            <button
              v-for="shift in activeShiftSheets"
              :key="shift.id"
              type="button"
              @click="selectedShiftId = shift.id"
              class="px-3 py-1 rounded text-xs font-bold font-mono transition-all flex items-center gap-1.5 shrink-0 border shadow-xs"
              :class="selectedShiftId === shift.id
                ? 'bg-amber-400 text-slate-950 border-amber-500 shadow font-black ring-2 ring-amber-300/50'
                : 'bg-white text-slate-800 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-400 border-slate-400 shadow-sm'"
            >
              <span>{{ shift.name }}</span>
              <span v-if="shift.time" class="text-[10px] font-normal opacity-85">({{ shift.time }})</span>
            </button>

            <!-- Manage Shifts Button -->
            <button
              type="button"
              @click="openShiftManagerModal"
              class="px-2.5 py-1 rounded text-xs font-bold font-mono bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition flex items-center gap-1 shrink-0"
              title="Tambah / Edit Shift"
            >
              <Settings class="w-3.5 h-3.5 text-emerald-600 stroke-[2]" />
              <span>Kelola Shift</span>
            </button>
          </div>

          <!-- Role / Pos Classification Switcher Bar (Pills, hidden on print) -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 border-b border-black/20 print:hidden">
            <div class="text-[11px] font-bold font-mono text-slate-700 uppercase tracking-wider shrink-0 mr-1">
              Pos/Role:
            </div>
            <button
              v-for="rf in roleFilterOptions"
              :key="String(rf.value)"
              type="button"
              @click="selectedRoleFilter = String(rf.value)"
              class="px-2.5 py-1 rounded text-xs font-bold font-mono transition-all flex items-center gap-1 shrink-0 border shadow-xs"
              :class="selectedRoleFilter === String(rf.value)
                ? 'bg-teal-600 text-white border-teal-700 shadow font-black ring-2 ring-teal-400/40'
                : 'bg-white text-slate-800 hover:bg-teal-50 hover:text-teal-900 hover:border-teal-400 border-slate-400 shadow-sm'"
            >
              <span>{{ rf.label }}</span>
            </button>
          </div>

          <!-- Document Main Title Bar -->
          <div class="text-center border-b-2 border-black pb-2 mb-3">
            <h2 class="text-[11px] text-black font-bold font-mono uppercase tracking-widest leading-tight">
              {{ t('mandorReport.sheetTitleZh') }}
            </h2>
            <h1 class="text-base sm:text-xl font-black font-mono tracking-wider uppercase text-black leading-snug">
              {{ t('mandorReport.sheetTitle') }}
            </h1>
          </div>

          <!-- Document Sub-Header Bar (Tanggal & Bagian) -->
          <div class="grid grid-cols-2 max-w-xl gap-x-4 gap-y-1 text-xs font-mono mb-3 pb-2 border-b border-black">
            <div class="flex items-center min-w-0">
              <span class="w-20 text-black font-bold shrink-0">{{ t('mandorReport.date') }}</span>
              <span class="font-extrabold text-black whitespace-nowrap">: {{ formattedSelectedDate }}</span>
            </div>

            <div class="flex items-center min-w-0">
              <span class="w-28 text-black font-bold shrink-0">{{ t('mandorReport.process') }}</span>
              <span class="font-extrabold text-black uppercase truncate">
                : {{ selectedTeamAndRoleLabel }}
                <span v-if="selectedShiftObj" class="ml-1 font-black text-[10px] text-amber-900 bg-amber-200/90 border border-amber-500 px-1.5 py-0.5 rounded shadow-xs uppercase">
                  • {{ selectedShiftObj.name }} {{ selectedShiftObj.time ? `(${selectedShiftObj.time})` : '' }}
                </span>
              </span>
            </div>
          </div>

          <!-- Main Production Record Table (High Contrast Pure White Grid) -->
          <div class="overflow-x-auto print:overflow-visible -mx-2 sm:mx-0 px-2 sm:px-0">
            <div v-if="isEditing" class="sm:hidden mb-2 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] font-mono text-amber-900 flex items-center gap-1.5 shadow-xs">
              <span class="text-sm">👉</span>
              <span>Geser ke kanan untuk melihat & mengisi semua kolom</span>
            </div>
            <table class="w-full min-w-[650px] border-collapse border-2 border-black text-[11px] font-mono leading-tight bg-white">
              <thead>
                <tr class="bg-white text-black text-center uppercase tracking-tight font-black border-b-2 border-black">
                  <th class="sticky left-0 z-20 border border-black p-1 w-8 text-center bg-white text-black font-black print:static">{{ t('mandorReport.colNo') }}<br/><span class="text-[8px] font-normal">序号</span></th>
                  <th class="sticky left-[24px] z-20 border border-black p-1 w-24 text-center bg-white text-black font-black print:static">{{ t('mandorReport.colWorkerNo') }}<br/><span class="text-[8px] font-normal">员工编号</span></th>
                  <th class="sticky left-[100px] z-20 border border-black p-1 min-w-[140px] text-left px-2 bg-white text-black font-black shadow-[2px_0_4px_-1px_rgba(0,0,0,0.15)] print:static print:shadow-none">{{ t('mandorReport.colWorkerName') }} / 姓名</th>
                  <th class="border border-black p-1 w-20 text-right px-1.5 bg-white text-black font-black">{{ t('mandorReport.colTarget') }}<br/><span class="text-[8px] font-normal">计划产量</span></th>
                  <th class="border border-black p-1 w-20 text-right px-1.5 bg-white text-black font-black">{{ t('mandorReport.colProd') }}<br/><span class="text-[8px] font-normal">实际产量</span></th>
                  <th class="border border-black p-1 min-w-[110px] text-left px-2 bg-white text-black font-black">{{ t('mandorReport.colRemark') }} / 备注</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="row in reportRows"
                  :key="row.no"
                  class="text-center h-7 sm:h-6 hover:bg-amber-100/70 hover:text-black print:hover:bg-transparent"
                >
                  <td class="sticky left-0 z-10 border border-black p-0.5 font-bold text-black text-center bg-white print:static">{{ row.no }}</td>

                  <!-- Worker No -->
                  <td class="sticky left-[24px] z-10 border border-black p-0.5 text-black font-mono text-center font-semibold bg-white print:static">
                    <input
                      v-if="isEditing"
                      :value="row.workerNo"
                      @focus="($event.target as HTMLInputElement).select()"
                      @input="saveCellOverrideDebounced(row.no, 'workerNo', ($event.target as HTMLInputElement).value)"
                      class="w-full h-8 sm:h-6 px-1.5 text-center rounded text-xs sm:text-[10px] font-mono focus:outline-none"
                      :class="isRowFieldEdited(row.workerId, 'workerNo')
                        ? 'bg-amber-300 text-amber-950 font-black border-2 border-amber-600 shadow-inner'
                        : 'bg-amber-50 border border-amber-400 focus:border-amber-600 focus:bg-white'"
                    />
                    <span v-else>{{ row.workerNo || '' }}</span>
                  </td>

                  <!-- Worker Name -->
                  <td class="sticky left-[100px] z-10 border border-black p-0.5 text-left px-2 font-black text-black bg-white shadow-[2px_0_4px_-1px_rgba(0,0,0,0.15)] print:static print:shadow-none">
                    <input
                      v-if="isEditing"
                      :value="row.workerName"
                      @focus="($event.target as HTMLInputElement).select()"
                      @input="saveCellOverrideDebounced(row.no, 'workerName', ($event.target as HTMLInputElement).value)"
                      class="w-full h-8 sm:h-6 px-1.5 text-left rounded text-xs sm:text-[10px] font-mono font-bold focus:outline-none"
                      :class="isRowFieldEdited(row.workerId, 'workerName')
                        ? 'bg-amber-300 text-amber-950 font-black border-2 border-amber-600 shadow-inner'
                        : 'bg-amber-50 border border-amber-400 focus:border-amber-600 focus:bg-white'"
                    />
                    <span v-else class="uppercase">{{ row.workerName }}</span>
                  </td>

                  <!-- Target Qty -->
                  <td class="border border-black p-0.5 text-right px-1.5 font-semibold text-black">
                    <input
                      v-if="isEditing"
                      type="number"
                      :value="row.targetQty"
                      @focus="($event.target as HTMLInputElement).select()"
                      @input="saveCellOverrideDebounced(row.no, 'targetQty', ($event.target as HTMLInputElement).value)"
                      class="w-full h-8 sm:h-6 px-1.5 text-right rounded text-xs sm:text-[10px] font-mono font-bold focus:outline-none"
                      :class="isRowFieldEdited(row.workerId, 'targetQty')
                        ? 'bg-amber-300 text-amber-950 font-black border-2 border-amber-600 shadow-inner'
                        : 'bg-amber-50 border border-amber-400 focus:border-amber-600 focus:bg-white'"
                    />
                    <span v-else>{{ row.targetQty ? row.targetQty.toLocaleString('id-ID') : '' }}</span>
                  </td>

                  <!-- Prod Qty -->
                  <td class="border border-black p-0.5 text-right px-1.5 font-black text-black">
                    <input
                      v-if="isEditing"
                      type="number"
                      :value="row.prodQty"
                      @focus="($event.target as HTMLInputElement).select()"
                      @input="saveCellOverrideDebounced(row.no, 'prodQty', ($event.target as HTMLInputElement).value)"
                      class="w-full h-8 sm:h-6 px-1.5 text-right rounded text-xs sm:text-[10px] font-mono font-black focus:outline-none"
                      :class="isRowFieldEdited(row.workerId, 'prodQty')
                        ? 'bg-amber-300 text-amber-950 font-black border-2 border-amber-600 shadow-inner'
                        : 'bg-emerald-50 border border-emerald-500 focus:border-emerald-600 focus:bg-white text-emerald-950 font-extrabold'"
                    />
                    <span v-else :class="row.isQc && (row.isPresent || row.prodQty > 0 || (row.remark && row.remark.toLowerCase().includes('check'))) ? 'font-black tracking-wider text-center block' : ''">
                      {{ (row.isQc && (row.isPresent || row.prodQty > 0 || (row.remark && row.remark.toLowerCase().includes('check')))) ? 'CHECK' : (row.prodQty ? row.prodQty.toLocaleString('id-ID') : '') }}
                    </span>
                  </td>

                  <!-- Remark -->
                  <td class="border border-black p-0.5 text-left px-2 text-black min-w-[110px]" :title="row.remark">
                    <input
                      v-if="isEditing"
                      :value="row.remark"
                      @focus="($event.target as HTMLInputElement).select()"
                      @input="saveCellOverrideDebounced(row.no, 'remark', ($event.target as HTMLInputElement).value)"
                      class="w-full h-8 sm:h-6 px-1.5 text-left rounded text-xs sm:text-[9px] font-mono focus:outline-none"
                      :class="isRowFieldEdited(row.workerId, 'remark')
                        ? 'bg-amber-300 text-amber-950 font-black border-2 border-amber-600 shadow-inner'
                        : 'bg-amber-50 border border-amber-400 focus:border-amber-600 focus:bg-white'"
                    />
                    <span v-else class="text-[10px] block truncate max-w-[140px]" :class="row.remark.includes('Cuti') || row.remark.includes('Keluar') ? 'text-rose-600 font-bold italic' : ''">{{ row.remark }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Table Summary Footer Section -->
          <div class="mt-3 grid grid-cols-2 gap-4 border-t-2 border-black pt-2 text-xs font-mono text-black">
            <div>
              <div class="flex items-center justify-between border-b border-black pb-1">
                <span class="font-bold">
                  {{ t('mandorReport.totalToday') }}
                  <span v-if="locale !== 'zh'" class="text-[10px] font-normal">(当天生产总量)</span>:
                </span>
                <span class="font-black text-sm text-black whitespace-nowrap ml-1">{{ totalDayProduction.toLocaleString('id-ID') }} Pcs</span>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px] border-b border-black pb-1">
                <span class="font-bold">
                  {{ t('mandorReport.attendanceRecords') }}
                  <span v-if="locale !== 'zh'" class="text-[9px] font-normal">(考勤记录)</span>:
                </span>
              </div>
              <div class="flex items-center justify-between text-[11px] pt-0.5">
                <span class="font-medium">
                  {{ t('mandorReport.expectedWorkers') }}
                  <span v-if="locale !== 'zh'" class="text-[9px]">(应到员工)</span>:
                </span>
                <span class="font-bold text-black whitespace-nowrap ml-1">{{ totalExpectedWorkers }} {{ t('mandorReport.personUnit') }}</span>
              </div>
              <div class="flex items-center justify-between text-[11px]">
                <span class="font-medium">
                  {{ t('mandorReport.presentWorkers') }}
                  <span v-if="locale !== 'zh'" class="text-[9px]">(实到员工)</span>:
                </span>
                <span class="font-extrabold text-black whitespace-nowrap ml-1">{{ totalPresentWorkers }} {{ t('mandorReport.personUnit') }}</span>
              </div>
            </div>
          </div>

          <!-- Signatures Box -->
          <div class="mt-6 pt-3 grid grid-cols-2 gap-4 text-xs font-mono border-t border-black print:mt-10 text-black">
            <div class="flex flex-col items-center justify-between h-24 text-center">
              <div>
                <p class="font-bold whitespace-nowrap leading-tight">{{ t('mandorReport.preparedByTitle') }}</p>
                <p class="text-[11px] font-medium text-slate-700 whitespace-nowrap leading-tight mt-0.5">{{ t('mandorReport.preparedByRole') }}</p>
              </div>
              <div class="w-32 sm:w-48 border-b border-black text-center font-bold text-xs pb-0.5 uppercase tracking-wide">
                {{ authStore.foremanName || 'Pak Hendra' }}
              </div>
            </div>

            <div class="flex flex-col items-center justify-between h-24 text-center">
              <div>
                <p class="font-bold whitespace-nowrap leading-tight">{{ t('mandorReport.approvedByTitle') }}</p>
                <p class="text-[11px] font-medium text-slate-700 whitespace-nowrap leading-tight mt-0.5">{{ t('mandorReport.approvedByRole') }}</p>
              </div>
              <div class="w-32 sm:w-48 border-b border-black border-dashed h-4"></div>
            </div>
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
              <span class="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">Pengaturan & Filter Laporan Mandor</span>
            </div>
            <button
              type="button"
              @click="showOptionsPanel = false"
              class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            <!-- Filter 1: Date Picker -->
            <div class="space-y-1">
              <label class="block text-[11px] font-semibold text-slate-400 font-mono">Pilih Tanggal</label>
              <input
                type="date"
                v-model="selectedDate"
                class="w-full h-9 px-3 rounded-md bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono font-bold focus:border-teal-400 focus:outline-none"
              />
            </div>

            <!-- Filter 2: Team Filter -->
            <div class="space-y-1">
              <label class="block text-[11px] font-semibold text-slate-400 font-mono">Pilih Tim / Process</label>
              <CustomSelect
                v-model="selectedTeamId"
                :options="teamFilterOptions"
                :placeholder="t('mandorReport.allTeams')"
              />
            </div>

            <!-- Filter 3: Role / Pos Filter -->
            <div class="space-y-1">
              <label class="block text-[11px] font-semibold text-slate-400 font-mono">Klasifikasi Role / Pos</label>
              <CustomSelect
                v-model="selectedRoleFilter"
                :options="roleFilterOptions"
                placeholder="Semua Role / Pos"
              />
            </div>

            <!-- Filter 4: Target Harian Configuration Input -->
            <div class="space-y-1">
              <label class="block text-[11px] font-semibold text-slate-400 font-mono flex items-center justify-between">
                <span>Target Harian (Pcs)</span>
                <span class="text-[9px] text-teal-400 font-sans font-normal">Auto Sync</span>
              </label>
              <input
                type="number"
                v-model.number="targetValueInput"
                @input="handleTargetInputChange"
                min="0"
                step="10"
                placeholder="Contoh: 500"
                class="w-full h-9 px-3 rounded-md bg-slate-950 border border-slate-700 text-teal-300 text-xs font-mono font-bold focus:border-teal-400 focus:outline-none"
              />
            </div>

            <!-- Filter 5: Sort -->
            <div class="space-y-1">
              <label class="block text-[11px] font-semibold text-slate-400 font-mono">Urutkan Data</label>
              <CustomSelect
                v-model="sortBy"
                :options="sortOptions"
                placeholder="Urutkan..."
              />
            </div>
          </div>

          <!-- Edit & Reset Section -->
          <div class="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="isEditing = !isEditing"
                class="h-9 px-4 rounded-md font-bold text-xs transition inline-flex items-center gap-1.5 border shadow-sm"
                :class="isEditing ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-teal-300'"
              >
                <Pencil class="w-3.5 h-3.5" />
                <span>{{ isEditing ? t('mandorReport.finishEditCell') : t('mandorReport.editCell') }}</span>
              </button>

              <button
                v-if="hasOverrides"
                type="button"
                @click="resetCellOverrides"
                class="h-9 px-3.5 rounded-md bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-xs transition flex items-center gap-1.5"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span>{{ t('mandorReport.resetBtn') }}</span>
              </button>
            </div>

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
            <span v-if="isEditing || hasOverrides || selectedTeamId" class="w-2.5 h-2.5 rounded-full bg-amber-400 absolute -top-1 -right-1 border-2 border-slate-900"></span>
          </button>

          <!-- Active Filter Summary Text -->
          <div class="text-[11px] font-mono text-slate-400 truncate flex items-center gap-1.5">
            <span class="text-teal-400 font-bold">{{ formattedSelectedDate }}</span>
            <span class="text-slate-600">•</span>
            <span class="truncate">{{ selectedTeamLabel }}</span>
            <span v-if="isEditing" class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">EDIT MODE</span>
          </div>
        </div>

        <!-- Action Buttons (Excel & PDF) -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            @click="exportExcel"
            class="h-9 px-3.5 sm:px-4 rounded-md bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40 font-bold text-xs shadow-md transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer"
            title="Download Rekap Format Excel (.csv)"
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

    </div>
    <!-- Shift Manager Modal (overlay inside Teleport) -->
    <div
      v-if="showShiftManagerModal"
      class="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
      @click.self="showShiftManagerModal = false"
    >
      <div class="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm font-sans text-slate-100">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <Settings class="w-4 h-4 text-emerald-400" />
            <h3 class="text-sm font-bold text-slate-100 font-mono">Kelola Shift</h3>
          </div>
          <button
            type="button"
            @click="showShiftManagerModal = false"
            class="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Existing Shifts List -->
        <div class="p-4 space-y-2 max-h-56 overflow-y-auto">
          <div
            v-for="s in shiftStore.shifts"
            :key="s.id"
            class="rounded-md border border-slate-800 bg-slate-950/60 p-2.5 space-y-2"
          >
            <!-- View Mode -->
            <div v-if="editingShiftId !== s.id" class="flex items-center justify-between gap-2">
              <div class="min-w-0">
                <p class="text-xs font-bold text-amber-300 font-mono">{{ s.name }}</p>
                <p class="text-[11px] text-slate-400 font-mono">{{ s.startTime }} - {{ s.endTime }}</p>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  @click="startEditShift(s.id)"
                  class="h-6 px-2 rounded bg-slate-800 hover:bg-teal-500/20 text-slate-400 hover:text-teal-300 transition text-[11px] font-mono"
                >Edit</button>
                <button
                  type="button"
                  @click="deleteShiftItem(s.id)"
                  :disabled="shiftStore.shifts.length <= 1"
                  class="h-6 w-6 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            </div>
            <!-- Edit Mode -->
            <div v-else class="space-y-1.5">
              <input v-model="shiftEditName" type="text" placeholder="Nama Shift" class="w-full h-8 bg-slate-950 border border-teal-500/50 rounded px-2 text-xs text-slate-200 focus:outline-none" />
              <div class="flex gap-1.5">
                <input v-model="shiftEditStart" type="time" class="flex-1 h-8 bg-slate-950 border border-slate-700 rounded px-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500" />
                <span class="text-slate-500 text-xs self-center">-</span>
                <input v-model="shiftEditEnd" type="time" class="flex-1 h-8 bg-slate-950 border border-slate-700 rounded px-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500" />
              </div>
              <div class="flex gap-1.5 pt-0.5">
                <button type="button" @click="saveEditShift" :disabled="!shiftEditName.trim()" class="flex-1 h-7 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 disabled:opacity-40 text-xs font-bold font-mono transition flex items-center justify-center gap-1">
                  <Check class="w-3 h-3" />Simpan
                </button>
                <button type="button" @click="cancelEditShift" class="h-7 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-mono transition">Batal</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Add New Shift Form -->
        <div class="px-4 pb-4 pt-2 border-t border-slate-800 space-y-2">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">+ Tambah Shift Baru</p>
          <input v-model="shiftEditName" type="text" placeholder="Nama Shift (e.g. Shift Malam)" class="w-full h-8 bg-slate-950 border border-slate-700 rounded px-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono" />
          <div class="flex gap-1.5">
            <div class="flex-1">
              <label class="text-[10px] text-slate-500 font-mono block mb-0.5">Mulai</label>
              <input v-model="shiftEditStart" type="time" class="w-full h-8 bg-slate-950 border border-slate-700 rounded px-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500" />
            </div>
            <div class="flex-1">
              <label class="text-[10px] text-slate-500 font-mono block mb-0.5">Selesai</label>
              <input v-model="shiftEditEnd" type="time" class="w-full h-8 bg-slate-950 border border-slate-700 rounded px-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500" />
            </div>
          </div>
          <button
            type="button"
            @click="addNewShiftFromModal"
            :disabled="!shiftEditName.trim() || !shiftEditStart || !shiftEditEnd || editingShiftId !== null"
            class="w-full h-8 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 disabled:opacity-40 text-xs font-bold font-mono border border-emerald-500/30 transition flex items-center justify-center gap-1.5"
          >
            <Plus class="w-3.5 h-3.5" />Tambah Shift
          </button>
        </div>
      </div>
    </div>
  </Teleport>

</template>


<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

// Debounce helper to reduce store writes on every keystroke
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}
import { useProductionStore, getLocalDateStr } from '@/stores/productionStore'
import { useTeamStore } from '@/stores/teamStore'
import { useAuthStore } from '@/stores/authStore'
import { useOverrideStore, type DailyOverride, type WorkerOverride } from '@/stores/overrideStore'
import CustomSelect, { type SelectOption } from '@/components/CustomSelect.vue'
import { ClipboardList, Printer, Pencil, Check, X, RotateCcw, Plus, Settings, Trash2, MoreVertical, SlidersHorizontal, ChevronUp, ChevronDown, FileSpreadsheet } from 'lucide-vue-next'
import { isWorkerInLog, getWorkerShareForLog, DEFAULT_DAILY_TARGET, isWorkerMatchingShift, isWorkerNewOnDate } from '@/utils/reportUtils'
import { useShiftStore } from '@/stores/shiftStore'
import { isTempWorkerNo } from '@/data/noKaryawanData'

const props = defineProps<{
  show: boolean
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

const { t, locale } = useI18n()
const productionStore = useProductionStore()
const teamStore = useTeamStore()
const authStore = useAuthStore()
const overrideStore = useOverrideStore()
const shiftStore = useShiftStore()

// Sheet tabs from global shift store with combined all-shifts option
const activeShiftSheets = computed(() => [
  ...shiftStore.sheetTabOptions,
  { id: 'all_shifts', name: 'Gabungan (Pagi & Siang)', time: 'Semua Shift' }
])
const selectedShiftId = ref(shiftStore.firstShiftId)

watch(() => shiftStore.firstShiftId, () => {
  if (!activeShiftSheets.value.some(s => s.id === selectedShiftId.value)) {
    selectedShiftId.value = 'all_shifts'
  }
})

const selectedShiftObj = computed(() => {
  return activeShiftSheets.value.find(s => s.id === selectedShiftId.value)
})

// Shift Management Modal
const showShiftManagerModal = ref(false)
const shiftEditName = ref('')
const shiftEditStart = ref('')
const shiftEditEnd = ref('')
const editingShiftId = ref<string | null>(null)

function openShiftManagerModal() {
  showShiftManagerModal.value = true
  editingShiftId.value = null
  shiftEditName.value = ''
  shiftEditStart.value = ''
  shiftEditEnd.value = ''
}

function startEditShift(id: string) {
  const s = shiftStore.getShiftById(id)
  if (!s) return
  editingShiftId.value = id
  shiftEditName.value = s.name
  shiftEditStart.value = s.startTime
  shiftEditEnd.value = s.endTime
}

function cancelEditShift() {
  editingShiftId.value = null
  shiftEditName.value = ''
  shiftEditStart.value = ''
  shiftEditEnd.value = ''
}

function saveEditShift() {
  if (!editingShiftId.value || !shiftEditName.value.trim()) return
  shiftStore.editShift(editingShiftId.value, shiftEditName.value, shiftEditStart.value, shiftEditEnd.value)
  cancelEditShift()
}

function addNewShiftFromModal() {
  if (!shiftEditName.value.trim() || !shiftEditStart.value || !shiftEditEnd.value) return
  const newId = shiftStore.addShift(shiftEditName.value, shiftEditStart.value, shiftEditEnd.value)
  selectedShiftId.value = newId
  shiftEditName.value = ''
  shiftEditStart.value = ''
  shiftEditEnd.value = ''
}

function deleteShiftItem(id: string) {
  if (shiftStore.shifts.length <= 1) return
  shiftStore.deleteShift(id)
  if (selectedShiftId.value === id) selectedShiftId.value = 'all_shifts'
}

const selectedDate = ref(productionStore.currentDateStr || getLocalDateStr())
const selectedTeamId = ref('')
const selectedRoleFilter = ref('')

// Edit Cell mode state
const isEditing = ref(false)
const sortBy = ref<'joined_date' | 'name' | 'team' | 'worker_no'>('joined_date')

const sortOptions = [
  { label: 'Urut: Tgl Masuk', value: 'joined_date' },
  { label: 'Urut: Abjad (A-Z)', value: 'name' },
  { label: 'Urut: Tim / Line', value: 'team' },
  { label: 'Urut: No Karyawan', value: 'worker_no' }
]

const roleFilterOptions = computed<SelectOption[]>(() => {
  const opts: SelectOption[] = [
    { label: 'Semua Role / Pos', value: '' }
  ]

  // Add process groups from Settings (e.g. A1 - SOLDER, LEM)
  authStore.processGroups.forEach(g => {
    opts.push({
      label: `KODE ${g.code} (${g.roles.join(', ')})`,
      value: `group_${g.code}`
    })
  })

  // Add QC & SPK if distinct
  opts.push({ label: 'QC / Pemeriksaan', value: 'QC' })
  opts.push({ label: 'SPK / Lembaran', value: 'SPK' })

  // Extract other distinct roles
  const knownRoles = new Set<string>()
  authStore.processGroups.forEach(g => g.roles.forEach(r => knownRoles.add(r.toUpperCase())))
  knownRoles.add('QC')
  knownRoles.add('CHECK')
  knownRoles.add('SPK')

  teamStore.allWorkers.forEach(w => {
    if (w.role && w.role.trim()) {
      const r = w.role.trim()
      const rUp = r.toUpperCase()
      if (!knownRoles.has(rUp) && !Array.from(knownRoles).some(k => rUp.includes(k))) {
        if (!opts.some(o => String(o.value).toLowerCase() === r.toLowerCase())) {
          opts.push({ label: r, value: r })
        }
      }
    }
  })

  return opts
})

function matchesRoleFilter(w: any, filterVal: string): boolean {
  if (!filterVal) return true
  const roleUpper = (w.role || '').toUpperCase()
  const team = teamStore.teams.find(t => t.id === w.team_id)
  const teamUpper = (team?.name || '').toUpperCase()

  if (filterVal === 'QC') {
    return roleUpper.includes('QC') || roleUpper.includes('CHECK') || teamUpper.includes('QC')
  }
  if (filterVal === 'SPK') {
    return roleUpper.includes('SPK') || teamUpper.includes('SPK')
  }
  if (filterVal.startsWith('group_')) {
    const code = filterVal.replace('group_', '').toUpperCase()
    const group = authStore.processGroups.find(g => g.code.toUpperCase() === code)
    if (group) {
      if (group.roles.some(r => roleUpper.includes(r.toUpperCase()))) return true
      if (authStore.getProcessCodeForRole(w.role).toUpperCase() === code) return true
    }
    return false
  }
  return roleUpper.includes(filterVal.toUpperCase()) || (w.role || '').toLowerCase() === filterVal.toLowerCase()
}

function saveCellOverride(rowNo: number, field: string, value: any) {
  const rowWorker = reportRows.value[rowNo - 1]
  const workerId = rowWorker?.workerId || `row_${rowNo}`

  if (field === 'workerNo' || field === 'workerName') {
    overrideStore.setWorkerOverride(workerId, field as keyof WorkerOverride, value)
  } else {
    overrideStore.setDailyOverride(workerId, selectedDate.value, field as keyof DailyOverride, value, selectedShiftId.value)
  }
}

// Debounced version for text fields — fires 300ms after last keystroke
const saveCellOverrideDebounced = debounce(saveCellOverride, 300)

function isRowFieldEdited(workerId: string, field: string): boolean {
  if (!workerId) return false
  if (field === 'workerNo' || field === 'workerName') {
    return overrideStore.getWorkerOverride(workerId)?.[field as keyof WorkerOverride] !== undefined
  }
  return overrideStore.getDailyOverride(workerId, selectedDate.value, selectedShiftId.value)?.[field as keyof DailyOverride] !== undefined
}

function resetCellOverrides() {
  overrideStore.resetDailyOverridesForDate(selectedDate.value)
}

const hasOverrides = computed(() => {
  const dateStr = selectedDate.value
  return Object.keys(overrideStore.dailyMap).some(k => k.endsWith(`_${dateStr}`))
})

const teamFilterOptions = computed<SelectOption[]>(() => {
  return [
    { label: t('mandorReport.allTeams'), value: '' },
    ...teamStore.teams.map(team => ({ label: team.name, value: team.id }))
  ]
})

// Target Harian configuration input & auto-sync with teamStore & DB
const targetValueInput = ref<number>(500)

function updateTargetInputFromStore() {
  if (selectedTeamId.value) {
    const team = teamStore.teams.find(t => t.id === selectedTeamId.value)
    if (team && team.hourly_target) {
      targetValueInput.value = team.hourly_target
      return
    }
  }
  const firstTeamTarget = teamStore.teams.find(t => t.hourly_target > 0)?.hourly_target
  targetValueInput.value = firstTeamTarget || 500
}

watch(selectedTeamId, () => {
  updateTargetInputFromStore()
}, { immediate: true })

watch(() => teamStore.teams, () => {
  updateTargetInputFromStore()
}, { deep: true })

async function handleTargetInputChange() {
  const val = Number(targetValueInput.value)
  if (isNaN(val) || val < 0) return

  if (selectedTeamId.value) {
    const team = teamStore.teams.find(t => t.id === selectedTeamId.value)
    if (team) {
      await teamStore.updateTeam(team.id, team.name, val)
    }
  } else {
    for (const team of teamStore.teams) {
      await teamStore.updateTeam(team.id, team.name, val)
    }
  }

  let targetWorkerIds = teamStore.allWorkers.map(w => w.id)
  if (selectedTeamId.value) {
    targetWorkerIds = teamStore.allWorkers.filter(w => w.team_id === selectedTeamId.value).map(w => w.id)
  }

  overrideStore.updateTargetQtyForAllOverrides(selectedDate.value, val, targetWorkerIds)

  for (const wId of targetWorkerIds) {
    overrideStore.setWorkerOverride(wId, 'target', String(val))
    overrideStore.setDailyOverride(wId, selectedDate.value, 'targetQty', val, selectedShiftId.value)
  }
}

const selectedTeamLabel = computed(() => {
  if (!selectedTeamId.value) return t('mandorReport.allTeams')
  const found = teamStore.teams.find(team => team.id === selectedTeamId.value)
  return found ? found.name : t('mandorReport.allTeams')
})

const selectedTeamAndRoleLabel = computed(() => {
  const teamLabel = selectedTeamLabel.value
  if (!selectedRoleFilter.value) return teamLabel
  const foundRole = roleFilterOptions.value.find(o => o.value === selectedRoleFilter.value)
  const roleLabel = foundRole ? foundRole.label : selectedRoleFilter.value
  return `${teamLabel} • ${roleLabel}`
})

const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

const formattedSelectedDate = computed(() => {
  if (!selectedDate.value) return '-'
  const parts = selectedDate.value.split('-')
  if (parts.length !== 3) return selectedDate.value
  const day = parseInt(parts[2])
  const monthIdx = parseInt(parts[1]) - 1
  const year = parts[0]
  const monthName = t(`time.${monthKeys[monthIdx]}`)
  return `${day} ${monthName} ${year}`
})

function buildRowsForWorkers(workerList: typeof teamStore.allWorkers, logsForDate: typeof productionStore.logs) {
  const rows = []
  const TOTAL_ROWS = Math.max(32, workerList.length)

  for (let i = 1; i <= TOTAL_ROWS; i++) {
    const worker = workerList[i - 1]
    const workerId = worker ? worker.id : `row_${i}`
    const wOverride = overrideStore.getWorkerOverride(workerId) || {}
    const dOverride = overrideStore.getDailyOverride(workerId, selectedDate.value, selectedShiftId.value) || {}

    if (worker) {
      const workerTeam = teamStore.teams.find(t => t.id === worker.team_id)
      const baseTargetQty = (workerTeam && workerTeam.hourly_target > 0) ? workerTeam.hourly_target : (targetValueInput.value || DEFAULT_DAILY_TARGET)
      const teamMemberCount = workerTeam ? (workerTeam.members ? workerTeam.members.length : 1) : 1

      const workerLogs = logsForDate.filter(l => isWorkerInLog(l, worker))

      let baseProdQty = 0
      for (const log of workerLogs) {
        baseProdQty += getWorkerShareForLog(log, teamMemberCount)
      }
      baseProdQty = Math.max(0, baseProdQty)

      const prodQty = dOverride.prodQty !== undefined ? dOverride.prodQty : baseProdQty
      const isPresent = workerLogs.length > 0 || prodQty > 0

      const remarks = workerLogs.map(l => l.notes).filter(Boolean).filter(n => !n?.includes('Reset hasil')).join('; ')
      const workerStatus = (worker.status || '').toLowerCase()
      const isOut = workerStatus.includes('keluar') || workerStatus.includes('out')
      const isOnLeave = workerStatus.includes('cuti')
      const isNewInInterval = isWorkerNewOnDate(worker.joined_date, selectedDate.value, 7)
      const isBeforeJoined = !!worker.joined_date && selectedDate.value < worker.joined_date
      const effectiveRole = (worker.role || '').toUpperCase()
      const isQc = effectiveRole.includes('QC') || effectiveRole.includes('CHECK') || (workerTeam?.name || '').toUpperCase().includes('QC') || (dOverride.remark || remarks || '').toLowerCase().includes('check')

      let defaultRemark = ''
      if (isBeforeJoined && !isPresent) {
        defaultRemark = 'Belum Bergabung'
      } else if (isOut && !isPresent) {
        defaultRemark = 'Keluar'
      } else if (isOnLeave && !isPresent) {
        defaultRemark = 'Cuti'
      } else if (isPresent) {
        const basePresentText = isQc ? 'Check' : (remarks || t('mandorReport.remarkPresent'))
        defaultRemark = isNewInInterval ? `${basePresentText} (${t('mandorReport.remarkNew')})` : basePresentText
      } else {
        defaultRemark = t('mandorReport.remarkAbsent')
      }

      const workerNo = wOverride.workerNo !== undefined ? wOverride.workerNo : ((worker.no_karyawan && !isTempWorkerNo(worker.no_karyawan) && worker.no_karyawan !== '-') ? worker.no_karyawan : '')
      const workerName = wOverride.workerName !== undefined ? wOverride.workerName : worker.full_name
      const targetQty = dOverride.targetQty !== undefined ? dOverride.targetQty : baseTargetQty
      const remark = dOverride.remark !== undefined ? dOverride.remark : defaultRemark

      rows.push({
        no: i,
        workerId,
        workerNo,
        workerName,
        targetQty,
        prodQty,
        remark,
        isQc,
        isPresent
      })
    } else {
      const workerNo = wOverride.workerNo !== undefined ? wOverride.workerNo : ''
      const workerName = wOverride.workerName !== undefined ? wOverride.workerName : ''
      const targetQty = dOverride.targetQty !== undefined ? dOverride.targetQty : 0
      const prodQty = dOverride.prodQty !== undefined ? dOverride.prodQty : 0
      const remark = dOverride.remark !== undefined ? dOverride.remark : ''

      rows.push({
        no: i,
        workerId,
        workerNo,
        workerName,
        targetQty,
        prodQty,
        remark,
        isQc: false,
        isPresent: false
      })
    }
  }

  return rows
}

// Compute report rows up to 32 fixed rows for a pristine single A4 sheet fit
const reportRows = computed(() => {
  let workerList = [...teamStore.allWorkers]
  if (selectedTeamId.value) {
    workerList = workerList.filter(w => w.team_id === selectedTeamId.value)
  }
  if (selectedShiftObj.value && selectedShiftId.value !== 'all_shifts') {
    workerList = workerList.filter(w => isWorkerMatchingShift(w, selectedShiftObj.value, teamStore.teams))
  }
  if (selectedRoleFilter.value) {
    workerList = workerList.filter(w => matchesRoleFilter(w, selectedRoleFilter.value))
  }

  const logsForDate = productionStore.logs.filter(l => l.date === selectedDate.value && l.total_qty > 0 && l.hour_slot !== 'Reset Hasil Tim')

  // Filter out workers with status 'Keluar' if they have no production logs in selectedDate's month
  const selectedMonthStr = selectedDate.value ? selectedDate.value.slice(0, 7) : getLocalDateStr().slice(0, 7)
  const monthLogs = productionStore.logs.filter(l => l.date && l.date.startsWith(selectedMonthStr))
  workerList = workerList.filter(w => {
    const isOut = (w.status || '').toLowerCase().includes('keluar') || (w.status || '').toLowerCase().includes('out')
    if (isOut) {
      const hasLogsInMonth = monthLogs.some(l => isWorkerInLog(l, w))
      if (!hasLogsInMonth) return false
    }
    return true
  })

  workerList.sort((a, b) => {
    if (sortBy.value === 'joined_date') {
      const dA = a.joined_date || '9999-99-99'
      const dB = b.joined_date || '9999-99-99'
      return dA.localeCompare(dB)
    }
    if (sortBy.value === 'name') {
      return (a.full_name || '').localeCompare(b.full_name || '', 'id', { sensitivity: 'base' })
    }
    if (sortBy.value === 'team') {
      const tA = teamStore.teams.find(t => t.id === a.team_id)?.name || ''
      const tB = teamStore.teams.find(t => t.id === b.team_id)?.name || ''
      const comp = tA.localeCompare(tB)
      if (comp !== 0) return comp
      return (a.full_name || '').localeCompare(b.full_name || '')
    }
    if (sortBy.value === 'worker_no') {
      const nA = (a.no_karyawan && !isTempWorkerNo(a.no_karyawan)) ? a.no_karyawan : '999999'
      const nB = (b.no_karyawan && !isTempWorkerNo(b.no_karyawan)) ? b.no_karyawan : '999999'
      return nA.localeCompare(nB, undefined, { numeric: true })
    }
    return 0
  })

  return buildRowsForWorkers(workerList, logsForDate)
})

const totalDayProduction = computed(() => {
  return reportRows.value.reduce((acc, r) => acc + (r.prodQty || 0), 0)
})

const totalExpectedWorkers = computed(() => {
  let list = teamStore.allWorkers
  if (selectedTeamId.value) {
    list = list.filter(w => w.team_id === selectedTeamId.value)
  }
  if (selectedShiftObj.value && selectedShiftId.value !== 'all_shifts') {
    list = list.filter(w => isWorkerMatchingShift(w, selectedShiftObj.value, teamStore.teams))
  }
  if (selectedRoleFilter.value) {
    list = list.filter(w => matchesRoleFilter(w, selectedRoleFilter.value))
  }
  return list.length
})

const totalPresentWorkers = computed(() => {
  const absentLabel = t('mandorReport.remarkAbsent').toLowerCase()
  return reportRows.value.filter(r => {
    if (!r.workerName || !r.workerName.trim()) return false
    const rem = (r.remark || '').toLowerCase().trim()
    return rem !== absentLabel && !rem.includes('absen') && !rem.includes('absent') && !rem.includes('tidak hadir')
  }).length
})

import { exportToXlsxMultiSheetRich, type RichSheetOptions } from '@/utils/excelExport'

function exportExcel() {
  // Bilingual column headers matching the UI table exactly
  const columnHeaders = [
    `${t('mandorReport.colNo')} / 序号`,
    `${t('mandorReport.colWorkerNo')} / 员工编号`,
    `${t('mandorReport.colWorkerName')} / 姓名`,
    `${t('mandorReport.colTarget')} / 计划产量`,
    `${t('mandorReport.colProd')} / 实际产量`,
    `${t('mandorReport.colRemark')} / 备注`
  ]

  const shiftLabelStr = selectedShiftObj.value
    ? `${selectedShiftObj.value.name}${selectedShiftObj.value.time ? ` (${selectedShiftObj.value.time})` : ''}`
    : undefined

  const logsForDate = productionStore.logs.filter(l => l.date === selectedDate.value && l.total_qty > 0 && l.hour_slot !== 'Reset Hasil Tim')

  const baseWorkerList = teamStore.allWorkers.filter(w => {
    if (selectedTeamId.value && w.team_id !== selectedTeamId.value) return false
    if (selectedShiftObj.value && selectedShiftId.value !== 'all_shifts' && !isWorkerMatchingShift(w, selectedShiftObj.value, teamStore.teams)) return false
    return true
  })

  // Build sheets for multi-sheet workbook
  const sheets: RichSheetOptions[] = []

  // Helper to construct a single RichSheetOptions
  const createSheetConfig = (name: string, workers: typeof teamStore.allWorkers, roleLabel?: string): RichSheetOptions => {
    const rowsBuilt = buildRowsForWorkers(workers, logsForDate)
    const totalProd = rowsBuilt.reduce((acc, r) => acc + (r.prodQty || 0), 0)
    const absentLabel = t('mandorReport.remarkAbsent').toLowerCase()
    const presentCount = rowsBuilt.filter(r => {
      if (!r.workerName || !r.workerName.trim()) return false
      const rem = (r.remark || '').toLowerCase().trim()
      return rem !== absentLabel && !rem.includes('absen') && !rem.includes('absent') && !rem.includes('tidak hadir')
    }).length

    const rowsData = rowsBuilt.map(r => [
      r.no,
      r.workerNo || '',
      r.workerName || '',
      r.targetQty || 0,
      r.isQc && (r.isPresent || r.prodQty > 0 || (r.remark && r.remark.toLowerCase().includes('check'))) ? 'CHECK' : (r.prodQty || 0),
      r.remark || ''
    ])

    const processDisplay = roleLabel ? `${selectedTeamLabel.value.toUpperCase()} • ${roleLabel.toUpperCase()}` : selectedTeamLabel.value.toUpperCase()

    return {
      sheetName: name,
      titleZh: '员工日目标报告表',
      titleId: t('mandorReport.sheetTitle'),
      dateLabel: t('mandorReport.date'),
      dateValue: formattedSelectedDate.value,
      processLabel: t('mandorReport.process'),
      processValue: processDisplay,
      shiftLabel: shiftLabelStr,
      columnHeaders,
      rows: rowsData,
      totalProduction: totalProd,
      totalProductionLabel: `${t('mandorReport.totalToday')} (当天生产总量)`,
      totalProductionUnit: 'Pcs',
      expectedWorkersLabel: `${t('mandorReport.expectedWorkers')} (应到员工)`,
      expectedWorkers: workers.length,
      presentWorkersLabel: `${t('mandorReport.presentWorkers')} (实到员工)`,
      presentWorkers: presentCount,
      personUnit: t('mandorReport.personUnit')
    }
  }

  // If a specific role is currently selected, add it as the first sheet
  if (selectedRoleFilter.value) {
    const roleOpt = roleFilterOptions.value.find(o => o.value === selectedRoleFilter.value)
    const roleLabel = roleOpt ? roleOpt.label : selectedRoleFilter.value
    const filteredWorkers = baseWorkerList.filter(w => matchesRoleFilter(w, selectedRoleFilter.value))
    sheets.push(createSheetConfig(roleLabel.slice(0, 25), filteredWorkers, roleLabel))
  }

  // 1. Sheet: Gabungan Semua
  sheets.push(createSheetConfig('Semua Tim Gabungan', baseWorkerList))

  // 2. Sheets per Process Code Group (e.g. A1 Solder/Lem, A2, etc.)
  authStore.processGroups.forEach(g => {
    const groupWorkers = baseWorkerList.filter(w => matchesRoleFilter(w, `group_${g.code}`))
    if (groupWorkers.length > 0) {
      sheets.push(createSheetConfig(`KODE ${g.code} (${g.roles.join(', ')})`.slice(0, 28), groupWorkers, `KODE ${g.code}`))
    }
  })

  // 3. Sheet: QC Pemeriksaan
  const qcWorkers = baseWorkerList.filter(w => matchesRoleFilter(w, 'QC'))
  if (qcWorkers.length > 0 && !sheets.some(s => s.sheetName.includes('QC'))) {
    sheets.push(createSheetConfig('QC Pemeriksaan', qcWorkers, 'QC Check'))
  }

  // 4. Sheet: SPK Lembaran
  const spkWorkers = baseWorkerList.filter(w => matchesRoleFilter(w, 'SPK'))
  if (spkWorkers.length > 0 && !sheets.some(s => s.sheetName.includes('SPK'))) {
    sheets.push(createSheetConfig('SPK Lembaran', spkWorkers, 'SPK'))
  }

  const lineName = (selectedTeamLabel.value || 'Semua_Tim').trim().replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_')
  const shiftName = selectedShiftObj.value ? selectedShiftObj.value.name.trim().replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_') : 'Semua_Shift'
  const roleName = selectedRoleFilter.value ? `_${selectedRoleFilter.value.replace(/[^a-zA-Z0-9]/g, '_')}` : ''
  const filename = `Laporan_Mandor_Harian_${lineName}${roleName}_${selectedDate.value}_${shiftName}.xlsx`

  exportToXlsxMultiSheetRich(filename, sheets)
}

function triggerPrint() {
  window.print()
}
</script>

<style>
.printable-mandor-modal th {
  background-color: #ffffff !important;
  color: #000000 !important;
}

@media print {
  @page {
    size: A4 portrait !important;
    margin: 5mm 5mm !important;
  }

  /* Completely hide app background elements during print */
  #app, 
  header, 
  nav, 
  footer, 
  .print\:hidden {
    display: none !important;
  }

  /* Teleported printable modal sheet */
  body > .printable-mandor-modal {
    display: block !important;
    position: relative !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: auto !important;
    background: #ffffff !important;
    color: #000000 !important;
    overflow: visible !important;
    z-index: 9999999 !important;
    padding: 2mm !important;
    margin: 0 auto !important;
    box-sizing: border-box !important;
  }

  .printable-mandor-modal table {
    width: 100% !important;
    min-width: 100% !important;
    max-width: 100% !important;
    table-layout: auto !important;
  }

  .printable-mandor-modal,
  .printable-mandor-modal * {
    color: #000000 !important;
    background: transparent !important;
    box-shadow: none !important;
    border-color: #000000 !important;
  }

  .printable-mandor-modal button,
  .printable-mandor-modal select,
  .printable-mandor-modal .print\:hidden {
    display: none !important;
  }

  .printable-mandor-modal input {
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
