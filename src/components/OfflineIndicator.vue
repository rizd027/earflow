<template>
  <div
    v-if="(!productionStore.isOnline) || (pendingCount > 0 && showSyncNotification) || syncStatus === 'syncing'"
    class="bg-slate-900 border-b border-amber-500/30 text-amber-300 text-xs px-4 py-2 flex items-center justify-between transition-all"
  >
    <div class="flex items-center gap-2">
      <span class="relative flex h-2 w-2">
        <span
          :class="[
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            !productionStore.isOnline ? 'bg-rose-500' : (syncStatus === 'syncing' ? 'bg-teal-400' : 'bg-amber-400')
          ]"
        ></span>
        <span
          :class="[
            'relative inline-flex rounded-full h-2 w-2',
            !productionStore.isOnline ? 'bg-rose-500' : (syncStatus === 'syncing' ? 'bg-teal-500' : 'bg-amber-500')
          ]"
        ></span>
      </span>
      <span>
        <template v-if="!productionStore.isOnline">
          {{ t('app.offline') }} — Data tersimpan aman di IndexedDB lokal.
        </template>
        <template v-else-if="syncStatus === 'syncing'">
          Menyinkronkan data dengan cloud Supabase...
        </template>
        <template v-else-if="pendingCount > 0 && showSyncNotification">
          Ada {{ pendingCount }} log produksi tersimpan lokal belum di-sync ke Supabase.
        </template>
      </span>
    </div>

    <button
      v-if="productionStore.isOnline"
      @click="triggerSync"
      :disabled="syncStatus === 'syncing'"
      class="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-semibold transition active:scale-95 flex items-center gap-1 cursor-pointer disabled:opacity-50"
    >
      <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': syncStatus === 'syncing' }" />
      <span>{{ syncStatus === 'syncing' ? 'Menyinkronkan...' : 'Sync Sekarang' }}</span>
    </button>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshCw } from 'lucide-vue-next'
import { useProductionStore } from '@/stores/productionStore'
import { syncStatus, pendingSyncCount, performFullSync } from '@/services/supabaseSyncService'

const { t } = useI18n()
const productionStore = useProductionStore()

const showSyncNotification = ref(false)
let timerId: any = null

const pendingCount = computed(() => {
  return Math.max(productionStore.pendingSyncCount, pendingSyncCount.value)
})

watch(
  () => pendingCount.value,
  (newVal) => {
    if (newVal > 0 && productionStore.isOnline) {
      showSyncNotification.value = true
      if (timerId) clearTimeout(timerId)
      timerId = setTimeout(() => {
        showSyncNotification.value = false
      }, 4000)
    } else {
      showSyncNotification.value = false
    }
  },
  { immediate: true }
)

async function triggerSync() {
  await performFullSync(() => {
    productionStore.loadLogs(true)
  })
}

onUnmounted(() => {
  if (timerId) clearTimeout(timerId)
})
</script>
