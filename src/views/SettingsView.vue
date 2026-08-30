<template>
  <div class="space-y-4 max-w-2xl pb-safe">

    <!-- ── Status Penyimpanan Lokal ── -->
    <div class="bg-slate-900/60 border border-slate-800/80 rounded-lg p-4 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Smartphone class="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 class="text-xs font-bold text-slate-100 font-mono">{{ t('settings.storageTitle') }}</h3>
            <p class="text-[11px] text-slate-400 leading-tight">{{ t('settings.storageSubtitle') }}</p>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
          {{ t('settings.storageActive') }}
        </span>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-3 gap-2 pt-0.5">
        <div class="p-2.5 rounded-md bg-slate-950/70 border border-slate-800 text-center">
          <p class="text-[10px] text-slate-500 font-mono">{{ t('settings.storageLabel') }}</p>
          <p class="text-xs font-bold text-emerald-400 mt-0.5">{{ t('settings.storageValue') }}</p>
        </div>
        <div class="p-2.5 rounded-md bg-slate-950/70 border border-slate-800 text-center">
          <p class="text-[10px] text-slate-500 font-mono">{{ t('settings.teamsLabel') }}</p>
          <p class="text-xs font-bold text-amber-400 mt-0.5">{{ teamStore.teams.length }} {{ t('settings.teamsUnit') }}</p>
        </div>
        <div class="p-2.5 rounded-md bg-slate-950/70 border border-slate-800 text-center">
          <p class="text-[10px] text-slate-500 font-mono">{{ t('settings.logsLabel') }}</p>
          <p class="text-xs font-bold text-teal-400 mt-0.5">{{ productionStore.logs.length }} {{ t('settings.logsUnit') }}</p>
        </div>
      </div>
    </div>

    <!-- ── Status & Sinkronisasi Cloud Supabase ── -->
    <div class="bg-slate-900/60 border border-slate-800/80 rounded-lg p-4 space-y-3.5">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
            <Cloud class="w-4 h-4 text-teal-400" />
          </div>
          <div class="min-w-0">
            <h3 class="text-xs font-bold text-slate-100 font-mono leading-tight">Database Cloud Supabase</h3>
            <p class="text-[11px] text-slate-400 leading-tight truncate">Sinkronisasi data otomatis multi-perangkat.</p>
          </div>
        </div>

        <span
          class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border shrink-0 flex items-center gap-1.5"
          :class="[
            syncStatus === 'connected' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
            syncStatus === 'syncing' ? 'bg-teal-500/15 text-teal-300 border-teal-500/30 animate-pulse' :
            syncStatus === 'error' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
            'bg-amber-500/15 text-amber-300 border-amber-500/30'
          ]"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="syncStatus === 'connected' ? 'bg-emerald-400' : (syncStatus === 'syncing' ? 'bg-teal-400' : 'bg-amber-400')"></span>
          <span>{{ syncStatus === 'connected' ? 'Cloud Terhubung' : (syncStatus === 'syncing' ? 'Menyinkronkan...' : (syncStatus === 'error' ? 'Gagal Terhubung' : 'Offline / Standby')) }}</span>
        </span>
      </div>

      <!-- Cloud Info Summary Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div class="p-2.5 rounded-md bg-slate-950/70 border border-slate-800 text-left">
          <p class="text-[10px] text-slate-500 font-mono">Status Jaringan</p>
          <p class="text-xs font-bold text-slate-200 mt-0.5">{{ productionStore.isOnline ? 'Online (Terhubung)' : 'Offline' }}</p>
        </div>
        <div class="p-2.5 rounded-md bg-slate-950/70 border border-slate-800 text-left">
          <p class="text-[10px] text-slate-500 font-mono">Terakhir Sync</p>
          <p class="text-xs font-bold text-teal-300 mt-0.5 truncate">{{ lastSyncTime || 'Belum pernah' }}</p>
        </div>
        <div class="p-2.5 rounded-md bg-slate-950/70 border border-slate-800 text-left col-span-2 sm:col-span-1">
          <p class="text-[10px] text-slate-500 font-mono">Belum Di-upload</p>
          <p class="text-xs font-bold text-amber-300 mt-0.5">{{ pendingSyncCount }} log lokal</p>
        </div>
      </div>

      <!-- Error / Notice banner if any -->
      <div v-if="lastSyncError" class="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-[11px] font-mono text-rose-300 flex items-center gap-2">
        <AlertCircle class="w-4 h-4 shrink-0 text-rose-400" />
        <span class="truncate">{{ lastSyncError }}</span>
      </div>

      <!-- Cloud Sync Action Buttons -->
      <div class="flex items-center gap-2 pt-1">
        <button
          type="button"
          @click="handleTestSupabase"
          :disabled="isTestingCloud"
          class="flex-1 h-9 px-3 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
        >
          <Activity class="w-3.5 h-3.5 text-teal-400" />
          <span>{{ isTestingCloud ? 'Memeriksa...' : 'Tes Koneksi Cloud' }}</span>
        </button>

        <button
          type="button"
          @click="handleManualCloudSync"
          :disabled="syncStatus === 'syncing'"
          class="flex-1 h-9 px-3 rounded-md bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 font-bold text-xs border border-teal-500/40 transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw class="w-3.5 h-3.5 text-teal-400" :class="{ 'animate-spin': syncStatus === 'syncing' }" />
          <span>{{ syncStatus === 'syncing' ? 'Sedang Sync...' : 'Sinkronkan Sekarang' }}</span>
        </button>
      </div>
    </div>


    <!-- ── Identitas Mandor / Pengawas ── -->
    <div class="bg-slate-900/60 border border-slate-800/80 rounded-lg p-4 space-y-3">
      <div class="flex items-center gap-2.5 border-b border-slate-800 pb-3">
        <div class="w-8 h-8 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
          <UserCheck class="w-4 h-4 text-teal-400" />
        </div>
        <div>
          <h3 class="text-xs font-bold text-slate-100 font-mono">Identitas Mandor / 生产管理</h3>
          <p class="text-[11px] text-slate-400 leading-tight">Ditampilkan pada seluruh sheet laporan.</p>
        </div>
      </div>

      <div class="space-y-1.5">
        <label class="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
          Nama Mandor / Manajer Produksi
        </label>
        <div class="flex items-center gap-2">
          <input
            type="text"
            v-model="foremanInput"
            @blur="handleSaveForeman"
            placeholder="Contoh: Pak Hendra"
            class="flex-1 h-9 bg-slate-950 border border-slate-800 rounded-md px-3 text-xs text-slate-100 focus:outline-none focus:border-teal-500 font-semibold"
          />
          <button
            type="button"
            @click="handleSaveForeman"
            class="h-9 px-4 rounded-md bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-bold text-xs border border-teal-500/30 transition flex items-center gap-1.5 shrink-0"
          >
            <CheckCircle2 class="w-3.5 h-3.5" />
            <span>Simpan</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Konfigurasi Kode & Jenis Proses Produksi ── -->
    <div class="bg-slate-900/60 border border-slate-800/80 rounded-lg p-4 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Layers class="w-4 h-4 text-amber-400" />
          </div>
          <div class="min-w-0">
            <h3 class="text-xs font-bold text-slate-100 font-mono truncate">Kode & Jenis Proses / 工序与代码</h3>
            <p class="text-[11px] text-slate-400 leading-tight truncate">Pengaturan kode dan role proses produksi.</p>
          </div>
        </div>

        <button
          type="button"
          @click="authStore.resetProcessGroups()"
          class="text-[10px] font-mono font-semibold text-slate-400 hover:text-amber-400 flex items-center gap-1 transition shrink-0"
          title="Reset ke pilihan bawaan pabrik"
        >
          <RotateCcw class="w-3 h-3" />
          <span>Reset Default</span>
        </button>
      </div>

      <!-- Form Tambah Kode Proses Baru -->
      <div class="flex items-center gap-2">
        <input
          type="text"
          v-model="newCodeInput"
          @keyup.enter="handleAddCodeGroup"
          placeholder="Kode baru (misal: A4)..."
          class="flex-1 h-9 bg-slate-950 border border-slate-800 rounded-md px-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-semibold uppercase"
        />
        <button
          type="button"
          @click="handleAddCodeGroup"
          class="h-9 px-4 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 transition flex items-center gap-1.5 shrink-0"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Tambah Kode</span>
        </button>
      </div>

      <!-- Process Code Cards List -->
      <div class="space-y-3 pt-1">
        <div
          v-for="group in authStore.processGroups"
          :key="group.code"
          class="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2.5 shadow-sm"
        >
          <!-- Code Card Header -->
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <!-- Normal Display Mode -->
            <div v-if="editingCodeKey !== group.code" class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded text-xs font-extrabold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                KODE {{ group.code }}
              </span>
              <span class="text-[11px] text-slate-400 font-mono">({{ group.roles.length }} Jenis Proses)</span>
              <button
                type="button"
                @click="startEditCode(group.code)"
                class="text-slate-400 hover:text-amber-300 text-xs transition p-1 flex items-center gap-1 hover:bg-slate-900 rounded"
                title="Edit Nama Kode"
              >
                <Pencil class="w-3.5 h-3.5" />
                <span class="text-[10px] font-mono font-semibold">Edit Kode</span>
              </button>
            </div>

            <!-- Edit Kode Mode Input -->
            <div v-else class="flex items-center gap-2">
              <span class="text-xs font-bold text-amber-400 font-mono">KODE:</span>
              <input
                type="text"
                v-model="editingCodeInput"
                @keyup.enter="saveEditCode(group.code)"
                @keyup.esc="cancelEditCode"
                class="h-7 w-28 bg-slate-900 border border-amber-500/60 rounded px-2 text-xs text-amber-300 font-mono font-bold uppercase focus:outline-none focus:border-amber-400"
                placeholder="Kode baru..."
              />
              <button
                type="button"
                @click="saveEditCode(group.code)"
                class="h-7 px-2.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center gap-1 border border-amber-500/40"
                title="Simpan Nama Kode"
              >
                <Check class="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>
              <button
                type="button"
                @click="cancelEditCode"
                class="h-7 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition"
                title="Batal"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              @click="authStore.removeProcessCodeGroup(group.code)"
              class="text-slate-500 hover:text-rose-400 text-xs transition p-1"
              title="Hapus Kode"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Roles Tag Pills for this Code -->
          <div class="flex flex-wrap items-center gap-1.5">
            <div
              v-for="role in group.roles"
              :key="role"
              class="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-2"
            >
              <span class="text-amber-400 font-black">#</span>
              <span>{{ role }}</span>
              <button
                type="button"
                @click="authStore.removeRoleFromGroup(group.code, role)"
                class="w-4 h-4 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 flex items-center justify-center transition"
                title="Hapus Role"
              >
                <X class="w-3 h-3" />
              </button>
            </div>

            <div v-if="group.roles.length === 0" class="text-xs text-slate-500 italic font-mono py-0.5">
              Belum ada jenis proses di dalam Kode {{ group.code }}
            </div>
          </div>

          <!-- Add Role to this Code Input -->
          <div class="flex items-center gap-2 pt-1">
            <input
              type="text"
              v-model="newRoleInputs[group.code]"
              @keyup.enter="handleAddRoleToGroup(group.code)"
              :placeholder="`Tambah jenis/role proses ke Kode ${group.code}...`"
              class="flex-1 h-8 bg-slate-900 border border-slate-800 rounded px-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
            />
            <button
              type="button"
              @click="handleAddRoleToGroup(group.code)"
              class="h-8 px-3 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs border border-slate-700 transition flex items-center gap-1 shrink-0"
            >
              <Plus class="w-3 h-3" />
              <span>Tambah Role</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Backup & Restore ── -->
    <div class="bg-slate-900/60 border border-slate-800/80 rounded-lg p-4 space-y-3">
      <div class="flex items-center gap-2.5 border-b border-slate-800 pb-3">
        <div class="w-8 h-8 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
          <Database class="w-4 h-4 text-teal-400" />
        </div>
        <div>
          <h3 class="text-xs font-bold text-slate-100 font-mono">{{ t('settings.backupTitle') }}</h3>
          <p class="text-[11px] text-slate-400 leading-tight">{{ t('settings.backupSubtitle') }}</p>
        </div>
      </div>

      <!-- Backup Action Row -->
      <div class="flex items-center justify-between gap-3 p-3 rounded-md bg-slate-950/70 border border-slate-800">
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 mb-0.5">
            <Download class="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span class="text-xs font-bold text-slate-200 font-mono">{{ t('settings.exportTitle') }}</span>
          </div>
          <p class="text-[11px] text-slate-500 leading-snug">{{ t('settings.exportDesc') }}</p>
        </div>
        <button
          type="button"
          @click="handleExportBackup"
          class="h-9 px-4 rounded-md bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-bold text-xs border border-teal-500/30 transition flex items-center gap-1.5 shrink-0"
        >
          <Download class="w-3.5 h-3.5" />
          <span>{{ t('settings.exportBtn') }}</span>
        </button>
      </div>

      <!-- Share Action Row -->
      <div class="flex items-center justify-between gap-3 p-3 rounded-md bg-slate-950/70 border border-slate-800">
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 mb-0.5">
            <Share2 class="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span class="text-xs font-bold text-slate-200 font-mono">{{ t('settings.shareTitle') }}</span>
          </div>
          <p class="text-[11px] text-slate-500 leading-snug">{{ t('settings.shareDesc') }}</p>
        </div>
        <button
          type="button"
          @click="handleShareBackup"
          class="h-9 px-4 rounded-md bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-bold text-xs border border-sky-500/30 transition flex items-center gap-1.5 shrink-0"
        >
          <Share2 class="w-3.5 h-3.5" />
          <span>{{ t('settings.shareBtn') }}</span>
        </button>
      </div>

      <!-- Restore Action Row -->
      <div class="flex items-center justify-between gap-3 p-3 rounded-md bg-slate-950/70 border border-slate-800">
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 mb-0.5">
            <Upload class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span class="text-xs font-bold text-slate-200 font-mono">{{ t('settings.importTitle') }}</span>
          </div>
          <p class="text-[11px] text-slate-500 leading-snug">{{ t('settings.importDesc') }}</p>
        </div>
        <label class="h-9 px-4 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer shrink-0">
          <Upload class="w-3.5 h-3.5" />
          <span>{{ t('settings.importBtn') }}</span>
          <input type="file" accept=".json" @change="handleImportBackup" class="hidden" />
        </label>
      </div>

      <!-- Status Notification -->
      <div
        v-if="statusMessage"
        class="p-2.5 rounded-md text-[11px] font-mono flex items-start gap-2"
        :class="statusType === 'success'
          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
          : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'"
      >
        <CheckCircle2 v-if="statusType === 'success'" class="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
        <AlertCircle v-else class="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
        <span class="leading-snug">{{ statusMessage }}</span>
      </div>
    </div>

    <!-- ── Preferensi Bahasa & Tema ── -->
    <div class="bg-slate-900/60 border border-slate-800/80 rounded-lg p-4 space-y-3">
      <div class="flex items-center gap-2.5 border-b border-slate-800 pb-3">
        <div class="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
          <Settings class="w-4 h-4 text-slate-300" />
        </div>
        <div>
          <h3 class="text-xs font-bold text-slate-100 font-mono">{{ t('settings.prefTitle') }}</h3>
          <p class="text-[11px] text-slate-400 leading-tight">{{ t('settings.prefSubtitle') }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <!-- Bahasa -->
        <div class="space-y-1.5">
          <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{{ t('settings.langLabel') }}</label>
          <div class="flex gap-1.5">
            <button
              type="button"
              @click="setLocale('id')"
              class="h-8 px-2 rounded text-xs font-semibold border transition flex-1 flex items-center justify-center"
              :class="locale === 'id'
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'"
            >
              {{ t('settings.langId') }}
            </button>
            <button
              type="button"
              @click="setLocale('en')"
              class="h-8 px-2 rounded text-xs font-semibold border transition flex-1 flex items-center justify-center"
              :class="locale === 'en'
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'"
            >
              {{ t('settings.langEn') }}
            </button>
            <button
              type="button"
              @click="setLocale('zh')"
              class="h-8 px-2 rounded text-xs font-semibold border transition flex-1 flex items-center justify-center"
              :class="locale === 'zh'
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'"
            >
              {{ t('settings.langZh') }}
            </button>
          </div>
        </div>

        <!-- Tema -->
        <div class="space-y-1.5">
          <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{{ t('settings.themeLabel') }}</label>
          <div class="flex gap-1.5">
            <button
              type="button"
              @click="setTheme('dark')"
              class="h-8 px-3 rounded text-xs font-semibold border transition flex-1 flex items-center justify-center gap-1.5"
              :class="currentTheme === 'dark'
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'"
            >
              <Moon class="w-3.5 h-3.5" />
              <span>{{ t('settings.themeDark') }}</span>
            </button>
            <button
              type="button"
              @click="setTheme('light')"
              class="h-8 px-3 rounded text-xs font-semibold border transition flex-1 flex items-center justify-center gap-1.5"
              :class="currentTheme === 'light'
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'"
            >
              <Sun class="w-3.5 h-3.5" />
              <span>{{ t('settings.themeLight') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductionStore, getLocalDateStr } from '@/stores/productionStore'
import { useTeamStore } from '@/stores/teamStore'
import { useAuthStore } from '@/stores/authStore'
import { useOverrideStore } from '@/stores/overrideStore'
import { useAuditStore } from '@/stores/auditStore'
import { useShiftStore } from '@/stores/shiftStore'
import { exportBackupData, importBackupData } from '@/services/db'
import {
  Smartphone,
  Database,
  Download,
  Upload,
  UserCheck,
  Layers,
  Plus,
  X,
  RotateCcw,
  Settings,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Pencil,
  Check,
  Share2,
  Cloud,
  Activity,
  RefreshCw
} from 'lucide-vue-next'
import {
  syncStatus,
  lastSyncTime,
  lastSyncError,
  pendingSyncCount,
  testSupabaseConnection,
  performFullSync
} from '@/services/supabaseSyncService'

const { t, locale } = useI18n()
const productionStore = useProductionStore()
const teamStore = useTeamStore()
const authStore = useAuthStore()
const overrideStore = useOverrideStore()
const auditStore = useAuditStore()
const shiftStore = useShiftStore()

const isTestingCloud = ref(false)

async function handleTestSupabase() {
  isTestingCloud.value = true
  try {
    const res = await testSupabaseConnection()
    statusType.value = res.ok ? 'success' : 'error'
    statusMessage.value = res.message
  } finally {
    isTestingCloud.value = false
  }
}

async function handleManualCloudSync() {
  const res = await performFullSync(async () => {
    await teamStore.loadTeams(true)
    await productionStore.loadLogs(true)
    await overrideStore.loadFromStorage(true)
  })
  statusType.value = res.success ? 'success' : 'error'
  statusMessage.value = res.message
}

const foremanInput = ref(authStore.foremanName)
const newCodeInput = ref('')
const newRoleInputs = ref<Record<string, string>>({})
const editingCodeKey = ref<string | null>(null)
const editingCodeInput = ref<string>('')
const statusMessage = ref('')
const statusType = ref<'success' | 'error'>('success')


function startEditCode(code: string) {
  editingCodeKey.value = code
  editingCodeInput.value = code
}

function saveEditCode(oldCode: string) {
  if (editingCodeInput.value && editingCodeInput.value.trim()) {
    authStore.updateProcessCodeGroup(oldCode, editingCodeInput.value.trim())
    editingCodeKey.value = null
    editingCodeInput.value = ''
  }
}

function cancelEditCode() {
  editingCodeKey.value = null
  editingCodeInput.value = ''
}

function handleAddCodeGroup() {
  if (newCodeInput.value.trim()) {
    authStore.addProcessCodeGroup(newCodeInput.value)
    newCodeInput.value = ''
  }
}

function handleAddRoleToGroup(code: string) {
  const val = newRoleInputs.value[code]
  if (val && val.trim()) {
    authStore.addRoleToGroup(code, val)
    newRoleInputs.value[code] = ''
  }
}

function handleSaveForeman() {
  authStore.setForemanName(foremanInput.value)
  statusType.value = 'success'
  statusMessage.value = 'Nama Mandor/Pengawas berhasil diperbarui'
}

function setLocale(lang: 'id' | 'en' | 'zh') {
  locale.value = lang
}

const currentTheme = ref(localStorage.getItem('theme') || 'light')

function setTheme(theme: 'light' | 'dark') {
  currentTheme.value = theme
  localStorage.setItem('theme', theme)
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }))
}

async function handleExportBackup() {
  try {
    // 1. Ensure all in-memory cell overrides and worker overrides are flushed to IndexedDB first
    await overrideStore.flushPendingOverrides()
    await overrideStore.saveAllToIndexedDB()

    const backupObj = await exportBackupData()
    const jsonStr = JSON.stringify(backupObj, null, 2)
    const today = getLocalDateStr()
    const filename = `earflow_backup_${today}.json`

    // Data URI fallback for mobile WebViews that block blob URLs
    const encodedData = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr)
    let downloadUrl = encodedData

    try {
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' })
      downloadUrl = URL.createObjectURL(blob)
    } catch {
      // Fallback to data URI if blob fails
    }

    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    link.setAttribute('download', filename)
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link)
      }
      if (downloadUrl.startsWith('blob:')) {
        URL.revokeObjectURL(downloadUrl)
      }
    }, 1500)

    await auditStore.logAction('System', 'Export Backup Data', `Mengunduh file cadangan backup: ${filename}`)

    statusType.value = 'success'
    statusMessage.value = t('settings.exportSuccess', { filename })
  } catch (err) {
    statusType.value = 'error'
    statusMessage.value = t('settings.exportError')
    console.error('Export backup error:', err)
  }
}

async function handleShareBackup() {
  try {
    // 1. Ensure all in-memory cell overrides and worker overrides are flushed to IndexedDB first
    await overrideStore.flushPendingOverrides()
    await overrideStore.saveAllToIndexedDB()

    const backupObj = await exportBackupData()
    const jsonStr = JSON.stringify(backupObj, null, 2)
    const today = getLocalDateStr()
    const filename = `earflow_backup_${today}.json`

    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' })
    const file = new File([blob], filename, { type: 'application/json' })

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'EarFlow Backup Data',
          text: `File Backup Data EarFlow (${today})`,
          files: [file]
        })
        await auditStore.logAction('System', 'Share Backup Data', `Membagikan file backup: ${filename}`)
        statusType.value = 'success'
        statusMessage.value = t('settings.shareSuccess', { filename })
        return
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError') {
          return
        }
        console.warn('Web Share API file share not allowed, falling back to download:', shareErr)
      }
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: 'EarFlow Backup Data',
          text: `Backup Data EarFlow (${today}).`
        })
        await auditStore.logAction('System', 'Share Backup Data', `Membagikan info backup: ${filename}`)
        statusType.value = 'success'
        statusMessage.value = t('settings.shareSuccess', { filename })
        return
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError') {
          return
        }
        console.warn('Web Share API text share not allowed, falling back to download:', shareErr)
      }
    }

    await handleExportBackup()
    statusType.value = 'success'
    statusMessage.value = t('settings.shareFallbackNotice')
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return
    }
    statusType.value = 'error'
    statusMessage.value = t('settings.shareError')
    console.error('Share backup error:', err)
  }
}

async function handleImportBackup(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const confirmMsg = t('settings.importConfirm') || 'Apakah Anda yakin ingin memulihkan data dari file backup? Semua data aktif saat ini akan digantikan oleh data dari file backup tersebut.'
  if (!window.confirm(confirmMsg)) {
    target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string
      const parsed = JSON.parse(content)

      await importBackupData(parsed)

      // Force reload all Pinia stores to reflect the newly restored data immediately
      await teamStore.loadTeams(true)
      await productionStore.loadLogs(true)
      await overrideStore.loadFromStorage(true)
      await auditStore.loadLogs()
      shiftStore.reloadFromStorage()
      authStore.reloadFromStorage()
      foremanInput.value = authStore.foremanName

      await auditStore.logAction('System', 'Restore Backup Data', 'Memulihkan seluruh data aplikasi dari file backup JSON')

      statusType.value = 'success'
      statusMessage.value = t('settings.importSuccess')
    } catch (err) {
      statusType.value = 'error'
      statusMessage.value = t('settings.importError')
      console.error(err)
    } finally {
      target.value = ''
    }
  }
  reader.readAsText(file)
}
</script>
