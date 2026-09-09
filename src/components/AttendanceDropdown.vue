<template>
  <div
    class="relative inline-block w-full text-left"
    :class="isOpen ? 'z-40' : 'z-10'"
    ref="containerRef"
  >
    <!-- Trigger Button -->
    <button
      type="button"
      ref="triggerRef"
      :disabled="isReadOnly"
      @click="toggleDropdown"
      class="w-full h-8 px-2.5 rounded-lg text-xs font-bold border transition-all duration-150 flex items-center justify-between gap-1.5 shadow-2xs focus:outline-none select-none"
      :class="[
        isReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer active:scale-[0.98]',
        triggerStyleClass
      ]"
      :title="triggerTitle"
    >
      <!-- Leading Icon + Label -->
      <div class="flex items-center gap-1.5 min-w-0 truncate">
        <!-- Status Icon (SVG) -->
        <component
          :is="currentIcon"
          class="w-3.5 h-3.5 shrink-0 stroke-[2.5]"
          :class="currentIconColorClass"
        />
        <span class="truncate font-bold tracking-tight">{{ currentLabel }}</span>
      </div>

      <!-- Trailing Chevron -->
      <ChevronDown
        class="w-3 h-3 shrink-0 opacity-60 transition-transform duration-200"
        :class="{ 'rotate-180 opacity-100': isOpen }"
      />
    </button>

    <!-- Floating Dropdown Menu (Matches Button Width Exactly) -->
    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        :class="[
          'absolute z-50 w-full left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1 font-sans text-xs select-none',
          openDirection === 'up' ? 'bottom-full mb-1 origin-bottom' : 'top-full mt-1 origin-top'
        ]"
      >
        <!-- Options List (Clean Text, No Item Icons, Harmonious Colors) -->
        <button
          v-for="opt in options"
          :key="opt.value"
          type="button"
          @click="selectOption(opt.value)"
          class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer"
          :class="[
            modelValue === opt.value ? opt.activeClass : opt.inactiveClass
          ]"
        >
          <span class="text-xs tracking-tight truncate">{{ opt.label }}</span>

          <!-- Active Checkmark Indicator -->
          <Check
            v-if="modelValue === opt.value"
            class="w-3.5 h-3.5 stroke-[3] shrink-0 ml-1"
            :class="opt.checkColor"
          />
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type Component } from 'vue'
import { Check, Clock, HeartPulse, X, ChevronDown } from 'lucide-vue-next'
import { onClickOutside } from '@vueuse/core'

export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Absen'

const props = defineProps<{
  modelValue: AttendanceStatus
  isQc?: boolean
  isSpk?: boolean
  isReadOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: AttendanceStatus): void
  (e: 'change', val: AttendanceStatus): void
}>()

const isOpen = ref(false)
const openDirection = ref<'down' | 'up'>('down')
const containerRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)

onClickOutside(containerRef, () => {
  isOpen.value = false
})

function toggleDropdown() {
  if (props.isReadOnly) return
  if (isOpen.value) {
    isOpen.value = false
    return
  }
  calculateDirection()
  isOpen.value = true
}

function calculateDirection() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const estimatedMenuHeight = 150

  if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
    openDirection.value = 'up'
  } else {
    openDirection.value = 'down'
  }
}

function selectOption(val: AttendanceStatus) {
  emit('update:modelValue', val)
  emit('change', val)
  isOpen.value = false
}

// Display Label
const currentLabel = computed(() => {
  if (props.modelValue === 'Hadir') {
    if (props.isQc) return 'Check'
    if (props.isSpk) return 'SPK-A1'
    return 'Hadir'
  }
  return props.modelValue
})

// Current SVG Icon
const currentIcon = computed<Component>(() => {
  switch (props.modelValue) {
    case 'Hadir':
      return Check
    case 'Izin':
      return Clock
    case 'Sakit':
      return HeartPulse
    case 'Absen':
    default:
      return X
  }
})

// Icon color inside trigger
const currentIconColorClass = computed(() => {
  switch (props.modelValue) {
    case 'Hadir':
      if (props.isQc) return 'text-cyan-600 dark:text-cyan-400'
      if (props.isSpk) return 'text-amber-600 dark:text-amber-400'
      return 'text-emerald-600 dark:text-emerald-400'
    case 'Izin':
      return 'text-amber-600 dark:text-amber-400'
    case 'Sakit':
      return 'text-sky-600 dark:text-sky-400'
    case 'Absen':
    default:
      return 'text-rose-600 dark:text-rose-400'
  }
})

// Trigger Button Styling Class
const triggerStyleClass = computed(() => {
  switch (props.modelValue) {
    case 'Hadir':
      if (props.isQc) {
        return 'bg-cyan-50 hover:bg-cyan-100/80 text-cyan-950 border-cyan-300 dark:bg-cyan-500/15 dark:hover:bg-cyan-500/25 dark:text-cyan-200 dark:border-cyan-500/40'
      }
      if (props.isSpk) {
        return 'bg-amber-50 hover:bg-amber-100/80 text-amber-950 border-amber-300 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 dark:text-amber-200 dark:border-amber-500/40'
      }
      return 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-950 border-emerald-300 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 dark:text-emerald-200 dark:border-emerald-500/40'
    case 'Izin':
      return 'bg-amber-50 hover:bg-amber-100/80 text-amber-950 border-amber-300 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 dark:text-amber-200 dark:border-amber-500/40'
    case 'Sakit':
      return 'bg-sky-50 hover:bg-sky-100/80 text-sky-950 border-sky-300 dark:bg-sky-500/15 dark:hover:bg-sky-500/25 dark:text-sky-200 dark:border-sky-500/40'
    case 'Absen':
    default:
      return 'bg-rose-50 hover:bg-rose-100/80 text-rose-950 border-rose-300 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-200 dark:border-rose-500/40'
  }
})

const triggerTitle = computed(() => {
  return `Absensi: ${currentLabel.value} (Klik untuk mengubah)`
})

// Options List (Clean, Harmonious Colors, No Item Icons, Pure Text)
const options = computed(() => [
  {
    value: 'Hadir' as AttendanceStatus,
    label: props.isQc ? 'Check' : (props.isSpk ? 'SPK-A1' : 'Hadir'),
    activeClass: 'bg-emerald-100/80 text-emerald-950 dark:bg-emerald-500/20 dark:text-emerald-200 font-black',
    inactiveClass: 'text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold',
    checkColor: 'text-emerald-600 dark:text-emerald-400'
  },
  {
    value: 'Izin' as AttendanceStatus,
    label: 'Izin',
    activeClass: 'bg-amber-100/80 text-amber-950 dark:bg-amber-500/20 dark:text-amber-200 font-black',
    inactiveClass: 'text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-bold',
    checkColor: 'text-amber-600 dark:text-amber-400'
  },
  {
    value: 'Sakit' as AttendanceStatus,
    label: 'Sakit',
    activeClass: 'bg-sky-100/80 text-sky-950 dark:bg-sky-500/20 dark:text-sky-200 font-black',
    inactiveClass: 'text-sky-800 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 font-bold',
    checkColor: 'text-sky-600 dark:text-sky-400'
  },
  {
    value: 'Absen' as AttendanceStatus,
    label: 'Absen',
    activeClass: 'bg-rose-100/80 text-rose-950 dark:bg-rose-500/20 dark:text-rose-200 font-black',
    inactiveClass: 'text-rose-800 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold',
    checkColor: 'text-rose-600 dark:text-rose-400'
  }
])
</script>
