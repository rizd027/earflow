<template>
  <header class="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 font-sans shadow-lg transition-all">
    <div class="w-full px-3 sm:px-4 h-14 flex items-center justify-between gap-3">
      <!-- Left: Real-Time Date & Clock Widget (Replaces Logo & EarFlow Text) -->
      <div class="flex items-center gap-2 min-w-0">
        <div class="font-mono text-left flex flex-col justify-center">
          <span class="text-xs sm:text-sm font-black text-teal-300 leading-none">
            {{ currentTimeStr }}
          </span>
          <span class="text-[9px] sm:text-[10px] text-slate-400 font-semibold leading-none mt-1 truncate">
            {{ currentDateStr }}
          </span>
        </div>
      </div>

      <!-- Center: Desktop Navigation Links (Underline Indicator) -->
      <nav class="hidden lg:flex items-center gap-1 sm:gap-2 h-full font-mono">
        <router-link
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          class="h-full px-3.5 flex items-center text-xs font-bold transition-all whitespace-nowrap border-b-2 -mb-px"
          :class="[
            route.path === link.path
              ? 'text-teal-400 border-teal-400'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:border-slate-600'
          ]"
        >
          {{ link.label }}
        </router-link>
      </nav>

      <!-- Right: Global Header 3-Dots Button (Only 1 menu button in header) -->
      <div ref="menuWrapperRef" class="relative flex items-center gap-2 shrink-0">
        <button
          type="button"
          @click.stop="toggleMenu"
          class="w-9 h-9 rounded-xl border transition flex items-center justify-center active:scale-95 shadow-sm"
          :class="headerMenuStore.isOpen
            ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 ring-2 ring-teal-500/30'
            : 'bg-slate-900 border-slate-800 hover:border-teal-500/50 text-slate-300 hover:text-teal-300'"
          title="Menu Aksi & Filter Halaman"
        >
          <MoreVertical class="w-5 h-5 text-teal-400" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { MoreVertical } from 'lucide-vue-next'
import { useHeaderMenuStore } from '@/stores/headerMenuStore'

const { t } = useI18n()
const route = useRoute()
const headerMenuStore = useHeaderMenuStore()

const currentTimeStr = ref('')
const currentDateStr = ref('')
const menuWrapperRef = ref<HTMLElement | null>(null)

function toggleMenu(e: MouseEvent) {
  e.stopPropagation()
  headerMenuStore.toggle()
  window.dispatchEvent(new CustomEvent('toggle-header-menu'))
}

watch(() => route.path, () => {
  headerMenuStore.close()
})

function updateTime() {
  const days = [
    t('time.sun'), t('time.mon'), t('time.tue'),
    t('time.wed'), t('time.thu'), t('time.fri'), t('time.sat')
  ]
  const months = [
    t('time.jan'), t('time.feb'), t('time.mar'), t('time.apr'),
    t('time.may'), t('time.jun'), t('time.jul'), t('time.aug'),
    t('time.sep'), t('time.oct'), t('time.nov'), t('time.dec')
  ]
  
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  
  const dayName = days[now.getDay()]
  const date = now.getDate()
  const monthName = months[now.getMonth()]
  const year = now.getFullYear()
  
  currentTimeStr.value = `${hours}.${minutes}.${seconds}`
  currentDateStr.value = `${dayName}, ${date} ${monthName} ${year}`
}

let timer: any = null
onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const navLinks = [
  { path: '/', label: 'Absensi & Target' },
  { path: '/performance', label: 'Performa' },
  { path: '/teams', label: 'Karyawan' },
  { path: '/salary', label: 'Estimasi Gaji' },
  { path: '/settings', label: 'Pengaturan' },
]
</script>
