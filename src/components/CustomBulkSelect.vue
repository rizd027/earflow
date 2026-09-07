<template>
  <div class="relative inline-block text-left font-mono" ref="containerRef">
    <!-- Trigger Button -->
    <button
      type="button"
      @click="toggleDropdown"
      ref="triggerRef"
      class="h-9 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between gap-1.5 shadow-xs focus:outline-none w-full sm:w-auto cursor-pointer"
      :class="[
        isOpen
          ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500 ring-2 ring-teal-500/20'
          : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-300'
      ]"
    >
      <span
        class="truncate font-bold"
        :class="isOpen ? 'text-teal-700 dark:text-teal-300' : 'text-slate-200'"
      >{{ placeholder }}</span>
      <ChevronUp v-if="isOpen" class="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
      <ChevronDown v-else class="w-3.5 h-3.5 text-slate-400 shrink-0" />
    </button>

    <!-- Floating Dropdown Menu (Teleported for perfect z-index floating) -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        :style="dropdownStyle"
        class="fixed z-[70] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden py-1 max-h-52 overflow-y-auto custom-scrollbar overscroll-contain font-mono text-xs min-w-[140px]"
      >
        <div
          v-for="opt in options"
          :key="String(opt.value)"
          @click="selectOption(opt.value)"
          class="px-3.5 py-2.5 text-xs font-bold cursor-pointer transition-colors flex items-center justify-between hover:bg-teal-500/10 text-slate-200 hover:text-teal-600 dark:hover:text-teal-300 border-b border-slate-800 last:border-b-0"
        >
          <span class="truncate">{{ opt.label }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import { onClickOutside } from '@vueuse/core'

export interface BulkSelectOption {
  label: string
  value: string | number
}

const props = defineProps<{
  options: BulkSelectOption[]
  placeholder: string
}>()

const emit = defineEmits(['select'])

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const dropdownStyle = ref<Record<string, string>>({})

onClickOutside(containerRef, () => {
  isOpen.value = false
}, { ignore: [dropdownRef] })

function toggleDropdown() {
  if (isOpen.value) {
    isOpen.value = false
    return
  }
  calculatePosition()
  isOpen.value = true
}

function calculatePosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const estimatedHeight = Math.min(props.options.length * 36 + 10, 200)

  let top = rect.bottom + 6
  if (spaceBelow < estimatedHeight) {
    top = rect.top - estimatedHeight - 6
  }

  dropdownStyle.value = {
    top: `${top}px`,
    left: `${rect.left}px`,
    width: `${Math.max(rect.width, 150)}px`
  }
}

function selectOption(value: string | number) {
  emit('select', value)
  isOpen.value = false
}
</script>
