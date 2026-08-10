<template>
  <div class="relative w-full text-left" ref="containerRef">
    <!-- Trigger Button -->
    <button
      type="button"
      @click="toggleDropdown"
      ref="triggerRef"
      class="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 transition-colors flex items-center justify-between gap-2 shadow-sm focus:outline-none focus:border-teal-500 font-sans"
    >
      <span class="truncate font-medium">
        {{ selectedLabel || placeholder || 'Pilih...' }}
      </span>
      <ChevronDown
        class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0"
        :class="{ 'rotate-180 text-teal-400': isOpen }"
      />
    </button>

    <!-- Floating Dropdown Menu -->
    <div
      v-if="isOpen"
      :class="[
        'absolute z-50 w-full bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-md shadow-2xl overflow-hidden py-1 max-h-56 overflow-y-auto no-scrollbar transition-all duration-150 animate-fadeIn',
        openDirection === 'up' ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'
      ]"
    >
      <div
        v-for="option in options"
        :key="String(option.value)"
        @click="selectOption(option.value)"
        class="px-3 py-2 text-xs font-medium cursor-pointer transition-colors flex items-center justify-between hover:bg-slate-800/80 hover:text-teal-300"
        :class="[
          modelValue === option.value ? 'bg-teal-500/10 text-teal-300 font-bold' : 'text-slate-300'
        ]"
      >
        <span class="truncate">{{ option.label }}</span>
        <Check v-if="modelValue === option.value" class="w-3.5 h-3.5 text-teal-400 stroke-[2.5] shrink-0" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown, Check } from 'lucide-vue-next'
import { onClickOutside } from '@vueuse/core'

export interface SelectOption {
  label: string
  value: string | number
}

const props = defineProps<{
  modelValue: string | number
  options: SelectOption[]
  placeholder?: string
}>()

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const openDirection = ref<'down' | 'up'>('down')
const containerRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)

onClickOutside(containerRef, () => {
  isOpen.value = false
})

const selectedLabel = computed(() => {
  const found = props.options.find(o => o.value === props.modelValue)
  return found ? found.label : ''
})

function toggleDropdown() {
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
  const estimatedDropdownHeight = Math.min(props.options.length * 36 + 10, 224)

  if (spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow) {
    openDirection.value = 'up'
  } else {
    openDirection.value = 'down'
  }
}

function selectOption(value: string | number) {
  emit('update:modelValue', value)
  emit('change', value)
  isOpen.value = false
}
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 0.1s ease-out forwards;
}
</style>
