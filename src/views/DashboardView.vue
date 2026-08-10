<template>
  <div class="space-y-3 sm:space-y-4 pb-safe">
    <!-- Sticky Search Bar & Collapsible Unified Konfigurasi, Tools & Filter Panel -->
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
            placeholder="Cari karyawan..."
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

      <!-- Collapsible Panel: Date Selector, Filters, and Tools & Laporan -->
      <div v-if="showFilterConfig" class="pt-2.5 border-t border-slate-800/80 space-y-3 font-mono">
        <!-- Date Selector Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <div class="flex items-center justify-between sm:justify-start gap-2">
            <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar class="w-4 h-4 text-teal-400" />
              Tanggal:
            </span>
            <span class="text-xs font-bold text-teal-400 sm:hidden">{{ formattedSelectedDate }}</span>
          </div>

          <div class="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              @click="changeDate(-1)"
              class="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold shrink-0 flex items-center justify-center active:scale-95"
              title="Hari Sebelumnya"
            >
              <ChevronLeft class="w-4 h-4 text-slate-300" />
            </button>
            <input
              type="date"
              v-model="selectedDate"
              class="flex-1 sm:w-40 h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold focus:border-teal-400 focus:outline-none"
            />
            <button
              @click="changeDate(1)"
              class="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold shrink-0 flex items-center justify-center active:scale-95"
              title="Hari Berikutnya"
            >
              <ChevronRight class="w-4 h-4 text-slate-300" />
            </button>
            <button
              @click="setToday"
              class="h-8 px-2.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold shrink-0"
            >
              Hari Ini
            </button>
          </div>
        </div>

        <!-- Filter Controls Grid -->
        <div class="grid grid-cols-2 gap-2.5">
          <!-- Filter Tim -->
          <div class="space-y-1">
            <label class="block text-[10px] sm:text-[11px] font-semibold text-slate-400">Tim / Line</label>
            <CustomSelect
              v-model="selectedTeamId"
              :options="teamFilterOptions"
              placeholder="Semua Tim"
            />
          </div>

          <!-- Filter Status -->
          <div class="space-y-1">
            <label class="block text-[10px] sm:text-[11px] font-semibold text-slate-400">Status Absensi</label>
            <CustomSelect
              v-model="statusFilter"
              :options="statusFilterOptions"
              placeholder="Semua Status"
            />
          </div>
        </div>

        <!-- Unified Tools & Laporan Section -->
        <div class="pt-2.5 border-t border-slate-800/80 space-y-2">
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Wrench class="w-3.5 h-3.5 text-teal-400" />
            <span>Tools & Laporan</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <!-- Tool 1: Input Jam-jaman -->
            <button
              @click="$emit('open-log-modal')"
              class="h-9 px-2.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Plus class="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span class="truncate">Input Jam-jaman</span>
            </button>

            <!-- Tool 2: Laporan Mandor -->
            <button
              @click="showMandorReportModal = true"
              class="h-9 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
            >
              <ClipboardList class="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span class="truncate">Laporan Mandor</span>
            </button>

            <!-- Tool 3: Rekap Bulanan -->
            <button
              @click="showMonthlyRecapModal = true"
              class="h-9 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Table class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span class="truncate">Rekap Bulanan</span>
            </button>

            <!-- Tool 4: Set Target Massal -->
            <button
              :disabled="isReadOnly"
              @click="showSetAllTargetModal = true"
              class="h-9 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
              :class="isReadOnly
                ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
                : 'bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30'"
            >
              <Target class="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span class="truncate">Set Target Massal</span>
            </button>

            <!-- Tool 5: Tandai Semua Hadir -->
            <button
              :disabled="isReadOnly"
              @click="markAllPresent()"
              class="h-9 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
              :class="isReadOnly
                ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'"
            >
              <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span class="truncate">Semua Hadir</span>
            </button>

            <!-- Tool 6: Reset Edit Tanggal Ini -->
            <button
              v-if="hasOverridesForDate"
              :disabled="isReadOnly"
              @click="resetDateOverrides()"
              class="h-9 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
              :class="isReadOnly
                ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'"
            >
              <RotateCcw class="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span class="truncate">Reset Edit Tanggal</span>
            </button>
          </div>
        </div>
      </div>
    </div>



    <!-- Double Security Past Date Read-Only Lock Banner (Compact Minimalist) -->
    <div
      v-if="isPastDate"
      class="p-2.5 sm:p-3 rounded-lg border flex items-center justify-between gap-2 font-mono shadow-sm transition"
      :class="isEditUnlocked
        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
        : 'bg-slate-900/90 border-slate-700 text-slate-300'"
    >
      <div class="flex items-center gap-2 min-w-0">
        <div
          class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          :class="isEditUnlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'"
        >
          <Lock v-if="!isEditUnlocked" class="w-3.5 h-3.5 text-slate-400" />
          <Unlock v-else class="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div class="min-w-0">
          <div class="text-xs font-bold flex items-center gap-1.5 truncate">
            <span>{{ isEditUnlocked ? 'Mode Edit' : 'Mode Terkunci' }}</span>
            <span class="text-[10px] text-slate-400 hidden sm:inline">• {{ formattedSelectedDate }}</span>
          </div>
          <p class="text-[10px] text-slate-400 truncate hidden sm:block">
            {{ isEditUnlocked
              ? 'Anda dapat mengedit tanggal lampau ini. Klik Kunci setelah selesai.'
              : 'Form dikunci untuk mencegah perubahan tidak sengaja.' }}
          </p>
        </div>
      </div>

      <button
        @click="isEditUnlocked = !isEditUnlocked"
        class="h-7 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition shrink-0 active:scale-95 shadow-sm"
        :class="isEditUnlocked
          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'"
      >
        <Lock v-if="isEditUnlocked" class="w-3 h-3" />
        <Unlock v-else class="w-3 h-3 text-amber-400" />
        <span>{{ isEditUnlocked ? 'Kunci' : 'Buka Kunci' }}</span>
      </button>
    </div>



    <!-- Count Summary Bar -->
    <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-mono px-1 text-slate-400">
      <div class="flex items-center gap-2">
        <span class="font-bold text-slate-200">Daftar Karyawan</span>
        <button
          :disabled="isReadOnly"
          @click="showSetAllTargetModal = true"
          class="px-2 py-0.5 rounded-md bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold inline-flex items-center gap-1 active:scale-95 disabled:opacity-50 transition"
          title="Buka Form Konfigurasi Target Massal Karyawan"
        >
          <Target class="w-3 h-3 text-teal-400 shrink-0" />
          <span>Set Target</span>
        </button>
      </div>
      <span class="text-[11px]">
        <strong class="text-teal-400 font-bold">{{ filteredWorkerRows.length }}</strong> / {{ workerRows.length }} Karyawan
      </span>
    </div>

    <!-- Main Attendance & Target Data Table (Desktop View) -->
    <div class="hidden md:block bg-slate-900/40 border border-slate-800/80 rounded-lg overflow-hidden shadow-md max-h-[75vh] overflow-y-auto">
      <table class="w-full text-left text-xs font-mono">
        <thead class="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
          <tr>
            <th class="py-3 px-3 w-10 text-center">No</th>
            <th class="py-3 px-4 min-w-[200px]">Karyawan / Line</th>
            <th class="py-3 px-3 w-28 text-center">Absensi</th>
            <th class="py-3 px-3 w-28 text-center">Jam Kerja</th>
            <th class="py-3 px-3 w-28 text-right">Target (Pcs)</th>
            <th class="py-3 px-3 w-28 text-right">Hasil (Pcs)</th>
            <th class="py-3 px-3 w-24 text-right">Selisih</th>
            <th class="py-3 px-3 w-28 text-center">Status</th>
            <th class="py-3 px-4 min-w-[120px]">Catatan Harian</th>
            <th class="py-3 px-3 w-20 text-center">Statistik</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60">
          <tr
            v-for="(row, idx) in displayedWorkerRows"
            :key="row.workerId"
            class="hover:bg-slate-800/40"
            :class="!row.isPresent ? 'bg-rose-950/10' : ''"
          >
            <!-- No -->
            <td class="py-3 px-3 text-center text-slate-500 font-bold">{{ idx + 1 }}</td>

            <!-- Karyawan / Line -->
            <td class="py-3 px-4">
              <div class="flex items-center gap-2.5">
                <img
                  v-if="row.avatarUrl"
                  :src="row.avatarUrl"
                  loading="lazy"
                  class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 shrink-0"
                />
                <div v-else class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center text-slate-400 font-bold">
                  {{ row.workerName.charAt(0) }}
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-slate-100 truncate text-xs">{{ row.workerName }}</div>
                  <div class="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <span class="text-teal-400 font-mono">{{ row.workerNo }}</span>
                    <span>•</span>
                    <span class="truncate">{{ row.teamName }}</span>
                  </div>
                </div>
              </div>
            </td>

            <!-- Absensi Toggle Button -->
            <td class="py-3 px-3 text-center">
              <button
                :disabled="isReadOnly"
                @click="toggleAttendance(row)"
                class="px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center justify-center gap-1.5 w-full border shadow-xs transition"
                :class="[
                  isReadOnly ? 'cursor-not-allowed opacity-70' : 'active:scale-95',
                  row.isPresent
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25'
                ]"
              >
                <Check v-if="row.isPresent" class="w-3.5 h-3.5 text-emerald-400" />
                <X v-else class="w-3.5 h-3.5 text-rose-400" />
                <span>{{ row.isPresent ? 'Hadir' : 'Absen' }}</span>
              </button>
            </td>

            <!-- Jam Kerja Input -->
            <td class="py-3 px-3 text-center">
              <input
                type="text"
                :disabled="isReadOnly"
                :readonly="isReadOnly"
                :value="row.workHours"
                @input="updateWorkHours(row.workerId, ($event.target as HTMLInputElement).value)"
                placeholder="06 - 13 (6h)"
                class="w-28 h-8 px-2 text-center rounded bg-slate-950 border text-amber-300 text-xs font-mono font-bold focus:outline-none placeholder:text-slate-600 truncate"
                :class="isReadOnly ? 'border-slate-800 text-slate-400 cursor-not-allowed bg-slate-900/50' : 'border-slate-700 focus:border-amber-400'"
              />
            </td>

            <!-- Target Harian (Pcs) -->
            <td class="py-3 px-3 text-right">
              <input
                type="number"
                :disabled="isReadOnly"
                :readonly="isReadOnly"
                :value="row.targetQty"
                @focus="($event.target as HTMLInputElement).select()"
                @input="updateTarget(row.workerId, Number(($event.target as HTMLInputElement).value))"
                min="0"
                class="w-24 h-8 px-2 text-right rounded bg-slate-950 border text-teal-300 text-xs font-mono font-bold focus:outline-none"
                :class="isReadOnly ? 'border-slate-800 text-slate-400 cursor-not-allowed bg-slate-900/50' : 'border-slate-700 focus:border-teal-400'"
              />
            </td>

            <!-- Hasil Realisasi (Pcs) -->
            <td class="py-3 px-3 text-right">
              <input
                type="number"
                :disabled="isReadOnly"
                :readonly="isReadOnly"
                :value="row.prodQty"
                @focus="($event.target as HTMLInputElement).select()"
                @input="updateProd(row.workerId, Number(($event.target as HTMLInputElement).value))"
                min="0"
                class="w-24 h-8 px-2 text-right rounded bg-slate-950 border text-cyan-300 text-xs font-mono font-bold focus:outline-none"
                :class="isReadOnly ? 'border-slate-800 text-slate-400 cursor-not-allowed bg-slate-900/50' : 'border-slate-700 focus:border-cyan-400'"
              />
            </td>

            <!-- Selisih (+/- Pcs) -->
            <td class="py-3 px-3 text-right font-extrabold" :class="row.gap >= 0 ? 'text-emerald-400' : 'text-rose-400'">
              {{ row.gap >= 0 ? `+${formatNumber(row.gap)}` : formatNumber(row.gap) }}
            </td>

            <!-- Status Target -->
            <td class="py-3 px-3 text-center">
              <span
                v-if="!row.isPresent"
                class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700"
              >
                Absen
              </span>
              <span
                v-else-if="row.isTargetReached"
                class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-1"
              >
                <Check class="w-3 h-3 text-emerald-400" />
                <span>Tercapai</span>
              </span>
              <span
                v-else
                class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center gap-1"
              >
                <Clock class="w-3 h-3 text-amber-400" />
                <span>Belum Target</span>
              </span>
            </td>

            <!-- Catatan Harian -->
            <td class="py-3 px-4">
              <input
                type="text"
                :disabled="isReadOnly"
                :readonly="isReadOnly"
                :value="row.remark"
                @input="updateRemark(row.workerId, ($event.target as HTMLInputElement).value)"
                placeholder="Catatan..."
                class="w-full h-8 px-2 rounded bg-slate-950 border text-slate-300 text-[11px] font-mono focus:outline-none truncate"
                :class="isReadOnly ? 'border-slate-800 text-slate-500 cursor-not-allowed bg-slate-900/50' : 'border-slate-800 focus:border-slate-600'"
              />
            </td>

            <!-- Statistik Karyawan Button -->
            <td class="py-3 px-3 text-center">
              <button
                @click="openWorkerReport(row)"
                class="h-7 px-2 rounded-md bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-bold font-mono inline-flex items-center gap-1 shrink-0 active:scale-95"
                title="Lihat Statistik & Laporan Bulanan Karyawan"
              >
                <BarChart3 class="w-3.5 h-3.5 text-teal-400" />
                <span>Stats</span>
              </button>
            </td>
          </tr>

          <tr v-if="filteredWorkerRows.length === 0">
            <td colspan="10" class="py-12 text-center text-slate-500 text-xs">
              Tidak ada data karyawan yang cocok dengan filter.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Worker Cards View (Clean, Minimalist Touch Design) -->
    <div class="md:hidden space-y-3">
      <div
        v-for="row in displayedWorkerRows"
        :key="row.workerId"
        class="bg-slate-900/80 border border-slate-800/90 rounded-lg p-3 sm:p-3.5 space-y-3 shadow-md transition"
        :class="!row.isPresent ? 'border-rose-900/30 bg-rose-950/20' : ''"
      >
        <!-- Top Row: Avatar, Name, No Krywn, Team, Increase Badge, Stats & Absensi Button -->
        <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/70">
          <div class="flex items-center gap-2 min-w-0">
            <img
              v-if="row.avatarUrl"
              :src="row.avatarUrl"
              loading="lazy"
              class="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 shrink-0"
            />
            <div v-else class="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center text-slate-300 font-bold text-xs">
              {{ row.workerName.charAt(0) }}
            </div>
            <div class="min-w-0">
              <div class="font-bold text-slate-100 truncate text-xs font-mono leading-snug flex items-center gap-1.5">
                <span class="truncate">{{ row.workerName }}</span>
                <span
                  v-if="workerIncreaseMap[row.workerId]"
                  class="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0"
                  title="Peningkatan hasil produksi dibanding kemarin"
                >
                  📈 +{{ workerIncreaseMap[row.workerId].pctIncrease.toFixed(1) }}%
                </span>
              </div>
              <div class="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5 truncate">
                <span class="text-teal-400 font-bold">{{ row.workerNo }}</span>
                <span>•</span>
                <span class="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 truncate">{{ row.teamName }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <!-- Stats Button -->
            <button
              @click="openWorkerReport(row)"
              class="h-7 px-2 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold font-mono flex items-center gap-1 active:scale-95"
              title="Lihat Statistik Karyawan"
            >
              <BarChart3 class="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Stats</span>
            </button>

            <!-- Absensi Button -->
            <button
              :disabled="isReadOnly"
              @click="toggleAttendance(row)"
              class="px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 border shrink-0 transition shadow-sm"
              :class="[
                isReadOnly ? 'cursor-not-allowed opacity-70' : 'active:scale-95',
                row.isPresent
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
              ]"
            >
              <Check v-if="row.isPresent" class="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
              <X v-else class="w-3.5 h-3.5 text-rose-400 stroke-[2.5]" />
              <span>{{ row.isPresent ? 'Hadir' : 'Absen' }}</span>
            </button>
          </div>
        </div>

        <!-- Middle Row: Jam Kerja, Target & Realisasi Side-by-Side (High Contrast) -->
        <div class="grid grid-cols-3 gap-1.5 sm:gap-2 bg-slate-950/70 p-2 sm:p-2.5 rounded-lg border border-slate-800/80 font-mono">
          <!-- Jam Kerja -->
          <div>
            <label class="block text-[9px] sm:text-[10px] text-slate-400 font-bold mb-1 truncate">
              JAM KERJA
            </label>
            <input
              type="text"
              :disabled="isReadOnly"
              :readonly="isReadOnly"
              :value="row.workHours"
              @input="updateWorkHours(row.workerId, ($event.target as HTMLInputElement).value)"
              placeholder="06 - 13 (6h)"
              class="w-full h-8 px-1 sm:px-2 text-center rounded-lg bg-slate-900 border text-amber-300 text-[11px] font-black focus:outline-none placeholder:text-slate-600 truncate"
              :class="isReadOnly ? 'border-slate-800 text-slate-500 cursor-not-allowed' : 'border-amber-500/40 focus:border-amber-400'"
            />
          </div>

          <!-- Target -->
          <div>
            <label class="block text-[9px] sm:text-[10px] text-slate-400 font-bold mb-1 flex items-center justify-between">
              <span>TARGET</span>
              <span class="text-teal-400 text-[9px]">Pcs</span>
            </label>
            <input
              type="number"
              :disabled="isReadOnly"
              :readonly="isReadOnly"
              :value="row.targetQty"
              @focus="($event.target as HTMLInputElement).select()"
              @input="updateTarget(row.workerId, Number(($event.target as HTMLInputElement).value))"
              class="w-full h-8 px-1 sm:px-2 text-center rounded-lg bg-slate-900 border text-teal-300 text-xs font-black focus:outline-none"
              :class="isReadOnly ? 'border-slate-800 text-slate-500 cursor-not-allowed' : 'border-teal-500/40 focus:border-teal-400'"
            />
          </div>

          <!-- Realisasi -->
          <div>
            <label class="block text-[9px] sm:text-[10px] text-slate-400 font-bold mb-1 flex items-center justify-between">
              <span>REALISASI</span>
              <span class="text-cyan-400 text-[9px]">Pcs</span>
            </label>
            <input
              type="number"
              :disabled="isReadOnly"
              :readonly="isReadOnly"
              :value="row.prodQty"
              @focus="($event.target as HTMLInputElement).select()"
              @input="updateProd(row.workerId, Number(($event.target as HTMLInputElement).value))"
              class="w-full h-8 px-1 sm:px-2 text-center rounded-lg bg-slate-900 border text-cyan-300 text-xs font-black focus:outline-none"
              :class="isReadOnly ? 'border-slate-800 text-slate-500 cursor-not-allowed' : 'border-cyan-500/40 focus:border-cyan-400'"
            />
          </div>
        </div>

        <!-- Status & Selisih Bar -->
        <div class="flex items-center justify-between gap-2 text-xs font-mono">
          <div class="flex items-center gap-1 text-[11px]">
            <span class="text-slate-400">Selisih:</span>
            <span class="font-extrabold" :class="row.gap >= 0 ? 'text-emerald-400' : 'text-rose-400'">
              {{ row.gap >= 0 ? `+${formatNumber(row.gap)}` : formatNumber(row.gap) }} Pcs
            </span>
          </div>

          <div>
            <span
              v-if="!row.isPresent"
              class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700"
            >
              Absen
            </span>
            <span
              v-else-if="row.isTargetReached"
              class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            >
              Tercapai
            </span>
            <span
              v-else
              class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20"
            >
              Belum Target
            </span>
          </div>
        </div>

        <!-- Catatan Harian Input -->
        <div>
          <input
            type="text"
            :disabled="isReadOnly"
            :readonly="isReadOnly"
            :value="row.remark"
            @input="updateRemark(row.workerId, ($event.target as HTMLInputElement).value)"
            placeholder="Catatan..."
            class="w-full h-7 px-2.5 rounded-lg bg-slate-950 border text-slate-300 text-[11px] font-mono focus:outline-none placeholder:text-slate-600"
            :class="isReadOnly ? 'border-slate-800 text-slate-500 cursor-not-allowed' : 'border-slate-800 focus:border-slate-600'"
          />
        </div>
      </div>

    </div>

    <!-- Load More Button when items exceed visible count -->
    <div
      v-if="filteredWorkerRows.length > displayedWorkerRows.length"
      class="pt-1 text-center"
    >
      <button
        type="button"
        @click="visibleWorkerCount += 35"
        class="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-800 text-xs font-bold font-mono transition active:scale-95 shadow-sm"
      >
        Tampilkan Lebih Banyak ({{ displayedWorkerRows.length }} dari {{ filteredWorkerRows.length }} Karyawan)
      </button>
    </div>

    <!-- Modals -->
    <MandorDailyReportModal
      :show="showMandorReportModal"
      @close="showMandorReportModal = false"
    />

    <MonthlyProductionRecapModal
      :show="showMonthlyRecapModal"
      @close="showMonthlyRecapModal = false"
    />

    <WorkerReportModal
      :show="showWorkerReportModal"
      :worker="selectedWorkerForReport"
      @close="showWorkerReportModal = false"
    />

    <SetAllTargetModal
      :show="showSetAllTargetModal"
      :selected-date="selectedDate"
      :team-options="teamFilterOptions"
      :all-workers="workerRows"
      :filtered-workers="filteredWorkerRows"
      :current-team-id="selectedTeamId"
      :is-read-only="isReadOnly"
      @close="showSetAllTargetModal = false"
      @apply="handleApplyMassTarget"
    />

    <!-- Floating Toast Notification -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div
        v-if="toastMessage"
        class="fixed bottom-6 right-6 z-50 max-w-sm px-4 py-3 rounded-xl bg-slate-900/95 border border-teal-500/50 text-teal-300 text-xs font-mono font-bold shadow-2xl flex items-center gap-2.5 backdrop-blur-md"
      >
        <CheckCircle2 class="w-4 h-4 text-teal-400 shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductionStore, getLocalDateStr } from '@/stores/productionStore'
import { useTeamStore } from '@/stores/teamStore'
import { useOverrideStore } from '@/stores/overrideStore'
import { useAuditStore } from '@/stores/auditStore'
import { useShiftStore } from '@/stores/shiftStore'
import CustomSelect, { type SelectOption } from '@/components/CustomSelect.vue'
import MandorDailyReportModal from '@/components/MandorDailyReportModal.vue'
import MonthlyProductionRecapModal from '@/components/MonthlyProductionRecapModal.vue'
import WorkerReportModal from '@/components/WorkerReportModal.vue'
import SetAllTargetModal from '@/components/SetAllTargetModal.vue'
import {
  Target,
  Calendar,
  Search,
  ClipboardList,
  Table,
  Plus,
  RotateCcw,
  CheckCircle2,
  Check,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  Wrench,
  BarChart3,
  Lock,
  Unlock
} from 'lucide-vue-next'
import { DEFAULT_DAILY_TARGET, isWorkerNewOnDate, calculateWorkerProdMap, isWorkerInLog } from '@/utils/reportUtils'

const { t } = useI18n()
const productionStore = useProductionStore()
const teamStore = useTeamStore()
const overrideStore = useOverrideStore()
const auditStore = useAuditStore()
const shiftStore = useShiftStore()

defineEmits(['open-log-modal'])

const showFilterConfig = ref(false)
const showMandorReportModal = ref(false)
const showMonthlyRecapModal = ref(false)
const showWorkerReportModal = ref(false)
const showSetAllTargetModal = ref(false)
const selectedWorkerForReport = ref<any>(null)

const toastMessage = ref('')
let toastTimeout: any = null

function showToast(msg: string) {
  toastMessage.value = msg
  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => {
    toastMessage.value = ''
  }, 3500)
}

// Debounce utility
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null
  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
  return debounced as T
}

function handleApplyMassTarget(data: { targetQty: number, workerIds: string[] }) {
  if (isReadOnly.value) return
  for (const wId of data.workerIds) {
    overrideStore.setDailyOverride(wId, selectedDate.value, 'targetQty', data.targetQty, 'all_shifts')
  }
  showToast(`Berhasil auto mengisi target ${formatNumber(data.targetQty)} Pcs untuk ${data.workerIds.length} karyawan!`)
}

const todayStr = computed(() => productionStore.currentDateStr || getLocalDateStr())
const selectedDate = ref(productionStore.currentDateStr || getLocalDateStr())
const selectedTeamId = ref('')
const statusFilter = ref('')
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

// Double Security Read-Only Mode for Past Dates
const isPastDate = computed(() => selectedDate.value !== todayStr.value)
const isEditUnlocked = ref(false)
const isReadOnly = computed(() => isPastDate.value && !isEditUnlocked.value)

watch(selectedDate, () => {
  // Lock edit automatically whenever switching dates
  isEditUnlocked.value = false
})

onMounted(async () => {
  try {
    await teamStore.loadTeams()
    await productionStore.loadLogs()
  } catch (err) {
    console.error('Failed to load initial dashboard data:', err)
  }
})

function formatNumber(val: number) {
  return new Intl.NumberFormat('id-ID').format(val || 0)
}

function setToday() {
  selectedDate.value = productionStore.currentDateStr || getLocalDateStr()
}

function changeDate(offsetDays: number) {
  const baseDate = selectedDate.value || productionStore.currentDateStr || getLocalDateStr()
  const parts = baseDate.split('-').map(Number)
  if (parts.length === 3) {
    const current = new Date(parts[0], parts[1] - 1, parts[2] + offsetDays)
    selectedDate.value = getLocalDateStr(current)
  } else {
    selectedDate.value = productionStore.currentDateStr || getLocalDateStr()
  }
}

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

const teamFilterOptions = computed<SelectOption[]>(() => [
  { label: 'Semua Tim / Line', value: '' },
  ...teamStore.teams.map(t => ({ label: t.name, value: t.id }))
])

const statusFilterOptions: SelectOption[] = [
  { label: 'Semua Status', value: '' },
  { label: 'Hadir', value: 'present' },
  { label: 'Absen', value: 'absent' },
  { label: 'Target Tercapai', value: 'reached' },
  { label: 'Belum Target', value: 'pending' }
]

interface WorkerRow {
  workerId: string
  workerNo: string
  workerName: string
  avatarUrl?: string
  teamName: string
  isPresent: boolean
  workHours: string
  targetQty: number
  prodQty: number
  gap: number
  isTargetReached: boolean
  remark: string
}

// Compute all worker rows for the selected date
const workerRows = computed<WorkerRow[]>(() => {
  const allWorkers = teamStore.allWorkers
  const dateStr = selectedDate.value

  // Build team map once O(n) instead of find() per worker O(n²)
  const teamMap = new Map<string, (typeof teamStore.teams)[0]>()
  for (const t of teamStore.teams) teamMap.set(t.id, t)

  // Fast O(Logs + Workers) Map lookup instead of 89 * 50 = 4450 nested filters
  const prodMap = calculateWorkerProdMap(dateStr, allWorkers, productionStore.logs)

  const selectedMonthStr = dateStr ? dateStr.slice(0, 7) : getLocalDateStr().slice(0, 7)
  const workersWithLogsInMonth = new Set<string>()
  for (const log of productionStore.logs) {
    if (log.date && log.date.startsWith(selectedMonthStr)) {
      for (const w of allWorkers) {
        if (isWorkerInLog(log, w)) {
          workersWithLogsInMonth.add(w.id)
        }
      }
    }
  }

  const activeWorkersInMonth = allWorkers.filter(w => {
    const isOut = (w.status || '').toLowerCase().includes('keluar') || (w.status || '').toLowerCase().includes('out')
    if (isOut) {
      if (!workersWithLogsInMonth.has(w.id)) return false
    }
    return true
  })

  return activeWorkersInMonth.map(w => {
    const workerId = w.id
    const wOverride = overrideStore.getWorkerOverride(workerId) || {}
    const dOverride = overrideStore.getDailyOverride(workerId, dateStr, 'all_shifts') || {}

    const workerTeam = teamMap.get(w.team_id)
    const baseTargetQty = workerTeam && workerTeam.hourly_target > 0 ? workerTeam.hourly_target : DEFAULT_DAILY_TARGET

    const baseProdQty = prodMap.get(workerId) || 0
    const hasProdOverride = dOverride.prodQty !== undefined
    const prodQtyVal = hasProdOverride ? dOverride.prodQty! : baseProdQty

    let isPresent = false
    if (dOverride.remark === 'Hadir ✓' || dOverride.remark === 'Hadir') {
      isPresent = true
    } else if (dOverride.remark === 'Absen ✕' || dOverride.remark === 'Absen') {
      isPresent = prodQtyVal > 0
    } else {
      isPresent = prodQtyVal > 0
    }

    const defaultWorkHours = workerTeam ? (workerTeam.shift ? shiftStore.formatShiftDisplay(workerTeam.shift) : '06:00 - 13:00') : '06:00 - 13:00'
    const workHours = dOverride.workHours !== undefined ? dOverride.workHours : defaultWorkHours

    const targetQty = dOverride.targetQty !== undefined ? dOverride.targetQty : baseTargetQty
    const prodQty = prodQtyVal
    const gap = prodQty - targetQty
    const isTargetReached = isPresent && prodQty >= targetQty && targetQty > 0

    const workerNo = wOverride.workerNo !== undefined ? wOverride.workerNo : (w.no_karyawan && !/^w[-_]/i.test(w.no_karyawan) ? w.no_karyawan : w.id)
    const workerName = wOverride.workerName !== undefined ? wOverride.workerName : w.full_name
    const teamName = workerTeam ? workerTeam.name : (w.team_name || 'Unassigned')
    const workerStatus = (w.status || '').toLowerCase()
    const isOut = workerStatus.includes('keluar') || workerStatus.includes('out')
    const isOnLeave = workerStatus.includes('cuti')
    const isNewInInterval = isWorkerNewOnDate(w.joined_date, dateStr, 7)
    const isBeforeJoined = !!w.joined_date && dateStr < w.joined_date

    let defaultRemark = 'Absen'
    if (isBeforeJoined && !isPresent) {
      defaultRemark = 'Belum Bergabung'
    } else if (isOut && !isPresent) {
      defaultRemark = 'Keluar'
    } else if (isOnLeave && !isPresent) {
      defaultRemark = 'Cuti'
    } else if (isPresent) {
      defaultRemark = isNewInInterval ? 'Hadir (Baru)' : 'Hadir'
    }

    const remark = dOverride.remark !== undefined ? dOverride.remark : defaultRemark

    return {
      workerId,
      workerNo,
      workerName,
      avatarUrl: w.avatar_url,
      teamName,
      isPresent,
      workHours,
      targetQty,
      prodQty,
      gap,
      isTargetReached,
      remark
    }
  })
})

function getPrevDateStr(dateStr: string): string {
  const parts = dateStr.split('-').map(Number)
  if (parts.length === 3) {
    const d = new Date(parts[0], parts[1] - 1, parts[2] - 1)
    return getLocalDateStr(d)
  }
  return dateStr
}

// Find the most recent date before selectedDate that has actual production logs (lookback up to 7 days)
function getPreviousWorkingDateStr(selectedDateStr: string): string {
  if (!selectedDateStr) return getPrevDateStr(selectedDateStr)

  const existingLogDates = Array.from(
    new Set(
      productionStore.logs
        .filter(l => l.date < selectedDateStr && l.total_qty > 0 && l.hour_slot !== 'Reset Hasil Tim')
        .map(l => l.date)
    )
  ).sort()

  if (existingLogDates.length > 0) {
    return existingLogDates[existingLogDates.length - 1]
  }

  return getPrevDateStr(selectedDateStr)
}

interface IncreasedWorkerItem {
  workerId: string
  workerName: string
  qtyYesterday: number
  qtyToday: number
  diffQty: number
  pctIncrease: number
}

const increasedWorkersList = computed<IncreasedWorkerItem[]>(() => {
  const prevDate = getPreviousWorkingDateStr(selectedDate.value)
  const allWorkers = teamStore.allWorkers
  const result: IncreasedWorkerItem[] = []

  const teamMap = new Map<string, (typeof teamStore.teams)[0]>()
  for (const t of teamStore.teams) teamMap.set(t.id, t)

  const todayRowMap = new Map<string, WorkerRow>()
  for (const r of workerRows.value) todayRowMap.set(r.workerId, r)

  // Fast O(1) prevProdMap calculation
  const prevProdMap = calculateWorkerProdMap(prevDate, allWorkers, productionStore.logs)

  for (const w of allWorkers) {
    const workerId = w.id
    const todayRow = todayRowMap.get(workerId)
    const qtyToday = todayRow?.prodQty ?? 0

    if (qtyToday <= 0) continue

    const dOverrideYesterday = overrideStore.getDailyOverride(workerId, prevDate, 'all_shifts') || {}
    const baseQtyYesterday = prevProdMap.get(workerId) || 0
    const qtyYesterday = dOverrideYesterday.prodQty !== undefined ? dOverrideYesterday.prodQty! : baseQtyYesterday

    const wOverride = overrideStore.getWorkerOverride(workerId) || {}
    const workerName = todayRow?.workerName || wOverride.workerName || w.full_name

    if (qtyYesterday > 0 && qtyToday > qtyYesterday) {
      const diffQty = qtyToday - qtyYesterday
      const rawPct = ((qtyToday - qtyYesterday) / qtyYesterday) * 100
      const pctIncrease = Math.round(rawPct * 10) / 10
      if (pctIncrease >= 10.0) {
        result.push({
          workerId,
          workerName,
          qtyYesterday,
          qtyToday,
          diffQty,
          pctIncrease
        })
      }
    }
  }

  return result.sort((a, b) => b.pctIncrease - a.pctIncrease || b.diffQty - a.diffQty)
})

const workerIncreaseMap = computed<Record<string, IncreasedWorkerItem>>(() => {
  const map: Record<string, IncreasedWorkerItem> = {}
  for (const item of increasedWorkersList.value) {
    map[item.workerId] = item
  }
  return map
})

// Build worker-id → team_id map for O(1) team lookup in filter
const workerTeamIdMap = computed<Map<string, string>>(() => {
  const m = new Map<string, string>()
  for (const w of teamStore.allWorkers) m.set(w.id, w.team_id)
  return m
})

// Filter worker rows based on team, status, search
const filteredWorkerRows = computed(() => {
  const twMap = workerTeamIdMap.value
  return workerRows.value.filter(row => {
    // Filter Team — O(1) map lookup
    if (selectedTeamId.value) {
      if (twMap.get(row.workerId) !== selectedTeamId.value) return false
    }

    // Exclude exited workers ('Keluar') and unjoined workers ('Belum Bergabung') when they have no production output on this date
    if ((row.remark === 'Keluar' || row.remark === 'Belum Bergabung') && !row.isPresent) return false

    // Filter Status
    if (statusFilter.value === 'present' && !row.isPresent) return false
    if (statusFilter.value === 'absent' && row.isPresent) return false
    if (statusFilter.value === 'reached' && !row.isTargetReached) return false
    if (statusFilter.value === 'pending' && (row.isTargetReached || !row.isPresent)) return false

    // Search Query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const nameMatch = row.workerName.toLowerCase().includes(q)
      const noMatch = row.workerNo.toLowerCase().includes(q)
      const teamMatch = row.teamName.toLowerCase().includes(q)
      if (!nameMatch && !noMatch && !teamMatch) return false
    }

    return true
  })
})

const visibleWorkerCount = ref(35)

watch([searchQuery, selectedTeamId, statusFilter, selectedDate], () => {
  visibleWorkerCount.value = 35
})

const displayedWorkerRows = computed(() => {
  return filteredWorkerRows.value.slice(0, visibleWorkerCount.value)
})

const hasOverridesForDate = computed(() => {
  const dateStr = selectedDate.value
  return Object.keys(overrideStore.dailyMap).some(k => k.includes(`_${dateStr}`))
})



function openWorkerReport(row: WorkerRow) {
  const fullWorkerObj = teamStore.allWorkers.find(w => w.id === row.workerId)
  selectedWorkerForReport.value = fullWorkerObj || {
    id: row.workerId,
    full_name: row.workerName,
    no_karyawan: row.workerNo,
    role: 'Operator Produksi',
    avatar_url: row.avatarUrl,
    team_name: row.teamName,
    status: undefined
  }
  showWorkerReportModal.value = true
}

function toggleAttendance(row: WorkerRow) {
  if (isReadOnly.value) return

  const newStatus = !row.isPresent
  const newRemark = newStatus ? 'Hadir' : 'Absen'
  overrideStore.setDailyOverride(row.workerId, selectedDate.value, 'remark', newRemark, 'all_shifts')

  if (!newStatus) {
    overrideStore.setDailyOverride(row.workerId, selectedDate.value, 'prodQty', 0, 'all_shifts')
  }

  auditStore.logAction('Absensi', `Toggle Absensi (${row.workerName})`, `Status diubah ke ${newRemark} (${selectedDate.value})`)
}

// Debounced writers — prevents per-keystroke localStorage writes
const _writeTarget = debounce((workerId: string, dateStr: string, val: number) => {
  overrideStore.setDailyOverride(workerId, dateStr, 'targetQty', val, 'all_shifts')
  const w = teamStore.allWorkers.find(item => item.id === workerId)
  auditStore.logAction('Target', `Edit Target (${w ? w.full_name : workerId})`, `Target harian set ke ${val} Pcs (${dateStr})`)
}, 400)

const _writeProd = debounce((workerId: string, dateStr: string, val: number) => {
  overrideStore.setDailyOverride(workerId, dateStr, 'prodQty', val, 'all_shifts')
  const w = teamStore.allWorkers.find(item => item.id === workerId)
  auditStore.logAction('Target', `Edit Realisasi (${w ? w.full_name : workerId})`, `Hasil produksi set ke ${val} Pcs (${dateStr})`)
}, 400)

const _writeRemark = debounce((workerId: string, dateStr: string, val: string) => {
  overrideStore.setDailyOverride(workerId, dateStr, 'remark', val, 'all_shifts')
  const w = teamStore.allWorkers.find(item => item.id === workerId)
  auditStore.logAction('Absensi', `Edit Catatan (${w ? w.full_name : workerId})`, `Catatan set ke "${val}" (${dateStr})`)
}, 400)

function updateTarget(workerId: string, val: number) {
  if (isReadOnly.value) return
  if (isNaN(val) || val < 0) return
  _writeTarget(workerId, selectedDate.value, val)
}

function updateProd(workerId: string, val: number) {
  if (isReadOnly.value) return
  if (isNaN(val) || val < 0) return
  _writeProd(workerId, selectedDate.value, val)
}

const _writeWorkHours = debounce((workerId: string, dateStr: string, val: string) => {
  overrideStore.setDailyOverride(workerId, dateStr, 'workHours', val, 'all_shifts')
  const w = teamStore.allWorkers.find(item => item.id === workerId)
  auditStore.logAction('Absensi', `Edit Jam Kerja (${w ? w.full_name : workerId})`, `Jam kerja set ke "${val}" (${dateStr})`)
}, 400)

function updateWorkHours(workerId: string, val: string) {
  if (isReadOnly.value) return
  _writeWorkHours(workerId, selectedDate.value, val)
}

function updateRemark(workerId: string, val: string) {
  if (isReadOnly.value) return
  _writeRemark(workerId, selectedDate.value, val)
}

function markAllPresent() {
  if (isReadOnly.value) return
  for (const row of filteredWorkerRows.value) {
    overrideStore.setDailyOverride(row.workerId, selectedDate.value, 'remark', 'Hadir', 'all_shifts')
  }
}

function resetDateOverrides() {
  if (isReadOnly.value) return
  overrideStore.resetDailyOverridesForDate(selectedDate.value)
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
