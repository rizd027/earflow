<template>
  <div class="space-y-4">
    <!-- Sticky Search Bar & Collapsible Unified Tools, Filter & Action Panel -->
    <div class="sticky top-14 z-30 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-lg p-2.5 sm:p-3 space-y-2.5 shadow-md transition-all">
      <!-- Search Input -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1 min-w-0">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Cari nama karyawan, NIK, atau role..."
            class="w-full h-9 pl-9 pr-9 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:border-teal-400 focus:outline-none placeholder:text-slate-500"
          />
          <button
            v-if="searchQuery"
            type="button"
            @click="searchQuery = ''"
            class="absolute right-0 top-0 bottom-0 w-9 rounded-r-lg text-slate-400 hover:text-slate-200 transition flex items-center justify-center cursor-pointer"
          >
            <X class="w-4 h-4 text-slate-400 hover:text-slate-200 stroke-[2.5]" />
          </button>
        </div>
      </div>

      <!-- Collapsible Panel: Month Selector, Filters, and Actions (Triggered by Header 3-Dots) -->
      <div v-if="headerMenuStore.isOpen" class="pt-2.5 border-t border-slate-800/80 space-y-3 font-mono">
        <!-- Month / Periode Selector Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <div class="flex items-center justify-between sm:justify-start gap-2">
            <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar class="w-4 h-4 text-teal-400" />
              Periode Bulan:
            </span>
            <span class="text-xs font-bold text-teal-300 sm:hidden">{{ formatMonthLabel(selectedMonth) }}</span>
          </div>

          <div class="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              @click="changeMonth(-1)"
              class="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold shrink-0 flex items-center justify-center active:scale-95 cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft class="w-4 h-4 text-slate-300" />
            </button>
            <input
              type="month"
              v-model="selectedMonth"
              class="flex-1 sm:w-40 h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold focus:border-teal-400 focus:outline-none cursor-pointer font-mono"
            />
            <button
              @click="changeMonth(1)"
              class="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold shrink-0 flex items-center justify-center active:scale-95 cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight class="w-4 h-4 text-slate-300" />
            </button>
            <button
              @click="setCurrentMonth"
              class="h-8 px-3 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-bold shrink-0 shadow-xs active:scale-95 transition cursor-pointer"
            >
              Bulan Ini
            </button>
          </div>
        </div>

        <!-- Filter Controls Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <!-- Filter Tim -->
          <div class="space-y-1">
            <label class="block text-[10px] sm:text-[11px] font-bold text-slate-400">Tim / Line</label>
            <CustomSelect
              v-model="selectedTeamId"
              :options="teamFilterOptions"
              placeholder="Semua Tim / Line"
            />
          </div>

          <!-- Filter Metode Gaji -->
          <div class="space-y-1">
            <label class="block text-[10px] sm:text-[11px] font-bold text-slate-400">Metode Penggajian</label>
            <div class="grid grid-cols-3 gap-1.5 p-0.5 bg-slate-950 border border-slate-700 rounded-lg h-9 items-center">
              <button
                type="button"
                @click="methodFilter = 'all'"
                class="h-7.5 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                :class="methodFilter === 'all' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs' : 'text-slate-400 hover:text-slate-200'"
              >
                Semua ({{ calculatedRows.length }})
              </button>
              <button
                type="button"
                @click="methodFilter = 'piece'"
                class="h-7.5 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                :class="methodFilter === 'piece' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs' : 'text-slate-400 hover:text-slate-200'"
              >
                Borongan ({{ pieceWorkersCount }})
              </button>
              <button
                type="button"
                @click="methodFilter = 'hourly'"
                class="h-7.5 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                :class="methodFilter === 'hourly' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs' : 'text-slate-400 hover:text-slate-200'"
              >
                Per Jam ({{ hourlyWorkersCount }})
              </button>
            </div>
          </div>
        </div>

        <!-- Aksi & Laporan Penggajian -->
        <div class="pt-2.5 border-t border-slate-800/80 space-y-2">
          <div class="flex items-center justify-between">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders class="w-3.5 h-3.5 text-teal-400" />
              <span>Aksi & Laporan Penggajian</span>
            </div>
            <button
              type="button"
              @click="resetFilters"
              class="text-[10px] text-slate-500 hover:text-teal-400 transition cursor-pointer font-bold"
            >
              Reset Filter
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <!-- Action 1: Atur Tarif Gaji Standar -->
            <button
              type="button"
              @click="showRateConfigModal = true"
              class="h-9 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Atur Tarif Standar Borongan & Per Jam"
            >
              <Sliders class="w-3.5 h-3.5 text-amber-400" />
              <span class="truncate">Atur Tarif Gaji</span>
            </button>

            <!-- Action 2: Cetak Rekapitulasi Gaji (A4) -->
            <button
              type="button"
              @click="showFullPayrollPrintModal = true"
              class="h-9 px-2.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 active:scale-95 text-teal-300 border border-teal-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Cetak Lembar Rekapitulasi Penggajian A4"
            >
              <Printer class="w-3.5 h-3.5 text-teal-400" />
              <span class="truncate">Cetak Rekap A4</span>
            </button>

            <!-- Action 3: Export Excel -->
            <button
              type="button"
              @click="exportToExcel"
              class="h-9 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Export Rekapitulasi ke Format Excel (.xlsx)"
            >
              <FileSpreadsheet class="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
              <span class="truncate">Export Excel</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Master Salary Table -->
    <div class="bg-slate-900/40 border border-slate-800/80 rounded-md overflow-hidden shadow-xl">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left text-xs min-w-[950px] whitespace-nowrap">
          <thead class="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md text-slate-400 font-mono border-b border-slate-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th class="p-3 w-10 text-center select-none">No</th>
              <th class="p-3 w-48 text-center">Karyawan</th>
              <th class="p-3 w-28 text-center">Role / Line</th>
              <th class="p-3 w-32 text-center">Kehadiran & Jam</th>
              <th class="p-3 w-28 text-center">Hasil (Pcs)</th>
              <th class="p-3 w-36 text-center">Metode Gaji</th>
              <th class="p-3 w-32 text-center">Tarif Satuan</th>
              <th class="p-3 w-36 text-center">Estimasi Gaji</th>
              <th class="p-3 w-32 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-800/60 font-sans">
            <tr v-if="teamStore.isLoading || productionStore.isLoading">
              <td colspan="9" class="p-8 text-center text-slate-400 font-mono">
                <div class="inline-flex items-center gap-2">
                  <div class="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Memuat data kalkulasi gaji...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="filteredRows.length === 0">
              <td colspan="9" class="p-8 text-center text-slate-500 font-mono">
                Tidak ada data karyawan ditemukan untuk filter yang dipilih.
              </td>
            </tr>

            <tr
              v-else
              v-for="(row, idx) in filteredRows"
              :key="row.worker.id"
              class="hover:bg-slate-800/40 transition font-mono"
            >
              <!-- No -->
              <td class="p-3 text-center text-slate-500 font-bold">{{ idx + 1 }}</td>

              <!-- Karyawan -->
              <td class="p-3 font-sans">
                <div class="flex items-center gap-2.5">
                  <img
                    :src="row.worker.avatar_url"
                    :alt="row.worker.full_name"
                    loading="lazy"
                    class="w-8 h-8 rounded-full bg-slate-800 object-cover border border-slate-700 shrink-0"
                  />
                  <div class="min-w-0">
                    <p class="font-bold text-xs text-slate-100 truncate">{{ row.worker.full_name }}</p>
                    <p class="text-[10px] text-slate-400 font-mono">NIK: {{ row.worker.no_karyawan || '-' }}</p>
                  </div>
                </div>
              </td>

              <!-- Role & Line -->
              <td class="p-3 text-center">
                <span class="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-teal-300 border border-teal-500/20">
                  {{ row.worker.role || 'Operator' }}
                </span>
                <span v-if="row.worker.team_name" class="block text-[9px] text-slate-400 mt-0.5 truncate">
                  {{ row.worker.team_name }}
                </span>
              </td>

              <!-- Kehadiran & Total Jam Kerja -->
              <td class="p-3 text-center">
                <div class="inline-flex flex-col items-center">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
                    :class="row.attendanceDays > 0 ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'">
                    <UserCheck class="w-3 h-3" />
                    <span>{{ row.attendanceDays }} Hari</span>
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono mt-0.5">
                    {{ row.totalWorkHours }} Jam Kerja
                  </span>
                </div>
              </td>

              <!-- Total Output (Pcs) -->
              <td class="p-3 text-center">
                <span class="font-bold text-slate-200">
                  {{ row.totalProdQty.toLocaleString('id-ID') }}
                </span>
                <span class="text-[10px] text-slate-500 block">Pcs</span>
              </td>

              <!-- Metode Gaji (Interactive Toggle Badge) -->
              <td class="p-3 text-center">
                <div class="inline-flex p-0.5 rounded-lg bg-slate-950 border border-slate-800">
                  <button
                    type="button"
                    @click="salaryStore.setWorkerMethod(row.worker.id, 'piece')"
                    class="px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    :class="row.salary.method === 'piece'
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'"
                    title="Gaji Dihitung Berdasarkan Hasil Output Pcs (Borongan)"
                  >
                    Borongan
                  </button>
                  <button
                    type="button"
                    @click="salaryStore.setWorkerMethod(row.worker.id, 'hourly')"
                    class="px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    :class="row.salary.method === 'hourly'
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'"
                    title="Gaji Dihitung Berdasarkan Jumlah Jam Kerja (Per Jam)"
                  >
                    Per Jam
                  </button>
                </div>
              </td>

              <!-- Tarif Satuan -->
              <td class="p-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <span class="font-bold text-xs text-slate-200">
                    Rp {{ formatRupiah(row.salary.rateUsed) }}
                  </span>
                  <span class="text-[9px] text-slate-400">/{{ row.salary.method === 'piece' ? 'pcs' : 'jam' }}</span>
                </div>
                <span v-if="row.hasCustomRate" class="text-[9px] text-amber-400 font-semibold block">
                  (Tarif Kustom)
                </span>
              </td>

              <!-- Estimasi Gaji -->
              <td class="p-3 text-center">
                <div class="text-xs sm:text-sm font-black text-emerald-400">
                  Rp {{ formatRupiah(row.salary.netAmount) }}
                </div>
                <span class="text-[9px] text-slate-400 block truncate" :title="row.salary.formulaStr">
                  {{ row.salary.formulaStr }}
                </span>
              </td>

              <!-- Aksi -->
              <td class="p-3 text-center font-sans">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    @click="openSlipModal(row)"
                    class="h-7 px-2.5 rounded bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 text-xs font-semibold transition inline-flex items-center gap-1 border border-teal-500/30 shrink-0"
                    title="Cetak Slip Gaji Karyawan"
                  >
                    <Printer class="w-3 h-3 text-teal-400" />
                    <span>Slip</span>
                  </button>

                  <button
                    type="button"
                    @click="openEditModal(row)"
                    class="h-7 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition inline-flex items-center gap-1 border border-slate-700 shrink-0"
                    title="Edit Tarif Khusus Karyawan"
                  >
                    <Pencil class="w-3 h-3 text-slate-400" />
                    <span>Edit</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── MODAL 1: ATUR TARIF GAJI STANDAR & ROLE ── -->
    <Teleport to="body">
      <div
        v-if="showRateConfigModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-mono"
        @click.self="showRateConfigModal = false"
      >
        <div class="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl text-slate-200">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <Sliders class="w-5 h-5 text-amber-400" />
              <h3 class="text-sm font-bold text-slate-100">Pengaturan Tarif Standar Gaji</h3>
            </div>
            <button @click="showRateConfigModal = false" class="text-slate-400 hover:text-slate-200">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-3.5 text-xs">
            <!-- Tarif Per Jam Standar -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-slate-300">
                Tarif Gaji Per Jam Standar (Rp / Jam Kerja):
              </label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-slate-500 font-bold">Rp</span>
                <input
                  type="number"
                  v-model.number="tempRates.defaultHourlyRate"
                  class="w-full h-9 pl-10 pr-3 rounded bg-slate-950 border border-slate-700 text-slate-100 font-bold focus:border-teal-400 focus:outline-none"
                  placeholder="12000"
                />
              </div>
            </div>

            <!-- Tarif Borongan Standar Default -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-slate-300">
                Tarif Borongan Default (Rp / Pcs):
              </label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-slate-500 font-bold">Rp</span>
                <input
                  type="number"
                  v-model.number="tempRates.defaultPieceRate"
                  class="w-full h-9 pl-10 pr-3 rounded bg-slate-950 border border-slate-700 text-slate-100 font-bold focus:border-teal-400 focus:outline-none"
                  placeholder="150"
                />
              </div>
            </div>

            <!-- Tarif Borongan Per Role / Proses -->
            <div class="space-y-2 pt-2 border-t border-slate-800">
              <label class="block text-[11px] font-bold text-amber-300 flex items-center justify-between">
                <span>Tarif Borongan Khusus Per Role / Posisi:</span>
              </label>

              <div class="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                <div
                  v-for="(_, roleKey) in tempRates.rolePieceRates"
                  :key="roleKey"
                  class="flex items-center justify-between gap-2 p-2 rounded bg-slate-950/70 border border-slate-800"
                >
                  <span class="text-xs font-bold text-slate-200">{{ roleKey }}</span>
                  <div class="flex items-center gap-1 w-32">
                    <span class="text-slate-500 font-bold text-[11px]">Rp</span>
                    <input
                      type="number"
                      v-model.number="tempRates.rolePieceRates[roleKey]"
                      class="w-full h-7 px-2 rounded bg-slate-900 border border-slate-700 text-slate-100 text-right text-xs font-bold focus:border-teal-400 focus:outline-none"
                    />
                    <span class="text-[10px] text-slate-500">/pcs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              @click="showRateConfigModal = false"
              class="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              @click="saveGlobalRates"
              class="px-4 py-1.5 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Check class="w-3.5 h-3.5 stroke-[3]" />
              <span>Simpan Tarif</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── MODAL 2: EDIT KOMPONEN GAJI INDIVIDUAL KARYAWAN ── -->
    <Teleport to="body">
      <div
        v-if="showEditWorkerModal && editingRow"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-mono"
        @click.self="showEditWorkerModal = false"
      >
        <div class="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl text-slate-200">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2.5">
              <img
                :src="editingRow.worker.avatar_url"
                class="w-8 h-8 rounded-full border border-slate-700"
              />
              <div>
                <h3 class="text-xs font-bold text-slate-100 truncate">{{ editingRow.worker.full_name }}</h3>
                <p class="text-[10px] text-slate-400">NIK: {{ editingRow.worker.no_karyawan || '-' }} • Role: {{ editingRow.worker.role }}</p>
              </div>
            </div>
            <button @click="showEditWorkerModal = false" class="text-slate-400 hover:text-slate-200">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <!-- Metode Gaji -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-slate-400">Metode Penggajian:</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  @click="editForm.method = 'piece'"
                  class="p-2 rounded-lg border text-center font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  :class="editForm.method === 'piece'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800'"
                >
                  <Layers class="w-3.5 h-3.5" />
                  <span>Borongan (Pcs)</span>
                </button>
                <button
                  type="button"
                  @click="editForm.method = 'hourly'"
                  class="p-2 rounded-lg border text-center font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  :class="editForm.method === 'hourly'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800'"
                >
                  <Clock class="w-3.5 h-3.5" />
                  <span>Per Jam (Jam)</span>
                </button>
              </div>
            </div>

            <!-- Custom Rate Override -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-slate-400">
                Tarif Kustom Khusus (Kosongkan jika mengikuti tarif standar):
              </label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-slate-500 font-bold">Rp</span>
                <input
                  v-if="editForm.method === 'piece'"
                  type="number"
                  v-model.number="editForm.customPieceRate"
                  class="w-full h-8 pl-10 pr-12 rounded bg-slate-950 border border-slate-700 text-slate-100 font-bold focus:border-teal-400 focus:outline-none"
                  :placeholder="`Standar: ${salaryStore.getEffectivePieceRate(editingRow.worker.id, editingRow.worker.role)}`"
                />
                <input
                  v-else
                  type="number"
                  v-model.number="editForm.customHourlyRate"
                  class="w-full h-8 pl-10 pr-12 rounded bg-slate-950 border border-slate-700 text-slate-100 font-bold focus:border-teal-400 focus:outline-none"
                  :placeholder="`Standar: ${salaryStore.ratesConfig.defaultHourlyRate}`"
                />
                <span class="absolute right-3 top-2 text-slate-500 text-[10px]">/{{ editForm.method === 'piece' ? 'pcs' : 'jam' }}</span>
              </div>
            </div>

            <!-- Catatan Khusus -->
            <div class="space-y-1">
              <label class="block text-[11px] font-bold text-slate-400">Catatan Khusus Slip:</label>
              <input
                type="text"
                v-model="editForm.notes"
                class="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-teal-400 focus:outline-none"
                placeholder="Contoh: Tambahan lembur / penyesuaian khusus"
              />
            </div>
          </div>

          <div class="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              @click="showEditWorkerModal = false"
              class="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              @click="saveWorkerSalaryConfig"
              class="px-4 py-1.5 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Check class="w-3.5 h-3.5 stroke-[3]" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── MODAL 3: CETAK SLIP GAJI KARYAWAN (PRINTABLE PAYSLIP) ── -->
    <Teleport to="body">
      <div
        v-if="showSlipModal && selectedSlipRow"
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm font-mono overflow-y-auto"
        @click.self="showSlipModal = false"
      >
        <div class="bg-white text-slate-900 border border-slate-300 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl print:shadow-none print:border-none print:m-0 print:p-4">
          <!-- Payslip Header -->
          <div class="flex items-center justify-between border-b-2 border-slate-800 pb-3">
            <div>
              <h2 class="text-base font-black uppercase tracking-wider text-slate-900">SLIP GAJI KARYAWAN</h2>
              <p class="text-[11px] text-slate-600 font-semibold">PT. EARFLOW PRODUCTION SYSTEM</p>
            </div>
            <div class="text-right font-mono">
              <span class="text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                Periode: {{ formatMonthLabel(selectedMonth) }}
              </span>
            </div>
          </div>

          <!-- Employee Info Details -->
          <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs py-1 border-b border-slate-200">
            <div>
              <span class="text-slate-500 text-[10px] block">NAMA KARYAWAN</span>
              <span class="font-bold text-slate-900 text-sm">{{ selectedSlipRow.worker.full_name }}</span>
            </div>
            <div>
              <span class="text-slate-500 text-[10px] block">NIK / NO. KARYAWAN</span>
              <span class="font-bold text-slate-900">{{ selectedSlipRow.worker.no_karyawan || '-' }}</span>
            </div>
            <div class="mt-1">
              <span class="text-slate-500 text-[10px] block">ROLE / POSISI</span>
              <span class="font-semibold text-slate-200">{{ selectedSlipRow.worker.role || 'Operator' }}</span>
            </div>
            <div class="mt-1">
              <span class="text-slate-500 text-[10px] block">METODE PENGGAJIAN</span>
              <span class="font-bold uppercase" :class="selectedSlipRow.salary.method === 'piece' ? 'text-amber-700' : 'text-cyan-700'">
                {{ selectedSlipRow.salary.method === 'piece' ? 'Borongan (Hasil Pcs)' : 'Gaji Per Jam (Jam Kerja)' }}
              </span>
            </div>
          </div>

          <!-- Calculation Breakdown -->
          <div class="space-y-2 text-xs">
            <h4 class="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Rincian Perhitungan Upah:</h4>
            
            <div class="space-y-1.5 bg-slate-50 p-3 rounded border border-slate-200">
              <div class="flex justify-between items-center text-slate-700">
                <span v-if="selectedSlipRow.salary.method === 'piece'">
                  Hasil Produksi ({{ selectedSlipRow.totalProdQty.toLocaleString('id-ID') }} Pcs × Rp {{ formatRupiah(selectedSlipRow.salary.rateUsed) }})
                </span>
                <span v-else>
                  Jam Kerja Hadir ({{ selectedSlipRow.totalWorkHours }} Jam • {{ selectedSlipRow.attendanceDays }} Hari × Rp {{ formatRupiah(selectedSlipRow.salary.rateUsed) }})
                </span>
                <span class="font-bold text-slate-900">Rp {{ formatRupiah(selectedSlipRow.salary.grossAmount) }}</span>
              </div>
            </div>

            <!-- Total Net Amount -->
            <div class="flex justify-between items-center bg-slate-900 text-white p-3 rounded font-bold">
              <span class="text-xs uppercase tracking-wider">TOTAL GAJI DITERIMA (TAKE HOME PAY)</span>
              <span class="text-base text-emerald-400 font-black">
                Rp {{ formatRupiah(selectedSlipRow.salary.netAmount) }}
              </span>
            </div>

            <p v-if="selectedSlipRow.salary.notes" class="text-[10px] text-slate-500 italic pt-1">
              Catatan: {{ selectedSlipRow.salary.notes }}
            </p>
          </div>

          <!-- Signature Footer -->
          <div class="grid grid-cols-2 gap-4 text-center text-xs pt-6 text-slate-700">
            <div>
              <p class="text-[10px] text-slate-500">Penerima,</p>
              <div class="h-12"></div>
              <p class="font-bold underline">{{ selectedSlipRow.worker.full_name }}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500">Manajer / Mandor,</p>
              <div class="h-12"></div>
              <p class="font-bold underline">M. Alfarizd</p>
            </div>
          </div>

          <!-- Print / Action Buttons -->
          <div class="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 print:hidden">
            <button
              type="button"
              @click="showSlipModal = false"
              class="px-3.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              @click="triggerPrintWindow"
              class="px-4 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer class="w-3.5 h-3.5" />
              <span>Cetak Slip</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── MODAL 4: CETAK LEMBAR REKAP PENGGAJIAN LENGKAP (A4) ── -->
    <Teleport to="body">
      <div
        v-if="showFullPayrollPrintModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm font-mono overflow-y-auto"
        @click.self="showFullPayrollPrintModal = false"
      >
        <div class="bg-white text-slate-900 border border-slate-300 rounded-lg max-w-4xl w-full p-6 space-y-4 shadow-2xl print:shadow-none print:border-none print:m-0 print:p-4">
          <div class="flex items-center justify-between border-b-2 border-slate-900 pb-3">
            <div>
              <h2 class="text-lg font-black uppercase text-slate-900">REKAPITULASI PENGGAJIAN KARYAWAN</h2>
              <p class="text-xs text-slate-600">PT. EARFLOW PRODUCTION SYSTEM • PERIODE: {{ formatMonthLabel(selectedMonth) }}</p>
            </div>
            <div class="text-right text-xs font-bold">
              <p>Total Pengeluaran: <span class="text-emerald-700 text-sm">Rp {{ formatRupiah(summaryStats.totalNetSalary) }}</span></p>
              <p class="text-[10px] text-slate-500">{{ filteredRows.length }} Orang Karyawan</p>
            </div>
          </div>

          <!-- Printable Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-[10px] border-collapse border border-slate-300">
              <thead class="bg-slate-100 text-slate-700 border-b border-slate-300">
                <tr>
                  <th class="p-1.5 border border-slate-300 text-center">No</th>
                  <th class="p-1.5 border border-slate-300">Nama Karyawan</th>
                  <th class="p-1.5 border border-slate-300">Role</th>
                  <th class="p-1.5 border border-slate-300 text-center">Hadir</th>
                  <th class="p-1.5 border border-slate-300 text-center">Total Jam</th>
                  <th class="p-1.5 border border-slate-300 text-center">Hasil (Pcs)</th>
                  <th class="p-1.5 border border-slate-300 text-center">Metode</th>
                  <th class="p-1.5 border border-slate-300 text-right">Tarif Satuan</th>
                  <th class="p-1.5 border border-slate-300 text-right font-bold">Total Gaji</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in filteredRows" :key="r.worker.id" class="border-b border-slate-200">
                  <td class="p-1.5 border border-slate-300 text-center">{{ i + 1 }}</td>
                  <td class="p-1.5 border border-slate-300 font-bold">{{ r.worker.full_name }}</td>
                  <td class="p-1.5 border border-slate-300">{{ r.worker.role }}</td>
                  <td class="p-1.5 border border-slate-300 text-center">{{ r.attendanceDays }} Hari</td>
                  <td class="p-1.5 border border-slate-300 text-center">{{ r.totalWorkHours }} Jam</td>
                  <td class="p-1.5 border border-slate-300 text-center">{{ r.totalProdQty.toLocaleString('id-ID') }}</td>
                  <td class="p-1.5 border border-slate-300 text-center font-semibold">
                    {{ r.salary.method === 'piece' ? 'Borongan' : 'Per Jam' }}
                  </td>
                  <td class="p-1.5 border border-slate-300 text-right">
                    Rp {{ formatRupiah(r.salary.rateUsed) }}{{ r.salary.method === 'piece' ? '/pcs' : '/jam' }}
                  </td>
                  <td class="p-1.5 border border-slate-300 text-right font-black text-slate-900">
                    Rp {{ formatRupiah(r.salary.netAmount) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 print:hidden">
            <button
              type="button"
              @click="showFullPayrollPrintModal = false"
              class="px-3.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              @click="triggerPrintWindow"
              class="px-4 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer class="w-3.5 h-3.5" />
              <span>Cetak Rekap A4</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import {
  Search,
  X,
  Sliders,
  Printer,
  FileSpreadsheet,
  Layers,
  Calendar,
  Clock,
  UserCheck,
  Pencil,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'
import CustomSelect from '@/components/CustomSelect.vue'
import { useTeamStore } from '@/stores/teamStore'
import { useProductionStore, getLocalDateStr } from '@/stores/productionStore'
import { useOverrideStore } from '@/stores/overrideStore'
import { useSalaryStore, type SalaryMethod } from '@/stores/salaryStore'
import { useHeaderMenuStore } from '@/stores/headerMenuStore'

const teamStore = useTeamStore()
const productionStore = useProductionStore()
const overrideStore = useOverrideStore()
const salaryStore = useSalaryStore()
const headerMenuStore = useHeaderMenuStore()

const searchQuery = ref('')
const selectedTeamId = ref('')
const methodFilter = ref<'all' | 'piece' | 'hourly'>('all')
const selectedMonth = ref(getLocalDateStr().slice(0, 7)) // e.g. "2026-09"

function changeMonth(delta: number) {
  if (!selectedMonth.value) {
    selectedMonth.value = getLocalDateStr().slice(0, 7)
    return
  }
  const [y, m] = selectedMonth.value.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  const nextY = d.getFullYear()
  const nextM = String(d.getMonth() + 1).padStart(2, '0')
  selectedMonth.value = `${nextY}-${nextM}`
}

function setCurrentMonth() {
  selectedMonth.value = getLocalDateStr().slice(0, 7)
}

function resetFilters() {
  selectedTeamId.value = ''
  methodFilter.value = 'all'
  selectedMonth.value = getLocalDateStr().slice(0, 7)
}

onMounted(async () => {
  await Promise.all([
    teamStore.loadTeams(),
    productionStore.loadLogs(),
    overrideStore.loadFromStorage()
  ])
})

onUnmounted(() => {
  headerMenuStore.close()
})

const teamFilterOptions = computed(() => {
  return [
    { label: 'Semua Tim / Line', value: '' },
    ...teamStore.teams.map(t => ({ label: t.name, value: t.id }))
  ]
})



function formatRupiah(val: number): string {
  return (Math.round(val) || 0).toLocaleString('id-ID')
}

function formatMonthLabel(monthStr: string): string {
  if (!monthStr) return ''
  const [y, m] = monthStr.split('-')
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const monthName = months[parseInt(m, 10) - 1] || m
  return `${monthName} ${y}`
}

function parseWorkHoursString(val: any): number {
  if (val == null) return 7
  const str = String(val).trim()
  if (!str || str === '-') return 7

  // Check if contains explicit "(Xh)" or "(X jam)" e.g. "06 - 13 (6h)"
  const parenMatch = str.match(/\((\d+(?:[.,]\d+)?)\s*(?:h|jam)?\)/i)
  if (parenMatch && parenMatch[1]) {
    const num = parseFloat(parenMatch[1].replace(',', '.'))
    if (!isNaN(num) && num > 0 && num <= 24) return num
  }

  // Check if time range like "06:00 - 13:00" or "06 - 13" or "7-14"
  const rangeMatch = str.match(/^(\d{1,2})(?::(\d{2}))?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?/)
  if (rangeMatch && rangeMatch[1] && rangeMatch[3]) {
    const startH = parseInt(rangeMatch[1], 10)
    const startM = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : 0
    let endH = parseInt(rangeMatch[3], 10)
    const endM = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : 0
    if (endH < startH) endH += 24 // overnight
    const diffHours = (endH + endM / 60) - (startH + startM / 60)
    if (diffHours > 0 && diffHours <= 24) return Math.round(diffHours * 10) / 10
  }

  // Check simple number e.g. "7" or "7.5"
  const singleNum = parseFloat(str.replace(',', '.').replace(/[^\d.]/g, ''))
  if (!isNaN(singleNum) && singleNum > 0 && singleNum <= 24) {
    return singleNum
  }

  return 7
}

// Calculate attendance days, total work hours & total production output for each worker for the selected month
const calculatedRows = computed(() => {
  const month = selectedMonth.value
  const workers = teamStore.allWorkers
  const dailyMap = overrideStore.dailyMap
  const logs = productionStore.logs

  // 1. Pre-index logs for the selected month in a single pass (O(logs))
  // workerId -> { presentDates: Set<string>, logQtyByDate: Map<string, number> }
  const workerLogData = new Map<string, { presentDates: Set<string>; logQtyByDate: Map<string, number> }>()
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i]
    if (!log.created_at || !log.created_at.startsWith(month)) continue
    if (!log.present_member_ids || log.present_member_ids.length === 0) continue

    const dateStr = log.created_at.slice(0, 10)
    const splitQty = Math.floor((log.total_qty || 0) / log.present_member_ids.length)

    for (let j = 0; j < log.present_member_ids.length; j++) {
      const memberId = log.present_member_ids[j]
      let item = workerLogData.get(memberId)
      if (!item) {
        item = { presentDates: new Set<string>(), logQtyByDate: new Map<string, number>() }
        workerLogData.set(memberId, item)
      }
      item.presentDates.add(dateStr)
      const cur = item.logQtyByDate.get(dateStr) || 0
      item.logQtyByDate.set(dateStr, cur + splitQty)
    }
  }

  // 2. Pre-index daily overrides for the selected month in a single pass (O(overrides))
  // workerId -> { presentDates: Set<string>, prodQty: number, dateHours: Map<string, number> }
  const workerOvData = new Map<string, { presentDates: Set<string>; prodQty: number; dateHours: Map<string, number> }>()
  const absentRegex = /(izin|sakit|alpha|cuti|off|absen)/i

  const overrideEntries = Object.entries(dailyMap)
  for (let i = 0; i < overrideEntries.length; i++) {
    const [key, val] = overrideEntries[i]
    if (!key.includes(month)) continue
    const underscoreIdx = key.lastIndexOf('_')
    if (underscoreIdx === -1) continue

    const workerId = key.slice(0, underscoreIdx)
    const dateStr = key.slice(underscoreIdx + 1)
    if (!dateStr.startsWith(month)) continue

    let wData = workerOvData.get(workerId)
    if (!wData) {
      wData = { presentDates: new Set<string>(), prodQty: 0, dateHours: new Map<string, number>() }
      workerOvData.set(workerId, wData)
    }

    const isAbsent = val.remark && absentRegex.test(val.remark)
    if (!isAbsent) {
      wData.presentDates.add(dateStr)
    }
    if (val.prodQty && val.prodQty > 0) {
      wData.prodQty += Number(val.prodQty)
    }
    if (val.workHours) {
      const parsed = parseWorkHoursString(val.workHours)
      wData.dateHours.set(dateStr, parsed)
    }
  }

  // 3. Filter eligible workers for the selected month
  const eligibleWorkers = workers.filter(w => {
    const isOut = (w.status || '').toLowerCase().includes('keluar') || (w.status || '').toLowerCase().includes('out')
    const hasActivity = workerLogData.has(w.id) || (workerOvData.get(w.id)?.presentDates.size || 0) > 0 || (workerOvData.get(w.id)?.prodQty || 0) > 0
    if (hasActivity) return true

    if (isOut) {
      if (w.exit_date && month > w.exit_date) return false
    }
    const isFuture = !!(w.joined_date && w.joined_date.slice(0, 7) > month)
    if (isFuture) return false
    return true
  })

  // 4. Map eligible workers with instant O(1) lookups
  return eligibleWorkers.map(worker => {
    const ov = workerOvData.get(worker.id)
    const lg = workerLogData.get(worker.id)

    const allPresentDates = new Set<string>()
    if (ov) {
      for (const d of ov.presentDates) allPresentDates.add(d)
    }
    if (lg) {
      for (const d of lg.presentDates) allPresentDates.add(d)
    }

    let totalProdQty = ov ? ov.prodQty : 0
    if (lg) {
      for (const [d, splitQty] of lg.logQtyByDate.entries()) {
        const hasDailyOvProd = dailyMap[`${worker.id}_${d}`]?.prodQty
        if (!hasDailyOvProd) {
          totalProdQty += splitQty
        }
      }
    }

    let totalWorkHours = 0
    for (const d of allPresentDates) {
      const customHours = ov?.dateHours.get(d)
      totalWorkHours += (customHours != null ? customHours : 7)
    }

    const attendanceDays = allPresentDates.size

    const config = salaryStore.getWorkerConfig(worker.id)
    const salary = salaryStore.calculateSalary({
      workerId: worker.id,
      role: worker.role,
      attendanceDays,
      totalWorkHours,
      totalProdQty
    })

    const hasCustomRate = (config.customHourlyRate != null && config.customHourlyRate > 0) ||
      (config.customPieceRate != null && config.customPieceRate > 0)

    return {
      worker,
      attendanceDays,
      totalWorkHours,
      totalProdQty,
      salary,
      hasCustomRate
    }
  })
})

const filteredRows = computed(() => {
  return calculatedRows.value.filter(row => {
    // Search filter
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchName = row.worker.full_name?.toLowerCase().includes(q)
      const matchNik = row.worker.no_karyawan?.toLowerCase().includes(q)
      const matchRole = row.worker.role?.toLowerCase().includes(q)
      if (!matchName && !matchNik && !matchRole) return false
    }

    // Team filter
    if (selectedTeamId.value && row.worker.team_id !== selectedTeamId.value) {
      return false
    }

    // Method filter
    if (methodFilter.value !== 'all' && row.salary.method !== methodFilter.value) {
      return false
    }

    return true
  })
})

const pieceWorkersCount = computed(() => {
  return calculatedRows.value.filter(r => r.salary.method === 'piece').length
})

const hourlyWorkersCount = computed(() => {
  return calculatedRows.value.filter(r => r.salary.method === 'hourly').length
})

const summaryStats = computed(() => {
  let totalNetSalary = 0
  let totalPieceSalary = 0
  let totalHourlySalary = 0
  let totalPieceQty = 0
  let totalHourlyHours = 0

  for (const r of filteredRows.value) {
    totalNetSalary += r.salary.netAmount
    if (r.salary.method === 'piece') {
      totalPieceSalary += r.salary.netAmount
      totalPieceQty += r.totalProdQty
    } else {
      totalHourlySalary += r.salary.netAmount
      totalHourlyHours += r.totalWorkHours
    }
  }

  const avgSalary = filteredRows.value.length > 0 ? Math.round(totalNetSalary / filteredRows.value.length) : 0

  return {
    totalNetSalary,
    totalPieceSalary,
    totalHourlySalary,
    totalPieceQty,
    totalHourlyHours,
    avgSalary
  }
})

// ── Rate Config Modal ──
const showRateConfigModal = ref(false)
const tempRates = reactive({
  defaultHourlyRate: salaryStore.ratesConfig.defaultHourlyRate || 12000,
  defaultPieceRate: salaryStore.ratesConfig.defaultPieceRate || 150,
  rolePieceRates: { ...salaryStore.ratesConfig.rolePieceRates }
})

function saveGlobalRates() {
  salaryStore.updateGlobalRates({
    defaultHourlyRate: tempRates.defaultHourlyRate,
    defaultPieceRate: tempRates.defaultPieceRate,
    rolePieceRates: { ...tempRates.rolePieceRates }
  })
  showRateConfigModal.value = false
}

// ── Edit Worker Salary Details Modal ──
const showEditWorkerModal = ref(false)
const editingRow = ref<any>(null)
const editForm = reactive({
  method: 'piece' as SalaryMethod,
  customHourlyRate: null as number | null,
  customPieceRate: null as number | null,
  allowance: 0,
  bonus: 0,
  deduction: 0,
  notes: ''
})

function openEditModal(row: any) {
  editingRow.value = row
  const config = salaryStore.getWorkerConfig(row.worker.id)
  editForm.method = config.method === 'daily' ? 'hourly' : config.method
  editForm.customHourlyRate = config.customHourlyRate ?? config.customDailyRate ?? null
  editForm.customPieceRate = config.customPieceRate ?? null
  editForm.allowance = config.allowance || 0
  editForm.bonus = config.bonus || 0
  editForm.deduction = config.deduction || 0
  editForm.notes = config.notes || ''
  showEditWorkerModal.value = true
}

function saveWorkerSalaryConfig() {
  if (editingRow.value) {
    salaryStore.setWorkerConfig(editingRow.value.worker.id, {
      method: editForm.method,
      customHourlyRate: editForm.customHourlyRate,
      customPieceRate: editForm.customPieceRate,
      allowance: editForm.allowance,
      bonus: editForm.bonus,
      deduction: editForm.deduction,
      notes: editForm.notes
    })
  }
  showEditWorkerModal.value = false
}

// ── Payslip Modal ──
const showSlipModal = ref(false)
const selectedSlipRow = ref<any>(null)

function openSlipModal(row: any) {
  selectedSlipRow.value = row
  showSlipModal.value = true
}

function triggerPrintWindow() {
  window.print()
}

// ── Full Payroll Print Modal ──
const showFullPayrollPrintModal = ref(false)

// ── Excel Export ──
async function exportToExcel() {
  const monthLabel = formatMonthLabel(selectedMonth.value)
  const filename = `Rekap_Gaji_Karyawan_${selectedMonth.value}.xlsx`
  const sheetTitle = `Gaji ${monthLabel}`

  const headers = [
    'No',
    'NIK / No Karyawan',
    'Nama Karyawan',
    'Role / Line',
    'Metode Penggajian',
    'Kehadiran (Hari)',
    'Total Jam Kerja (Jam)',
    'Hasil Output (Pcs)',
    'Tarif Satuan (Rp)',
    'Total Estimasi Gaji (Rp)'
  ]

  const rows = filteredRows.value.map((r, i) => [
    i + 1,
    r.worker.no_karyawan || '-',
    r.worker.full_name || '-',
    r.worker.role || '-',
    r.salary.method === 'hourly' ? 'Per Jam' : 'Borongan',
    r.attendanceDays,
    r.totalWorkHours,
    r.totalProdQty,
    r.salary.rateUsed,
    r.salary.netAmount
  ])

  const { exportToXlsx } = await import('@/utils/excelExport')
  exportToXlsx(filename, sheetTitle, headers, rows)
}
</script>
