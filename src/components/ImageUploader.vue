<template>
  <div class="space-y-3">
    <label class="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
      <Camera class="w-4 h-4 text-teal-400" />
      <span>{{ t('logForm.photoUpload') }}</span>
    </label>

    <!-- Upload Box or Preview -->
    <div
      v-if="!modelValue"
      @click="triggerFileInput"
      class="border-2 border-dashed border-slate-700 hover:border-teal-500/50 rounded-xl p-4 text-center cursor-pointer transition bg-slate-900/50 hover:bg-slate-900 group"
    >
      <input
        type="file"
        ref="fileInput"
        accept="image/*"
        class="hidden"
        @change="handleFileChange"
      />

      <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-800 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
        <Camera class="w-5 h-5 text-teal-400" />
      </div>
      <p class="text-xs text-slate-300 font-medium">Klik untuk upload foto / ambil dari kamera</p>
      <p class="text-[10px] text-slate-400 mt-1">Support JPG, PNG, Cloudinary Media</p>
    </div>

    <!-- Active Image Preview -->
    <div v-else class="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group">
      <img :src="modelValue" alt="Bukti Hasil Produksi" class="w-full h-40 object-cover" />
      <div class="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          type="button"
          @click="triggerFileInput"
          class="px-3 py-1 rounded bg-slate-800 text-slate-200 text-xs hover:bg-slate-700 font-medium flex items-center gap-1"
        >
          <Image class="w-3.5 h-3.5" />
          <span>Ganti</span>
        </button>
        <button
          type="button"
          @click="$emit('update:modelValue', '')"
          class="px-3 py-1 rounded bg-rose-900/80 text-rose-200 text-xs hover:bg-rose-800 font-medium flex items-center gap-1"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>Hapus</span>
        </button>
      </div>
      <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-teal-500/80 text-slate-950 font-extrabold text-[10px] flex items-center gap-1">
        <CheckCircle2 class="w-3 h-3 text-slate-950" />
        <span>Bukti Terunggah</span>
      </div>
    </div>

    <!-- Quick Preset Photos for Demonstration -->
    <div class="pt-1">
      <p class="text-[11px] text-slate-400 mb-1 font-medium">Pilih contoh foto produksi cepat (Demo):</p>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="(sample, idx) in samplePhotos"
          :key="idx"
          type="button"
          @click="$emit('update:modelValue', sample.url)"
          class="relative rounded-lg overflow-hidden border border-slate-800 hover:border-teal-500 transition h-14 bg-slate-900 group text-left"
        >
          <img :src="sample.url" :alt="sample.label" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          <span class="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[9px] text-slate-300 px-1 py-0.5 truncate">
            {{ sample.label }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Camera, Image, Trash2, CheckCircle2 } from 'lucide-vue-next'

defineProps<{
  modelValue?: string
}>()

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()
const fileInput = ref<HTMLInputElement | null>(null)

const samplePhotos = [
  {
    label: 'Solder Kabel Driver',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500'
  },
  {
    label: 'Pengolesan Lem Shell',
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500'
  },
  {
    label: 'Hasil Tray QC',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500'
  }
]

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        emit('update:modelValue', e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }
}
</script>
