<template>
  <div class="space-y-3 sm:space-y-4 pb-safe">
    <!-- Unified Compact Sticky Glassmorphism Toolbar Card -->
    <div class="sticky top-14 z-30 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-2.5 sm:p-3 space-y-2.5 shadow-lg transition-all">
      <!-- Top Row: Search Input + View Switcher + Header Menu (Unified Single Row) -->
      <div class="flex items-center gap-2">
        <!-- Search Input -->
        <div class="relative flex-1 min-w-0">
          <input
            ref="searchInputRef"
            type="text"
            v-model="workerSearchQueryInput"
            @input="onSearchInput"
            :placeholder="t('teams.searchWorkerPlaceholder')"
            @focus="isSearchFocused = true"
            @click="isSearchFocused = true"
            @blur="handleSearchBlur"
            class="w-full h-9 bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-9 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-medium transition placeholder:text-slate-600"
          />
          <Search class="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
          <button
            v-if="isSearchFocused || workerSearchQueryInput"
            type="button"
            @mousedown.prevent
            @click="clearAndBlurSearch"
            class="absolute right-0 top-0 bottom-0 w-9 rounded-r-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 active:bg-slate-800 transition active:scale-95 flex items-center justify-center"
            title="Bersihkan Pencarian"
          >
            <X class="w-4 h-4 text-slate-400 hover:text-slate-200 stroke-[2.5]" />
          </button>
        </div>

        <!-- Quick Action Buttons: + Karyawan & + Tim (Visible directly on desktop toolbar) -->
        <div v-if="!isSearchFocused && !workerSearchQueryInput" class="hidden sm:flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            @click="triggerAddMasterWorker()"
            class="h-9 px-3 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-400 hover:opacity-90 active:scale-95 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition flex items-center justify-center gap-1.5 shrink-0"
            title="Tambah Karyawan Baru"
          >
            <UserPlus class="w-3.5 h-3.5 stroke-[2.5]" />
            <span class="hidden sm:inline">+ Karyawan</span>
          </button>
          <button
            type="button"
            @click="openAddTeamModal()"
            class="h-9 px-2.5 sm:px-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-teal-500/40 text-teal-300 font-bold text-xs transition flex items-center justify-center gap-1.5 shrink-0"
            title="Tambah Tim Baru"
          >
            <Plus class="w-3.5 h-3.5 text-teal-400 stroke-[2.5]" />
            <span class="hidden sm:inline">+ Tim</span>
          </button>
        </div>

        <!-- Segmented Control View Switcher (Visible on desktop toolbar) -->
        <div v-if="!isSearchFocused && !workerSearchQueryInput" class="hidden sm:flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 items-center h-9 shrink-0">
          <button
            type="button"
            @click="activeView = 'table'"
            class="px-2.5 h-full rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
            :class="activeView === 'table'
              ? 'bg-slate-800 text-teal-300 border border-teal-500/40 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'"
            title="Tampilan Tabel Karyawan"
          >
            <Users class="w-3.5 h-3.5 shrink-0" />
            <span v-if="activeView === 'table'">{{ t('teams.tabTable', { count: filteredWorkers.length }) }}</span>
          </button>

          <button
            type="button"
            @click="activeView = 'cards'"
            class="px-2.5 h-full rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
            :class="activeView === 'cards'
              ? 'bg-slate-800 text-teal-300 border border-teal-500/40 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'"
            title="Tampilan Kartu Tim"
          >
            <LayoutGrid class="w-3.5 h-3.5 shrink-0" />
            <span v-if="activeView === 'cards'">{{ t('teams.tabCards') }}</span>
          </button>
        </div>

        <!-- Header Actions & Filters Dropdown Menu (Triggered by Global Navbar 3-Dots Button) -->
        <div v-if="!isSearchFocused && !workerSearchQueryInput" class="relative shrink-0" v-click-outside="() => showHeaderMenu = false">
          <!-- Dropdown Menu (Unified Filter & Actions) -->
          <Transition
            enter-active-class="transition ease-out duration-150"
            enter-from-class="opacity-0 scale-95 translate-y-1"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-1"
          >
            <div
              v-if="showHeaderMenu"
              class="absolute right-0 top-full mt-2 w-72 sm:w-80 max-h-[calc(100vh-120px)] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl z-50 p-3.5 space-y-3 font-mono text-xs"
            >
              <!-- Mode Tampilan Switcher (Sangat berguna di Mobile) -->
              <div class="space-y-1 pb-2 border-b border-slate-800">
                <label class="block text-[10px] text-slate-400 font-semibold">Tampilan Utama</label>
                <div class="flex items-center p-1 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-bold">
                  <button
                    type="button"
                    @click="activeView = 'table'"
                    class="flex-1 py-1.5 px-2 rounded-md transition flex items-center justify-center gap-1.5"
                    :class="activeView === 'table'
                      ? 'bg-slate-800 text-teal-300 border border-teal-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'"
                  >
                    <Users class="w-3.5 h-3.5 shrink-0" />
                    <span>Tabel Karyawan</span>
                  </button>
                  <button
                    type="button"
                    @click="activeView = 'cards'"
                    class="flex-1 py-1.5 px-2 rounded-md transition flex items-center justify-center gap-1.5"
                    :class="activeView === 'cards'
                      ? 'bg-slate-800 text-teal-300 border border-teal-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'"
                  >
                    <LayoutGrid class="w-3.5 h-3.5 shrink-0" />
                    <span>Kartu Tim</span>
                  </button>
                </div>
              </div>

              <!-- Tab Navigation Switcher -->
              <div class="flex items-center p-1 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  @click="menuTab = 'filters'"
                  class="flex-1 py-1.5 px-2 rounded-md transition flex items-center justify-center gap-1.5"
                  :class="menuTab === 'filters'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'"
                >
                  <Filter class="w-3.5 h-3.5" />
                  <span>Filter & Urutkan</span>
                </button>
                <button
                  type="button"
                  @click="menuTab = 'actions'"
                  class="flex-1 py-1.5 px-2 rounded-md transition flex items-center justify-center gap-1.5"
                  :class="menuTab === 'actions'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'"
                >
                  <SlidersHorizontal class="w-3.5 h-3.5" />
                  <span>Aksi & Laporan</span>
                </button>
              </div>

              <!-- TAB 1: Filter & Konfigurasi -->
              <div v-if="menuTab === 'filters'" class="space-y-2.5">
                <div class="flex items-center justify-between px-1 text-[10px] text-slate-400 font-semibold">
                  <span>Parameter Filter:</span>
                  <button
                    v-if="shiftFilter || workerTeamFilter || workerShiftFilter || workerNoFilter"
                    type="button"
                    @click="shiftFilter = ''; workerTeamFilter = ''; workerShiftFilter = ''; workerNoFilter = ''"
                    class="text-[10px] text-teal-400 hover:underline font-bold"
                  >
                    Reset Filter
                  </button>
                </div>

                <!-- Shift Filter Chips (Cards View) -->
                <div v-if="activeView === 'cards'" class="space-y-1.5">
                  <label class="block text-[10px] text-slate-400 font-semibold">Filter Shift Tim</label>
                  <div class="flex flex-wrap gap-1">
                    <button
                      type="button"
                      @click="shiftFilter = ''"
                      class="h-6 px-2.5 rounded-md text-[10px] font-bold border transition shrink-0"
                      :class="shiftFilter === ''
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
                    >
                      Semua Shift
                    </button>
                    <button
                      v-for="shiftOpt in uniqueShifts"
                      :key="shiftOpt"
                      type="button"
                      @click="shiftFilter = shiftOpt"
                      class="h-6 px-2.5 rounded-md text-[10px] font-bold border transition shrink-0 truncate max-w-[180px]"
                      :class="shiftFilter === shiftOpt
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
                    >
                      {{ shiftOpt }}
                    </button>
                  </div>
                </div>

                <!-- Table View Filters -->
                <div v-if="activeView === 'table'" class="space-y-2.5">
                  <!-- Filter Cepat Karyawan -->
                  <div class="space-y-1">
                    <label class="block text-[10px] text-slate-400 font-semibold">Filter Cepat Status</label>
                    <div class="flex flex-wrap gap-1">
                      <button
                        type="button"
                        @click="workerTeamFilter = ''; workerShiftFilter = ''; workerNoFilter = ''"
                        class="px-2 py-1 rounded-md text-[10px] font-bold border transition shrink-0"
                        :class="!workerTeamFilter && !workerShiftFilter && !workerNoFilter ? 'bg-teal-500/20 text-teal-300 border-teal-500/50' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
                      >
                        Semua ({{ teamStore.allWorkers.length }})
                      </button>
                      <button
                        type="button"
                        @click="workerTeamFilter = UNASSIGNED_TEAM_ID; workerShiftFilter = ''; workerNoFilter = ''"
                        class="px-2 py-1 rounded-md text-[10px] font-bold border transition shrink-0"
                        :class="workerTeamFilter === UNASSIGNED_TEAM_ID ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
                      >
                        Belum Tim ({{ teamStore.unassignedMembers.length }})
                      </button>
                      <button
                        type="button"
                        @click="workerTeamFilter = ''; workerShiftFilter = ''; workerNoFilter = workerNoFilter === 'empty' ? '' : 'empty'"
                        class="px-2 py-1 rounded-md text-[10px] font-bold border transition shrink-0 flex items-center gap-1"
                        :class="workerNoFilter === 'empty' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
                      >
                        <span>Tanpa NIK</span>
                        <span class="px-1 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 font-extrabold">{{ noNikCount }}</span>
                      </button>
                    </div>
                  </div>

                  <div class="space-y-1">
                    <label class="block text-[10px] text-slate-400 font-semibold">Periode Bulan</label>
                    <input
                      type="month"
                      v-model="selectedMonthFilter"
                      class="w-full h-9 bg-slate-950 border border-slate-800 rounded-md px-3 text-xs text-teal-300 font-mono focus:outline-none focus:border-teal-500 font-bold cursor-pointer transition"
                    />
                  </div>

                  <div class="space-y-1">
                    <label class="block text-[10px] text-slate-400 font-semibold">Tim Penugasan</label>
                    <CustomCombobox
                      v-model="workerTeamFilter"
                      :options="teamFilterOptions"
                      :placeholder="t('teams.filterTeamPlaceholder')"
                      @add-option="handleAddTeamFromCombobox"
                      @edit-option="handleEditTeamFromCombobox"
                      @delete-option="handleDeleteTeamFromCombobox"
                    />
                  </div>

                  <div class="space-y-1">
                    <label class="block text-[10px] text-slate-400 font-semibold">Shift Karyawan</label>
                    <CustomSelect
                      v-model="workerShiftFilter"
                      :options="workerShiftFilterOptions"
                      placeholder="Semua Shift Karyawan..."
                    />
                  </div>

                  <div class="space-y-1">
                    <label class="block text-[10px] text-slate-400 font-semibold">Urutkan Data</label>
                    <CustomSelect
                      v-model="workerSortBy"
                      :options="workerSortOptions"
                      :placeholder="t('teams.sortByPlaceholder')"
                    />
                  </div>
                </div>
              </div>

              <!-- TAB 2: Menu Aksi & Laporan -->
              <div v-if="menuTab === 'actions'" class="space-y-2.5">
                <!-- Sub 1: Kelola Data -->
                <div class="space-y-1.5">
                  <div class="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-0.5">Kelola Data</div>
                  <div class="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      @click="openAddTeamModal(); showHeaderMenu = false"
                      class="h-8 px-2 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold flex items-center justify-center gap-1.5 transition text-[11px]"
                    >
                      <Plus class="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>Tambah Tim</span>
                    </button>
                    <button
                      type="button"
                      @click="openAddMasterWorkerModal(); showHeaderMenu = false"
                      class="h-8 px-2 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold flex items-center justify-center gap-1.5 transition text-[11px]"
                    >
                      <UserPlus class="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>Tambah Pekerja</span>
                    </button>
                  </div>
                </div>

                <!-- Sub 2: Laporan & Export -->
                <div class="space-y-1.5 pt-1.5 border-t border-slate-800/80">
                  <div class="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-0.5">Laporan & Ekspor</div>
                  <button
                    type="button"
                    @click="showMandorReportModal = true; showHeaderMenu = false"
                    class="w-full h-8 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-2 transition text-xs"
                  >
                    <ClipboardList class="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{{ t('dashboard.mandorSheet') }}</span>
                  </button>
                  <button
                    type="button"
                    @click="showMonthlyRecapModal = true; showHeaderMenu = false"
                    class="w-full h-8 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-2 transition text-xs"
                  >
                    <Table class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{{ t('dashboard.monthlyRecapSheet') }}</span>
                  </button>
                  <button
                    type="button"
                    @click="exportWorkerTableToExcel(); showHeaderMenu = false"
                    class="w-full h-8 px-2.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold flex items-center gap-2 transition text-xs"
                  >
                    <FileSpreadsheet class="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Export Excel Karyawan</span>
                  </button>
                </div>

                <!-- Sub 3: Zona Berbahaya -->
                <div class="pt-1.5 border-t border-rose-900/40">
                  <button
                    v-if="teamStore.teams.length > 0"
                    type="button"
                    @click="triggerDeleteAllTeams(); showHeaderMenu = false"
                    class="w-full h-7 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold flex items-center justify-center gap-1.5 transition text-[11px]"
                  >
                    <Trash2 class="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Hapus Semua Tim ({{ teamStore.teams.length }})</span>
                  </button>
                </div>
              </div>
            </div>
          </Transition>
      </div>
    </div>

      <!-- Bottom Row: Status Pill & Summary (Table View) -->
      <div v-if="activeView === 'table'" class="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2.5">
        <div class="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span v-if="workerTeamFilter || workerShiftFilter" class="text-teal-400 font-bold text-[11px]">
            Filter Aktif: {{ workerTeamFilter ? 'Tim' : '' }} {{ workerShiftFilter ? 'Shift' : '' }}
          </span>
          <span v-else class="text-slate-500 text-[11px]">Semua Data Karyawan</span>
        </div>

        <div class="flex items-center justify-end shrink-0">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 font-mono text-xs font-bold shadow-xs">
            <span>{{ t('teams.totalWorkersLabel') }}</span>
            <span class="font-extrabold text-teal-400 bg-teal-500/20 px-2 py-0.5 rounded text-[11px]">{{ filteredWorkers.length }}</span>
          </span>
        </div>
      </div>
    </div>



    <!-- VIEW 1: TEAM CARDS GRID -->
    <div v-if="activeView === 'cards'">
      <div v-if="teamStore.teams.length === 0" class="flex flex-col items-center justify-center p-8 text-center bg-slate-900/60 border border-slate-800/80 rounded-md py-12 space-y-3">
        <div class="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400">
          <LayoutGrid class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-slate-100 font-mono">{{ t('teams.noTeamsTitle') }}</h3>
          <p class="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {{ t('teams.noTeamsSub') }}
          </p>
        </div>
        <button
          @click="openAddTeamModal()"
          class="h-9 px-4 rounded bg-slate-900 border border-teal-500/40 text-teal-300 font-bold text-xs shadow-sm hover:opacity-90 transition"
        >
          {{ t('teams.addFirstTeam') }}
        </button>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Empty state for shift filter -->
        <div
          v-if="filteredTeams.length === 0"
          class="col-span-full flex flex-col items-center justify-center p-8 text-center bg-slate-900/60 border border-slate-800/80 rounded-md py-10 space-y-2"
        >
          <Search class="w-8 h-8 text-slate-600" />
          <p class="text-xs text-slate-400">{{ t('teams.noTeamsForShift', { shift: shiftFilter }) }}</p>
        </div>

        <div
          v-for="team in filteredTeams"
          :key="team.id"
          @click="openEditTeamModal(team)"
          class="bg-slate-900/60 border border-slate-800/80 hover:border-teal-500/50 rounded-md p-4 flex flex-col justify-between transition cursor-pointer group shadow-sm hover:shadow-teal-500/5"
        >
          <div>
            <!-- Team Card Header (With Edit & Delete Team Actions) -->
            <div class="flex items-start justify-between border-b border-slate-800/80 pb-3 mb-3">
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono">
                    {{ getTeamDisplayShift(team) }}
                  </span>
                </div>

                <h3 class="text-base font-bold text-slate-100 font-mono mt-1 group-hover:text-teal-300 transition">
                  {{ team.name }}
                </h3>
              </div>

              <div class="text-right">
                <span class="text-[11px] text-slate-400 block font-mono">{{ t('teams.todayTarget') }}</span>
                <span class="text-sm font-extrabold font-mono text-teal-400">
                  {{ getTeamDailyTarget(team.hourly_target) }} Pcs
                </span>
                <span class="text-[10px] text-slate-500 block font-mono">
                  {{ t('teams.perHourRate', { rate: Math.round(team.hourly_target / 6) }) }}
                </span>
              </div>
            </div>

            <!-- Real-time Production Output Progress Bar -->
            <div class="mb-3 p-2.5 rounded-md bg-slate-950/80 border border-slate-800/80 space-y-1.5 group-hover:border-teal-500/30 transition">
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Package class="w-3.5 h-3.5 text-teal-400" />
                  <span>{{ t('teams.achievedOutputToday') }}</span>
                </span>
                <span class="font-extrabold text-teal-300">
                  {{ getTeamAchievedOutput(team.id) }} <span class="text-slate-400 font-normal">/ {{ getTeamDailyTarget(team.hourly_target) }} Pcs</span>
                </span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  class="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  :style="{ width: `${Math.min(100, Math.round((getTeamAchievedOutput(team.id) / (getTeamDailyTarget(team.hourly_target) || 1)) * 100))}%` }"
                ></div>
              </div>
            </div>

            <!-- Team Members List -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <span>{{ t('teams.membersCountLabel', { count: team.members.length }) }}</span>
                <span class="text-[11px] font-mono text-slate-500">{{ t('teams.shiftMembers') }}</span>
              </div>

              <div v-if="team.members.length === 0" class="text-center py-5 text-slate-500 text-xs bg-slate-950/40 rounded-md border border-slate-800/40">
                {{ t('teams.noWorkersInTeam') }}
              </div>

              <div
                v-for="member in team.members"
                :key="member.id"
                class="p-2.5 rounded-md bg-slate-950/60 border border-slate-800/80 flex items-center justify-between group/member hover:border-slate-700 transition"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <img
                    :src="member.avatar_url"
                    :alt="member.full_name"
                    loading="lazy"
                    class="w-8 h-8 rounded-md bg-slate-800 object-cover border border-slate-700 shrink-0"
                  />
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <p class="font-bold text-slate-200 truncate">{{ member.full_name }}</p>
                      <span class="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 shrink-0">
                        {{ getWorkerSplitOutput(team) }} Pcs
                      </span>
                    </div>
                    <p class="text-[10px] text-slate-500 capitalize truncate">{{ formatRole(member.role) }}</p>
                  </div>
                </div>

                <!-- Member Action Buttons -->
                <div class="flex items-center gap-1 opacity-80 group-hover/member:opacity-100 transition shrink-0 ml-2">
                  <button
                    type="button"
                    @click.stop="openWorkerReport(member, team)"
                    title="Lihat & Cetak Tabel Statistik Produksi"
                    class="p-1.5 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 transition border border-teal-500/30"
                  >
                    <Printer class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Interactive Team Card Footer -->
          <div class="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold gap-2.5">
            <button
              type="button"
              @click.stop="confirmResetTeamOutput(team)"
              class="h-8 px-2.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-500 text-[11px] font-bold transition inline-flex items-center gap-1.5 border border-rose-500/20 shrink-0"
              title="Reset hasil hari ini menjadi 0 Pcs"
            >
              <RotateCcw class="w-3 h-3 text-rose-500" />
              <span>{{ t('teams.resetOutputBtn') }}</span>
            </button>
            
            <button
              type="button"
              @click.stop="openEditTeamModal(team)"
              class="h-8 px-3 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-[11px] font-bold transition inline-flex items-center gap-1.5 border border-teal-500/30 flex-1 justify-center"
            >
              <Pencil class="w-3 h-3 text-teal-400" />
              <span>{{ t('teams.editInputOutputBtn') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW 2: MASTER TABLE KARYAWAN KESELURUHAN -->
    <div v-else class="space-y-3">
      <!-- Quick Filter Chips Bar (Visible on desktop view, accessible via 3-dots menu on mobile) -->
      <div class="hidden sm:flex flex-wrap items-center justify-between gap-2 py-1 font-mono text-xs">
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span class="text-[10px] text-slate-400 font-bold uppercase shrink-0 mr-1 hidden sm:inline">Filter Cepat:</span>
          <button
            type="button"
            @click="workerTeamFilter = ''; workerShiftFilter = ''; workerNoFilter = ''"
            class="px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 border transition"
            :class="!workerTeamFilter && !workerShiftFilter && !workerNoFilter ? 'bg-teal-500/20 text-teal-300 border-teal-500/50' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'"
          >
            Semua ({{ teamStore.allWorkers.length }})
          </button>
          <button
            type="button"
            @click="workerTeamFilter = UNASSIGNED_TEAM_ID; workerShiftFilter = ''; workerNoFilter = ''"
            class="px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 border transition"
            :class="workerTeamFilter === UNASSIGNED_TEAM_ID ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'"
          >
            Belum Tim ({{ teamStore.unassignedMembers.length }})
          </button>
          <button
            type="button"
            @click="workerTeamFilter = ''; workerShiftFilter = ''; workerNoFilter = workerNoFilter === 'empty' ? '' : 'empty'"
            class="px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 border transition flex items-center gap-1"
            :class="workerNoFilter === 'empty' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'"
          >
            <span>Tanpa NIK</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-extrabold">{{ noNikCount }}</span>
          </button>
          <button
            v-for="s in shiftStore.shifts"
            :key="s.id"
            type="button"
            @click="workerShiftFilter = s.name; workerNoFilter = ''"
            class="px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 border transition"
            :class="workerShiftFilter === s.name ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'"
          >
            {{ s.name }}
          </button>
        </div>

        <!-- Month Selector Control Widget (Visible on Page) -->
        <div class="flex items-center gap-1.5 shrink-0 ml-auto bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 shadow-xs">
          <Calendar class="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span class="text-[10px] text-slate-400 font-bold uppercase shrink-0 hidden sm:inline">Bulan:</span>
          <input
            type="month"
            v-model="selectedMonthFilter"
            class="bg-slate-950 border border-slate-800 rounded-md px-2 py-0.5 text-xs text-teal-300 font-mono font-bold focus:outline-none focus:border-teal-500 cursor-pointer"
          />
        </div>
      </div>

      <!-- Bulk Action Floating Bar (Fixed Sticky at Bottom) -->
      <Teleport to="body">
        <div
          v-if="selectedWorkerIds.length > 0"
          class="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 z-50 bulk-action-bar p-2.5 sm:p-3 rounded-2xl shadow-2xl font-mono text-xs transition-all flex flex-col sm:flex-row items-center justify-between gap-2.5"
        >
          <!-- Left: Count Badge -->
          <div class="h-9 px-3 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-800 dark:text-teal-400 border border-teal-300 dark:border-teal-500/30 flex items-center justify-between sm:justify-start gap-2 font-bold shrink-0 w-full sm:w-auto">
            <div class="flex items-center gap-2">
              <Check class="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>{{ selectedWorkerIds.length }} Terpilih</span>
            </div>
            <button
              @click="selectedWorkerIds = []"
              class="sm:hidden w-6 h-6 rounded-lg bg-teal-200/60 dark:bg-slate-800 text-teal-900 dark:text-slate-300 hover:bg-teal-200 flex items-center justify-center active:scale-95"
              title="Batal Pilihan"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Right: Dropdowns & Action Buttons -->
          <div class="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <!-- Bulk Shift -->
            <CustomBulkSelect
              placeholder="Pindah Shift..."
              :options="bulkShiftOptions"
              @select="(val) => bulkAssignShift(String(val))"
            />

            <!-- Bulk Team -->
            <CustomBulkSelect
              placeholder="Pindah Tim..."
              :options="bulkTeamOptions"
              @select="(val) => bulkAssignTeam(String(val))"
            />

            <!-- Bulk Status -->
            <CustomBulkSelect
              placeholder="Ubah Status..."
              :options="bulkStatusOptions"
              @select="(val) => bulkChangeStatus(String(val))"
            />

            <!-- Hapus Button -->
            <button
              type="button"
              @click="bulkDeleteSelectedWorkers"
              class="h-9 px-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
            >
              <Trash2 class="w-4 h-4" />
              <span>Hapus</span>
            </button>

            <!-- Unified Batal Button (Desktop) -->
            <button
              type="button"
              @click="selectedWorkerIds = []"
              class="hidden sm:inline-flex h-9 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold transition items-center justify-center gap-1.5 active:scale-95 shrink-0"
            >
              <X class="w-4 h-4 text-slate-400" />
              <span>Batal</span>
            </button>
          </div>
        </div>
      </Teleport>

      <!-- Master Worker Table -->
      <div class="bg-slate-900/40 border border-slate-800/80 rounded-md overflow-hidden shadow-xl max-h-[75vh] overflow-y-auto">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs min-w-[760px] whitespace-nowrap">
            <thead class="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md text-slate-400 font-mono border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th class="p-3 w-10 text-center select-none">
                  <input
                    type="checkbox"
                    :checked="isAllWorkersSelected"
                    @change="toggleSelectAllWorkers"
                    class="rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th 
                  @click="toggleSort('no')"
                  class="p-3 w-32 whitespace-nowrap cursor-pointer hover:text-teal-300 transition select-none"
                  :title="t('teams.sortByNoAsc')"
                >
                  <div class="flex items-center gap-1.5">
                    <span>{{ t('teams.colWorkerNo') }}</span>
                    <ArrowUpDown class="w-3.5 h-3.5" :class="[workerSortBy === 'no-asc' ? 'text-teal-400 font-bold' : 'text-slate-600']" />
                  </div>
                </th>
                <th 
                  @click="toggleSort('name')"
                  class="p-3 w-48 whitespace-nowrap cursor-pointer hover:text-teal-300 transition select-none"
                  title="Klik untuk mengurutkan berdasarkan Nama"
                >
                  <div class="flex items-center gap-1.5">
                    <span>{{ t('teams.tableHeaderWorker') }}</span>
                    <ArrowUpDown class="w-3.5 h-3.5" :class="[workerSortBy.startsWith('name') ? 'text-teal-400 font-bold' : 'text-slate-600']" />
                  </div>
                </th>
                <th 
                  @click="toggleSort('role')"
                  class="p-3 w-36 whitespace-nowrap cursor-pointer hover:text-teal-300 transition select-none"
                  title="Klik untuk mengurutkan berdasarkan Role"
                >
                  <div class="flex items-center gap-1.5">
                    <span>{{ t('teams.tableHeaderRole') }}</span>
                    <ArrowUpDown class="w-3.5 h-3.5" :class="[workerSortBy === 'role-asc' ? 'text-teal-400 font-bold' : 'text-slate-600']" />
                  </div>
                </th>
                <th 
                  @click="toggleSort('team')"
                  class="p-3 w-32 whitespace-nowrap cursor-pointer hover:text-teal-300 transition select-none"
                  title="Klik untuk mengurutkan berdasarkan Tim"
                >
                  <div class="flex items-center gap-1.5">
                    <span>{{ t('teams.tableHeaderTeam') }}</span>
                    <ArrowUpDown class="w-3.5 h-3.5" :class="[workerSortBy === 'team-asc' ? 'text-teal-400 font-bold' : 'text-slate-600']" />
                  </div>
                </th>
                <th class="p-3 w-32 whitespace-nowrap">Shift Karyawan</th>
                <th
                  @click="toggleSort('joined')"
                  class="p-3 w-28 whitespace-nowrap cursor-pointer hover:text-teal-300 transition select-none"
                  title="Klik untuk mengurutkan berdasarkan Tanggal Masuk"
                >
                  <div class="flex items-center gap-1.5">
                    <span>Tgl Masuk</span>
                    <ArrowUpDown class="w-3.5 h-3.5" :class="[workerSortBy === 'joined-asc' ? 'text-teal-400 font-bold' : 'text-slate-600']" />
                  </div>
                </th>
                <th class="p-3 text-center w-36 whitespace-nowrap">Status Bulan Ini</th>
                <th class="p-3 text-right whitespace-nowrap">{{ t('teams.tableHeaderAction') }}</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-800/60 font-sans">
              <tr v-if="filteredWorkers.length === 0">
                <td colspan="8" class="p-8 text-center text-slate-500 whitespace-nowrap">
                  {{ t('teams.noWorkersFound') }}
                </td>
              </tr>

              <tr
                v-for="worker in displayedWorkers"
                :key="worker.id"
                class="hover:bg-slate-800/40 transition"
                :class="selectedWorkerIds.includes(worker.id) ? 'bg-teal-950/20' : ''"
              >
                <!-- Checkbox -->
                <td class="p-3 text-center">
                  <input
                    type="checkbox"
                    :value="worker.id"
                    v-model="selectedWorkerIds"
                    class="rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-0 cursor-pointer"
                  />
                </td>
                <!-- No Karyawan -->
                <td class="p-3 font-mono text-xs font-semibold whitespace-nowrap">
                  <span
                    v-if="hasValidWorkerNo(worker)"
                    class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-teal-300 font-bold shadow-2xs"
                  >
                    {{ getDisplayWorkerNo(worker) }}
                  </span>
                  <span
                    v-else
                    class="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300/90 border border-amber-500/20 font-semibold"
                  >
                    Belum ada NIK
                  </span>
                </td>

                <!-- Worker Profile & HP -->
                <td class="p-3 whitespace-nowrap">
                  <div class="flex items-center gap-2.5">
                    <img
                      :src="worker.avatar_url"
                      :alt="worker.full_name"
                      loading="lazy"
                      class="w-9 h-9 rounded-md bg-slate-800 object-cover border border-slate-700 shrink-0"
                    />
                    <div class="min-w-0">
                      <p class="font-bold text-xs text-slate-100 whitespace-nowrap">{{ worker.full_name }}</p>
                      <p class="text-[10px] text-slate-400 font-mono whitespace-nowrap">HP: {{ worker.phone_number || '-' }}</p>
                    </div>
                  </div>
                </td>

                <!-- Role Badge -->
                <td class="p-3 whitespace-nowrap">
                  <span class="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-teal-300 border border-teal-500/20 whitespace-nowrap">
                    {{ formatRole(worker.role) }}
                  </span>
                </td>

                <!-- Team -->
                <td class="p-3 font-semibold text-slate-200 whitespace-nowrap">
                  <span v-if="worker.team_id === UNASSIGNED_TEAM_ID" class="text-amber-400 italic text-[11px] whitespace-nowrap">
                    {{ t('teams.unassignedTeam') }}
                  </span>
                  <span v-else class="text-[11px] whitespace-nowrap">
                    {{ worker.team_name }}
                  </span>
                </td>

                <!-- Shift Badge -->
                <td class="p-3 whitespace-nowrap">
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 whitespace-nowrap font-mono">
                    {{ shiftStore.formatShiftDisplay(worker.shift) }}
                  </span>
                </td>

                <!-- Tanggal Masuk -->
                <td class="p-3 whitespace-nowrap">
                  <span v-if="worker.joined_date" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 bg-slate-800/70 border border-slate-700 whitespace-nowrap">
                    {{ formatJoinedDate(worker.joined_date) }}
                  </span>
                  <span v-else class="text-slate-600 text-[11px] font-mono">-</span>
                </td>

                <!-- Status Badge (Dynamic based on Selected Month) -->
                <td class="p-3 text-center whitespace-nowrap">
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap shadow-xs"
                    :class="getWorkerMonthlyStats(worker, selectedMonthFilter).statusBg"
                  >
                    <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="getWorkerMonthlyStats(worker, selectedMonthFilter).statusDot"></span>
                    {{ getWorkerMonthlyStats(worker, selectedMonthFilter).statusText }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="p-3 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      @click="openWorkerReport(worker)"
                      class="h-7 px-2.5 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-semibold transition inline-flex items-center gap-1 border border-teal-500/30 whitespace-nowrap shrink-0"
                      :title="t('teams.statBtn')"
                    >
                      <Printer class="w-3 h-3 shrink-0" />
                      <span class="whitespace-nowrap">{{ t('teams.statBtn') }}</span>
                    </button>
                    <button
                      v-if="worker.team_id === UNASSIGNED_TEAM_ID"
                      type="button"
                      @click="openEditMemberModal(worker.team_id, worker)"
                      class="h-7 px-2.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold transition inline-flex items-center gap-1 border border-amber-500/30 whitespace-nowrap shrink-0"
                    >
                      <UserPlus class="w-3 h-3 shrink-0" />
                      <span class="whitespace-nowrap">{{ t('teams.assignTeamBtn') }}</span>
                    </button>
                    <button
                      v-else
                      type="button"
                      @click="openEditMemberModal(worker.team_id, worker)"
                      class="h-7 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold transition inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <Pencil class="w-3 h-3 shrink-0" />
                      <span class="whitespace-nowrap">{{ t('teams.editBtn') }}</span>
                    </button>
                    <button
                      type="button"
                      @click="confirmDeleteMember(worker.team_id, worker)"
                      class="h-7 px-2.5 rounded bg-slate-800 hover:bg-rose-950 text-rose-300 text-xs font-semibold transition inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <Trash2 class="w-3 h-3 shrink-0" />
                      <span class="whitespace-nowrap">{{ t('teams.deleteBtn') }}</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Load More Pagination Button -->
        <div v-if="filteredWorkers.length > visibleWorkerCount" class="p-3 text-center border-t border-slate-800 bg-slate-950/60 font-mono">
          <button
            type="button"
            @click="visibleWorkerCount += 50"
            class="px-4 py-2 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 active:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-xs font-bold transition shadow-xs"
          >
            Tampilkan Lebih Banyak (Tersisa {{ filteredWorkers.length - visibleWorkerCount }} Karyawan)
          </button>
        </div>
      </div>
    </div>

    <!-- FULLSCREEN MODAL: TAMBAH TIM BARU -->
    <Teleport to="body">
      <div
        v-if="showAddTeamModal"
        class="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans overflow-hidden animate-fadeIn text-slate-100"
      >
        <div class="py-3.5 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 gap-3 min-h-[60px]">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <Plus class="w-5 h-5 stroke-[3]" />
            </div>
            <div class="min-w-0">
              <h2 class="text-sm sm:text-base font-bold text-slate-100 font-mono leading-snug truncate">
                {{ t('teams.addTeamModalTitle') }}
              </h2>
              <p class="text-[11px] text-slate-400 leading-tight truncate">{{ t('teams.addTeamModalSub') }}</p>
            </div>
          </div>
          <button
            type="button"
            @click="showAddTeamModal = false"
            class="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 shrink-0"
            title="Tutup"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 sm:p-6 max-w-xl mx-auto w-full space-y-4">
          <div class="bg-slate-900/60 p-4 sm:p-5 border border-slate-800/80 rounded-md space-y-4 shadow-sm">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.teamNameLabel') }}</label>
              <input
                type="text"
                v-model="teamNameInput"
                :placeholder="t('teams.teamNamePlaceholder')"
                class="w-full h-9 bg-slate-950 border border-slate-800 rounded-md px-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.dailyTargetLabel') }}</label>
              <input
                type="number"
                v-model.number="teamDailyTargetInput"
                placeholder="1260"
                min="1"
                class="w-full h-9 bg-slate-950 border border-slate-800 rounded-md px-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono font-bold text-teal-400"
              />
            </div>

            <!-- Live Target Hari Ini Calculation Breakdown -->
            <div class="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-2">
              <div class="text-[11px] font-bold text-teal-400 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>{{ t('teams.targetCalcTitle') }}</span>
                <span class="text-slate-500 font-normal">Auto Calculator</span>
              </div>
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-slate-300 font-semibold">{{ t('teams.targetCalcTotal') }}</span>
                <span class="text-teal-300 font-extrabold text-sm">{{ teamDailyTargetInput || 0 }} Pcs</span>
              </div>
              <div class="flex items-center justify-between text-xs font-mono pt-1.5 border-t border-slate-800/80">
                <span class="text-slate-400">{{ t('teams.targetCalcAvg') }}</span>
                <span class="text-teal-400 font-bold">{{ Math.round((teamDailyTargetInput || 0) / 6) }} Pcs / Jam</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Strict Visible Bottom Action Bar -->
        <div class="py-3.5 px-4 sm:px-6 border-t border-slate-800 bg-slate-900 shrink-0 shadow-2xl z-10">
          <div class="max-w-xl mx-auto w-full grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              @click="showAddTeamModal = false"
              class="w-full sm:w-auto h-10 px-4 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700 flex items-center justify-center"
            >
              <span>{{ t('teams.cancelBtn') }}</span>
            </button>
            <button
              type="button"
              @click="handleSaveNewTeam"
              :disabled="!teamNameInput"
              class="w-full sm:w-auto h-10 px-5 rounded-md bg-gradient-to-r from-teal-500 to-emerald-400 hover:opacity-90 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition flex items-center justify-center gap-1.5"
            >
              <Check class="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>{{ t('teams.saveNewTeamBtn') }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- FULLSCREEN MODAL: EDIT DATA & INPUT HASIL TIM -->
    <Teleport to="body">
      <div
        v-if="showEditTeamModal"
        class="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans overflow-hidden animate-fadeIn text-slate-100"
      >
        <div class="py-3.5 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 gap-3 min-h-[60px]">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <Pencil class="w-5 h-5 text-teal-400" />
            </div>
             <div class="min-w-0">
               <h2 class="text-sm sm:text-base font-bold text-slate-100 font-mono leading-snug">
                 {{ t('teams.editTeamModalTitle', { name: selectedTeamToEdit?.name }) }}
               </h2>
               <p class="text-[11px] text-slate-400 leading-tight">{{ t('teams.editTeamModalSub') }}</p>
             </div>
          </div>
          <button
            type="button"
            @click="showEditTeamModal = false"
            class="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 shrink-0"
            title="Tutup"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 sm:p-6 max-w-xl mx-auto w-full space-y-4">
          <!-- Direct Input Section for Hasil Dicapai Hari Ini -->
          <div class="p-4 rounded-md bg-teal-500/10 border border-teal-500/30 space-y-2 shadow-sm">
            <label class="block text-xs font-bold text-teal-300 font-mono tracking-wider flex items-center justify-between">
              <span class="flex items-center gap-1.5"><Package class="w-4 h-4 text-teal-400"/> {{ t('teams.updateAchievedLabel') }}</span>
              <span class="text-[10px] text-teal-400/80 font-normal">Real-Time Output</span>
            </label>
            <input
              type="number"
              v-model.number="teamAchievedInput"
              placeholder="375"
              min="0"
              class="w-full h-10 bg-slate-950 border border-teal-500/40 rounded-md px-3 text-sm text-teal-300 focus:outline-none focus:border-teal-400 font-mono font-extrabold"
            />
            <p class="text-[11px] text-slate-400">
              {{ t('teams.updateAchievedHelp') }}
            </p>
          </div>

          <!-- Absensi Kehadiran Shift Hari Ini -->
          <div class="bg-slate-900/60 p-4 border border-slate-800/80 rounded-md space-y-2.5 shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <label class="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                <Users class="w-4 h-4 text-teal-400" /> {{ t('teams.attendanceShiftTitle') }}
              </label>
              <span class="text-[10px] text-teal-400 font-mono font-bold">
                {{ t('teams.presentCountLabel', { present: activePresentMemberIds.length, total: editingTeamMembers.length }) }}
              </span>
            </div>

            <div v-if="editingTeamMembers.length === 0" class="text-xs text-slate-500 italic py-2">
              {{ t('teams.noWorkersInTeam') }}
            </div>

            <div v-else class="space-y-1.5 pt-1">
              <div
                v-for="member in editingTeamMembers"
                :key="member.id"
                class="flex items-center justify-between p-2 rounded-md bg-slate-950/80 border border-slate-800/80 text-xs"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <img
                    :src="member.avatar_url"
                    loading="lazy"
                    class="w-7 h-7 rounded bg-slate-800 object-cover shrink-0 border border-slate-700"
                  />
                  <div class="min-w-0">
                    <p class="font-bold text-slate-200 truncate">{{ member.full_name }}</p>
                    <p class="text-[10px] text-slate-400 capitalize truncate">{{ member.role }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <!-- Toggle Switch Hadir/Absen -->
                  <button
                    type="button"
                    @click="toggleMemberAttendance(member.id)"
                    class="h-7 px-2.5 rounded font-mono text-[11px] font-bold transition flex items-center gap-1.5 border"
                    :class="activePresentMemberIds.includes(member.id)
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="activePresentMemberIds.includes(member.id) ? 'bg-emerald-400' : 'bg-rose-400'"></span>
                    <span>{{ activePresentMemberIds.includes(member.id) ? t('logForm.present') : t('teams.absentPermission') }}</span>
                  </button>

                  <!-- Edit Member Button inside Modal -->
                  <button
                    type="button"
                    @click="openEditMemberModal(selectedTeamToEdit?.id || '', member)"
                    title="Edit data karyawan"
                    class="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-teal-300 transition"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>

                  <!-- Remove Member Button inside Modal (Unassigns only) -->
                  <button
                    type="button"
                    @click="triggerRemoveMemberFromTeam(selectedTeamToEdit?.id || '', member)"
                    title="Keluarkan karyawan dari tim"
                    class="p-1.5 rounded bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 transition"
                  >
                    <UserMinus class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Tambah Anggota Button at the bottom of the list -->
            <div class="pt-2">
              <button
                type="button"
                @click="triggerAddTeamMember"
                class="w-full h-8 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 hover:text-teal-400 text-xs font-bold transition border border-teal-500/30 flex items-center justify-center gap-1.5"
              >
                <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{{ t('teams.addTeamMemberBtn') }}</span>
              </button>
            </div>
          </div>

          <div class="bg-slate-900/60 p-4 sm:p-5 border border-slate-800/80 rounded-md space-y-4 shadow-sm">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.teamNameLabel') }}</label>
              <input
                type="text"
                v-model="teamNameInput"
                class="w-full h-9 bg-slate-950 border border-slate-800 rounded-md px-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.dailyTargetLabel') }}</label>
              <input
                type="number"
                v-model.number="teamDailyTargetInput"
                min="1"
                class="w-full h-9 bg-slate-950 border border-slate-800 rounded-md px-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono font-bold text-teal-400"
              />
            </div>

            <!-- Live Target Hari Ini Calculation Breakdown -->
            <div class="p-3 bg-slate-950 border border-slate-800 rounded-md space-y-2">
              <div class="text-[11px] font-bold text-teal-400 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>{{ t('teams.summaryTitle') }}</span>
                <span class="text-slate-500 font-normal">Auto Calculator</span>
              </div>
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-slate-300 font-semibold">{{ t('teams.achievedTodayLabel') }}</span>
                <span class="text-teal-300 font-extrabold text-sm">{{ teamAchievedInput || 0 }} Pcs</span>
              </div>
              <div class="flex items-center justify-between text-[11px] font-mono text-teal-400/90 pl-3.5 border-l-2 border-teal-500/30">
                <span class="text-slate-400">{{ t('teams.perWorkerSplitLabel') }}</span>
                <span class="font-bold">
                  {{ t('teams.perWorkerUnit', { pcs: Math.floor((teamAchievedInput || 0) / (activePresentMemberIds.length || 1)), count: activePresentMemberIds.length }) }}
                </span>
              </div>
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-slate-300 font-semibold">{{ t('teams.targetCalcTotal') }}</span>
                <span class="text-teal-400 font-bold">{{ teamDailyTargetInput || 0 }} Pcs</span>
              </div>
              <div class="flex items-center justify-between text-xs font-mono pt-1.5 border-t border-slate-800/80">
                <span class="text-slate-400">{{ t('teams.achievementPercentage') }}</span>
                <span class="text-emerald-400 font-extrabold font-mono">
                  {{ Math.min(100, Math.round(((teamAchievedInput || 0) / (teamDailyTargetInput || 1)) * 100)) }}%
                </span>
              </div>
            </div>

            <!-- Danger Zone / Hapus Tim Action -->
            <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <h4 class="text-xs font-bold text-rose-400 font-mono">{{ t('teams.deleteTeamGroupTitle') }}</h4>
                <p class="text-[10px] text-slate-500">{{ t('teams.deleteTeamGroupSub') }}</p>
              </div>
              <button
                type="button"
                @click="handleDeleteTeamFromEditModal"
                class="h-8 px-3 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition inline-flex items-center gap-1.5 shrink-0"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>{{ t('teams.deleteTeamBtn') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Strict Visible Bottom Action Bar -->
        <div class="py-3.5 px-4 sm:px-6 border-t border-slate-800 bg-slate-900 shrink-0 shadow-2xl z-10">
          <div class="max-w-xl mx-auto w-full grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              @click="showEditTeamModal = false"
              class="w-full sm:w-auto h-10 px-4 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700 flex items-center justify-center"
            >
              <span>{{ t('teams.cancelBtn') }}</span>
            </button>
            <button
              type="button"
              @click="handleSaveEditTeam"
              :disabled="!teamNameInput"
              class="w-full sm:w-auto h-10 px-5 rounded-md bg-gradient-to-r from-teal-500 to-emerald-400 hover:opacity-90 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition flex items-center justify-center gap-1.5"
            >
              <Check class="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>{{ t('teams.saveTeamChangesBtn') }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- FULLSCREEN MODAL: HAPUS TIM -->
    <Teleport to="body">
      <div
        v-if="showDeleteTeamModal"
        class="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans overflow-hidden animate-fadeIn text-slate-100 justify-between"
      >
        <div class="py-3.5 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 gap-3 min-h-[60px]">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle class="w-5 h-5" />
            </div>
            <div class="min-w-0">
              <h2 class="text-sm sm:text-base font-bold text-slate-100 font-mono leading-snug truncate">
                {{ t('teams.deleteConfirmTitle') }}
              </h2>
              <p class="text-[11px] text-slate-400 leading-tight truncate">{{ t('teams.deleteConfirmTitle') }}</p>
            </div>
          </div>
          <button
            type="button"
            @click="showDeleteTeamModal = false"
            class="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 shrink-0"
            title="Tutup"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 sm:p-6 max-w-xl mx-auto w-full flex items-center justify-center">
          <div class="bg-slate-900/60 p-6 border border-rose-900/40 rounded-md text-center space-y-4 w-full">
            <div class="w-12 h-12 rounded-md bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
              <AlertTriangle class="w-6 h-6" />
            </div>

            <div>
              <h3 class="text-base font-bold text-slate-100 font-mono">{{ t('teams.deleteConfirmTitle') }}</h3>
              <p class="text-xs text-slate-400 mt-1.5">
                {{ t('teams.deleteConfirmSub', { name: selectedTeamToDelete?.name }) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Strict Visible Bottom Action Bar -->
        <div class="py-3.5 px-4 sm:px-6 border-t border-slate-800 bg-slate-900 shrink-0 shadow-2xl z-10">
          <div class="max-w-xl mx-auto w-full grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              @click="showDeleteTeamModal = false"
              class="w-full sm:w-auto h-10 px-4 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700 flex items-center justify-center"
            >
              {{ t('teams.cancelBtn') }}
            </button>
            <button
              type="button"
              @click="handleConfirmDeleteTeam"
              class="w-full sm:w-auto h-10 px-5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-1.5"
            >
              <Trash2 class="w-4 h-4" />
              <span>{{ t('teams.confirmDeleteBtn') }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- FULLSCREEN MODAL 1: TAMBAH ANGGOTA TIM -->
    <Teleport to="body">
      <div
        v-if="showTeamMemberModal"
        class="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans overflow-hidden animate-fadeIn text-slate-100"
      >
        <div class="py-3.5 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 gap-3 min-h-[60px]">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <Users class="w-5 h-5" />
            </div>
            <div class="min-w-0">
              <h2 class="text-sm sm:text-base font-bold text-slate-100 font-mono leading-snug truncate">
                Tambah Anggota ke {{ selectedTeamName }}
              </h2>
              <p class="text-[11px] text-slate-400 leading-tight truncate">Pilih dari terdaftar atau ketik nama baru</p>
            </div>
          </div>
          <button
            type="button"
            @click="showTeamMemberModal = false"
            class="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 shrink-0"
            title="Tutup"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 sm:p-6 max-w-xl mx-auto w-full space-y-4">
          <div class="bg-slate-900/60 p-4 sm:p-5 border border-slate-800/80 rounded-md space-y-4 shadow-sm">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.selectWorkerLabel') }}</label>
              <CustomCombobox
                v-model="memberNameInput"
                :options="workerSelectOptions"
                :placeholder="t('teams.selectWorkerPlaceholder')"
                @change="handleSelectExistingWorkerToAssign"
                @add-option="handleAddNewWorkerFromCombobox"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.roleLabel') }}</label>
              <CustomCombobox
                v-model="memberRoleInput"
                :options="roleOptions"
                :placeholder="t('teams.rolePlaceholder')"
                storageKey="earflow_role_options"
                @update:options="handleRoleOptionsUpdate"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.workerNoLabel') }}</label>
                <div class="relative">
                  <input
                    type="text"
                    v-model="memberNoInput"
                    placeholder="Contoh: W-102938"
                    class="w-full h-9 bg-slate-950 border border-slate-800 rounded-md pl-3 pr-7 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                  />
                  <button
                    v-if="memberNoInput"
                    type="button"
                    @click="memberNoInput = ''"
                    class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white flex items-center justify-center transition"
                    title="Hapus"
                  >
                    <X class="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.joinedDateLabel') }}</label>
                <input
                  type="date"
                  v-model="memberJoinedDateInput"
                  class="w-full h-9 bg-slate-950 border border-slate-800 rounded-md px-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.phoneLabel') }}</label>
              <div class="relative">
                <input
                  type="tel"
                  v-model="memberPhoneInput"
                  placeholder="Contoh: 08123456789"
                  class="w-full h-9 bg-slate-950 border border-slate-800 rounded-md pl-3 pr-7 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
                />
                <button
                  v-if="memberPhoneInput"
                  type="button"
                  @click="memberPhoneInput = ''"
                  class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white flex items-center justify-center transition"
                  title="Hapus"
                >
                  <X class="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Shift Karyawan</label>
              <CustomSelect
                v-model="memberShiftInput"
                :options="workerShiftOptions"
                placeholder="Pilih Shift Karyawan..."
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Status Karyawan</label>
              <CustomCombobox
                v-model="memberStatusInput"
                :options="workerStatusOptions"
                placeholder="Pilih / Ketik Status (Aktif, Baru, Keluar...)"
                storageKey="earflow_worker_status_options"
                @update:options="handleStatusOptionsUpdate"
              />
            </div>
          </div>
        </div>

        <!-- Strict Visible Bottom Action Bar -->
        <div class="py-3.5 px-4 sm:px-6 border-t border-slate-800 bg-slate-900 shrink-0 shadow-2xl z-10">
          <div class="max-w-xl mx-auto w-full grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              @click="showTeamMemberModal = false"
              class="w-full sm:w-auto h-10 px-4 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700 flex items-center justify-center"
            >
              {{ t('teams.cancelBtn') }}
            </button>
            <button
              type="button"
              @click="handleSaveTeamMember"
              :disabled="!memberNameInput"
              class="w-full sm:w-auto h-10 px-5 rounded-md bg-gradient-to-r from-teal-500 to-emerald-400 hover:opacity-90 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition flex items-center justify-center gap-1.5"
            >
              <Check class="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>{{ t('teams.addToTeamBtn') }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- FULLSCREEN MODAL 2: TAMBAH PEKERJA MASTER (STATUS: BELUM MASUK TIM) -->
    <Teleport to="body">
      <div
        v-if="showMasterWorkerModal"
        class="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans overflow-hidden animate-fadeIn text-slate-100"
      >
        <div class="py-3.5 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 gap-3 min-h-[60px]">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <UserPlus class="w-5 h-5" />
            </div>
            <div class="min-w-0">
              <h2 class="text-sm sm:text-base font-bold text-slate-100 font-mono leading-snug truncate">
                {{ t('teams.addMasterWorkerTitle') }}
              </h2>
              <p class="text-[11px] text-slate-400 leading-tight truncate">{{ t('teams.addMasterWorkerSub') }}</p>
            </div>
          </div>
          <button
            type="button"
            @click="showMasterWorkerModal = false"
            class="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 shrink-0"
            title="Tutup"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 sm:p-6 max-w-xl mx-auto w-full space-y-4">
          <div class="bg-slate-900/60 p-4 sm:p-5 border border-slate-800/80 rounded-md space-y-4 shadow-sm">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.teamAssignmentLabel') }}</label>
              <CustomCombobox
                v-model="targetTeamId"
                :options="teamSelectOptions"
                :placeholder="t('teams.selectTeamPlaceholder')"
                @add-option="handleAddTeamFromCombobox"
                @edit-option="handleEditTeamFromCombobox"
                @delete-option="handleDeleteTeamFromCombobox"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.nameLabel') }}</label>
              <input
                type="text"
                v-model="memberNameInput"
                :placeholder="t('teams.namePlaceholder')"
                class="w-full h-9 bg-slate-950 border border-slate-800 rounded-md px-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.roleLabel') }}</label>
              <CustomCombobox
                v-model="memberRoleInput"
                :options="roleOptions"
                :placeholder="t('teams.rolePlaceholder')"
                storageKey="earflow_role_options"
                @update:options="handleRoleOptionsUpdate"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.workerNoLabel') }}</label>
                <div class="relative">
                  <input
                    type="text"
                    v-model="memberNoInput"
                    placeholder="Contoh: W-102938"
                    class="w-full h-9 bg-slate-950 border border-slate-800 rounded-md pl-3 pr-7 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                  />
                  <button
                    v-if="memberNoInput"
                    type="button"
                    @click="memberNoInput = ''"
                    class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white flex items-center justify-center transition"
                    title="Hapus"
                  >
                    <X class="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.joinedDateLabel') }}</label>
                <input
                  type="date"
                  v-model="memberJoinedDateInput"
                  class="w-full h-9 bg-slate-950 border border-slate-800 rounded-md px-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.phoneLabel') }}</label>
              <div class="relative">
                <input
                  type="tel"
                  v-model="memberPhoneInput"
                  placeholder="Contoh: 08123456789"
                  class="w-full h-9 bg-slate-950 border border-slate-800 rounded-md pl-3 pr-7 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
                />
                <button
                  v-if="memberPhoneInput"
                  type="button"
                  @click="memberPhoneInput = ''"
                  class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white flex items-center justify-center transition"
                  title="Hapus"
                >
                  <X class="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Shift Karyawan</label>
              <CustomSelect
                v-model="memberShiftInput"
                :options="workerShiftOptions"
                placeholder="Pilih Shift Karyawan..."
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Status Karyawan</label>
              <CustomCombobox
                v-model="memberStatusInput"
                :options="workerStatusOptions"
                placeholder="Pilih / Ketik Status (Aktif, Baru, Keluar...)"
                storageKey="earflow_worker_status_options"
                @update:options="handleStatusOptionsUpdate"
              />
            </div>

            <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-300 flex items-center gap-2">
              <UserPlus class="w-4 h-4 shrink-0 text-amber-400" />
              <span>{{ t('teams.masterWorkerHelp') }}</span>
            </div>
          </div>
        </div>

        <!-- Strict Visible Bottom Action Bar -->
        <div class="py-3.5 px-4 sm:px-6 border-t border-slate-800 bg-slate-900 shrink-0 shadow-2xl z-10">
          <div class="max-w-xl mx-auto w-full grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              @click="showMasterWorkerModal = false"
              class="w-full sm:w-auto h-10 px-4 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700 flex items-center justify-center"
            >
              {{ t('teams.cancelBtn') }}
            </button>
            <button
              type="button"
              @click="handleSaveMasterWorker"
              :disabled="!memberNameInput"
              class="w-full sm:w-auto h-10 px-5 rounded-md bg-gradient-to-r from-teal-500 to-emerald-400 hover:opacity-90 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition flex items-center justify-center gap-1.5"
            >
              <Check class="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>{{ t('teams.saveToDirectoryBtn') }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- FULLSCREEN MODAL 3: EDIT MEMBER -->
    <Teleport to="body">
      <div
        v-if="showEditModal"
        class="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans overflow-hidden animate-fadeIn text-slate-100"
      >
        <div class="py-3.5 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 gap-3 min-h-[60px]">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <Pencil class="w-5 h-5" />
            </div>
            <div class="min-w-0">
              <h2 class="text-sm sm:text-base font-bold text-slate-100 font-mono leading-snug truncate">
                {{ t('teams.editWorkerModalTitle') }}
              </h2>
              <p class="text-[11px] text-slate-400 leading-tight truncate">{{ t('teams.editWorkerModalSub') }}</p>
            </div>
          </div>
          <button
            type="button"
            @click="showEditModal = false"
            class="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 shrink-0"
            title="Tutup"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 sm:p-6 max-w-xl mx-auto w-full space-y-4">
          <div class="bg-slate-900/60 p-4 sm:p-5 border border-slate-800/80 rounded-md space-y-4 shadow-sm">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.teamAssignmentLabel') }}</label>
              <CustomCombobox
                v-model="targetTeamId"
                :options="teamSelectOptions"
                :placeholder="t('teams.selectTeamPlaceholder')"
                @add-option="handleAddTeamFromCombobox"
                @edit-option="handleEditTeamFromCombobox"
                @delete-option="handleDeleteTeamFromCombobox"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.nameLabel') }}</label>
              <input
                type="text"
                v-model="memberNameInput"
                class="w-full h-9 bg-slate-950 border border-slate-800 rounded-md px-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.roleLabel') }}</label>
              <CustomCombobox
                v-model="memberRoleInput"
                :options="roleOptions"
                :placeholder="t('teams.rolePlaceholder')"
                storageKey="earflow_role_options"
                @update:options="handleRoleOptionsUpdate"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.workerNoLabel') }}</label>
                <div class="relative">
                  <input
                    type="text"
                    v-model="memberNoInput"
                    placeholder="Contoh: W-102938"
                    class="w-full h-9 bg-slate-950 border border-slate-800 rounded-md pl-3 pr-7 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                  />
                  <button
                    v-if="memberNoInput"
                    type="button"
                    @click="memberNoInput = ''"
                    class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white flex items-center justify-center transition"
                    title="Hapus"
                  >
                    <X class="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.joinedDateLabel') }}</label>
                <input
                  type="date"
                  v-model="memberJoinedDateInput"
                  class="w-full h-9 bg-slate-950 border border-slate-800 rounded-md px-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ t('teams.phoneLabel') }}</label>
              <div class="relative">
                <input
                  type="tel"
                  v-model="memberPhoneInput"
                  placeholder="Contoh: 08123456789"
                  class="w-full h-9 bg-slate-950 border border-slate-800 rounded-md pl-3 pr-7 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
                />
                <button
                  v-if="memberPhoneInput"
                  type="button"
                  @click="memberPhoneInput = ''"
                  class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white flex items-center justify-center transition"
                  title="Hapus"
                >
                  <X class="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Shift Karyawan</label>
              <CustomSelect
                v-model="memberShiftInput"
                :options="workerShiftOptions"
                placeholder="Pilih Shift Karyawan..."
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Status Karyawan</label>
              <CustomCombobox
                v-model="memberStatusInput"
                :options="workerStatusOptions"
                placeholder="Pilih / Ketik Status (Aktif, Baru, Keluar...)"
                storageKey="earflow_worker_status_options"
                @update:options="handleStatusOptionsUpdate"
              />
            </div>
          </div>
        </div>

        <!-- Strict Visible Bottom Action Bar -->
        <div class="py-3.5 px-4 sm:px-6 border-t border-slate-800 bg-slate-900 shrink-0 shadow-2xl z-10">
          <div class="max-w-xl mx-auto w-full grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              @click="showEditModal = false"
              class="w-full sm:w-auto h-10 px-4 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700 flex items-center justify-center"
            >
              {{ t('teams.cancelBtn') }}
            </button>
            <button
              type="button"
              @click="handleSaveEditMember"
              :disabled="!memberNameInput"
              class="w-full sm:w-auto h-10 px-5 rounded-md bg-gradient-to-r from-teal-500 to-emerald-400 hover:opacity-90 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition flex items-center justify-center gap-1.5"
            >
              <Check class="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>{{ t('teams.saveWorkerChangesBtn') }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- FULLSCREEN MODAL 4: CONFIRM DELETE MEMBER -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans overflow-hidden animate-fadeIn text-slate-100 justify-between"
      >
        <div class="py-3.5 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 gap-3 min-h-[60px]">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle class="w-5 h-5" />
            </div>
            <div class="min-w-0">
              <h2 class="text-sm sm:text-base font-bold text-slate-100 font-mono leading-snug truncate">
                Hapus Karyawan
              </h2>
              <p class="text-[11px] text-slate-400 leading-tight truncate">Konfirmasi penghapusan data anggota tim</p>
            </div>
          </div>
          <button
            type="button"
            @click="showDeleteModal = false"
            class="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 shrink-0"
            title="Tutup"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 sm:p-6 max-w-xl mx-auto w-full flex items-center justify-center">
          <div class="bg-slate-900/60 p-6 border border-rose-900/40 rounded-md text-center space-y-4 w-full">
            <div class="w-12 h-12 rounded-md bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
              <AlertTriangle class="w-6 h-6" />
            </div>

            <div>
              <h3 class="text-base font-bold text-slate-100 font-mono">Hapus Karyawan?</h3>
              <p class="text-xs text-slate-400 mt-1.5">
                Apakah Anda yakin ingin menghapus <strong class="text-slate-200">{{ selectedMember?.full_name }}</strong> dari direktori pekerja?
              </p>
            </div>
          </div>
        </div>

        <!-- Strict Visible Bottom Action Bar -->
        <div class="py-3.5 px-4 sm:px-6 border-t border-slate-800 bg-slate-900 shrink-0 shadow-2xl z-10">
          <div class="max-w-xl mx-auto w-full grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              @click="showDeleteModal = false"
              class="w-full sm:w-auto h-10 px-4 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700 flex items-center justify-center"
            >
              Batal
            </button>
            <button
              type="button"
              @click="handleConfirmDeleteMember"
              class="w-full sm:w-auto h-10 px-5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-1.5"
            >
              <Trash2 class="w-4 h-4" />
              <span>Ya, Hapus Karyawan</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- WORKER MONTHLY REPORT & PRINT MODAL -->
    <WorkerReportModal
      :show="showWorkerReportModal"
      :worker="selectedReportWorker"
      @close="showWorkerReportModal = false"
    />

    <!-- MANDOR DAILY PRODUCTION PLAN SHEET MODAL -->
    <MandorDailyReportModal
      :show="showMandorReportModal"
      @close="showMandorReportModal = false"
    />

    <!-- MONTHLY PRODUCTION RECAP MATRIX MODAL -->
    <MonthlyProductionRecapModal
      :show="showMonthlyRecapModal"
      @close="showMonthlyRecapModal = false"
    />

    <!-- FULLSCREEN MODAL 5: CUSTOM ALERT & CONFIRM DIALOG -->
    <Teleport to="body">
      <div
        v-if="showDialog"
        class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fadeIn text-slate-100"
      >
        <div class="bg-slate-900 border border-slate-800 rounded-lg p-5 max-w-sm w-full space-y-4 shadow-2xl relative">
          <!-- Icon Accent -->
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              :class="dialogType === 'confirm' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'"
            >
              <RotateCcw v-if="dialogType === 'confirm'" class="w-5 h-5 text-rose-400" />
              <AlertTriangle v-else class="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-100 font-mono">{{ dialogTitle }}</h3>
              <p class="text-[10px] text-slate-400 mt-0.5">Sistem EarFlow Real-Time</p>
            </div>
          </div>

          <!-- Dialog Message Body -->
          <p class="text-xs text-slate-300 font-medium leading-relaxed">
            {{ dialogMessage }}
          </p>

          <!-- Buttons Bar -->
          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button
              v-if="dialogType === 'confirm'"
              type="button"
              @click="closeDialog(false)"
              class="h-9 px-3.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700"
            >
              {{ dialogCancelButtonText }}
            </button>
            <button
              type="button"
              @click="closeDialog(true)"
              class="h-9 px-4 rounded-md font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
              :class="dialogType === 'confirm' 
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/10'
                : 'bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 shadow-teal-500/10'"
            >
              <span>{{ dialogButtonText }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTeamStore, UNASSIGNED_TEAM_ID } from '@/stores/teamStore'
import { useProductionStore, getLocalDateStr } from '@/stores/productionStore'
import { useShiftStore } from '@/stores/shiftStore'
import { useAuditStore } from '@/stores/auditStore'
import CustomCombobox, { type ComboboxOption } from '@/components/CustomCombobox.vue'
import CustomSelect from '@/components/CustomSelect.vue'
import CustomBulkSelect, { type BulkSelectOption } from '@/components/CustomBulkSelect.vue'
import WorkerReportModal from '@/components/WorkerReportModal.vue'
import MandorDailyReportModal from '@/components/MandorDailyReportModal.vue'
import MonthlyProductionRecapModal from '@/components/MonthlyProductionRecapModal.vue'
import { isWorkerMatchingShift, isWorkerInLog, getWorkerShareForLog } from '@/utils/reportUtils'
import { exportToXlsx } from '@/utils/excelExport'
import { isTempWorkerNo } from '@/data/noKaryawanData'
import { LayoutGrid, Users, Plus, Pencil, Trash2, Search, X, UserPlus, AlertTriangle, Check, Package, Printer, RotateCcw, UserMinus, ClipboardList, ArrowUpDown, Table, SlidersHorizontal, Filter, FileSpreadsheet, Calendar } from 'lucide-vue-next'

const { t } = useI18n()
const teamStore = useTeamStore()
const productionStore = useProductionStore()
const shiftStore = useShiftStore()
const auditStore = useAuditStore()

const activeView = ref<'table' | 'cards'>('table')

// Options for Custom Bulk Selects
const bulkShiftOptions = computed<BulkSelectOption[]>(() => 
  shiftStore.shifts.map(s => ({ label: s.name, value: s.name }))
)

const bulkTeamOptions = computed<BulkSelectOption[]>(() => [
  { label: 'Belum Masuk Tim', value: UNASSIGNED_TEAM_ID },
  ...teamStore.teams.map(t => ({ label: t.name, value: t.id }))
])

const bulkStatusOptions = computed<BulkSelectOption[]>(() => [
  { label: 'Aktif', value: 'Aktif' },
  { label: 'Cuti', value: 'Cuti' },
  { label: 'Keluar', value: 'Keluar' }
])

// Bulk Action Selection State
const selectedWorkerIds = ref<string[]>([])

const isAllWorkersSelected = computed(() => {
  if (filteredWorkers.value.length === 0) return false
  return filteredWorkers.value.every(w => selectedWorkerIds.value.includes(w.id))
})

function toggleSelectAllWorkers() {
  if (isAllWorkersSelected.value) {
    selectedWorkerIds.value = []
  } else {
    selectedWorkerIds.value = filteredWorkers.value.map(w => w.id)
  }
}

async function bulkAssignShift(shiftName: string) {
  if (!shiftName || selectedWorkerIds.value.length === 0) return
  const count = selectedWorkerIds.value.length
  for (const id of selectedWorkerIds.value) {
    const worker = teamStore.allWorkers.find(w => w.id === id)
    if (worker) {
      await teamStore.editMember(worker.team_id, worker.id, worker.full_name, worker.role, worker.team_id, worker.no_karyawan, worker.joined_date, worker.phone_number, shiftName, worker.status)
    }
  }
  await auditStore.logAction('Pekerja', 'Pindah Shift Massal', `${count} karyawan dipindahkan ke ${shiftName}`)
  selectedWorkerIds.value = []
}

async function bulkAssignTeam(targetTeamId: string) {
  if (!targetTeamId || selectedWorkerIds.value.length === 0) return
  const count = selectedWorkerIds.value.length
  const teamObj = teamStore.teams.find(t => t.id === targetTeamId)
  const teamName = targetTeamId === UNASSIGNED_TEAM_ID ? 'Belum Masuk Tim' : (teamObj ? teamObj.name : targetTeamId)

  for (const id of selectedWorkerIds.value) {
    const worker = teamStore.allWorkers.find(w => w.id === id)
    if (worker) {
      await teamStore.editMember(worker.team_id, worker.id, worker.full_name, worker.role, targetTeamId, worker.no_karyawan, worker.joined_date, worker.phone_number, worker.shift, worker.status)
    }
  }
  await auditStore.logAction('Tim', 'Pindah Tim Massal', `${count} karyawan dipindahkan ke tim ${teamName}`)
  selectedWorkerIds.value = []
}

async function bulkChangeStatus(newStatus: string) {
  if (!newStatus || selectedWorkerIds.value.length === 0) return
  const count = selectedWorkerIds.value.length
  for (const id of selectedWorkerIds.value) {
    const worker = teamStore.allWorkers.find(w => w.id === id)
    if (worker) {
      await teamStore.editMember(worker.team_id, worker.id, worker.full_name, worker.role, worker.team_id, worker.no_karyawan, worker.joined_date, worker.phone_number, worker.shift, newStatus)
    }
  }
  await auditStore.logAction('Pekerja', 'Ubah Status Massal', `Status ${count} karyawan diubah menjadi ${newStatus}`)
  selectedWorkerIds.value = []
}

async function bulkDeleteSelectedWorkers() {
  if (selectedWorkerIds.value.length === 0) return
  const count = selectedWorkerIds.value.length
  if (confirm(`Yakin ingin menghapus ${count} karyawan yang dipilih?`)) {
    for (const id of selectedWorkerIds.value) {
      const worker = teamStore.allWorkers.find(w => w.id === id)
      if (worker) {
        await teamStore.deleteMember(worker.team_id, worker.id, true)
      }
    }
    await auditStore.logAction('Pekerja', 'Hapus Karyawan Massal', `${count} karyawan telah dihapus dari sistem`)
    selectedWorkerIds.value = []
  }
}

const showHeaderMenu = ref(false)
const menuTab = ref<'filters' | 'actions'>('filters')
const shiftFilter = ref('')
const workerSearchQueryInput = ref('')
const workerSearchQuery = ref('')
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  if (!workerSearchQueryInput.value) {
    workerSearchQuery.value = ''
    return
  }
  searchDebounceTimer = setTimeout(() => {
    workerSearchQuery.value = workerSearchQueryInput.value
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
  workerSearchQueryInput.value = ''
  workerSearchQuery.value = ''
  isSearchFocused.value = false
  if (searchInputRef.value) {
    searchInputRef.value.blur()
  }
}

const workerTeamFilter = ref<string>('')
const workerShiftFilter = ref<string>('')
const workerNoFilter = ref<string>('')
const workerSortBy = ref<'name-asc' | 'name-desc' | 'no-asc' | 'role-asc' | 'team-asc' | 'joined-asc'>('name-asc')
const selectedMonthFilter = ref<string>(getLocalDateStr().slice(0, 7))

function hasValidWorkerNo(worker: { no_karyawan?: string; id?: string }): boolean {
  const no = worker.no_karyawan ? worker.no_karyawan.trim() : ''
  return !!(no && no !== '-' && !isTempWorkerNo(no))
}

const noNikCount = computed(() => {
  return teamStore.allWorkers.filter(w => !hasValidWorkerNo(w)).length
})

const visibleWorkerCount = ref(50)
watch([workerSearchQuery, workerTeamFilter, workerShiftFilter, workerNoFilter, workerSortBy, selectedMonthFilter], () => {
  visibleWorkerCount.value = 50
})

const displayedWorkers = computed(() => {
  return filteredWorkers.value.slice(0, visibleWorkerCount.value)
})

function formatMonthLabel(monthStr: string): string {
  if (!monthStr) return ''
  const [y, m] = monthStr.split('-')
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const monthIdx = parseInt(m, 10) - 1
  return `${months[monthIdx] || m} ${y}`
}

// ─── Performance Cache: Worker Monthly Stats Map ─────────────────────────────
// Computed Map: workerId => stats object (calculated ONCE per selected month / logs update)
const workerMonthlyStatsMap = computed<Map<string, {
  statusText: string
  statusBg: string
  statusDot: string
  totalPcs: number
  presentDays: number
  isNotJoinedYet: boolean
}>>(() => {
  const map = new Map()
  const monthStr = selectedMonthFilter.value || getLocalDateStr().slice(0, 7)
  const [yearStr, mStr] = monthStr.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(mStr, 10)

  const lastDayObj = new Date(year, month, 0)
  const monthEndStr = getLocalDateStr(lastDayObj)

  const monthLogs = productionStore.logs.filter(
    l => l.date && l.date.startsWith(monthStr)
  )

  const workerLogsMap = new Map<string, Array<any>>()
  for (const log of monthLogs) {
    for (const worker of teamStore.allWorkers) {
      if (isWorkerInLog(log, worker)) {
        let arr = workerLogsMap.get(worker.id)
        if (!arr) {
          arr = []
          workerLogsMap.set(worker.id, arr)
        }
        arr.push(log)
      }
    }
  }

  for (const worker of teamStore.allWorkers) {
    const joinedStr = worker.joined_date || ''
    let statusText = workerStatusMap.value?.get(worker.id)?.text || worker.status || 'Aktif'
    let statusBg = workerStatusMap.value?.get(worker.id)?.bgClass || 'bg-teal-500/10 text-teal-300 border-teal-500/30'
    let statusDot = workerStatusMap.value?.get(worker.id)?.dotClass || 'bg-teal-400'

    if (joinedStr && joinedStr > monthEndStr) {
      statusText = 'Belum Masuk'
      statusBg = 'bg-slate-900 text-slate-400 border-slate-800'
      statusDot = 'bg-slate-500'
    }

    const wLogs = workerLogsMap.get(worker.id) || []
    let totalPcs = 0
    const uniqueDates = new Set<string>()

    for (const log of wLogs) {
      totalPcs += getWorkerShareForLog(log)
      if (log.date) uniqueDates.add(log.date)
    }

    map.set(worker.id, {
      statusText,
      statusBg,
      statusDot,
      totalPcs,
      presentDays: uniqueDates.size,
      isNotJoinedYet: !!(joinedStr && joinedStr > monthEndStr)
    })
  }

  return map
})

function getWorkerMonthlyStats(worker: { id: string }, _monthStr?: string) {
  const cached = workerMonthlyStatsMap.value.get(worker.id)
  if (cached) return cached
  return {
    statusText: 'Aktif',
    statusBg: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
    statusDot: 'bg-teal-400',
    totalPcs: 0,
    presentDays: 0,
    isNotJoinedYet: false
  }
}



// v-click-outside directive
const vClickOutside = {
  mounted(el: HTMLElement, binding: { value: () => void }) {
    (el as any)._clickOutsideHandler = (event: MouseEvent) => {
      if (!el.contains(event.target as Node)) binding.value()
    }
    document.addEventListener('click', (el as any)._clickOutsideHandler)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', (el as any)._clickOutsideHandler)
  }
}

function getTeamDisplayShift(team: { members?: Array<{ shift?: string }> }): string {
  if (!team || !team.members || team.members.length === 0) return 'Tanpa Shift'
  const memberShifts = team.members.map(m => m.shift).filter(Boolean) as string[]
  const unique = [...new Set(memberShifts)]
  if (unique.length === 0) return 'Tanpa Shift'
  return unique.map(s => shiftStore.formatShiftDisplay(s)).join(', ')
}

const uniqueShifts = computed(() => {
  const shiftsSet = new Set<string>()
  for (const team of teamStore.teams) {
    for (const member of team.members || []) {
      if (member.shift) shiftsSet.add(member.shift)
    }
  }
  return [...shiftsSet].sort()
})

const filteredTeams = computed(() => {
  if (!shiftFilter.value) return teamStore.teams
  return teamStore.teams.filter(t =>
    t.members && t.members.some(m => m.shift === shiftFilter.value)
  )
})

// ─── Performance Cache: Team Achieved Output ──────────────────────────────────
// Computed Map: teamId => achieved output (avoids calling filter().reduce() per team per render)
const teamAchievedMap = computed<Map<string, number>>(() => {
  const todayStr = productionStore.currentDateStr
  const map = new Map<string, number>()
  const todayLogs = productionStore.logs.filter(
    log => log.date === todayStr && log.total_qty > 0
  )
  for (const log of todayLogs) {
    if (!log.team_id) continue
    map.set(log.team_id, (map.get(log.team_id) ?? 0) + (log.total_qty || 0))
  }
  return map
})

// Cached: teamId => split output per present member
const teamSplitOutputMap = computed<Map<string, number>>(() => {
  const map = new Map<string, number>()
  for (const team of teamStore.teams) {
    const total = teamAchievedMap.value.get(team.id) ?? 0
    const members = team.members?.length || 1
    map.set(team.id, Math.floor(total / members))
  }
  return map
})

// ─── Performance Cache: Worker Status Display ─────────────────────────────────
// Computed Map: workerId => status display object (avoids calling per-row per render)
const workerStatusMap = computed<Map<string, ReturnType<typeof getWorkerStatusDisplay>>>(() => {
  const map = new Map<string, ReturnType<typeof getWorkerStatusDisplay>>()
  for (const w of teamStore.allWorkers) {
    map.set(w.id, getWorkerStatusDisplay(w))
  }
  return map
})

// Worker Report Modal
const showWorkerReportModal = ref(false)
const selectedReportWorker = ref<any>(null)

// Mandor Report Modal
const showMandorReportModal = ref(false)

// Monthly Recap Modal
const showMonthlyRecapModal = ref(false)

// Modal Visibility Controls
const showTeamMemberModal = ref(false)
const showMasterWorkerModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)

// Team CRUD Modals Controls
const showAddTeamModal = ref(false)
const showEditTeamModal = ref(false)
const showDeleteTeamModal = ref(false)
const selectedTeamToDelete = ref<{ id: string; name: string } | null>(null)
const selectedTeamToEdit = ref<{ id: string; name: string; target: number } | null>(null)

const editingTeamMembers = ref<Array<{ id: string; full_name: string; role: string; avatar_url?: string }>>([])
const activePresentMemberIds = ref<string[]>([])

const teamNameInput = ref('')
const teamDailyTargetInput = ref(1260)
const teamAchievedInput = ref(0)

const currentTeamId = ref('')
const targetTeamId = ref('')
const selectedMember = ref<{ 
  id: string; 
  full_name: string; 
  role: string;
  no_karyawan?: string;
  joined_date?: string;
  phone_number?: string;
  shift?: string;
  status?: string;
} | null>(null)

const memberNameInput = ref('')
const memberRoleInput = ref('')
const memberNoInput = ref('')
const memberJoinedDateInput = ref('')
const memberPhoneInput = ref('')
const memberShiftInput = ref('Shift Pagi')
const memberStatusInput = ref('Aktif')

const workerShiftOptions = computed<ComboboxOption[]>(() => shiftStore.workerShiftOptions)

const defaultStatusOptions: ComboboxOption[] = [
  { label: 'Aktif', value: 'Aktif' },
  { label: 'Baru', value: 'Baru' },
  { label: 'Keluar', value: 'Keluar' },
  { label: 'Cuti', value: 'Cuti' },
  { label: 'Training', value: 'Training' }
]

const customStatuses = ref<ComboboxOption[]>([])

function loadCustomStatuses() {
  try {
    const saved = localStorage.getItem('earflow_worker_status_options')
    if (saved !== null) {
      const parsed = JSON.parse(saved) as ComboboxOption[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        customStatuses.value = parsed
        return
      }
    }
  } catch {}
  customStatuses.value = defaultStatusOptions
}

const workerStatusOptions = computed<ComboboxOption[]>(() => customStatuses.value)

function handleStatusOptionsUpdate(newOptions: ComboboxOption[]) {
  customStatuses.value = newOptions
  try {
    localStorage.setItem('earflow_worker_status_options', JSON.stringify(newOptions))
  } catch {}
}

function getWorkerWorkingDays(joinedDateStr?: string): number {
  if (!joinedDateStr) return 1
  const joinedDate = new Date(joinedDateStr)
  if (isNaN(joinedDate.getTime())) return 1
  const today = new Date()
  const d1 = new Date(joinedDate.getFullYear(), joinedDate.getMonth(), joinedDate.getDate())
  const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffTime = d2.getTime() - d1.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays + 1)
}

function getWorkerStatusDisplay(worker: { team_id?: string; status?: string; joined_date?: string }) {
  const rawStatus = (worker.status || '').trim()
  const lower = rawStatus.toLowerCase()
  const days = getWorkerWorkingDays(worker.joined_date)

  if (lower === 'baru' || lower.startsWith('baru')) {
    if (days <= 7) {
      return {
        text: `Baru (${days} Hari)`,
        type: 'baru',
        bgClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        dotClass: 'bg-blue-400 animate-pulse'
      }
    } else {
      return {
        text: `Aktif (${days} Hari)`,
        type: 'aktif',
        bgClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-400'
      }
    }
  }

  if (lower === 'keluar') {
    return {
      text: 'Keluar',
      type: 'keluar',
      bgClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      dotClass: 'bg-rose-400'
    }
  }

  if (rawStatus) {
    if (lower === 'aktif') {
      return {
        text: `Aktif (${days} Hari)`,
        type: 'aktif',
        bgClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-400'
      }
    }
    return {
      text: rawStatus,
      type: 'custom',
      bgClass: 'bg-slate-800 text-teal-300 border-teal-500/30',
      dotClass: 'bg-teal-400'
    }
  }

  if (worker.team_id === UNASSIGNED_TEAM_ID) {
    return {
      text: t('teams.notInTeamStatus') || 'Belum Masuk Tim',
      type: 'unassigned',
      bgClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      dotClass: 'bg-amber-400'
    }
  }

  return {
    text: `Aktif (${days} Hari)`,
    type: 'aktif',
    bgClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotClass: 'bg-emerald-400'
  }
}

const customRoles = ref<ComboboxOption[]>([])

function loadCustomRoles() {
  try {
    const saved = localStorage.getItem('earflow_role_options')
    if (saved !== null) {
      const parsed = JSON.parse(saved) as ComboboxOption[]
      if (Array.isArray(parsed)) {
        customRoles.value = parsed
        return
      }
    }
  } catch {}
  customRoles.value = [
    { label: t('teams.jobSolder'), value: 'Operator Solder' },
    { label: t('teams.jobGlue'), value: 'Operator Lem' },
    { label: t('teams.jobAssembly'), value: 'Assembly & QC' }
  ]
}

const roleOptions = computed<ComboboxOption[]>(() => {
  return customRoles.value
})

function handleRoleOptionsUpdate(newOptions: ComboboxOption[]) {
  customRoles.value = newOptions
  try {
    localStorage.setItem('earflow_role_options', JSON.stringify(newOptions))
  } catch {}
}

function formatRole(role?: string) {
  if (!role) return '-'
  const trimmed = role.trim()
  const lower = trimmed.toLowerCase()

  // 1. Check custom user roleOptions list first
  const found = roleOptions.value.find(r => 
    String(r.value).toLowerCase() === lower || 
    r.label.toLowerCase() === lower
  )
  if (found) return found.label

  // 2. Fallback to default legacy role mappings if not found in custom roleOptions
  if (lower === 'operator solder' || lower === 'operator_solder' || lower === 'job_solder') return t('teams.jobSolder')
  if (lower === 'operator lem' || lower === 'job_glue' || lower === 'pengeleman/casing & magnet') return t('teams.jobGlue')
  if (lower === 'assembly & qc' || lower === 'job_assembly' || lower === 'perakitan & quality control') return t('teams.jobAssembly')

  return trimmed
}

onMounted(async () => {
  loadCustomRoles()
  loadCustomStatuses()
  await teamStore.loadTeams()
  await productionStore.loadLogs()
  if (teamStore.teams.length > 0) {
    targetTeamId.value = teamStore.teams[0].id
  }
})

function getTeamDailyTarget(hourlyTarget: number) {
  // hourly_target field now stores the DAILY total target directly
  return hourlyTarget || 0
}

// These functions are kept for backwards compat but their results are now cached via computed Maps
function getTeamAchievedOutput(teamId: string) {
  return teamAchievedMap.value.get(teamId) ?? 0
}

function getWorkerSplitOutput(_team: { id: string; members: Array<any> }) {
  return teamSplitOutputMap.value.get(_team.id) ?? 0
}

function openWorkerReport(worker: any, team?: any) {
  const workerTeam = team || teamStore.teams.find(t => t.id === worker.team_id)
  const resolvedShift = worker.shift || (workerTeam?.shift && workerTeam.shift !== '-' ? workerTeam.shift : 'Shift Pagi')

  selectedReportWorker.value = {
    ...worker,
    team_id: workerTeam?.id || worker.team_id,
    team_name: workerTeam?.name || worker.team_name,
    shift: resolvedShift
  }
  showWorkerReportModal.value = true
}

const activeUnassignedCount = computed(() => {
  const currentMonth = getLocalDateStr().slice(0, 7)
  return teamStore.unassignedMembers.filter(m => {
    const status = (m.status || '').toLowerCase()
    const isOut = status.includes('keluar') || status.includes('out')
    if (!isOut) return true
    // If exit_date is set, hide only if current month is after exit month
    if (m.exit_date) return currentMonth <= m.exit_date
    return false // legacy: no exit_date → hide
  }).length
})

const teamFilterOptions = computed<ComboboxOption[]>(() => {
  return [
    { label: t('teams.allWorkers'), value: '' },
    { label: t('teams.notInTeamWithCount', { count: activeUnassignedCount.value }), value: UNASSIGNED_TEAM_ID },
    ...teamStore.teams.map(t => ({ label: t.name, value: t.id }))
  ]
})

const teamSelectOptions = computed<ComboboxOption[]>(() => {
  return [
    { label: t('teams.unassignedReserve'), value: UNASSIGNED_TEAM_ID },
    ...teamStore.teams.map(t => ({ label: t.name, value: t.id }))
  ]
})

const workerSelectOptions = computed<ComboboxOption[]>(() => {
  return teamStore.allWorkers.map(w => ({
    label: `${w.full_name} (${w.team_name})`,
    value: w.id
  }))
})

const selectedTeamName = computed(() => {
  const found = teamStore.teams.find(t => t.id === currentTeamId.value)
  return found ? found.name : 'Tim'
})

const workerShiftFilterOptions = computed<ComboboxOption[]>(() => [
  { label: 'Semua Shift Karyawan', value: '' },
  ...shiftStore.shifts.map(s => ({
    label: `${s.name} (${s.startTime} - ${s.endTime})`,
    value: `${s.name} (${s.startTime} - ${s.endTime})`
  }))
])

const workerSortOptions = computed<ComboboxOption[]>(() => [
  { label: t('teams.sortByNameAsc'), value: 'name-asc' },
  { label: t('teams.sortByNameDesc'), value: 'name-desc' },
  { label: t('teams.sortByNoAsc'), value: 'no-asc' },
  { label: t('teams.sortByRoleAsc'), value: 'role-asc' },
  { label: t('teams.sortByTeamAsc'), value: 'team-asc' },
  { label: 'Tgl Masuk (Terlama)', value: 'joined-asc' }
])

function toggleSort(type: 'name' | 'no' | 'role' | 'team' | 'joined') {
  if (type === 'no') {
    workerSortBy.value = workerSortBy.value === 'no-asc' ? 'name-asc' : 'no-asc'
  } else if (type === 'name') {
    workerSortBy.value = workerSortBy.value === 'name-asc' ? 'name-desc' : 'name-asc'
  } else if (type === 'role') {
    workerSortBy.value = workerSortBy.value === 'role-asc' ? 'name-asc' : 'role-asc'
  } else if (type === 'team') {
    workerSortBy.value = workerSortBy.value === 'team-asc' ? 'name-asc' : 'team-asc'
  } else if (type === 'joined') {
    workerSortBy.value = workerSortBy.value === 'joined-asc' ? 'name-asc' : 'joined-asc'
  }
}

const workersWithLogsInSelectedMonth = computed<Set<string>>(() => {
  const set = new Set<string>()
  const monthStr = selectedMonthFilter.value
  if (!monthStr) return set
  const monthLogs = productionStore.logs.filter(
    l => l.date && l.date.startsWith(monthStr)
  )
  for (const log of monthLogs) {
    for (const w of teamStore.allWorkers) {
      if (isWorkerInLog(log, w)) {
        set.add(w.id)
      }
    }
  }
  return set
})

const filteredWorkers = computed(() => {
  const query = workerSearchQuery.value.trim().toLowerCase()

  // Pre-resolve shift object outside the loop
  const selectedShiftObj = workerShiftFilter.value
    ? (shiftStore.getShiftByName(workerShiftFilter.value) || { name: workerShiftFilter.value })
    : undefined
  const hasShiftFilter = !!workerShiftFilter.value
  const hasTeamFilter = !!workerTeamFilter.value
  const hasQuery = !!query

  const list = teamStore.allWorkers.filter(w => {
    if (hasQuery) {
      const nameMatch = w.full_name.toLowerCase().includes(query)
      const roleMatch = w.role.toLowerCase().includes(query)
      const noMatch = w.no_karyawan && w.no_karyawan.toLowerCase().includes(query)
      if (!nameMatch && !roleMatch && !noMatch) return false
    }
    if (hasTeamFilter) {
      const matchesTeam = w.team_id === workerTeamFilter.value || w.team_name.toLowerCase().includes(workerTeamFilter.value.toLowerCase())
      if (!matchesTeam) return false
    }
    if (hasShiftFilter) {
      if (!isWorkerMatchingShift(w, selectedShiftObj, teamStore.teams)) return false
    }
    if (workerNoFilter.value === 'empty') {
      if (hasValidWorkerNo(w)) return false
    }

    // Exclude workers with status 'Keluar' based on their exit month:
    // - If exit_date is set: hide when viewing any month AFTER their exit month
    //   (e.g. exit_date='2026-08' → visible in Aug, hidden from Sep onwards)
    // - Legacy fallback (no exit_date): hide if no production logs in selected month
    const isOut = (w.status || '').toLowerCase().includes('keluar') || (w.status || '').toLowerCase().includes('out')
    if (isOut) {
      const selectedMonth = selectedMonthFilter.value || getLocalDateStr().slice(0, 7)
      if (w.exit_date) {
        // Hide if the selected month is AFTER (strictly greater than) the exit month
        if (selectedMonth > w.exit_date) return false
      } else {
        // Legacy: hide if worker has no logs in the selected month
        if (!workersWithLogsInSelectedMonth.value.has(w.id)) return false
      }
    }

    return true
  })

  return list.sort((a, b) => {
    if (workerSortBy.value === 'name-asc') {
      return a.full_name.localeCompare(b.full_name, undefined, { numeric: true, sensitivity: 'base' })
    } else if (workerSortBy.value === 'name-desc') {
      return b.full_name.localeCompare(a.full_name, undefined, { numeric: true, sensitivity: 'base' })
    } else if (workerSortBy.value === 'no-asc') {
      const noA = a.no_karyawan || a.id
      const noB = b.no_karyawan || b.id
      return noA.localeCompare(noB, undefined, { numeric: true, sensitivity: 'base' })
    } else if (workerSortBy.value === 'role-asc') {
      const roleA = formatRole(a.role)
      const roleB = formatRole(b.role)
      return roleA.localeCompare(roleB, undefined, { numeric: true, sensitivity: 'base' })
    } else if (workerSortBy.value === 'team-asc') {
      return a.team_name.localeCompare(b.team_name, undefined, { numeric: true, sensitivity: 'base' })
    } else if (workerSortBy.value === 'joined-asc') {
      const dA = a.joined_date || '9999-12-31'
      const dB = b.joined_date || '9999-12-31'
      return dA.localeCompare(dB)
    }
    return 0
  })
})

const monthNamesShort = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

function formatJoinedDate(dateStr?: string): string {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const d = parseInt(parts[2])
  const m = parseInt(parts[1]) - 1
  const y = parts[0]
  return `${d} ${monthNamesShort[m] ?? ''} ${y}`
}

function getDisplayWorkerNo(worker: { no_karyawan?: string; id?: string }): string {
  const no = worker.no_karyawan ? worker.no_karyawan.trim() : ''
  if (!no || no === '-' || isTempWorkerNo(no)) {
    return '-'
  }
  return no
}

async function handleAddTeamFromCombobox(newOpt: ComboboxOption) {
  await teamStore.addTeam(newOpt.label, 180)
}

async function handleDeleteTeamFromCombobox(opt: ComboboxOption) {
  if (opt.value && opt.value !== UNASSIGNED_TEAM_ID) {
    await teamStore.deleteTeam(String(opt.value))
  }
}

async function handleEditTeamFromCombobox(opt: ComboboxOption, newLabel: string) {
  if (opt.value && opt.value !== UNASSIGNED_TEAM_ID) {
    const team = teamStore.teams.find(t => t.id === opt.value)
    if (team) {
      await teamStore.updateTeam(team.id, newLabel, team.hourly_target)
    }
  }
}

// Team CRUD Actions
function openAddTeamModal() {
  teamNameInput.value = ''
  teamDailyTargetInput.value = 1260
  showAddTeamModal.value = true
}

async function handleSaveNewTeam() {
  if (!teamNameInput.value) return
  // Store daily target directly — no rounding conversion
  await teamStore.addTeam(teamNameInput.value, teamDailyTargetInput.value || 602)
  showAddTeamModal.value = false
}

function openEditTeamModal(team: { id: string; name: string; hourly_target: number; shift?: string; members?: any[] }) {
  selectedTeamToEdit.value = { id: team.id, name: team.name, target: team.hourly_target }
  teamNameInput.value = team.name
  teamDailyTargetInput.value = team.hourly_target || 602  // hourly_target now stores daily target
  
  editingTeamMembers.value = [...(team.members || [])]
  activePresentMemberIds.value = team.members ? team.members.map(m => m.id) : []

  const currentTotal = getTeamAchievedOutput(team.id)
  teamAchievedInput.value = currentTotal
  showEditTeamModal.value = true
}

function toggleMemberAttendance(memberId: string) {
  const idx = activePresentMemberIds.value.indexOf(memberId)
  if (idx !== -1) {
    activePresentMemberIds.value.splice(idx, 1)
  } else {
    activePresentMemberIds.value.push(memberId)
  }
}

async function handleSaveEditTeam() {
  if (!selectedTeamToEdit.value || !teamNameInput.value) return
  const teamId = selectedTeamToEdit.value.id
  // Store daily target directly — no rounding conversion to prevent drift
  await teamStore.updateTeam(teamId, teamNameInput.value, teamDailyTargetInput.value || 602)
  
  // Set output cleanly for today without negative diff logs
  const newAchieved = Math.max(0, teamAchievedInput.value || 0)
  await productionStore.setTeamTodayOutput(
    teamId,
    teamNameInput.value,
    newAchieved,
    [...activePresentMemberIds.value]
  )

  showEditTeamModal.value = false
}

function confirmDeleteTeam(team: { id: string; name: string }) {
  selectedTeamToDelete.value = team
  showDeleteTeamModal.value = true
}

function handleDeleteTeamFromEditModal() {
  if (!selectedTeamToEdit.value) return
  const team = teamStore.teams.find(t => t.id === selectedTeamToEdit.value!.id) || { id: selectedTeamToEdit.value.id, name: selectedTeamToEdit.value.name }
  showEditTeamModal.value = false
  confirmDeleteTeam(team)
}

async function handleConfirmDeleteTeam() {
  if (!selectedTeamToDelete.value) return
  await teamStore.deleteTeam(selectedTeamToDelete.value.id)
  showDeleteTeamModal.value = false
}

function triggerDeleteAllTeams() {
  if (teamStore.teams.length === 0) return
  const teamCount = teamStore.teams.length
  const memberCount = teamStore.teams.reduce((acc, t) => acc + t.members.length, 0)
  dialogType.value = 'confirm'
  dialogTitle.value = '⚠️ Hapus Semua Tim'
  dialogMessage.value = `Anda akan menghapus ${teamCount} tim sekaligus. Semua anggota (${memberCount} karyawan) akan dipindahkan ke kategori "Belum Masuk Tim" dan tidak akan dihapus dari sistem.\n\nTindakan ini tidak dapat dibatalkan. Yakin ingin melanjutkan?`
  dialogButtonText.value = `Ya, Hapus ${teamCount} Tim`
  dialogCancelButtonText.value = 'Batal'
  onDialogConfirm = async () => {
    await teamStore.deleteAllTeams()
  }
  showDialog.value = true
}

function handleSelectExistingWorkerToAssign(val: string | number) {
  const valStr = String(val)
  const existing = teamStore.allWorkers.find(w => w.id === valStr || w.full_name.toLowerCase() === valStr.toLowerCase())
  if (existing) {
    memberNameInput.value = existing.full_name
    memberRoleInput.value = existing.role
    const noKaryawan = existing.no_karyawan
    memberNoInput.value = (noKaryawan && !/^w[-_]/i.test(noKaryawan) && noKaryawan !== '-') ? noKaryawan : ''
    memberJoinedDateInput.value = existing.joined_date || getLocalDateStr()
    memberPhoneInput.value = (existing.phone_number && existing.phone_number !== '-') ? existing.phone_number : ''
    memberShiftInput.value = existing.shift || 'Shift Pagi'
    memberStatusInput.value = existing.status || 'Aktif'
  }
}

function handleAddNewWorkerFromCombobox(newVal: string) {
  memberNameInput.value = newVal
  memberNoInput.value = ''
  memberJoinedDateInput.value = getLocalDateStr()
  memberPhoneInput.value = ''
  memberShiftInput.value = 'Shift Pagi'
  memberStatusInput.value = 'Baru'
}

function triggerAddTeamMember() {
  currentTeamId.value = selectedTeamToEdit.value ? selectedTeamToEdit.value.id : ''
  targetTeamId.value = currentTeamId.value
  memberNameInput.value = ''
  memberRoleInput.value = 'Operator Solder'
  memberNoInput.value = ''
  memberJoinedDateInput.value = getLocalDateStr()
  memberPhoneInput.value = ''
  memberShiftInput.value = 'Shift Pagi'
  memberStatusInput.value = 'Aktif'
  showEditTeamModal.value = false
  showTeamMemberModal.value = true
}

function triggerAddMasterWorker(teamId?: string) {
  targetTeamId.value = teamId || UNASSIGNED_TEAM_ID
  memberNameInput.value = ''
  memberRoleInput.value = 'Operator Solder'
  memberNoInput.value = ''
  memberJoinedDateInput.value = getLocalDateStr()
  memberPhoneInput.value = ''
  memberShiftInput.value = 'Shift Pagi'
  memberStatusInput.value = 'Baru'
  showMasterWorkerModal.value = true
}

function findDuplicateWorker(
  _name: string,
  noKaryawan?: string,
  excludeWorkerId?: string
) {
  const rawNo = (noKaryawan || '').trim()
  const cleanNo = rawNo && rawNo !== '-' && !isTempWorkerNo(rawNo) ? rawNo.toLowerCase() : ''

  // Only check duplicate if NIK is filled and valid.
  // Multiple workers can be without NIK or share names.
  if (!cleanNo) return undefined

  return teamStore.allWorkers.find(w => {
    if (excludeWorkerId && w.id === excludeWorkerId) return false
    const wRawNo = (w.no_karyawan || '').trim()
    const wNo = wRawNo && wRawNo !== '-' && !isTempWorkerNo(wRawNo) ? wRawNo.toLowerCase() : ''

    if (cleanNo && wNo && wNo === cleanNo) return true
    return false
  })
}

async function handleSaveTeamMember() {
  if (!currentTeamId.value || !memberNameInput.value.trim()) return

  await teamStore.assignOrAddMemberToTeam(
    currentTeamId.value, 
    memberNameInput.value.trim(), 
    memberRoleInput.value,
    memberNoInput.value,
    memberJoinedDateInput.value,
    memberPhoneInput.value,
    memberShiftInput.value,
    memberStatusInput.value
  )
  showTeamMemberModal.value = false
}

async function handleSaveMasterWorker() {
  if (!memberNameInput.value.trim()) return

  // Validation: Check duplicate worker NIK
  const existing = findDuplicateWorker(memberNameInput.value, memberNoInput.value)
  if (existing) {
    dialogType.value = 'alert'
    dialogTitle.value = '⚠️ NIK Karyawan Sudah Ada'
    dialogMessage.value = `NIK "${memberNoInput.value.trim()}" sudah digunakan oleh karyawan lain (${existing.full_name}). Mohon gunakan NIK yang berbeda.`
    dialogButtonText.value = 'Mengerti'
    onDialogConfirm = null
    showDialog.value = true
    return
  }

  const destTeam = targetTeamId.value || UNASSIGNED_TEAM_ID

  if (destTeam === UNASSIGNED_TEAM_ID) {
    await teamStore.addUnassignedWorker(
      memberNameInput.value.trim(), 
      memberRoleInput.value,
      memberNoInput.value,
      memberJoinedDateInput.value,
      memberPhoneInput.value,
      memberShiftInput.value,
      memberStatusInput.value
    )
  } else {
    await teamStore.addMemberToTeam(
      destTeam,
      memberNameInput.value.trim(),
      memberRoleInput.value,
      memberNoInput.value,
      memberJoinedDateInput.value,
      memberPhoneInput.value,
      memberShiftInput.value,
      memberStatusInput.value
    )
  }
  showMasterWorkerModal.value = false
}

function openEditMemberModal(teamId: string, member: any) {
  currentTeamId.value = teamId
  targetTeamId.value = teamId
  selectedMember.value = member
  memberNameInput.value = member.full_name
  memberRoleInput.value = member.role
  const noKaryawan = member.no_karyawan
  memberNoInput.value = (noKaryawan && !/^w[-_]/i.test(noKaryawan) && noKaryawan !== '-') ? noKaryawan : ''
  memberJoinedDateInput.value = member.joined_date || getLocalDateStr()
  memberPhoneInput.value = (member.phone_number && member.phone_number !== '-') ? member.phone_number : ''
  memberShiftInput.value = member.shift || 'Shift Pagi'
  memberStatusInput.value = member.status || (member.team_id === UNASSIGNED_TEAM_ID ? 'Baru' : 'Aktif')
  showEditModal.value = true
}

async function handleSaveEditMember() {
  if (!currentTeamId.value || !selectedMember.value || !memberNameInput.value.trim()) return
  const memberToEdit = selectedMember.value

  // Duplicate Check against other workers
  const dup = findDuplicateWorker(memberNameInput.value, memberNoInput.value, memberToEdit.id)
  if (dup) {
    dialogType.value = 'alert'
    dialogTitle.value = '⚠️ Nama / NIK Bentrok'
    dialogMessage.value = `Nama "${memberNameInput.value.trim()}" atau NIK sudah digunakan oleh karyawan lain (${dup.full_name} - ${dup.team_name}). Mohon gunakan nama / NIK yang berbeda.`
    dialogButtonText.value = 'Mengerti'
    onDialogConfirm = null
    showDialog.value = true
    return
  }

  const targetId = targetTeamId.value || currentTeamId.value

  try {
    await teamStore.editMember(
      currentTeamId.value,
      memberToEdit.id,
      memberNameInput.value.trim(),
      memberRoleInput.value,
      targetId,
      memberNoInput.value,
      memberJoinedDateInput.value || undefined,
      memberPhoneInput.value || undefined,
      memberShiftInput.value || 'Shift Pagi',
      memberStatusInput.value || 'Aktif'
    )
    showEditModal.value = false
  } catch (err) {
    console.error('[EditMember] Gagal menyimpan:', err)
  }
}

function confirmDeleteMember(teamId: string, member: { id: string; full_name: string; role: string }) {
  currentTeamId.value = teamId
  selectedMember.value = member
  showDeleteModal.value = true
}

async function handleConfirmDeleteMember() {
  if (!currentTeamId.value || !selectedMember.value) return
  await teamStore.deleteMember(currentTeamId.value, selectedMember.value.id, true) // Force permanent deletion
  showDeleteModal.value = false
}

// Modal Back-Button History Support
const activeModalStack = ref<string[]>([])
let isProgrammaticBack = false

function pushModalState(modalName: string) {
  if (!activeModalStack.value.includes(modalName)) {
    activeModalStack.value.push(modalName)
    window.history.pushState({ modalOpen: modalName }, '')
    window.addEventListener('popstate', onPopState)
  }
}

function popModalState(modalName: string) {
  const index = activeModalStack.value.indexOf(modalName)
  if (index !== -1) {
    activeModalStack.value.splice(index, 1)
    if (window.history.state?.modalOpen === modalName) {
      isProgrammaticBack = true
      window.history.back()
    }
  }
}

function onPopState(_e: PopStateEvent) {
  if (isProgrammaticBack) {
    isProgrammaticBack = false
    return
  }
  if (activeModalStack.value.length > 0) {
    const poppedModal = activeModalStack.value.pop()
    closeModalByName(poppedModal)
  }
}

function closeModalByName(name: string | undefined) {
  if (!name) return
  if (name === 'editTeam') showEditTeamModal.value = false
  else if (name === 'addTeam') showAddTeamModal.value = false
  else if (name === 'workerReport') showWorkerReportModal.value = false
  else if (name === 'mandorReport') showMandorReportModal.value = false
  else if (name === 'editMember') showEditModal.value = false
  else if (name === 'addMember') showTeamMemberModal.value = false
  else if (name === 'addMasterMember') showMasterWorkerModal.value = false
  else if (name === 'deleteMember') showDeleteModal.value = false
  else if (name === 'customDialog') showDialog.value = false
}

// Watchers
watch(showEditTeamModal, (val) => {
  if (val) pushModalState('editTeam')
  else popModalState('editTeam')
})
watch(showAddTeamModal, (val) => {
  if (val) pushModalState('addTeam')
  else popModalState('addTeam')
})
watch(showWorkerReportModal, (val) => {
  if (val) pushModalState('workerReport')
  else popModalState('workerReport')
})
watch(showMandorReportModal, (val) => {
  if (val) pushModalState('mandorReport')
  else popModalState('mandorReport')
})
watch(showEditModal, (val) => {
  if (val) pushModalState('editMember')
  else popModalState('editMember')
})
watch(showTeamMemberModal, (val) => {
  if (val) pushModalState('addMember')
  else popModalState('addMember')
})
watch(showMasterWorkerModal, (val) => {
  if (val) pushModalState('addMasterMember')
  else popModalState('addMasterMember')
})
watch(showDeleteModal, (val) => {
  if (val) pushModalState('deleteMember')
  else popModalState('deleteMember')
})
// Custom Dialog Alert/Confirm State
const showDialog = ref(false)
const dialogType = ref<'alert' | 'confirm'>('confirm')
const dialogTitle = ref('')
const dialogMessage = ref('')
const dialogButtonText = ref('Ya, Lanjutkan')
const dialogCancelButtonText = ref('Batal')
let onDialogConfirm: (() => void) | null = null

function closeDialog(confirmed: boolean) {
  showDialog.value = false
  if (confirmed && onDialogConfirm) {
    onDialogConfirm()
  }
}

watch(showDialog, (val) => {
  if (val) pushModalState('customDialog')
  else popModalState('customDialog')
})

const isAnyModalOpen = computed(() => {
  return showAddTeamModal.value ||
    showEditTeamModal.value ||
    showDeleteTeamModal.value ||
    showTeamMemberModal.value ||
    showMasterWorkerModal.value ||
    showEditModal.value ||
    showDeleteModal.value ||
    showWorkerReportModal.value ||
    showMandorReportModal.value ||
    showMonthlyRecapModal.value ||
    showDialog.value
})

function handleHeaderMenuToggle() {
  showHeaderMenu.value = !showHeaderMenu.value
}

onMounted(() => {
  window.addEventListener('toggle-header-menu', handleHeaderMenuToggle)
})

onUnmounted(() => {
  window.removeEventListener('toggle-header-menu', handleHeaderMenuToggle)
})

watch(isAnyModalOpen, (isOpen) => {
  if (isOpen) {
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
  window.removeEventListener('popstate', onPopState)
})

async function confirmResetTeamOutput(team: { id: string; name: string; members?: any[] }) {
  const currentTotal = getTeamAchievedOutput(team.id)
  if (currentTotal === 0) {
    dialogType.value = 'alert'
    dialogTitle.value = 'Informasi Reset'
    dialogMessage.value = `Hasil produksi untuk ${team.name} hari ini sudah berada pada angka 0 Pcs.`
    dialogButtonText.value = 'Mengerti'
    onDialogConfirm = null
    showDialog.value = true
    return
  }
  
  dialogType.value = 'confirm'
  dialogTitle.value = 'Reset Hasil Tim'
  dialogMessage.value = `Apakah Anda yakin ingin me-reset hasil produksi ${team.name} hari ini kembali ke 0 Pcs?`
  dialogButtonText.value = 'Ya, Reset Hasil'
  dialogCancelButtonText.value = 'Batal'
  onDialogConfirm = async () => {
    await productionStore.resetTeamTodayLogs(team.id)
  }
  showDialog.value = true
}

function openAddMasterWorkerModal() {
  triggerAddMasterWorker()
}

function exportWorkerTableToExcel() {
  const workers = filteredWorkers.value.length > 0 ? filteredWorkers.value : teamStore.allWorkers
  const monthLabel = formatMonthLabel(selectedMonthFilter.value)

  const headers = [
    'No',
    'No. Karyawan (NIK)',
    'Nama Karyawan',
    'No. Telepon / HP',
    'Spesialisasi Role',
    'Tim Penugasan',
    'Shift Operasional',
    'Tanggal Masuk',
    `Status (${monthLabel})`
  ]

  const rows = workers.map((w, index) => {
    const stats = getWorkerMonthlyStats(w, selectedMonthFilter.value)
    return [
      index + 1,
      w.no_karyawan && w.no_karyawan !== '-' ? w.no_karyawan : (w.id && !/^w[-_]/i.test(w.id) ? w.id : '-'),
      w.full_name || '-',
      w.phone_number || '-',
      formatRole(w.role) || '-',
      w.team_id === UNASSIGNED_TEAM_ID ? 'Belum Masuk Tim' : (w.team_name || 'Belum Masuk Tim'),
      shiftStore.formatShiftDisplay(w.shift) || '-',
      w.joined_date ? formatJoinedDate(w.joined_date) : '-',
      stats.statusText
    ]
  })

  const filename = `Daftar_Karyawan_EarFlow_${selectedMonthFilter.value}.xlsx`
  exportToXlsx(filename, `Daftar Karyawan ${monthLabel}`, headers, rows)
  auditStore.logAction('Pekerja', 'Export Excel Karyawan', `Export ${rows.length} karyawan periode ${monthLabel} ke file ${filename}`)
}



// Watch teamStore to update editingTeamMembers in real-time when workers are assigned to the team
watch(
  () => {
    if (!selectedTeamToEdit.value) return ''
    const team = teamStore.teams.find(t => t.id === selectedTeamToEdit.value!.id)
    return team ? JSON.stringify(team.members) : ''
  },
  () => {
    if (showEditTeamModal.value && selectedTeamToEdit.value) {
      const team = teamStore.teams.find(t => t.id === selectedTeamToEdit.value!.id)
      if (team) {
        const newMembers = team.members || []
        editingTeamMembers.value = [...newMembers]
        
        // Auto-mark newly added members as present
        const currentIds = activePresentMemberIds.value
        for (const m of newMembers) {
          if (!currentIds.includes(m.id)) {
            activePresentMemberIds.value.push(m.id)
          }
        }
      }
    }
  }
)

function triggerRemoveMemberFromTeam(teamId: string, member: { id: string; full_name: string; role: string }) {
  const teamName = selectedTeamToEdit.value ? selectedTeamToEdit.value.name : 'tim'
  dialogType.value = 'confirm'
  dialogTitle.value = 'Keluarkan Anggota'
  dialogMessage.value = `Apakah Anda yakin ingin mengeluarkan ${member.full_name} dari ${teamName}? Pekerja ini tetap terdaftar di sistem dan dipindahkan ke kategori 'Belum Masuk Tim'.`
  dialogButtonText.value = 'Ya, Keluarkan'
  dialogCancelButtonText.value = 'Batal'
  onDialogConfirm = async () => {
    await teamStore.editMember(teamId, member.id, member.full_name, member.role, UNASSIGNED_TEAM_ID)
  }
  showDialog.value = true
}
</script>
