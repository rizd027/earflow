<template>
  <div
    v-if="(!productionStore.isOnline) || (productionStore.pendingSyncCount > 0 && showSyncNotification)"
    class="bg-slate-900 border-b border-amber-500/30 text-amber-300 text-xs px-4 py-2 flex items-center justify-between transition-all"
  >
    <div class="flex items-center gap-2">
      <span class="relative flex h-2 w-2">
        <span
          :class="[
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            productionStore.isOnline ? 'bg-amber-400' : 'bg-rose-500'
          ]"
        ></span>
        <span
          :class="[
            'relative inline-flex rounded-full h-2 w-2',
            productionStore.isOnline ? 'bg-amber-500' : 'bg-rose-500'
          ]"
        ></span>
      </span>
      <span>
        <template v-if="!productionStore.isOnline">
          {{ t('app.offline') }} — Data akan tersimpan di IndexedDB browser.
        </template>
        <template v-else-if="productionStore.pendingSyncCount > 0 && showSyncNotification">
          Ada {{ productionStore.pendingSyncCount }} data log tersimpan lokal belum di-sync ke Supabase.
        </template>
      </span>
    </div>

    <button
      v-if="productionStore.isOnline && productionStore.pendingSyncCount > 0 && showSyncNotification"
      @click="productionStore.syncPendingLogs()"
      class="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-semibold transition"
    >
      Sync Sekarang
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProductionStore } from '@/stores/productionStore'

const { t } = useI18n()
const productionStore = useProductionStore()

const showSyncNotification = ref(false)
let timerId: any = null

// Watch pendingSyncCount to show sync warning for exactly 2 seconds, then dismiss it
watch(
  () => productionStore.pendingSyncCount,
  (newVal) => {
    if (newVal > 0 && productionStore.isOnline) {
      showSyncNotification.value = true
      if (timerId) clearTimeout(timerId)
      timerId = setTimeout(() => {
        showSyncNotification.value = false
      }, 2000)
    } else {
      showSyncNotification.value = false
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (timerId) clearTimeout(timerId)
})
</script>
