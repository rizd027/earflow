<template>
  <div class="space-y-3.5 sm:space-y-5 pb-10 font-sans text-slate-100">
    <!-- Top Header & Controls Bar (Sticky & Collapsible on Mobile) -->
    <div class="sticky top-14 z-30 bg-slate-950/95 backdrop-blur-xl border border-slate-800/90 rounded-xl p-3 sm:p-5 shadow-xl space-y-3 font-sans">
      <!-- Title & Collapse/Expand Header Row -->
      <div class="flex items-center justify-between gap-3">
        <!-- Title & Icon -->
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-inner transition"
            :class="rankingMode === 'increase'
              ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400'"
          >
            <TrendingUp v-if="rankingMode === 'increase'" class="w-4 h-4 sm:w-5 sm:h-5" />
            <Trophy v-else class="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div class="min-w-0">
            <h1 class="text-xs sm:text-lg font-extrabold font-mono text-slate-100 tracking-tight flex items-center gap-2 truncate">
              <span class="truncate">{{ rankingMode === 'increase' ? 'Peningkatan Performa' : 'Hasil Terbanyak' }}</span>
              <span
                class="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold font-mono border shrink-0"
                :class="rankingMode === 'increase'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'"
              >
                {{ rankingMode === 'increase' ? increasedList.length : topOutputList.length }} Karyawan
              </span>
            </h1>
            <p class="text-xs text-slate-400 font-mono hidden sm:block">
              {{ rankingMode === 'increase'
                ? 'Peringkat & histori kenaikan hasil produksi harian karyawan dibanding hari kerja sebelumnya'
                : 'Peringkat karyawan dengan akumulasi hasil output produksi (Pcs) terbanyak' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Collapsible Container (Filters, Category Switcher & Action Buttons) -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2 max-h-0 overflow-hidden"
        enter-to-class="opacity-100 translate-y-0 max-h-[500px]"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 max-h-[500px]"
        leave-to-class="opacity-0 -translate-y-2 max-h-0 overflow-hidden"
      >
        <div v-show="isFiltersOpen" class="space-y-3 pt-2 border-t border-slate-800/80">
          <!-- Switcher Tabs & Quick Action Buttons -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <!-- Ranking Mode Category Switcher Tabs -->
            <div class="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold flex-1">
              <button
                type="button"
                @click="rankingMode = 'increase'"
                class="flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition flex items-center justify-center gap-1.5"
                :class="rankingMode === 'increase'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'"
              >
                <TrendingUp class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span class="sm:hidden">Performa (%)</span>
                <span class="hidden sm:inline">Peningkatan Performa (%)</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono" :class="rankingMode === 'increase' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-800 text-slate-400'">
                  {{ increasedList.length }}
                </span>
              </button>

              <button
                type="button"
                @click="rankingMode = 'top_output'"
                class="flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition flex items-center justify-center gap-1.5"
                :class="rankingMode === 'top_output'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'"
              >
                <Trophy class="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span class="sm:hidden">Hasil (Pcs)</span>
                <span class="hidden sm:inline">Hasil Terbanyak (Pcs)</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono" :class="rankingMode === 'top_output' ? 'bg-amber-500/30 text-amber-200' : 'bg-slate-800 text-slate-400'">
                  {{ topOutputList.length }}
                </span>
              </button>
            </div>

            <!-- Action Buttons: Print A4 & Export Excel -->
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                @click="exportExcel"
                class="flex-1 sm:flex-none h-8 sm:h-9 px-3 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-mono font-bold text-xs border border-teal-500/30 transition inline-flex items-center justify-center gap-1.5 shadow-xs"
              >
                <FileSpreadsheet class="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Excel</span>
              </button>
              <button
                type="button"
                @click="showPrintModal = true"
                class="flex-1 sm:flex-none h-8 sm:h-9 px-3 sm:px-4 rounded-lg text-slate-950 font-mono font-extrabold text-xs transition inline-flex items-center justify-center gap-1.5 shadow-md"
                :class="rankingMode === 'increase' ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-950/40' : 'bg-amber-400 hover:bg-amber-300 shadow-amber-950/40'"
              >
                <Printer class="w-3.5 h-3.5 shrink-0" />
                <span class="sm:hidden">Cetak A4</span>
                <span class="hidden sm:inline">Cetak Laporan (A4)</span>
              </button>
            </div>
          </div>

          <!-- Filters & Date Selector Bar -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 font-mono text-xs">
            <!-- Selector Tanggal Evaluasi -->
            <div class="space-y-1">
              <label class="block text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Calendar class="w-3.5 h-3.5 text-teal-400" />
                <span>Tanggal:</span>
              </label>
              <input
                type="date"
                v-model="selectedDate"
                class="w-full h-8 sm:h-9 bg-slate-950 border border-slate-800 rounded-lg px-3 text-xs text-teal-300 font-mono font-bold focus:outline-none focus:border-teal-500 cursor-pointer transition"
              />
            </div>

            <!-- Filter Tim -->
            <div class="space-y-1">
              <label class="block text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Users class="w-3.5 h-3.5 text-amber-400" />
                <span>Tim:</span>
              </label>
              <CustomSelect
                v-model="selectedTeamId"
                :options="teamFilterOptions"
                placeholder="Semua Tim..."
              />
            </div>

            <!-- Filter Shift -->
            <div class="space-y-1">
              <label class="block text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Filter class="w-3.5 h-3.5 text-emerald-400" />
                <span>Shift:</span>
              </label>
              <CustomSelect
                v-model="selectedShift"
                :options="shiftFilterOptions"
                placeholder="Semua Shift..."
              />
            </div>

            <!-- Search Query -->
            <div class="space-y-1">
              <label class="block text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Search class="w-3.5 h-3.5 text-blue-400" />
                <span>Cari:</span>
              </label>
              <div class="relative">
                <input
                  type="text"
                  v-model="searchQueryInput"
                  @input="onSearchInput"
                  placeholder="Ketik nama / NIK..."
                  class="w-full h-8 sm:h-9 bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-8 text-xs text-slate-200 font-sans focus:outline-none focus:border-teal-500 font-medium"
                />
                <Search class="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2 sm:top-2.5 pointer-events-none" />
                <button
                  v-if="searchQueryInput"
                  type="button"
                  @click="clearSearch"
                  class="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition"
                  title="Bersihkan"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Summary KPI Cards (Clean 4-Column Grid on Mobile & Desktop) -->
    <!-- MODE 1: Peningkatan Performa (%) -->
    <div v-if="rankingMode === 'increase'" class="grid grid-cols-4 gap-1.5 sm:gap-3.5">
      <!-- Card 1: Total Karyawan Meningkat -->
      <div class="p-2 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-0.5 sm:space-y-1 relative overflow-hidden group hover:border-emerald-500/40 transition">
        <div class="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-mono font-semibold">
          <span class="truncate">Meningkat</span>
          <Award class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
        </div>
        <div class="text-xs sm:text-2xl font-black font-mono text-emerald-400 flex items-baseline gap-0.5 sm:gap-2">
          <span>{{ filteredIncreasedList.length }}</span>
          <span class="text-[9px] sm:text-xs font-normal text-slate-400">/{{ totalEvaluatedWorkers }}</span>
        </div>
        <p class="text-[9px] sm:text-[10px] text-slate-500 font-mono truncate hidden sm:block">&ge; 10.0% &amp; &gt; 0 Pcs</p>
      </div>

      <!-- Card 2: Rata-Rata Kenaikan -->
      <div class="p-2 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-0.5 sm:space-y-1 relative overflow-hidden group hover:border-teal-500/40 transition">
        <div class="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-mono font-semibold">
          <span class="truncate">Rata-Rata</span>
          <TrendingUp class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400 shrink-0" />
        </div>
        <div class="text-xs sm:text-2xl font-black font-mono text-teal-300">
          +{{ avgIncreasePct.toFixed(1) }}%
        </div>
        <p class="text-[9px] sm:text-[10px] text-slate-500 font-mono truncate hidden sm:block">Dihitung dari {{ filteredIncreasedList.length }} karyawan</p>
      </div>

      <!-- Card 3: Total Tambahan Output -->
      <div class="p-2 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-0.5 sm:space-y-1 relative overflow-hidden group hover:border-blue-500/40 transition">
        <div class="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-mono font-semibold">
          <span class="truncate">Tambahan</span>
          <BarChart3 class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
        </div>
        <div class="text-xs sm:text-2xl font-black font-mono text-blue-300 flex items-baseline gap-0.5">
          <span>+{{ totalDiffQty.toLocaleString('id-ID') }}</span>
          <span class="text-[9px] sm:text-xs text-slate-400 font-normal">Pcs</span>
        </div>
        <p class="text-[9px] sm:text-[10px] text-slate-500 font-mono truncate hidden sm:block">Akumulasi selisih pcs</p>
      </div>

      <!-- Card 4: Top Performer (Juara 1) -->
      <div class="p-2 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-0.5 sm:space-y-1 relative overflow-hidden group hover:border-amber-500/40 transition">
        <div class="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-mono font-semibold">
          <span class="truncate">Juara #1</span>
          <Sparkles class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
        </div>
        <div v-if="filteredIncreasedList.length > 0" class="min-w-0">
          <div class="font-extrabold text-xs sm:text-sm text-amber-300 truncate font-mono">
            {{ filteredIncreasedList[0].workerName.split(' ')[0] }}
          </div>
          <div class="text-[9px] sm:text-xs font-bold font-mono text-emerald-400 truncate">
            +{{ filteredIncreasedList[0].pctIncrease }}%
          </div>
        </div>
        <div v-else class="text-[9px] text-slate-500 italic font-mono">-</div>
      </div>
    </div>

    <!-- MODE 2: Hasil Terbanyak (Pcs) -->
    <div v-else-if="rankingMode === 'top_output'" class="grid grid-cols-4 gap-1.5 sm:gap-3.5">
      <!-- Card 1: Total Hasil Produksi -->
      <div class="p-2 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-0.5 sm:space-y-1 relative overflow-hidden group hover:border-amber-500/40 transition">
        <div class="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-mono font-semibold">
          <span class="truncate">Total Output</span>
          <Trophy class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
        </div>
        <div class="text-xs sm:text-2xl font-black font-mono text-amber-300 flex items-baseline gap-0.5">
          <span>{{ totalTopOutputPcs.toLocaleString('id-ID') }}</span>
          <span class="text-[9px] sm:text-xs text-slate-400 font-normal">Pcs</span>
        </div>
        <p class="text-[9px] sm:text-[10px] text-slate-500 font-mono truncate hidden sm:block">Akumulasi hasil pabrik</p>
      </div>

      <!-- Card 2: Rata-Rata Output -->
      <div class="p-2 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-0.5 sm:space-y-1 relative overflow-hidden group hover:border-teal-500/40 transition">
        <div class="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-mono font-semibold">
          <span class="truncate">Rata-Rata</span>
          <BarChart3 class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400 shrink-0" />
        </div>
        <div class="text-xs sm:text-2xl font-black font-mono text-teal-300 flex items-baseline gap-0.5">
          <span>{{ avgTopOutputPcs.toLocaleString('id-ID') }}</span>
          <span class="text-[9px] sm:text-xs text-slate-400 font-normal">Pcs</span>
        </div>
        <p class="text-[9px] sm:text-[10px] text-slate-500 font-mono truncate hidden sm:block">Rata-rata per orang</p>
      </div>

      <!-- Card 3: Pekerja Produksi Aktif -->
      <div class="p-2 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-0.5 sm:space-y-1 relative overflow-hidden group hover:border-blue-500/40 transition">
        <div class="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-mono font-semibold">
          <span class="truncate">Aktif</span>
          <Users class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
        </div>
        <div class="text-xs sm:text-2xl font-black font-mono text-blue-300 flex items-baseline gap-0.5 sm:gap-2">
          <span>{{ filteredTopOutputList.length }}</span>
          <span class="text-[9px] sm:text-xs font-normal text-slate-400">/{{ totalEvaluatedWorkers }}</span>
        </div>
        <p class="text-[9px] sm:text-[10px] text-slate-500 font-mono truncate hidden sm:block">Karyawan bekerja</p>
      </div>

      <!-- Card 4: Produsen Terbanyak (#1) -->
      <div class="p-2 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-0.5 sm:space-y-1 relative overflow-hidden group hover:border-emerald-500/40 transition">
        <div class="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-mono font-semibold">
          <span class="truncate">Juara #1</span>
          <Sparkles class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
        </div>
        <div v-if="filteredTopOutputList.length > 0" class="min-w-0">
          <div class="font-extrabold text-xs sm:text-sm text-emerald-300 truncate font-mono">
            {{ filteredTopOutputList[0].workerName.split(' ')[0] }}
          </div>
          <div class="text-[9px] sm:text-xs font-bold font-mono text-amber-300 truncate">
            {{ filteredTopOutputList[0].qtyToday.toLocaleString('id-ID') }} Pcs
          </div>
        </div>
        <div v-else class="text-[9px] text-slate-500 italic font-mono">-</div>
      </div>
    </div>

    <!-- Main View Mode Switcher Header -->
    <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-[11px] sm:text-xs font-bold font-mono text-slate-300 uppercase tracking-wider truncate">
          {{ rankingMode === 'increase' ? 'Peringkat Kenaikan (%)' : 'Peringkat Hasil Terbanyak (Pcs)' }} ({{ formatShortDate(selectedDate) }})
        </span>
      </div>

      <!-- View Switcher Toggle Buttons -->
      <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-xs shrink-0">
        <button
          type="button"
          @click="viewMode = 'grid'"
          class="px-2.5 py-1 rounded-md transition font-bold flex items-center gap-1.5"
          :class="viewMode === 'grid' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-400 hover:text-slate-200'"
        >
          <LayoutGrid class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Kartu Grid</span>
        </button>
        <button
          type="button"
          @click="viewMode = 'table'"
          class="px-2.5 py-1 rounded-md transition font-bold flex items-center gap-1.5"
          :class="viewMode === 'table' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'text-slate-400 hover:text-slate-200'"
        >
          <Table class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">Tabel Detail</span>
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="(rankingMode === 'increase' && filteredIncreasedList.length === 0) || (rankingMode === 'top_output' && filteredTopOutputList.length === 0)" class="text-center py-16 bg-slate-900/40 border border-slate-800/60 rounded-xl space-y-3 font-mono">
      <div class="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
        <TrendingUp v-if="rankingMode === 'increase'" class="w-6 h-6" />
        <Trophy v-else class="w-6 h-6" />
      </div>
      <div class="space-y-1">
        <p class="text-sm font-bold text-slate-300">Tidak Ada Data Karyawan</p>
        <p class="text-xs text-slate-500 max-w-md mx-auto">
          Pada tanggal {{ formatDisplayDate(selectedDate) }}, {{ rankingMode === 'increase' ? 'belum ada karyawan yang mengalami kenaikan produksi ≥ 10.0% dibanding hari kerja sebelumnya.' : 'belum ada input data produksi karyawan yang tercatat.' }}
        </p>
      </div>
    </div>

    <!-- MODE 1: Peningkatan Performa (%) -->
    <div v-else-if="rankingMode === 'increase'">
      <!-- VIEW 1: Grid Cards -->
      <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="(item, idx) in filteredIncreasedList"
          :key="item.workerId"
          class="p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition space-y-2.5 relative group shadow-sm"
        >
          <!-- Rank Badge & Worker Info -->
          <div class="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div class="flex items-center gap-2.5 min-w-0">
              <!-- Rank Badge -->
              <div
                class="w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-xs"
                :class="[
                  idx === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                  idx === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-400/50' :
                  idx === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/50' :
                  'bg-slate-950 text-slate-400 border border-slate-800'
                ]"
              >
                <span v-if="idx === 0">🥇</span>
                <span v-else-if="idx === 1">🥈</span>
                <span v-else-if="idx === 2">🥉</span>
                <span v-else>{{ idx + 1 }}</span>
              </div>

              <div class="min-w-0">
                <h3 class="font-bold text-xs text-slate-100 font-mono truncate group-hover:text-teal-300 transition">
                  {{ item.workerName }}
                </h3>
                <p class="text-[10px] text-slate-500 font-mono truncate">
                  NIK: {{ item.workerNo }} &bull; {{ item.teamName }}
                </p>
              </div>
            </div>

            <!-- Increase Percentage Badge -->
            <div class="px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-black shrink-0">
              +{{ item.pctIncrease }}%
            </div>
          </div>

          <!-- Output Quantities Comparison -->
          <div class="flex items-center justify-between text-xs font-mono bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
            <div class="text-left">
              <span class="text-[10px] text-slate-500 block">Kemarin ({{ formatShortDate(prevDateStr) }})</span>
              <span class="font-extrabold text-slate-300 text-sm">{{ item.qtyYesterday }} Pcs</span>
            </div>

            <div class="text-slate-600 font-bold">&rarr;</div>

            <div class="text-right">
              <span class="text-[10px] text-teal-400 font-semibold block">Hari Ini ({{ formatShortDate(selectedDate) }})</span>
              <span class="font-extrabold text-teal-300 text-sm">{{ item.qtyToday }} Pcs</span>
            </div>
          </div>

          <!-- Diff & Formula Explanation -->
          <div class="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-400 border-t border-slate-800/60">
            <span>Selisih Hasil: <strong class="text-emerald-400 font-bold">(+{{ item.diffQty }} Pcs)</strong></span>
            <span class="text-[10px] text-slate-500">({{ item.diffQty }} &divide; {{ item.qtyYesterday }}) &times; 100%</span>
          </div>
        </div>
      </div>

      <!-- VIEW 2: Data Table -->
      <div v-else-if="viewMode === 'table'" class="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <th class="p-3 text-center w-12">#</th>
                <th class="p-3 w-28">No. Karyawan</th>
                <th class="p-3">Nama Pekerja</th>
                <th class="p-3 w-32">Tim Penugasan</th>
                <th class="p-3 text-right w-28">Kemarin</th>
                <th class="p-3 text-right w-28">Hari Ini</th>
                <th class="p-3 text-right w-28">Selisih (+Pcs)</th>
                <th class="p-3 text-right w-32">Kenaikan (%)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-sans">
              <tr
                v-for="(item, idx) in filteredIncreasedList"
                :key="item.workerId"
                class="hover:bg-slate-800/40 transition"
              >
                <td class="p-3 text-center font-mono font-bold text-slate-400">
                  {{ idx + 1 }}
                </td>
                <td class="p-3 font-mono text-xs font-semibold text-teal-300">
                  <span class="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
                    {{ item.workerNo }}
                  </span>
                </td>
                <td class="p-3 font-bold text-xs text-slate-100 font-mono">
                  {{ item.workerName }}
                </td>
                <td class="p-3 text-xs text-slate-400 font-mono">
                  {{ item.teamName }}
                </td>
                <td class="p-3 text-right font-mono text-slate-400 font-semibold">
                  {{ item.qtyYesterday }} Pcs
                </td>
                <td class="p-3 text-right font-mono text-teal-300 font-bold">
                  {{ item.qtyToday }} Pcs
                </td>
                <td class="p-3 text-right font-mono text-emerald-400 font-extrabold">
                  +{{ item.diffQty }} Pcs
                </td>
                <td class="p-3 text-right font-mono">
                  <span class="inline-block px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                    +{{ item.pctIncrease }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODE 2: Hasil Terbanyak (Pcs) -->
    <div v-else-if="rankingMode === 'top_output'">
      <!-- VIEW 1: Grid Cards -->
      <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="(item, idx) in filteredTopOutputList"
          :key="item.workerId"
          class="p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition space-y-2.5 relative group shadow-sm"
        >
          <!-- Rank Badge & Worker Info -->
          <div class="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div class="flex items-center gap-2.5 min-w-0">
              <!-- Rank Badge -->
              <div
                class="w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-xs"
                :class="[
                  idx === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                  idx === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-400/50' :
                  idx === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/50' :
                  'bg-slate-950 text-slate-400 border border-slate-800'
                ]"
              >
                <span v-if="idx === 0">🥇</span>
                <span v-else-if="idx === 1">🥈</span>
                <span v-else-if="idx === 2">🥉</span>
                <span v-else>{{ idx + 1 }}</span>
              </div>

              <div class="min-w-0">
                <h3 class="font-bold text-xs text-slate-100 font-mono truncate group-hover:text-amber-300 transition">
                  {{ item.workerName }}
                </h3>
                <p class="text-[10px] text-slate-500 font-mono truncate">
                  NIK: {{ item.workerNo }} &bull; {{ item.teamName }}
                </p>
              </div>
            </div>

            <!-- Target Status Badge -->
            <div
              class="px-2 py-1 rounded-md text-[11px] font-mono font-bold shrink-0 border"
              :class="item.isTargetReached ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'"
            >
              {{ item.isTargetReached ? 'Tercapai 100%' : item.targetPct + '% Target' }}
            </div>
          </div>

          <!-- Total Output Main Display -->
          <div class="flex items-center justify-between text-xs font-mono bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
            <div>
              <span class="text-[10px] text-slate-400 font-semibold block">Total Hasil Produksi</span>
              <span class="font-black text-amber-300 text-lg leading-tight">{{ item.qtyToday.toLocaleString('id-ID') }} Pcs</span>
            </div>

            <div class="text-right">
              <span class="text-[10px] text-slate-500 block">Target Harian</span>
              <span class="font-bold text-slate-300 text-xs">{{ item.targetQty }} Pcs</span>
            </div>
          </div>

          <!-- Target Gap Detail -->
          <div class="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-400 border-t border-slate-800/60">
            <span>Selisih Target:</span>
            <strong :class="item.gap >= 0 ? 'text-emerald-400' : 'text-amber-400'" class="font-bold">
              {{ item.gap >= 0 ? '+' + item.gap + ' Pcs (Lampaui)' : item.gap + ' Pcs' }}
            </strong>
          </div>
        </div>
      </div>

      <!-- VIEW 2: Data Table -->
      <div v-else-if="viewMode === 'table'" class="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <th class="p-3 text-center w-12">#</th>
                <th class="p-3 w-28">No. Karyawan</th>
                <th class="p-3">Nama Pekerja</th>
                <th class="p-3 w-32">Tim Penugasan</th>
                <th class="p-3 text-right w-28">Target (Pcs)</th>
                <th class="p-3 text-right w-32">Hasil Output</th>
                <th class="p-3 text-right w-28">Selisih Target</th>
                <th class="p-3 text-right w-32">Status Capaian</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-sans">
              <tr
                v-for="(item, idx) in filteredTopOutputList"
                :key="item.workerId"
                class="hover:bg-slate-800/40 transition"
              >
                <td class="p-3 text-center font-mono font-bold text-slate-400">
                  {{ idx + 1 }}
                </td>
                <td class="p-3 font-mono text-xs font-semibold text-teal-300">
                  <span class="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
                    {{ item.workerNo }}
                  </span>
                </td>
                <td class="p-3 font-bold text-xs text-slate-100 font-mono">
                  {{ item.workerName }}
                </td>
                <td class="p-3 text-xs text-slate-400 font-mono">
                  {{ item.teamName }}
                </td>
                <td class="p-3 text-right font-mono text-slate-400 font-semibold">
                  {{ item.targetQty }} Pcs
                </td>
                <td class="p-3 text-right font-mono text-amber-300 font-extrabold text-sm">
                  {{ item.qtyToday.toLocaleString('id-ID') }} Pcs
                </td>
                <td class="p-3 text-right font-mono font-bold" :class="item.gap >= 0 ? 'text-emerald-400' : 'text-amber-400'">
                  {{ item.gap >= 0 ? '+' + item.gap + ' Pcs' : item.gap + ' Pcs' }}
                </td>
                <td class="p-3 text-right font-mono">
                  <span
                    class="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border"
                    :class="item.isTargetReached ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'"
                  >
                    {{ item.isTargetReached ? 'Tercapai 100%' : item.targetPct + '% Target' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Cetak Laporan A4 (Print Preview) -->
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
      <div v-if="showPrintModal" class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto custom-scrollbar">
        <div class="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden font-sans">
          <!-- Modal Header -->
          <div class="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <Printer class="w-4 h-4 text-emerald-400" />
              <h2 class="text-sm font-bold text-slate-100 font-mono">
                Preview Cetak Sheet A4 - {{ rankingMode === 'increase' ? 'Laporan Peningkatan Performa' : 'Laporan Hasil Produksi Terbanyak' }}
              </h2>
            </div>
            <button type="button" @click="showPrintModal = false" class="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Printable Sheet Area -->
          <div class="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white text-slate-900 font-sans print:p-0 print:m-0" id="print-sheet-area">
            <!-- Kop Surat Header -->
            <div class="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h1 class="text-xl font-extrabold tracking-tight text-slate-900 uppercase font-mono">
                  {{ rankingMode === 'increase' ? 'LAPORAN PENINGKATAN PERFORMA KARYAWAN' : 'LAPORAN HASIL PRODUKSI TERBANYAK KARYAWAN' }}
                </h1>
                <p class="text-xs text-slate-600 font-mono mt-0.5">
                  EARFLOW MANUFACTURING SYSTEMS &bull; EVALUASI HASIL PRODUKSI HARIAN
                </p>
              </div>
              <div class="text-right font-mono text-xs">
                <p class="font-bold text-slate-900">Tanggal: {{ formatDisplayDate(selectedDate) }}</p>
                <p v-if="rankingMode === 'increase'" class="text-slate-600">Pembanding: {{ formatDisplayDate(prevDateStr) }}</p>
              </div>
            </div>

            <!-- Syarat Kenaikan Banner -->
            <div class="p-2.5 rounded bg-slate-100 border border-slate-300 text-[11px] font-mono text-slate-700 mb-4 flex items-center justify-between">
              <span>
                {{ rankingMode === 'increase'
                  ? 'Syarat Evaluasi: Kenaikan ≥ 10.0% dibanding hari kerja sebelumnya (Hasil Kemarin > 0 Pcs)'
                  : 'Parameter Evaluasi: Peringkat Akumulasi Total Hasil Produksi (Pcs) Terbanyak Karyawan' }}
              </span>
              <span class="font-bold text-slate-900">
                Total Karyawan: {{ rankingMode === 'increase' ? filteredIncreasedList.length : filteredTopOutputList.length }}
              </span>
            </div>

            <!-- Print Table MODE 1 (Increase %) -->
            <table v-if="rankingMode === 'increase'" class="w-full border-collapse text-xs font-mono border border-slate-900 text-left mb-6">
              <thead>
                <tr class="bg-slate-200 text-slate-900 border-b border-slate-900 font-bold uppercase text-[11px]">
                  <th class="p-2 border-r border-slate-900 text-center w-10">NO</th>
                  <th class="p-2 border-r border-slate-900 w-24">NO KRYWN</th>
                  <th class="p-2 border-r border-slate-900">NAMA PEKERJA</th>
                  <th class="p-2 border-r border-slate-900 w-32">TIM PENUGASAN</th>
                  <th class="p-2 border-r border-slate-900 text-right w-24">KEMARIN</th>
                  <th class="p-2 border-r border-slate-900 text-right w-24">HARI INI</th>
                  <th class="p-2 border-r border-slate-900 text-right w-24">SELISIH</th>
                  <th class="p-2 text-right w-28">KENAIKAN (%)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-400">
                <tr v-for="(item, idx) in filteredIncreasedList" :key="item.workerId" class="even:bg-slate-50">
                  <td class="p-2 border-r border-slate-400 text-center font-bold">{{ idx + 1 }}</td>
                  <td class="p-2 border-r border-slate-400 font-bold">{{ item.workerNo }}</td>
                  <td class="p-2 border-r border-slate-400 font-bold">{{ item.workerName }}</td>
                  <td class="p-2 border-r border-slate-400">{{ item.teamName }}</td>
                  <td class="p-2 border-r border-slate-400 text-right">{{ item.qtyYesterday }} Pcs</td>
                  <td class="p-2 border-r border-slate-400 text-right font-bold">{{ item.qtyToday }} Pcs</td>
                  <td class="p-2 border-r border-slate-400 text-right font-bold text-emerald-800">+{{ item.diffQty }} Pcs</td>
                  <td class="p-2 text-right font-extrabold text-slate-900">+{{ item.pctIncrease }}%</td>
                </tr>
              </tbody>
            </table>

            <!-- Print Table MODE 2 (Top Output Pcs) -->
            <table v-else-if="rankingMode === 'top_output'" class="w-full border-collapse text-xs font-mono border border-slate-900 text-left mb-6">
              <thead>
                <tr class="bg-slate-200 text-slate-900 border-b border-slate-900 font-bold uppercase text-[11px]">
                  <th class="p-2 border-r border-slate-900 text-center w-10">NO</th>
                  <th class="p-2 border-r border-slate-900 w-24">NO KRYWN</th>
                  <th class="p-2 border-r border-slate-900">NAMA PEKERJA</th>
                  <th class="p-2 border-r border-slate-900 w-32">TIM PENUGASAN</th>
                  <th class="p-2 border-r border-slate-900 text-right w-24">TARGET</th>
                  <th class="p-2 border-r border-slate-900 text-right w-28">HASIL OUTPUT</th>
                  <th class="p-2 border-r border-slate-900 text-right w-24">SELISIH</th>
                  <th class="p-2 text-right w-28">CAPAIAN (%)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-400">
                <tr v-for="(item, idx) in filteredTopOutputList" :key="item.workerId" class="even:bg-slate-50">
                  <td class="p-2 border-r border-slate-400 text-center font-bold">{{ idx + 1 }}</td>
                  <td class="p-2 border-r border-slate-400 font-bold">{{ item.workerNo }}</td>
                  <td class="p-2 border-r border-slate-400 font-bold">{{ item.workerName }}</td>
                  <td class="p-2 border-r border-slate-400">{{ item.teamName }}</td>
                  <td class="p-2 border-r border-slate-400 text-right">{{ item.targetQty }} Pcs</td>
                  <td class="p-2 border-r border-slate-400 text-right font-extrabold text-slate-900">{{ item.qtyToday.toLocaleString('id-ID') }} Pcs</td>
                  <td class="p-2 border-r border-slate-400 text-right font-bold" :class="item.gap >= 0 ? 'text-emerald-800' : 'text-slate-700'">
                    {{ item.gap >= 0 ? '+' + item.gap + ' Pcs' : item.gap + ' Pcs' }}
                  </td>
                  <td class="p-2 text-right font-bold text-slate-900">{{ item.isTargetReached ? '100%' : item.targetPct + '%' }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Signatures Footer Block -->
            <div class="grid grid-cols-2 gap-8 text-xs font-mono text-center pt-4 border-t border-slate-300">
              <div>
                <p class="text-slate-600">Dibuat Oleh,</p>
                <div class="h-14"></div>
                <p class="font-bold text-slate-900 text-xs">Mandor Produksi</p>
              </div>
              <div>
                <p class="text-slate-600">Disetujui Oleh,</p>
                <div class="h-14"></div>
                <p class="font-bold text-slate-900 text-xs">Kepala Pabrik / SPV</p>
              </div>
            </div>
          </div>

          <!-- Modal Footer Actions -->
          <div class="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 font-mono text-xs">
            <button type="button" @click="showPrintModal = false" class="h-8 px-3 rounded text-slate-400 hover:text-slate-200 transition">
              Batal
            </button>
            <button
              type="button"
              @click="triggerPrint"
              class="h-9 px-4 rounded-md text-slate-950 font-bold transition flex items-center gap-1.5"
              :class="rankingMode === 'increase' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-amber-400 hover:bg-amber-300'"
            >
              <Printer class="w-4 h-4" />
              <span>Cetak Sekarang / Print PDF</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTeamStore, UNASSIGNED_TEAM_ID } from '@/stores/teamStore'
import { useProductionStore, getLocalDateStr } from '@/stores/productionStore'
import { useShiftStore } from '@/stores/shiftStore'
import { useOverrideStore } from '@/stores/overrideStore'
import { useAuditStore } from '@/stores/auditStore'
import CustomSelect, { type SelectOption } from '@/components/CustomSelect.vue'
import { calculateWorkerProdMap } from '@/utils/reportUtils'
import { exportToXlsx } from '@/utils/excelExport'
import { TrendingUp, Calendar, Search, Printer, FileSpreadsheet, Users, Award, BarChart3, Filter, Sparkles, LayoutGrid, Table, X, Trophy } from 'lucide-vue-next'

const teamStore = useTeamStore()
const productionStore = useProductionStore()
const shiftStore = useShiftStore()
const overrideStore = useOverrideStore()
const auditStore = useAuditStore()

const rankingMode = ref<'increase' | 'top_output'>('increase')
const isFiltersOpen = ref<boolean>(false)
const selectedDate = ref<string>(getLocalDateStr())
const selectedTeamId = ref<string>('')
const selectedShift = ref<string>('')
const searchQueryInput = ref<string>('')
const searchQuery = ref<string>('')
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

function clearSearch() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchQueryInput.value = ''
  searchQuery.value = ''
}

const viewMode = ref<'grid' | 'table'>('grid')
const showPrintModal = ref<boolean>(false)

// Calculate previous date dynamically
const prevDateStr = computed(() => {
  if (!selectedDate.value) return getLocalDateStr()
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() - 1)
  return getLocalDateStr(d)
})

interface IncreasedItem {
  workerId: string
  workerNo: string
  workerName: string
  teamName: string
  qtyYesterday: number
  qtyToday: number
  diffQty: number
  pctIncrease: number
}

interface TopOutputItem {
  workerId: string
  workerNo: string
  workerName: string
  teamName: string
  targetQty: number
  qtyToday: number
  gap: number
  targetPct: number
  isTargetReached: boolean
}

// Compute performance increase list for the selected date
const increasedList = computed<IncreasedItem[]>(() => {
  const dateStr = selectedDate.value || getLocalDateStr()
  const prevDate = prevDateStr.value
  const allWorkers = teamStore.allWorkers
  const result: IncreasedItem[] = []

  const teamMap = new Map(teamStore.teams.map(t => [t.id, t]))

  // Calculate today worker production map
  const todayProdMap = calculateWorkerProdMap(dateStr, allWorkers, productionStore.logs)
  // Calculate yesterday worker production map
  const prevProdMap = calculateWorkerProdMap(prevDate, allWorkers, productionStore.logs)

  for (const w of allWorkers) {
    const workerId = w.id
    const dOverrideToday = overrideStore.getDailyOverride(workerId, dateStr, 'all_shifts') || {}
    const baseQtyToday = todayProdMap.get(workerId) || 0
    const qtyToday = dOverrideToday.prodQty !== undefined ? dOverrideToday.prodQty! : baseQtyToday

    if (qtyToday <= 0) continue

    const dOverrideYesterday = overrideStore.getDailyOverride(workerId, prevDate, 'all_shifts') || {}
    const baseQtyYesterday = prevProdMap.get(workerId) || 0
    const qtyYesterday = dOverrideYesterday.prodQty !== undefined ? dOverrideYesterday.prodQty! : baseQtyYesterday

    const wOverride = overrideStore.getWorkerOverride(workerId) || {}
    const workerName = wOverride.workerName !== undefined ? wOverride.workerName : w.full_name
    const rawNo = wOverride.workerNo !== undefined ? wOverride.workerNo : (w.no_karyawan && !/^w[-_]/i.test(w.no_karyawan) ? w.no_karyawan : w.id)
    const workerNo = (!rawNo || rawNo === '-' || /^w[-_]/i.test(rawNo)) ? '-' : rawNo

    const workerTeam = teamMap.get(w.team_id)
    const teamName = workerTeam ? workerTeam.name : (w.team_name || 'Belum Ada Tim')

    if (qtyYesterday > 0 && qtyToday > qtyYesterday) {
      const diffQty = qtyToday - qtyYesterday
      const rawPct = (diffQty / qtyYesterday) * 100
      const pctIncrease = Math.round(rawPct * 10) / 10
      if (pctIncrease >= 10.0) {
        result.push({
          workerId,
          workerNo,
          workerName,
          teamName,
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

// Compute top total production output (Hasil Terbanyak) list
const topOutputList = computed<TopOutputItem[]>(() => {
  const dateStr = selectedDate.value || getLocalDateStr()
  const allWorkers = teamStore.allWorkers
  const result: TopOutputItem[] = []

  const teamMap = new Map(teamStore.teams.map(t => [t.id, t]))
  const todayProdMap = calculateWorkerProdMap(dateStr, allWorkers, productionStore.logs)

  for (const w of allWorkers) {
    const workerId = w.id
    const dOverrideToday = overrideStore.getDailyOverride(workerId, dateStr, 'all_shifts') || {}
    const baseQtyToday = todayProdMap.get(workerId) || 0
    const qtyToday = dOverrideToday.prodQty !== undefined ? dOverrideToday.prodQty! : baseQtyToday

    if (qtyToday <= 0) continue

    const workerTeam = teamMap.get(w.team_id)
    const teamHourlyTarget = workerTeam?.hourly_target || 71
    const baseTarget = dOverrideToday.targetQty !== undefined ? dOverrideToday.targetQty : (teamHourlyTarget * 7)
    const targetQty = baseTarget > 0 ? baseTarget : 500

    const gap = qtyToday - targetQty
    const targetPct = targetQty > 0 ? Math.round((qtyToday / targetQty) * 1000) / 10 : 0
    const isTargetReached = gap >= 0

    const wOverride = overrideStore.getWorkerOverride(workerId) || {}
    const workerName = wOverride.workerName !== undefined ? wOverride.workerName : w.full_name
    const rawNo = wOverride.workerNo !== undefined ? wOverride.workerNo : (w.no_karyawan && !/^w[-_]/i.test(w.no_karyawan) ? w.no_karyawan : w.id)
    const workerNo = (!rawNo || rawNo === '-' || /^w[-_]/i.test(rawNo)) ? '-' : rawNo
    const teamName = workerTeam ? workerTeam.name : (w.team_name || 'Belum Ada Tim')

    result.push({
      workerId,
      workerNo,
      workerName,
      teamName,
      targetQty,
      qtyToday,
      gap,
      targetPct,
      isTargetReached
    })
  }

  return result.sort((a, b) => b.qtyToday - a.qtyToday || b.gap - a.gap)
})

// Filtered list for Mode 1 (Increased Performance %)
const filteredIncreasedList = computed<IncreasedItem[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return increasedList.value.filter(item => {
    const worker = teamStore.allWorkers.find(w => w.id === item.workerId)
    if (!worker) return false

    if (selectedTeamId.value && worker.team_id !== selectedTeamId.value) return false

    if (selectedShift.value) {
      const shiftName = worker.shift || 'Shift Pagi'
      if (!shiftName.toLowerCase().includes(selectedShift.value.toLowerCase())) return false
    }

    if (query) {
      const nameMatch = item.workerName.toLowerCase().includes(query)
      const noMatch = item.workerNo.toLowerCase().includes(query)
      const teamMatch = item.teamName.toLowerCase().includes(query)
      if (!nameMatch && !noMatch && !teamMatch) return false
    }

    return true
  })
})

// Filtered list for Mode 2 (Hasil Terbanyak Pcs)
const filteredTopOutputList = computed<TopOutputItem[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return topOutputList.value.filter(item => {
    const worker = teamStore.allWorkers.find(w => w.id === item.workerId)
    if (!worker) return false

    if (selectedTeamId.value && worker.team_id !== selectedTeamId.value) return false

    if (selectedShift.value) {
      const shiftName = worker.shift || 'Shift Pagi'
      if (!shiftName.toLowerCase().includes(selectedShift.value.toLowerCase())) return false
    }

    if (query) {
      const nameMatch = item.workerName.toLowerCase().includes(query)
      const noMatch = item.workerNo.toLowerCase().includes(query)
      const teamMatch = item.teamName.toLowerCase().includes(query)
      if (!nameMatch && !noMatch && !teamMatch) return false
    }

    return true
  })
})

const totalEvaluatedWorkers = computed(() => teamStore.allWorkers.length)

const avgIncreasePct = computed(() => {
  if (filteredIncreasedList.value.length === 0) return 0
  const sum = filteredIncreasedList.value.reduce((acc, item) => acc + item.pctIncrease, 0)
  return sum / filteredIncreasedList.value.length
})

const totalDiffQty = computed(() => {
  return filteredIncreasedList.value.reduce((acc, item) => acc + item.diffQty, 0)
})

const totalTopOutputPcs = computed(() => {
  return filteredTopOutputList.value.reduce((acc, item) => acc + item.qtyToday, 0)
})

const avgTopOutputPcs = computed(() => {
  if (filteredTopOutputList.value.length === 0) return 0
  return Math.round(totalTopOutputPcs.value / filteredTopOutputList.value.length)
})

const teamFilterOptions = computed<SelectOption[]>(() => [
  { label: 'Semua Tim', value: '' },
  { label: 'Belum Masuk Tim', value: UNASSIGNED_TEAM_ID },
  ...teamStore.teams.map(t => ({ label: t.name, value: t.id }))
])

const shiftFilterOptions = computed<SelectOption[]>(() => [
  { label: 'Semua Shift', value: '' },
  ...shiftStore.shifts.map(s => ({ label: s.name, value: s.name }))
])

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const d = parseInt(parts[2], 10)
  const m = parseInt(parts[1], 10) - 1
  const y = parts[0]
  return `${d} ${months[m] || ''} ${y}`
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const d = parseInt(parts[2], 10)
  const m = parseInt(parts[1], 10) - 1
  return `${d} ${months[m] || ''}`
}

function exportExcel() {
  const dateLabel = formatDisplayDate(selectedDate.value)
  const prevLabel = formatDisplayDate(prevDateStr.value)

  if (rankingMode.value === 'increase') {
    const items = filteredIncreasedList.value
    const headers = [
      'Peringkat (#)',
      'No. Karyawan (NIK)',
      'Nama Pekerja',
      'Tim Penugasan',
      `Hasil Kemarin (${prevLabel})`,
      `Hasil Hari Ini (${dateLabel})`,
      'Selisih Tambahan (+Pcs)',
      'Persentase Kenaikan (%)'
    ]

    const rows = items.map((item, idx) => [
      idx + 1,
      item.workerNo,
      item.workerName,
      item.teamName,
      item.qtyYesterday,
      item.qtyToday,
      item.diffQty,
      `+${item.pctIncrease}%`
    ])

    const filename = `Statistik_Peningkatan_Performa_${selectedDate.value}.xlsx`
    exportToXlsx(filename, `Peningkatan Performa ${dateLabel}`, headers, rows)
    auditStore.logAction('Pekerja', 'Export Excel Performa', `Export ${rows.length} karyawan peningkatan performa tanggal ${dateLabel}`)
  } else {
    const items = filteredTopOutputList.value
    const headers = [
      'Peringkat (#)',
      'No. Karyawan (NIK)',
      'Nama Pekerja',
      'Tim Penugasan',
      'Target Harian (Pcs)',
      `Hasil Output (${dateLabel})`,
      'Selisih Target (Pcs)',
      'Capaian Target (%)'
    ]

    const rows = items.map((item, idx) => [
      idx + 1,
      item.workerNo,
      item.workerName,
      item.teamName,
      item.targetQty,
      item.qtyToday,
      item.gap >= 0 ? `+${item.gap}` : item.gap,
      item.isTargetReached ? '100%' : `${item.targetPct}%`
    ])

    const filename = `Statistik_Hasil_Terbanyak_${selectedDate.value}.xlsx`
    exportToXlsx(filename, `Hasil Terbanyak ${dateLabel}`, headers, rows)
    auditStore.logAction('Pekerja', 'Export Excel Hasil Terbanyak', `Export ${rows.length} karyawan hasil terbanyak tanggal ${dateLabel}`)
  }
}

function triggerPrint() {
  window.print()
}

function handleHeaderMenuToggle() {
  isFiltersOpen.value = !isFiltersOpen.value
}

onMounted(() => {
  window.addEventListener('toggle-header-menu', handleHeaderMenuToggle)
})

onUnmounted(() => {
  window.removeEventListener('toggle-header-menu', handleHeaderMenuToggle)
})
</script>
