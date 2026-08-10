<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="printable-recap-modal fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col font-sans overflow-hidden animate-fadeIn text-slate-100"
    >
      <!-- Modal Top Action Header (Hidden on Print & Edit Cell Mode) -->
      <div v-if="!isEditing" class="py-3 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 gap-3 min-h-[56px] print:hidden">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
            <Table class="w-4 h-4 text-teal-400" />
          </div>
          <div class="min-w-0">
            <h2 class="text-xs sm:text-sm font-bold text-slate-100 font-mono leading-tight truncate">
              {{ t('monthlyRecap.modalTitle') }}
            </h2>
            <p class="text-[11px] text-slate-400 leading-tight truncate">
              {{ t('monthlyRecap.modalSubtitle') }}
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

      <!-- Scrollable Sheet Container -->
      <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-2 sm:p-4 print:p-0 print:overflow-visible print:h-auto print:block bg-slate-950/50">

        <!-- Horizontal Touch Scroll Wrapper for Mobile View -->
        <div class="w-full overflow-x-auto no-scrollbar print:overflow-visible pb-2">
          <!-- Physical Printable A4 Sheet Paper (Landscape) -->
          <div
            id="monthly-recap-printable-sheet"
            class="mx-auto bg-white text-black rounded-sm shadow-2xl border-2 border-slate-900 font-mono transition-all duration-300 print:shadow-none print:border-none print:p-1 print:max-w-none print:w-full min-w-[1150px] print:min-w-0 max-w-[1380px] p-3 sm:p-5"
          >
          
          <!-- Sheet Shift Switcher Bar (Excel-like Sheet Tabs, hidden on print) -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 border-b border-black/20 print:hidden">
            <div class="text-[11px] font-bold font-mono text-slate-700 uppercase tracking-wider shrink-0 mr-1">
              Sheet Shift:
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

          <!-- Official Excel Sheet Header -->
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-3 print:gap-1 mb-3 print:mb-1 pb-2.5 print:pb-1 border-b-2 border-black font-mono text-black">
            <!-- Left Info Block -->
            <div class="space-y-1 print:space-y-0 min-w-0">
              <div class="text-xs sm:text-sm print:text-[10px] font-black uppercase tracking-tight flex flex-wrap items-center gap-1.5 print:gap-1">
                <span>{{ t('monthlyRecap.lineLabel') }}:</span>
                <span class="underline text-black">{{ selectedTeamLabel.toUpperCase() }}</span>
                <span v-if="selectedShiftObj" class="font-black text-[11px] print:text-[9px] text-amber-950 bg-amber-200 border border-amber-500 px-2 print:px-1 py-0.5 print:py-0 rounded shadow-xs uppercase whitespace-nowrap">
                  • {{ selectedShiftObj.name }} {{ selectedShiftObj.time ? `(${selectedShiftObj.time})` : '' }}
                </span>
              </div>
              <div class="text-[11px] print:text-[9px] font-semibold text-slate-800">
                {{ t('monthlyRecap.processLabel') }}: <span class="font-bold text-black">SOLDER / LEM / GULUNG / PACKING</span>
              </div>
            </div>

            <!-- Center Title Block -->
            <div class="text-left md:text-center md:px-2 shrink-0">
              <h2 class="text-xs print:text-[8px] font-bold uppercase tracking-widest text-slate-800 leading-none">
                {{ t('monthlyRecap.sheetTitleZh') }}
              </h2>
              <h1 class="text-lg sm:text-2xl print:text-sm font-black tracking-wide uppercase text-black leading-tight whitespace-nowrap">
                {{ t('monthlyRecap.sheetTitle') }}
              </h1>
            </div>

            <!-- Right Metadata Block -->
            <div class="text-left md:text-right text-xs print:text-[9px] space-y-0.5 print:space-y-0 shrink-0">
              <div class="font-medium text-slate-800">
                Bulan 月份: <span class="font-black text-sm print:text-xs uppercase text-black ml-1">{{ formattedSelectedMonth }}</span>
              </div>
              <div class="text-[11px] print:text-[9px] font-medium text-slate-800">
                Manajer Produksi 生产管理: <span class="font-bold text-black ml-1">{{ foremanName }}</span>
              </div>
            </div>
          </div>

          <!-- Main Production Matrix Table (Pure White High-Contrast Grid) -->
          <div class="overflow-x-auto print:overflow-visible">
            <table class="recap-table w-full border-collapse border-2 border-black text-[9px] font-mono leading-none bg-white text-black table-fixed">
              <thead>
                <tr class="bg-slate-100 text-black text-center uppercase tracking-tighter font-black border-b-2 border-black sticky top-0 z-20">
                  <th class="print-col-no sticky top-0 z-20 border border-black p-0.5 w-[2%] text-center bg-slate-100 text-black font-black">No<br/><span class="text-[7px] font-normal">数</span></th>
                  <th class="print-col-nik sticky top-0 z-20 border border-black p-0.5 w-[4.5%] text-center bg-slate-100 text-black font-black">No Krywn<br/><span class="text-[7px] font-normal">员工编号</span></th>
                  <th class="print-col-name sticky top-0 z-20 border border-black p-0.5 w-[10.5%] text-left px-1 bg-slate-100 text-black font-black">Nama Karyawan<br/><span class="text-[7px] font-normal">员工姓名</span></th>
                  <th class="print-col-process sticky top-0 z-20 border border-black p-0.5 w-[5%] text-center bg-slate-100 text-black font-black">Proses Produksi<br/><span class="text-[7px] font-normal">工序</span></th>
                  <th class="print-col-target sticky top-0 z-20 border border-black p-0.5 w-[3.5%] text-center bg-slate-100 text-black font-black">Target<br/><span class="text-[7px] font-normal">目标</span></th>
                  
                  <!-- Day Columns 1..daysInMonth (Formatted as d/m) -->
                  <th
                    v-for="dInfo in monthDaysData"
                    :key="dInfo.day"
                    :style="printDayColStyle"
                    class="print-col-day sticky top-0 z-20 border border-black p-0.5 text-center bg-slate-100 text-black font-black text-[7.5px]"
                  >
                    {{ dInfo.day }}/{{ month + 1 }}
                  </th>

                  <th class="print-col-total sticky top-0 z-20 border border-black p-0.5 w-[4.5%] text-right px-0.5 bg-slate-100 text-black font-black">Total<br/><span class="text-[7px] font-normal">当月总产量</span></th>
                  <th class="print-col-remark sticky top-0 z-20 border border-black p-0.5 w-[3.5%] text-left px-1 bg-slate-100 text-black font-black">Catatan<br/><span class="text-[7px] font-normal">备注</span></th>
                </tr>
              </thead>

              <tbody>
                <!-- Worker Rows (1..reportRows) -->
                <tr
                  v-for="row in reportRows"
                  :key="row.no"
                  class="text-center h-5 bg-white text-black hover:bg-amber-100/70 hover:text-black print:hover:bg-transparent"
                >
                  <!-- No -->
                  <td class="print-col-no border border-black p-0.5 font-bold text-black text-center text-[9px] bg-white">{{ row.no }}</td>
                  
                  <!-- Worker No -->
                  <td class="print-col-nik border border-black p-0.5 text-black font-mono text-center font-semibold text-[8px] bg-white">
                    <input
                      v-if="isEditing"
                      :value="row.workerNo"
                      @focus="($event.target as HTMLInputElement).select()"
                      @input="saveWorkerOverrideDebounced(row.workerId, 'workerNo', ($event.target as HTMLInputElement).value)"
                      class="w-full h-4 px-0.5 text-center bg-amber-50 border border-amber-400 text-black rounded text-[8px] font-mono focus:outline-none focus:bg-white"
                    />
                    <span v-else class="text-black">{{ row.workerNo }}</span>
                  </td>

                  <!-- Worker Name -->
                  <td class="print-col-name border border-black p-0.5 text-black font-mono text-left px-1 font-bold text-[9px] truncate max-w-[130px] bg-white">
                    <input
                      v-if="isEditing"
                      :value="row.workerName"
                      @focus="($event.target as HTMLInputElement).select()"
                      @input="saveWorkerOverrideDebounced(row.workerId, 'workerName', ($event.target as HTMLInputElement).value)"
                      class="w-full h-4 px-1 text-left bg-amber-50 border border-amber-400 text-black rounded text-[8px] font-mono focus:outline-none focus:bg-white"
                    />
                    <span v-else class="text-black">{{ row.workerName }}</span>
                  </td>

                  <!-- Process (Proses Produksi) -->
                  <td class="print-col-process border border-black p-0.5 text-black font-mono text-center text-[8px] bg-white truncate max-w-[80px]">
                    <input
                      v-if="isEditing"
                      :value="row.process"
                      @focus="($event.target as HTMLInputElement).select()"
                      @input="saveWorkerOverrideDebounced(row.workerId, 'process', ($event.target as HTMLInputElement).value)"
                      list="recap-process-types-list"
                      class="w-full h-4 px-0.5 text-center bg-amber-50 border border-amber-400 text-black rounded text-[8px] font-mono focus:outline-none focus:bg-white font-semibold"
                    />
                    <span v-else class="text-black font-semibold">{{ row.process }}</span>
                  </td>

                  <!-- Target -->
                  <td class="print-col-target border border-black p-0.5 text-black font-mono text-center text-[8px] bg-white">
                    <input
                      v-if="isEditing"
                      :value="row.target"
                      @focus="($event.target as HTMLInputElement).select()"
                      @change="saveWorkerOverride(row.workerId, 'target', ($event.target as HTMLInputElement).value)"
                      placeholder="Target..."
                      class="w-full h-4 px-0.5 text-center bg-amber-50 border border-amber-400 text-black rounded text-[8px] font-mono focus:outline-none focus:bg-white"
                    />
                    <span v-else class="text-black">{{ row.target || '-' }}</span>
                  </td>

                  <!-- Daily Yield Cells (Day 1..monthDaysData) -->
                  <td
                    v-for="dInfo in monthDaysData"
                    :key="dInfo.day"
                    :style="printDayColStyle"
                    class="print-col-day border border-black p-0 text-center font-mono text-[8px] bg-white text-black overflow-hidden whitespace-nowrap"
                    :class="matrixAndSummary.matrix[row.workerId]?.[dInfo.day]?.bgClass"
                  >
                    <input
                      v-if="isEditing"
                      type="number"
                      :value="matrixAndSummary.matrix[row.workerId]?.[dInfo.day]?.inputValue"
                      :placeholder="dInfo.isSunday ? 'MG' : '-'"
                      @focus="($event.target as HTMLInputElement).select()"
                      @change="saveCellOverride(row.workerId, dInfo.day, ($event.target as HTMLInputElement).value)"
                      class="w-full h-full min-h-[22px] px-0.5 text-center text-[9.5px] font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      :class="matrixAndSummary.matrix[row.workerId]?.[dInfo.day]?.isEdited
                        ? 'bg-amber-300 text-amber-950 font-black border-2 border-amber-600 shadow-inner'
                        : 'bg-amber-50/80 text-black font-extrabold border border-amber-300 focus:bg-white focus:border-amber-600'"
                    />
                    <span v-else class="text-black inline-block py-0.5 px-0.5">
                      {{ matrixAndSummary.matrix[row.workerId]?.[dInfo.day]?.display }}
                    </span>
                  </td>

                  <!-- Monthly Worker Sum -->
                  <td class="print-col-total border border-black p-0.5 text-right px-1 font-black text-black text-[9px] bg-white">
                    {{ (matrixAndSummary.workerTotals[row.workerId] || 0) > 0 ? matrixAndSummary.workerTotals[row.workerId] : '-' }}
                  </td>

                  <!-- Remark -->
                  <td class="print-col-remark border border-black p-0.5 text-left px-1 text-[8px] font-mono text-black bg-white">
                    <input
                      v-if="isEditing"
                      :value="row.remark"
                      @focus="($event.target as HTMLInputElement).select()"
                      @input="saveWorkerOverrideDebounced(row.workerId, 'remark', ($event.target as HTMLInputElement).value)"
                      class="w-full h-4 px-1 text-left bg-amber-50 border border-amber-400 text-black rounded text-[8px] font-mono focus:outline-none focus:bg-white"
                    />
                    <span v-else class="text-black">{{ row.remark || '-' }}</span>
                  </td>
                </tr>

                <!-- Summary Row 1: Total produksi hari itu -->
                <tr class="bg-slate-200 text-black font-black text-center h-6 border-t-2 border-black">
                  <td colspan="5" class="border border-black px-1 text-left text-[9px] uppercase tracking-tight text-black font-black">
                    Total produksi hari itu 当天总量汇总
                  </td>
                  <td
                    v-for="dInfo in monthDaysData"
                    :key="dInfo.day"
                    :style="printDayColStyle"
                    class="print-col-day border border-black p-0.5 text-center text-[8px] font-black text-black print:min-w-0"
                  >
                    {{ (matrixAndSummary.dailyTotals[dInfo.day] || 0) > 0 ? matrixAndSummary.dailyTotals[dInfo.day] : '-' }}
                  </td>
                  <td class="border border-black p-0.5 text-right px-0.5 text-[9px] font-black bg-emerald-200 text-emerald-950">
                    {{ matrixAndSummary.grandTotal }}
                  </td>
                  <td class="border border-black p-0.5 text-left px-1 text-[7px] text-black">Total Harian</td>
                </tr>

                <!-- Summary Row 2: Catatan Kehadiran - hrus kerja -->
                <tr class="bg-white text-black font-bold text-center h-5">
                  <td rowspan="3" class="border border-black p-0.5 text-center text-[8px] font-bold text-black align-middle bg-slate-50">
                    Catatan<br/>kehadiran<br/><span class="text-[7px]">考勤记录</span>
                  </td>
                  <td colspan="4" class="border border-black px-1 text-left text-[8px] text-black font-bold">
                    hrus kerja 应到员工
                  </td>
                  <td
                    v-for="dInfo in monthDaysData"
                    :key="dInfo.day"
                    :style="printDayColStyle"
                    class="print-col-day border border-black p-0.5 text-center text-[8px] text-black font-bold print:min-w-0"
                  >
                    {{ dInfo.isSunday ? 0 : reportRows.length }}
                  </td>
                  <td class="border border-black p-0.5 text-right px-1 text-[8px] font-bold text-black">-</td>
                  <td class="border border-black p-0.5 text-left px-1 text-[7px] text-black">Target Hadir</td>
                </tr>

                <!-- Summary Row 3: Kry hadir -->
                <tr class="bg-white text-black font-bold text-center h-5">
                  <td colspan="4" class="border border-black px-1 text-left text-[8px] text-black font-bold">
                    Kry hadir 实到员工
                  </td>
                  <td
                    v-for="dInfo in monthDaysData"
                    :key="dInfo.day"
                    :style="printDayColStyle"
                    class="print-col-day border border-black p-0.5 text-center text-[8px] text-black font-bold print:min-w-0"
                  >
                    {{ matrixAndSummary.presentCounts[dInfo.day] || 0 }}
                  </td>
                  <td class="border border-black p-0.5 text-right px-1 text-[8px] font-bold text-black">-</td>
                  <td class="border border-black p-0.5 text-left px-1 text-[7px] text-black">Realisasi Hadir</td>
                </tr>

                <!-- Summary Row 4: Absen -->
                <tr class="bg-white text-black font-bold text-center h-5">
                  <td colspan="4" class="border border-black px-1 text-left text-[8px] text-black font-bold">
                    Absen 缺勤员工
                  </td>
                  <td
                    v-for="dInfo in monthDaysData"
                    :key="dInfo.day"
                    :style="printDayColStyle"
                    class="print-col-day border border-black p-0.5 text-center text-[8px] text-black font-bold print:min-w-0"
                  >
                    {{ matrixAndSummary.absentCounts[dInfo.day] || 0 }}
                  </td>
                  <td class="border border-black p-0.5 text-right px-1 text-[8px] font-bold text-black">-</td>
                  <td class="border border-black p-0.5 text-left px-1 text-[7px] text-black">Libur/Absen</td>
                </tr>

                <!-- Summary Row 5: Total Produksi Bulan ini -->
                <tr class="bg-amber-100 text-black font-black text-center h-6 border-b-2 border-black">
                  <td colspan="5" class="border border-black px-1.5 text-left text-[9px] uppercase tracking-wide text-black font-black">
                    Total Produksi Bulan 当月总产量
                  </td>
                  <td :colspan="monthDaysData.length" class="border border-black p-0.5 text-center text-[11px] font-mono font-black text-black">
                    {{ matrixAndSummary.grandTotal }} Pcs
                  </td>
                  <td class="border border-black p-0.5 text-right px-0.5 text-[9px] font-black text-black">
                    {{ matrixAndSummary.grandTotal }}
                  </td>
                  <td class="border border-black p-0.5 text-left px-1 text-[7px] text-black">Grand Total</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Document Footer Legend Bar (Exact Match with Reference Excel Row 49) -->
          <div class="mt-2 pt-1 border-t border-black flex flex-col sm:flex-row sm:items-center justify-between text-[8px] font-mono gap-1 text-black">
            <div class="font-bold">
              DDP 工序描述: SOLDER 焊接: 01 &nbsp;|&nbsp; LEM 胶水: 02 &nbsp;|&nbsp; GULUNG (绕线): 03 &nbsp;|&nbsp; Cangkang 穿壳: 04 &nbsp;|&nbsp; PACKING 包装: 05 &nbsp;|&nbsp; CHECK 检测: 06
            </div>
            <div class="flex items-center gap-6 font-bold">
              <div>Pemeriksa (QC): ____________</div>
              <div>Disiapkan Oleh (Mandor): <span class="underline">{{ foremanName }}</span></div>
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
              <span class="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">Pengaturan & Filter Laporan</span>
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
            <!-- Filter 1: Month Picker -->
            <div class="space-y-1">
              <label class="block text-[11px] font-semibold text-slate-400 font-mono">Pilih Bulan & Tahun</label>
              <input
                type="month"
                v-model="selectedMonthYear"
                class="w-full h-9 px-3 rounded-md bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono font-bold focus:border-teal-400 focus:outline-none"
              />
            </div>

            <!-- Filter 2: Team Filter -->
            <div class="space-y-1">
              <label class="block text-[11px] font-semibold text-slate-400 font-mono">Pilih Line / Tim</label>
              <CustomSelect
                v-model="selectedTeamId"
                :options="teamFilterOptions"
                placeholder="Pilih Line / Tim..."
              />
            </div>

            <!-- Filter 3: Process Configuration Dropdown/Combobox -->
            <div class="space-y-1">
              <label class="block text-[11px] font-semibold text-slate-400 font-mono flex items-center justify-between">
                <span>Proses Produksi</span>
                <span class="text-[9px] text-teal-400 font-sans font-normal">Auto Sync</span>
              </label>
              <CustomCombobox
                v-model="selectedProcessInput"
                :options="processOptions"
                placeholder="Pilih / Ketik Proses..."
                storage-key="earflow_role_options"
                @update:model-value="handleProcessInputChange"
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
                <Edit3 class="w-3.5 h-3.5" />
                <span>{{ isEditing ? 'Selesai Edit Cell' : 'Mode Edit Cell' }}</span>
              </button>

              <button
                v-if="hasOverrides"
                type="button"
                @click="resetCellOverrides"
                class="h-9 px-3.5 rounded-md bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-xs transition flex items-center gap-1.5"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                <span>Reset Editan</span>
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
            <span class="text-teal-400 font-bold">{{ formattedSelectedMonth }}</span>
            <span class="text-slate-600">•</span>
            <span class="truncate">{{ selectedTeamLabel }}</span>
            <span v-if="isEditing" class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">EDIT MODE</span>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <!-- Excel Button -->
          <button
            type="button"
            @click="exportExcel"
            class="h-9 px-3.5 sm:px-4 rounded-md bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40 font-bold text-xs shadow-md transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer"
            title="Download Rekap Format Excel (.csv)"
          >
            <FileSpreadsheet class="w-4 h-4 text-teal-400 shrink-0" />
            <span>Excel</span>
          </button>

          <!-- Primary Direct PDF Export Button (Guaranteed Landscape) -->
          <button
            type="button"
            @click="exportPdfLandscape"
            :disabled="isExportingPdf"
            class="h-9 px-3.5 sm:px-4 rounded-md bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            title="Download File PDF Landscape Laporan Bulanan"
          >
            <Loader2 v-if="isExportingPdf" class="w-4 h-4 animate-spin text-slate-950" />
            <FileText v-else class="w-4 h-4 stroke-[2.5]" />
            <span>{{ isExportingPdf ? 'Exporting...' : 'PDF' }}</span>
          </button>
        </div>
      </div>

      <!-- Floating Toast Notification on Export PDF -->
      <Teleport to="body">
        <transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 -translate-y-4 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 -translate-y-4 scale-95"
        >
          <div
            v-if="isExportingPdf"
            class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 text-emerald-300 font-mono text-xs px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 pointer-events-none"
          >
            <div class="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Loader2 class="w-4 h-4 animate-spin text-emerald-400" />
            </div>
            <div>
              <p class="font-bold text-slate-100 leading-tight">
                Meng-export PDF (Landscape)...
              </p>
              <p class="text-[10px] text-slate-400 leading-tight mt-0.5">
                Membuat dokumen PDF A4 Landscape...
              </p>
            </div>
          </div>
        </transition>
      </Teleport>

      <!-- Datalist option for process types selection -->
      <datalist id="recap-process-types-list">
        <option v-for="pt in authStore.processTypes" :key="pt" :value="pt" />
      </datalist>
    </div>

    <!-- Shift Manager Modal (overlay inside Teleport) -->
    <div
      v-if="showShiftManagerModal"
      class="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      @click.self="showShiftManagerModal = false"
    >
      <div class="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm font-sans">
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
import { computed, ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

// Debounce helper to reduce store writes on every keystroke
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}
import { useTeamStore } from '@/stores/teamStore'
import { useProductionStore, getLocalDateStr } from '@/stores/productionStore'
import { useAuthStore } from '@/stores/authStore'
import { useOverrideStore, type WorkerOverride } from '@/stores/overrideStore'
import CustomCombobox, { type ComboboxOption } from '@/components/CustomCombobox.vue'
import CustomSelect, { type SelectOption } from '@/components/CustomSelect.vue'
import { toJpeg } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { Table, X, Edit3, RotateCcw, Plus, Settings, Trash2, Check, MoreVertical, SlidersHorizontal, ChevronUp, ChevronDown, FileText, Loader2, FileSpreadsheet } from 'lucide-vue-next'
import { getWorkerShareForLog, DEFAULT_DAILY_TARGET, isWorkerMatchingShift, isWorkerInLog } from '@/utils/reportUtils'
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

const { t } = useI18n()
const teamStore = useTeamStore()
const productionStore = useProductionStore()
const authStore = useAuthStore()
const overrideStore = useOverrideStore()
const shiftStore = useShiftStore()

// Sheet tabs from global shift store with combined all-shifts option
const activeShiftSheets = computed(() => [
  ...shiftStore.sheetTabOptions,
  { id: 'all_shifts', name: 'Gabungan (Pagi & Siang)', time: 'Semua Shift' }
])
const selectedShiftId = ref(shiftStore.firstShiftId)

// Keep selectedShiftId valid if shifts change
watch(() => shiftStore.firstShiftId, (firstId) => {
  if (!activeShiftSheets.value.some(s => s.id === selectedShiftId.value)) {
    selectedShiftId.value = firstId
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
  if (selectedShiftId.value === id) {
    selectedShiftId.value = shiftStore.firstShiftId
  }
}

const selectedTeamId = ref('')
const selectedMonthYear = ref(getLocalDateStr().slice(0, 7)) // YYYY-MM
const isEditing = ref(false)
const sortBy = ref<'joined_date' | 'name' | 'team' | 'worker_no'>('joined_date')

const sortOptions = [
  { label: 'Urut: Tgl Masuk', value: 'joined_date' },
  { label: 'Urut: Abjad (A-Z)', value: 'name' },
  { label: 'Urut: Tim / Line', value: 'team' },
  { label: 'Urut: No Karyawan', value: 'worker_no' }
]

interface DayInfo {
  day: number
  dateStr: string
  isSunday: boolean
}

const monthDaysData = computed<DayInfo[]>(() => {
  const parts = (selectedMonthYear.value || '').split('-')
  const yearNum = parseInt(parts[0], 10) || new Date().getFullYear()
  const monthNum = (parseInt(parts[1], 10) || 1) - 1
  const numDays = new Date(yearNum, monthNum + 1, 0).getDate()
  const yearStr = String(yearNum)
  const monthStr = String(monthNum + 1).padStart(2, '0')

  const list: DayInfo[] = new Array(numDays)
  for (let d = 1; d <= numDays; d++) {
    const dateObj = new Date(yearNum, monthNum, d)
    const dayStr = String(d).padStart(2, '0')
    list[d - 1] = {
      day: d,
      dateStr: `${yearStr}-${monthStr}-${dayStr}`,
      isSunday: dateObj.getDay() === 0
    }
  }
  return list
})

const month = computed(() => (parseInt((selectedMonthYear.value || '').split('-')[1], 10) || 1) - 1)
function getDateStrForDay(day: number): string {
  return monthDaysData.value[day - 1]?.dateStr || ''
}

const hasOverrides = computed(() => overrideStore.hasAnyOverrides)

function resetCellOverrides() {
  overrideStore.resetAllOverrides()
}

function saveCellOverride(workerId: string, day: number, value: string) {
  const dateStr = getDateStrForDay(day)
  overrideStore.setDailyOverride(workerId, dateStr, 'prodQty', value, selectedShiftId.value)
}

function saveWorkerOverride(workerId: string, field: string, value: string) {
  overrideStore.setWorkerOverride(workerId, field as keyof WorkerOverride, value)
}

// Debounced version for text fields (name, remark, process, etc.) — fires 300ms after typing stops
const saveWorkerOverrideDebounced = debounce(saveWorkerOverride, 300)

const foremanName = computed(() => {
  return authStore.foremanName || 'Karen & Lala'
})

const teamFilterOptions = computed<SelectOption[]>(() => {
  return [
    { label: t('monthlyRecap.allTeams'), value: '' },
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

  // Only update the workerOverride.target field used by the monthly recap display.
  // Do NOT touch teamStore.hourly_target or dailyMap.targetQty so that
  // daily attendance targets and mandor report targets remain unchanged.
  let targetWorkerIds = teamStore.allWorkers.map(w => w.id)
  if (selectedTeamId.value) {
    targetWorkerIds = teamStore.allWorkers
      .filter(w => w.team_id === selectedTeamId.value)
      .map(w => w.id)
  }

  for (const wId of targetWorkerIds) {
    overrideStore.setWorkerOverride(wId, 'target', String(val))
  }
}

// Proses Produksi configuration input & auto-sync
const selectedProcessInput = ref<string>('Solder')

const processOptions = computed<ComboboxOption[]>(() => {
  const opts: ComboboxOption[] = []
  authStore.processGroups.forEach(g => {
    opts.push({ label: `KODE ${g.code} (${g.roles.join(', ')})`, value: g.code })
  })
  const roles = ['Solder', 'Lem', 'Gulung', 'Cangkang', 'Packing', 'Check']
  roles.forEach(r => {
    if (!opts.some(o => String(o.value).toLowerCase() === r.toLowerCase())) {
      opts.push({ label: r, value: r })
    }
  })
  return opts
})

function updateProcessInputFromStore() {
  if (selectedTeamId.value) {
    const team = teamStore.teams.find(t => t.id === selectedTeamId.value)
    if (team && team.members && team.members.length > 0) {
      const firstRole = team.members[0].role
      if (firstRole) {
        selectedProcessInput.value = firstRole
        return
      }
    }
  }
  selectedProcessInput.value = 'Solder'
}

watch(selectedTeamId, () => {
  updateProcessInputFromStore()
})

async function handleProcessInputChange(val: any) {
  const newProcess = String(val || '').trim()
  if (!newProcess) return
  selectedProcessInput.value = newProcess

  let targetWorkers = teamStore.allWorkers
  if (selectedTeamId.value) {
    targetWorkers = targetWorkers.filter(w => w.team_id === selectedTeamId.value)
  }

  for (const w of targetWorkers) {
    overrideStore.setWorkerOverride(w.id, 'process', newProcess)
  }
}

const selectedTeamLabel = computed(() => {
  if (!selectedTeamId.value) return t('monthlyRecap.allTeams') || 'Semua Line / Tim'
  const found = teamStore.teams.find(t => t.id === selectedTeamId.value)
  return found ? found.name : 'Semua Line / Tim'
})

const monthNames = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
]

const formattedSelectedMonth = computed(() => {
  if (!selectedMonthYear.value) return 'JULI 2026'
  const [yearStr, monthStr] = selectedMonthYear.value.split('-')
  const monthIdx = parseInt(monthStr, 10) - 1
  return `${monthNames[monthIdx] || 'JULI'} ${yearStr}`
})

const reportRows = computed(() => {
  let workers = [...teamStore.allWorkers]
  if (selectedTeamId.value) {
    workers = workers.filter(w => w.team_id === selectedTeamId.value)
  }
  if (selectedShiftObj.value && selectedShiftObj.value.id !== 'all_shifts') {
    workers = workers.filter(w => isWorkerMatchingShift(w, selectedShiftObj.value, teamStore.teams))
  }

  // Filter out workers with status 'Keluar' if they have no production logs in targetMonthStr
  const targetMonthStr = selectedMonthYear.value || getLocalDateStr().slice(0, 7)
  workers = workers.filter(w => {
    const isOut = (w.status || '').toLowerCase().includes('keluar') || (w.status || '').toLowerCase().includes('out')
    if (isOut) {
      const hasLogsInMonth = productionStore.logs.some(
        l => l.date && l.date.startsWith(targetMonthStr) && isWorkerInLog(l, w)
      )
      if (!hasLogsInMonth) return false
    }
    return true
  })

  const teamMap = new Map(teamStore.teams.map(t => [t.id, t]))

  workers.sort((a, b) => {
    if (sortBy.value === 'joined_date') {
      const dA = a.joined_date || '9999-99-99'
      const dB = b.joined_date || '9999-99-99'
      return dA.localeCompare(dB)
    }
    if (sortBy.value === 'name') {
      return (a.full_name || '').localeCompare(b.full_name || '', 'id', { sensitivity: 'base' })
    }
    if (sortBy.value === 'team') {
      const tA = teamMap.get(a.team_id)?.name || ''
      const tB = teamMap.get(b.team_id)?.name || ''
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

  const processDefault = authStore.processTypes.length > 0 ? authStore.processTypes[0] : 'SOLDER'

  return workers.map((w, idx) => {
    const wOverride = overrideStore.getWorkerOverride(w.id) || {}
    const workerTeam = teamMap.get(w.team_id)
    const activeInputTargetStr = (targetValueInput.value && targetValueInput.value > 0) ? String(targetValueInput.value) : undefined
    const defaultTarget = activeInputTargetStr || ((workerTeam && workerTeam.hourly_target > 0) ? String(workerTeam.hourly_target) : String(DEFAULT_DAILY_TARGET))

    const workerNo = wOverride.workerNo !== undefined ? wOverride.workerNo : ((w.no_karyawan && !isTempWorkerNo(w.no_karyawan) && w.no_karyawan !== '-') ? w.no_karyawan : '')
    const workerName = wOverride.workerName !== undefined ? wOverride.workerName : w.full_name
    const defaultProcess = selectedProcessInput.value || (w.role || processDefault)
    const rawProcess = wOverride.process !== undefined ? wOverride.process : defaultProcess
    const process = authStore.getProcessCodeForRole(rawProcess)
    const target = activeInputTargetStr || (wOverride.target !== undefined ? wOverride.target : defaultTarget)
    const workerStatus = (w.status || '').toLowerCase()
    let defaultRemark = ''
    if (workerStatus.includes('keluar') || workerStatus.includes('out')) {
      defaultRemark = 'Keluar'
    } else if (workerStatus.includes('cuti')) {
      defaultRemark = 'Cuti'
    }
    const remark = wOverride.remark !== undefined ? wOverride.remark : defaultRemark
    const teamMemberCount = workerTeam ? (workerTeam.members ? workerTeam.members.length : 1) : 1

    return {
      no: idx + 1,
      workerId: w.id,
      workerNo,
      workerName,
      process,
      target,
      remark,
      worker: w,
      teamMemberCount,
      wIdLower: w.id ? w.id.toLowerCase() : '',
      wNoLower: w.no_karyawan ? w.no_karyawan.toLowerCase() : '',
      wNameLower: w.full_name ? w.full_name.toLowerCase() : ''
    }
  })
})

const logsByDateMap = computed(() => {
  const map = new Map<string, typeof productionStore.logs>()
  const prefix = selectedMonthYear.value || ''
  const logs = productionStore.logs
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i]
    if (log.date && log.date.startsWith(prefix)) {
      let arr = map.get(log.date)
      if (!arr) {
        arr = []
        map.set(log.date, arr)
      }
      arr.push(log)
    }
  }
  return map
})

function checkWorkerInLog(
  log: any,
  row: typeof reportRows.value[0]
): boolean {
  if (!log || log.total_qty <= 0 || log.hour_slot === 'Reset Hasil Tim') return false

  const presentList = log.present_member_ids
  if (Array.isArray(presentList) && presentList.length > 0) {
    for (let i = 0; i < presentList.length; i++) {
      const id = presentList[i]
      if (!id) continue
      const idLower = id.toLowerCase()
      if ((row.wIdLower && idLower === row.wIdLower) ||
          (row.wNoLower && idLower === row.wNoLower) ||
          (row.wNameLower && idLower === row.wNameLower)) {
        return true
      }
    }
    return false
  }

  const teamIdMatch = !!log.team_id && !!row.worker.team_id && log.team_id === row.worker.team_id
  const teamNameMatch = !!log.team_name && !!row.worker.team_name && log.team_name.toLowerCase() === (row.worker.team_name || '').toLowerCase()
  return teamIdMatch || teamNameMatch
}

interface CellDetail {
  qty: number
  isEdited: boolean
  display: string
  inputValue: string
  bgClass: string
}

const matrixAndSummary = computed(() => {
  const shiftKey = selectedShiftId.value
  const logsMap = logsByDateMap.value
  const days = monthDaysData.value
  const numDays = days.length
  const rows = reportRows.value

  const matrix: Record<string, Record<number, CellDetail>> = {}
  const workerTotals: Record<string, number> = {}
  const dailyTotals: Record<number, number> = {}
  const presentCounts: Record<number, number> = {}
  const absentCounts: Record<number, number> = {}
  let grandTotal = 0

  for (let d = 1; d <= numDays; d++) {
    dailyTotals[d] = 0
    presentCounts[d] = 0
  }

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    const workerId = row.workerId
    const rowMatrix: Record<number, CellDetail> = {}
    let workerSum = 0

    for (let d = 1; d <= numDays; d++) {
      const dayInfo = days[d - 1]
      const dateFormatted = dayInfo.dateStr
      const dOverride = overrideStore.getDailyOverride(workerId, dateFormatted, shiftKey)

      let qty = 0
      let isEdited = false

      if (dOverride?.prodQty !== undefined) {
        qty = Math.max(0, dOverride.prodQty)
        isEdited = true
      } else {
        const dayLogs = logsMap.get(dateFormatted)
        if (dayLogs && dayLogs.length > 0) {
          for (let l = 0; l < dayLogs.length; l++) {
            const log = dayLogs[l]
            if (checkWorkerInLog(log, row)) {
              qty += getWorkerShareForLog(log, row.teamMemberCount)
            }
          }
        }
        qty = Math.max(0, qty)
      }

      let display = '-'
      if (isEdited && dOverride?.prodQty !== undefined) {
        display = String(dOverride.prodQty)
      } else if (qty > 0) {
        display = String(qty)
      } else if (dayInfo.isSunday) {
        display = 'MG'
      }

      const inputValue = qty > 0 ? String(qty) : ''

      let bgClass = ''
      if (isEdited) {
        bgClass = 'bg-amber-100/80 font-bold'
      } else if (dayInfo.isSunday) {
        bgClass = 'bg-rose-100 text-rose-950 font-bold'
      } else if (qty > 0) {
        bgClass = 'font-black text-black'
      }

      rowMatrix[d] = {
        qty,
        isEdited,
        display,
        inputValue,
        bgClass
      }

      workerSum += qty
      dailyTotals[d] += qty
      if (qty > 0) {
        presentCounts[d]++
      }
    }

    matrix[workerId] = rowMatrix
    workerTotals[workerId] = workerSum
    grandTotal += workerSum
  }

  for (let d = 1; d <= numDays; d++) {
    const dayInfo = days[d - 1]
    const pCount = presentCounts[d]
    if (dayInfo.isSunday) {
      absentCounts[d] = pCount > 0 ? Math.max(0, rows.length - pCount) : 0
    } else {
      absentCounts[d] = Math.max(0, rows.length - pCount)
    }
  }

  return {
    matrix,
    workerTotals,
    dailyTotals,
    presentCounts,
    absentCounts,
    grandTotal
  }
})


const printDayColStyle = computed(() => ({
  width: `${66.5 / Math.max(1, monthDaysData.value.length)}%`
}))

const isExportingPdf = ref(false)

import { exportToXlsx } from '@/utils/excelExport'

function exportExcel() {
  const days = monthDaysData.value
  const dayHeaderTitles = days.map((d: any) => `TGL ${d.day}`)
  const headers = ['NO', 'NO KARYAWAN', 'NAMA PEKERJA', 'PROSES', ...dayHeaderTitles, 'TOTAL PROD', 'TARGET BULAN', 'SELISIH', 'CATATAN']

  const dataMatrix = matrixAndSummary.value.matrix
  const totals = matrixAndSummary.value.workerTotals

  const rows = reportRows.value.map((r: any) => {
    const workerId = r.workerId
    const rowMatrix = dataMatrix[workerId] || {}
    const dailyValues = days.map((d: any) => (rowMatrix[d.day] ? rowMatrix[d.day].qty : 0))
    const totalProd = totals[workerId] || 0
    const targetBulan = (Number(r.target) || 0) * days.length
    const selisih = totalProd - targetBulan

    return [
      r.no,
      r.workerNo || '',
      r.workerName || '',
      r.process || '',
      ...dailyValues,
      totalProd,
      targetBulan,
      selisih,
      r.remark || ''
    ]
  })

  const lineName = (selectedTeamLabel.value || 'semualine').replace(/\s+/g, '_')
  const filename = `rekap_laporan_bulanan_${selectedMonthYear.value}_${lineName}.xlsx`
  exportToXlsx(filename, 'Rekap Bulanan', headers, rows)
}

async function exportPdfLandscape() {
  if (isExportingPdf.value) return
  isExportingPdf.value = true

  // Yield to browser event loop to paint loading UI immediately
  await new Promise(r => setTimeout(r, 100))

  const wasEditing = isEditing.value
  if (wasEditing) {
    isEditing.value = false
    await new Promise(r => setTimeout(r, 60))
  }

  const element = document.getElementById('monthly-recap-printable-sheet')
  if (!element) {
    isExportingPdf.value = false
    return
  }

  element.classList.add('exporting-pdf')
  try {
    const imgData = await toJpeg(element, {
      quality: 0.95,
      pixelRatio: 3.5,
      backgroundColor: '#ffffff',
      cacheBust: true,
      filter: (node) => {
        if (node instanceof HTMLElement && node.classList.contains('print:hidden')) {
          return false
        }
        return true
      },
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left'
      }
    })

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    const pdfWidth = pdf.internal.pageSize.getWidth() // 297 mm
    const pdfHeight = pdf.internal.pageSize.getHeight() // 210 mm

    const marginX = 2
    const marginY = 2
    const printableW = pdfWidth - marginX * 2 // 293 mm
    const printableH = pdfHeight - marginY * 2 // 206 mm

    const img = new Image()
    img.src = imgData
    await new Promise((resolve) => {
      img.onload = resolve
    })

    const imgWidth = img.width
    const imgHeight = img.height

    // Priority: Fill 100% of printable width while maintaining aspect ratio
    let finalW = printableW
    let finalH = imgHeight * (printableW / imgWidth)

    if (finalH > printableH) {
      finalH = printableH
      finalW = imgWidth * (printableH / imgHeight)
    }

    const xPos = marginX + (printableW - finalW) / 2
    const yPos = marginY + (printableH - finalH) / 2

    pdf.addImage(imgData, 'JPEG', xPos, yPos, finalW, finalH, undefined, 'FAST')

    const lineName = selectedTeamLabel.value.replace(/[^a-zA-Z0-9]/g, '_')
    const monthName = selectedMonthYear.value
    const filename = `Laporan_Bulanan_${monthName}_${lineName}.pdf`

    pdf.save(filename)
  } catch (err: any) {
    console.error('Export PDF failed:', err)
  } finally {
    element.classList.remove('exporting-pdf')
    isExportingPdf.value = false
  }
}



</script>

<style>
.exporting-pdf .print\:hidden,
#monthly-recap-printable-sheet.exporting-pdf .print\:hidden {
  display: none !important;
}

@media print {
  @page {
    size: A4 landscape !important;
    margin: 3mm 4mm !important;
  }

  @page recap-landscape {
    size: A4 landscape !important;
    margin: 3mm 4mm !important;
  }

  .printable-recap-modal {
    page: recap-landscape !important;
  }
}
</style>

<style scoped>
@media print {
  html, body {
    background: #ffffff !important;
    color: #000000 !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .printable-recap-modal {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    background: #ffffff !important;
    overflow: visible !important;
    height: auto !important;
    inset: 0 auto auto 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
    page: recap-landscape !important;
  }

  .printable-recap-modal .overflow-x-auto,
  .printable-recap-modal .overflow-y-auto {
    overflow: visible !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    max-height: none !important;
  }

  .printable-recap-modal table {
    width: 100% !important;
    min-width: 100% !important;
    max-width: 100% !important;
    table-layout: fixed !important;
  }

  .printable-recap-modal th,
  .printable-recap-modal td {
    padding: 1.5px 0.5px !important;
    font-size: 7px !important;
    line-height: 1.1 !important;
    min-width: 0 !important;
    max-width: none !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .printable-recap-modal tr {
    height: auto !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .print-col-no { width: 2.2% !important; }
  .print-col-nik { width: 4.8% !important; }
  .print-col-name { width: 11.5% !important; }
  .print-col-process { width: 5.5% !important; }
  .print-col-target { width: 3.5% !important; }
  .print-col-total { width: 4.5% !important; }
  .print-col-remark { width: 4.0% !important; }
}
</style>

<style>
@media print {
  @page {
    size: A4 landscape !important;
    margin: 3mm 4mm !important;
  }
}
</style>
