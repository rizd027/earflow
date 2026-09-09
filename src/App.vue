<template>
  <NConfigProvider :theme="naiveTheme" :theme-overrides="currentNaiveOverrides">
    <div v-if="route.path === '/auth'" class="min-h-screen bg-slate-950">
      <router-view />
    </div>

    <div v-else class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      <!-- Top Offline Banner Indicator -->
      <OfflineIndicator />

      <!-- Top Navbar -->
      <Navbar />

      <!-- Main Page View Container -->
      <main class="flex-1 w-full px-2 sm:px-3 pt-2 sm:pt-3 pb-24 md:pb-6">
        <router-view v-slot="{ Component }">
          <keep-alive :max="10">
            <component :is="Component" @open-log-modal="showLogModal = true" />
          </keep-alive>
        </router-view>
      </main>

      <!-- Multi-Step Hourly Input Modal -->
      <MultiStepLogModal :show="showLogModal" @close="showLogModal = false" />

      <!-- Mobile One-Handed Bottom Nav -->
      <MobileBottomNav @open-log-modal="showLogModal = true" />
    </div>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NConfigProvider } from 'naive-ui'
import { darkTheme, darkThemeOverrides, lightThemeOverrides } from '@/theme/naiveTheme'
import Navbar from '@/components/Navbar.vue'
import MobileBottomNav from '@/components/MobileBottomNav.vue'
import OfflineIndicator from '@/components/OfflineIndicator.vue'
import MultiStepLogModal from '@/components/MultiStepLogModal.vue'
import { useTeamStore } from '@/stores/teamStore'
import { useProductionStore } from '@/stores/productionStore'
import { useOverrideStore } from '@/stores/overrideStore'
import { useShiftStore } from '@/stores/shiftStore'
import { useAuthStore } from '@/stores/authStore'
import { useSalaryStore } from '@/stores/salaryStore'
import { isCloudEnabled, initSyncService } from '@/services/supabaseSyncService'

const route = useRoute()
const showLogModal = ref(false)
const teamStore = useTeamStore()
const productionStore = useProductionStore()
const overrideStore = useOverrideStore()
const shiftStore = useShiftStore()
const authStore = useAuthStore()
const salaryStore = useSalaryStore()

// Modal Back-Button History Support
let isProgrammaticClose = false

watch(showLogModal, (newVal) => {
  if (newVal) {
    window.history.pushState({ modalOpen: 'logModal' }, '')
    window.addEventListener('popstate', onPopState)
  } else {
    window.removeEventListener('popstate', onPopState)
    if (!isProgrammaticClose && window.history.state?.modalOpen === 'logModal') {
      window.history.back()
    }
    isProgrammaticClose = false
  }
})

function onPopState(_e: PopStateEvent) {
  if (showLogModal.value) {
    isProgrammaticClose = true
    showLogModal.value = false
  }
}
const activeTheme = ref(localStorage.getItem('theme') || 'light')
const naiveTheme = computed(() => {
  return activeTheme.value === 'dark' ? darkTheme : null
})
const currentNaiveOverrides = computed(() => {
  return activeTheme.value === 'dark' ? darkThemeOverrides : lightThemeOverrides
})

function applyTheme(theme: string) {
  if (theme === 'light') {
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
  } else {
    document.documentElement.classList.add('dark')
    document.documentElement.classList.remove('light')
  }
}

const onThemeChanged = (e: any) => {
  activeTheme.value = e.detail
  applyTheme(e.detail)
}

const refreshStoresFromCloud = () => {
  // Never reload stores while the user is actively typing or editing an input/select/textarea
  const activeEl = document.activeElement
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
    return
  }
  teamStore.loadTeams(true)
  productionStore.loadLogs(true)
  overrideStore.loadFromStorage(true)
  shiftStore.reloadFromStorage()
  authStore.reloadFromStorage()
  salaryStore.loadFromStorage()
}

onMounted(async () => {
  applyTheme(activeTheme.value)
  window.addEventListener('theme-changed', onThemeChanged)
  window.addEventListener('supabase-data-updated', refreshStoresFromCloud)
  
  // 1. Pre-load local cached data immediately for instant zero-latency view switching
  await Promise.all([
    teamStore.loadTeams(),
    productionStore.loadLogs(),
    overrideStore.loadFromStorage(),
    salaryStore.loadFromStorage()
  ])

  // 2. Langsung sinkronkan dengan Supabase Cloud di awal pemuatan (immediate startup sync)
  if (isCloudEnabled.value && navigator.onLine) {
    initSyncService(refreshStoresFromCloud)
  }
})

onUnmounted(() => {
  window.removeEventListener('theme-changed', onThemeChanged)
  window.removeEventListener('popstate', onPopState)
  window.removeEventListener('supabase-data-updated', refreshStoresFromCloud)
})
</script>
