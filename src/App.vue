<template>
  <NConfigProvider :theme="naiveTheme" :theme-overrides="earflowThemeOverrides">
    <div v-if="route.path === '/auth'" class="min-h-screen bg-slate-950">
      <router-view />
    </div>

    <div v-else class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      <!-- Top Offline Banner Indicator -->
      <OfflineIndicator />

      <!-- Top Navbar -->
      <Navbar />

      <!-- Main Page View Container -->
      <main class="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-3 lg:px-4 pt-2 sm:pt-3 pb-24 md:pb-6">
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
import { darkTheme, earflowThemeOverrides } from '@/theme/naiveTheme'
import Navbar from '@/components/Navbar.vue'
import MobileBottomNav from '@/components/MobileBottomNav.vue'
import OfflineIndicator from '@/components/OfflineIndicator.vue'
import MultiStepLogModal from '@/components/MultiStepLogModal.vue'
import { useTeamStore } from '@/stores/teamStore'
import { useProductionStore } from '@/stores/productionStore'
import { useOverrideStore } from '@/stores/overrideStore'

const route = useRoute()
const showLogModal = ref(false)
const teamStore = useTeamStore()
const productionStore = useProductionStore()
const overrideStore = useOverrideStore()

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

function applyTheme(theme: string) {
  if (theme === 'light') {
    document.documentElement.classList.add('light')
  } else {
    document.documentElement.classList.remove('light')
  }
}

const onThemeChanged = (e: any) => {
  activeTheme.value = e.detail
  applyTheme(e.detail)
}

onMounted(() => {
  applyTheme(activeTheme.value)
  window.addEventListener('theme-changed', onThemeChanged)

  const refreshStoresFromCloud = () => {
    teamStore.loadTeams(true)
    productionStore.loadLogs(true)
    overrideStore.loadFromStorage(true)
  }

  window.addEventListener('supabase-data-updated', refreshStoresFromCloud)
  
  // Pre-load data in background on initialization for instant view switching
  teamStore.loadTeams()
  productionStore.loadLogs()
  overrideStore.loadFromStorage()
})

onUnmounted(() => {
  window.removeEventListener('theme-changed', onThemeChanged)
  window.removeEventListener('popstate', onPopState)
})
</script>
