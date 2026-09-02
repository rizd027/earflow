<template>
  <div class="relative w-full text-left font-sans" ref="containerRef">
    <!-- Combobox Input Field & Trigger (Fixed h-9 height matching standard buttons) -->
    <div class="relative flex items-center h-9">
      <input
        ref="inputRef"
        type="text"
        v-model="inputValue"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
        :placeholder="placeholder || 'Pilih atau ketik baru...'"
        class="w-full h-full bg-slate-950 hover:bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-md pl-3 pr-14 text-xs text-slate-200 transition-colors focus:outline-none font-medium shadow-sm"
      />

      <div class="absolute right-1 top-1 bottom-1 flex items-center gap-0.5">
        <!-- Quick Clear X Button -->
        <button
          v-if="inputValue"
          type="button"
          @click.stop="clearValue"
          tabindex="-1"
          title="Bersihkan input"
          class="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
        >
          <X class="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          @click="toggleDropdown"
          tabindex="-1"
          class="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-slate-200 rounded transition"
        >
          <ChevronDown
            class="w-3.5 h-3.5 transition-transform duration-200"
            :class="{ 'rotate-180 text-teal-400': isOpen }"
          />
        </button>
      </div>
    </div>

    <!-- Floating Combobox Popover Menu -->
    <div
      v-if="isOpen"
      :class="[
        'absolute z-50 w-full bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-md shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto custom-scrollbar overscroll-contain transition-all duration-150 animate-fadeIn',
        openDirection === 'up' ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'
      ]"
    >
      <!-- Option list -->
      <div v-if="filteredOptions.length > 0" class="divide-y divide-slate-800/40">
        <div
          v-for="option in filteredOptions"
          :key="String(option.value)"
          class="group px-3 py-2 text-xs font-medium transition-colors flex items-center justify-between hover:bg-slate-800/80 font-sans min-h-[36px]"
          :class="[
            modelValue === option.value ? 'bg-teal-500/10 text-teal-300 font-bold' : 'text-slate-300'
          ]"
        >
          <!-- Option Label or Inline Edit Input -->
          <div
            v-if="editingOptionValue !== option.value"
            @mousedown.prevent="selectOption(option)"
            class="flex-1 truncate cursor-pointer py-1 flex items-center justify-between pr-2"
          >
            <span class="truncate">{{ option.label }}</span>
            <Check v-if="modelValue === option.value" class="w-3.5 h-3.5 text-teal-400 stroke-[2.5] shrink-0 ml-1" />
          </div>

          <div v-else class="flex-1 flex items-center gap-1.5 pr-2">
            <input
              type="text"
              v-model="editingLabel"
              @keyup.enter="saveInlineEdit(option)"
              class="w-full h-7 bg-slate-950 border border-teal-500 rounded px-2 text-xs text-teal-200 focus:outline-none"
              ref="editInputRef"
            />
            <button
              type="button"
              @click="saveInlineEdit(option)"
              class="h-7 w-7 flex items-center justify-center rounded bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 shrink-0"
            >
              <Check class="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>

          <!-- Edit & Delete Action Icons -->
          <div v-if="canEditOptions && editingOptionValue !== option.value" class="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition shrink-0">
            <button
              type="button"
              @click.stop="startInlineEdit(option)"
              title="Edit opsi ini"
              class="h-7 w-7 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-teal-300 transition"
            >
              <Pencil class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              @click.stop="handleDeleteOption(option)"
              title="Hapus opsi ini"
              class="h-7 w-7 flex items-center justify-center rounded hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Option to Add New Value if typing new custom input -->
      <div
        v-if="showAddNewOption"
        @mousedown.prevent="addNewOptionFromInput"
        class="px-3 py-2.5 text-xs font-semibold text-teal-400 hover:bg-teal-500/10 cursor-pointer flex items-center gap-1.5 border-t border-slate-800/80 min-h-[36px]"
      >
        <Plus class="w-3.5 h-3.5 text-teal-400 stroke-[3]" />
        <span>Tambah Opsi Baru: "{{ inputValue }}"</span>
      </div>

      <!-- Empty state -->
      <div v-if="filteredOptions.length === 0 && !showAddNewOption" class="p-3 text-center text-xs text-slate-500">
        Tidak ada opsi tersedia.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { ChevronDown, Check, Pencil, Trash2, Plus, X } from 'lucide-vue-next'
import { onClickOutside } from '@vueuse/core'

export interface ComboboxOption {
  label: string
  value: string | number
}

const props = withDefaults(defineProps<{
  modelValue: string | number
  options: ComboboxOption[]
  placeholder?: string
  allowEditOptions?: boolean
  storageKey?: string
}>(), {
  allowEditOptions: true
})

const emit = defineEmits([
  'update:modelValue',
  'update:options',
  'change',
  'add-option',
  'edit-option',
  'delete-option'
])

const isOpen = ref(false)
const openDirection = ref<'down' | 'up'>('down')
const containerRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const inputValue = ref('')
const editingOptionValue = ref<string | number | null>(null)
const editingLabel = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

const localOptions = ref<ComboboxOption[]>([])

const effectiveStorageKey = computed(() => {
  return props.storageKey || null
})

const canEditOptions = computed(() => {
  return Boolean(props.allowEditOptions)
})

function loadLocalOptions() {
  const key = effectiveStorageKey.value
  if (key) {
    try {
      const saved = localStorage.getItem(key)
      if (saved !== null) {
        const parsed = JSON.parse(saved) as ComboboxOption[]
        if (Array.isArray(parsed)) {
          localOptions.value = parsed
          return
        }
      }
    } catch (e) {
      console.error('Failed to load combobox options from localStorage:', e)
    }
  }
  localOptions.value = props.options ? [...props.options] : []
}

import { syncAppSettingToCloud, APP_SETTING_KEYS } from '@/services/supabaseSyncService'

function saveLocalOptionsToStorage() {
  const key = effectiveStorageKey.value
  if (key) {
    try {
      localStorage.setItem(key, JSON.stringify(localOptions.value))
      if (APP_SETTING_KEYS.includes(key)) {
        syncAppSettingToCloud(key, localOptions.value).catch(() => {})
      }
    } catch (e) {
      console.error('Failed to save combobox options to localStorage:', e)
    }
  }
}

watch(
  () => props.options,
  (newOpts) => {
    if (!newOpts) return
    const key = effectiveStorageKey.value
    if (key && localStorage.getItem(key) !== null) {
      try {
        const saved = localStorage.getItem(key)
        if (saved !== null) {
          const parsed = JSON.parse(saved) as ComboboxOption[]
          if (Array.isArray(parsed)) {
            localOptions.value = parsed
            return
          }
        }
      } catch (e) {
        console.error('Error loading saved options from localStorage:', e)
      }
    }
    localOptions.value = [...newOpts]
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  // Purge any stale combobox options stored from automatic placeholder keys, legacy role options, or shift options
  try {
    localStorage.removeItem('earflow_role_options')
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && (k.startsWith('earflow_cb_storage_pilih_shift') || k === 'earflow_shift_options' || k === 'earflow_worker_shift_options' || k === 'earflow_role_options')) {
        localStorage.removeItem(k)
      }
    }
  } catch {}
  loadLocalOptions()
})

onClickOutside(containerRef, () => {
  isOpen.value = false
  editingOptionValue.value = null
})

watch(
  () => [props.modelValue, localOptions.value],
  () => {
    const found = localOptions.value.find(o => o.value === props.modelValue)
    if (found) {
      inputValue.value = found.label
    } else if (typeof props.modelValue === 'string') {
      inputValue.value = props.modelValue
    } else {
      inputValue.value = ''
    }
  },
  { immediate: true, deep: true }
)

const selectedOptionLabel = computed(() => {
  const found = localOptions.value.find(o => o.value === props.modelValue)
  if (found) return found.label
  if (typeof props.modelValue === 'string') return props.modelValue
  return ''
})

const filteredOptions = computed(() => {
  if (!inputValue.value || inputValue.value.trim() === '') return localOptions.value
  const query = inputValue.value.toLowerCase().trim()
  const selectedLabel = selectedOptionLabel.value.toLowerCase().trim()

  // If input matches the currently selected option's label, user hasn't typed a new search query -> show all options
  if (selectedLabel && query === selectedLabel) {
    return localOptions.value
  }

  return localOptions.value.filter(o => o.label.toLowerCase().includes(query))
})

const showAddNewOption = computed(() => {
  if (!inputValue.value.trim()) return false
  const query = inputValue.value.toLowerCase().trim()
  const selectedLabel = selectedOptionLabel.value.toLowerCase().trim()

  if (selectedLabel && query === selectedLabel) return false

  const exists = localOptions.value.some(o => o.label.toLowerCase().trim() === query)
  return !exists
})

function calculateDirection() {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const estimatedHeight = 220

  if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
    openDirection.value = 'up'
  } else {
    openDirection.value = 'down'
  }
}

function handleFocus() {
  calculateDirection()
  isOpen.value = true
}

function toggleDropdown() {
  if (isOpen.value) {
    isOpen.value = false
  } else {
    calculateDirection()
    isOpen.value = true
  }
}

function handleInput() {
  calculateDirection()
  isOpen.value = true
}

function handleBlur() {
  // Restore display to currently selected option's label
  // Do NOT emit anything here — selection is handled by selectOption/clearValue only
  const found = localOptions.value.find(o => o.value === props.modelValue)
  const currentLabel = found ? found.label : String(props.modelValue || '')
  if (!inputValue.value.trim()) {
    inputValue.value = currentLabel
  } else if (!localOptions.value.some(o => o.label.toLowerCase() === inputValue.value.toLowerCase().trim())) {
    // User typed something not in options — only emit if allowEditOptions is false (free text not allowed)
    // For allow-edit-options comboboxes, addNewOptionFromInput handles it
    if (!props.allowEditOptions) {
      inputValue.value = currentLabel
    }
  }
}

function clearValue() {
  inputValue.value = ''
  emit('update:modelValue', '')
  emit('change', '')
  calculateDirection()
  isOpen.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function selectOption(option: ComboboxOption) {
  inputValue.value = option.label
  emit('update:modelValue', option.value)
  emit('change', option.value)
  isOpen.value = false
}

function addNewOptionFromInput() {
  const newVal = inputValue.value.trim()
  if (!newVal) return
  const newOpt: ComboboxOption = { label: newVal, value: newVal }
  
  const existing = localOptions.value.find(o => o.label.toLowerCase() === newVal.toLowerCase())
  if (!existing) {
    localOptions.value.push(newOpt)
    saveLocalOptionsToStorage()
    emit('add-option', newOpt)
    emit('update:options', [...localOptions.value])
  }
  
  emit('update:modelValue', newVal)
  emit('change', newVal)
  isOpen.value = false
}

function startInlineEdit(option: ComboboxOption) {
  editingOptionValue.value = option.value
  editingLabel.value = option.label
  nextTick(() => {
    editInputRef.value?.focus()
  })
}

function saveInlineEdit(option: ComboboxOption) {
  const newLabel = editingLabel.value.trim()
  if (newLabel && newLabel !== option.label) {
    const idx = localOptions.value.findIndex(o => o.value === option.value || o.label === option.label)
    if (idx !== -1) {
      const oldVal = localOptions.value[idx].value
      const oldLabel = localOptions.value[idx].label
      
      localOptions.value[idx].label = newLabel
      if (typeof oldVal === 'string' && (oldVal === oldLabel || !oldVal.startsWith('t_'))) {
        localOptions.value[idx].value = newLabel
      }
      
      const updatedOption = localOptions.value[idx]
      saveLocalOptionsToStorage()
      
      if (props.modelValue === oldVal || props.modelValue === oldLabel) {
        inputValue.value = newLabel
        emit('update:modelValue', updatedOption.value)
        emit('change', updatedOption.value)
      }
      
      emit('edit-option', option, newLabel)
      emit('update:options', [...localOptions.value])
    }
  }
  editingOptionValue.value = null
}

function handleDeleteOption(option: ComboboxOption) {
  const oldVal = option.value
  const oldLabel = option.label
  
  localOptions.value = localOptions.value.filter(o => o.value !== oldVal && o.label !== oldLabel)
  saveLocalOptionsToStorage()
  
  if (props.modelValue === oldVal || props.modelValue === oldLabel) {
    clearValue()
  }
  
  emit('delete-option', option)
  emit('update:options', [...localOptions.value])
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
