<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans overflow-hidden animate-fadeIn text-slate-100"
    >
      <!-- Clean Proportional Header -->
      <div class="py-3.5 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 gap-3 min-h-[60px]">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
            <Zap class="w-5 h-5 fill-teal-400/20" />
          </div>
          <div class="min-w-0">
            <h2 class="text-sm sm:text-base font-bold text-slate-100 font-mono leading-snug">
              {{ t('logForm.title') }}
            </h2>
            <p class="text-[11px] text-slate-400 leading-tight">{{ t('logForm.title') }} (Auto Timestamp)</p>
          </div>
        </div>

        <button
          type="button"
          @click="closeModal"
          class="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 shrink-0"
          title="Tutup"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Fullscreen Step Indicator Bar -->
      <div class="bg-slate-900/50 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 shrink-0">
        <div class="max-w-xl mx-auto grid grid-cols-2 gap-3 text-center text-xs">
          <button
            type="button"
            @click="currentStep = 1"
            class="h-9 rounded-md font-semibold transition text-xs flex items-center justify-center gap-2 border"
            :class="[
              currentStep === 1
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold shadow-sm'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
            ]"
          >
            <span class="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 text-[11px] font-mono flex items-center justify-center border border-teal-500/30">1</span>
            <span>{{ t('logForm.step1') }}</span>
          </button>

          <button
            type="button"
            @click="canProceedToStep2 ? currentStep = 2 : null"
            class="h-9 rounded-md font-semibold transition text-xs flex items-center justify-center gap-2 border"
            :class="[
              currentStep === 2
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold shadow-sm'
                : canProceedToStep2
                ? 'bg-slate-900/60 text-slate-400 border-slate-800 cursor-pointer hover:text-slate-200'
                : 'bg-slate-950/40 text-slate-600 border-slate-900 cursor-not-allowed'
            ]"
          >
            <span class="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-mono flex items-center justify-center">2</span>
            <span>{{ t('logForm.step2') }}</span>
          </button>
        </div>
      </div>

      <!-- Fullscreen Scrollable Body (Strict min-h-0 & no-scrollbar) -->
      <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 sm:p-6 max-w-xl mx-auto w-full space-y-4">
        <!-- STEP 1: Tim, Live Auto Clock & Kehadiran Pekerja -->
        <div v-if="currentStep === 1" class="space-y-4">
          <div class="bg-slate-900/60 p-4 border border-slate-800/80 rounded-md space-y-4 shadow-sm">
            <h4 class="text-xs font-bold text-teal-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <Users class="w-4 h-4" />
              <span>{{ t('logForm.step1Short') }}</span>
            </h4>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                {{ t('logForm.selectTeam') }}
              </label>
              <CustomCombobox
                v-model="selectedTeamId"
                :options="teamOptions"
                :placeholder="t('logForm.placeholderTeam')"
                @add-option="handleAddTeamFromCombobox"
              />
            </div>

            <!-- Automatic Live Clock Field -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>{{ t('logForm.recordTime') }}</span>
                <span class="text-[10px] text-teal-400 font-mono font-normal">{{ t('logForm.realTimeSync') }}</span>
              </label>
              <div class="h-9 bg-slate-950 border border-slate-800 rounded-md px-3 flex items-center justify-between">
                <div class="flex items-center gap-2 text-slate-400 text-xs font-medium">
                  <Clock class="w-3.5 h-3.5 text-teal-400" />
                  <span>{{ t('logForm.currentHour') }}</span>
                </div>
                <span class="text-xs font-mono font-bold text-teal-300 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20">
                  {{ currentAutoTime }}
                </span>
              </div>
            </div>
          </div>

          <!-- Attendance Checkbox Cards -->
          <div class="bg-slate-900/60 p-4 border border-slate-800/80 rounded-md space-y-3 shadow-sm">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-teal-400 uppercase tracking-wider font-mono flex items-center gap-2">
                <CheckCircle2 class="w-4 h-4" />
                <span>{{ t('logForm.attendanceTitle') }}</span>
              </h4>
              <span class="text-xs font-mono text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/20 font-bold">
                {{ presentMemberIds.length }} {{ t('logForm.presentWorkers') }}
              </span>
            </div>

            <div class="space-y-2">
              <div
                v-for="member in currentTeamMembers"
                :key="member.id"
                @click="toggleMemberAttendance(member.id)"
                class="p-3 rounded-md border flex items-center justify-between cursor-pointer transition select-none"
                :class="[
                  presentMemberIds.includes(member.id)
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-slate-800 bg-slate-950/40 text-slate-500 hover:border-slate-700'
                ]"
              >
                <div class="flex items-center gap-3">
                  <img
                    :src="member.avatar_url"
                    class="w-8 h-8 rounded-md bg-slate-800 object-cover border border-slate-700 shrink-0"
                  />
                  <div>
                    <p class="font-bold text-xs text-slate-100">{{ member.full_name }}</p>
                    <p class="text-[10px] text-slate-400 capitalize">{{ member.role }}</p>
                  </div>
                </div>

                <div
                  class="px-2.5 py-1 rounded text-xs font-bold"
                  :class="[
                    presentMemberIds.includes(member.id)
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-500'
                  ]"
                >
                  <span>{{ presentMemberIds.includes(member.id) ? t('logForm.present') : t('logForm.absent') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 2: Total Quantity, Photo Proof & Live Smart Split -->
        <div v-else class="space-y-4">
          <div class="bg-slate-900/60 p-4 border border-slate-800/80 rounded-md space-y-4 shadow-sm">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                {{ t('logForm.inputQty') }}
              </label>
              <div class="relative h-10">
                <input
                  type="number"
                  v-model.number="totalQty"
                  placeholder="Contoh: 600"
                  min="0"
                  class="w-full h-full bg-slate-950 border border-slate-800 rounded-md pl-3.5 pr-28 text-lg font-bold font-mono text-teal-400 focus:outline-none focus:border-teal-500"
                />
                <span class="absolute right-3.5 top-2.5 text-xs text-slate-500 font-mono">Pcs Earphone</span>
              </div>
            </div>

            <!-- Live Smart Split Banner -->
            <div class="bg-gradient-to-br from-slate-950 to-slate-900 border border-teal-500/30 rounded-md p-4 text-center space-y-1">
              <span class="text-xs font-mono text-teal-300 uppercase tracking-wider font-bold">
                {{ t('logForm.calculationPreview') }}
              </span>
              <p class="text-3xl font-black font-mono text-teal-400">
                {{ perWorkerShare }} <span class="text-xs font-normal text-slate-400">Pcs / {{ t('logForm.person') }}</span>
              </p>

              <div class="pt-2 text-xs text-slate-400 border-t border-slate-800/80 mt-2">
                <p>{{ t('logForm.formulaShort', { total: totalQty, present: presentMemberIds.length }) }}</p>
              </div>
            </div>
          </div>

          <!-- Photo Upload & Notes -->
          <div class="bg-slate-900/60 p-4 border border-slate-800/80 rounded-md space-y-3.5 shadow-sm">
            <ImageUploader v-model="photoUrl" />

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">
                {{ t('logForm.notes') }}
              </label>
              <textarea
                v-model="notes"
                rows="2"
                placeholder="Misal: Kendala timah solder / penggantian bahan lem"
                class="w-full bg-slate-950 border border-slate-800 rounded-md p-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Strict Visible Bottom Action Bar -->
      <div class="py-3.5 px-4 sm:px-6 border-t border-slate-800 bg-slate-900 shrink-0 shadow-2xl z-10">
        <div class="max-w-xl mx-auto w-full">
          <div v-if="currentStep === 1" class="w-full">
            <button
              type="button"
              @click="currentStep = 2"
              :disabled="!canProceedToStep2"
              class="w-full h-10 px-5 rounded-md bg-gradient-to-r from-teal-500 to-emerald-400 hover:opacity-90 disabled:opacity-40 text-slate-950 font-bold text-xs transition shadow-md shadow-teal-500/20 inline-flex items-center justify-center gap-1.5"
            >
              <span>{{ t('logForm.nextStep') }}</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>

          <div v-else class="grid grid-cols-2 gap-3 w-full sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              @click="currentStep = 1"
              class="w-full sm:w-auto h-10 px-4 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition inline-flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <ArrowLeft class="w-4 h-4" />
              <span>{{ t('logForm.prevStep') }}</span>
            </button>

            <button
              type="button"
              @click="handleSave"
              :disabled="isSubmitting"
              class="w-full sm:w-auto h-10 px-6 rounded-md bg-gradient-to-r from-teal-500 to-emerald-400 hover:opacity-90 disabled:opacity-50 text-slate-950 font-extrabold text-xs transition shadow-md shadow-teal-500/30 inline-flex items-center justify-center gap-1.5"
            >
              <span v-if="isSubmitting">{{ t('logForm.saving') }}</span>
              <span v-else class="inline-flex items-center justify-center gap-1.5">
                <span>{{ t('logForm.saveBtn') }}</span>
                <Check class="w-4 h-4 text-slate-950 stroke-[3]" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTeamStore } from '@/stores/teamStore'
import { useProductionStore } from '@/stores/productionStore'
import CustomCombobox, { type ComboboxOption } from '@/components/CustomCombobox.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import { Zap, X, Check, ArrowLeft, ArrowRight, Users, CheckCircle2, Clock } from 'lucide-vue-next'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])
const { t } = useI18n()
const teamStore = useTeamStore()
const productionStore = useProductionStore()

const currentStep = ref<1 | 2>(1)
const selectedTeamId = ref('')
const currentAutoTime = ref('')
const presentMemberIds = ref<string[]>([])
const totalQty = ref<number>(180)
const photoUrl = ref<string>('')
const notes = ref<string>('')
const isSubmitting = ref(false)

function updateAutoTime() {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  currentAutoTime.value = `${hours}:${minutes}:${seconds} WIB`
}

let clockTimer: number | null = null

onMounted(() => {
  updateAutoTime()
  clockTimer = window.setInterval(updateAutoTime, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})

watch(
  () => teamStore.teams,
  (teams) => {
    if (teams.length > 0 && !selectedTeamId.value) {
      selectedTeamId.value = teams[0].id
    }
  },
  { immediate: true }
)

const teamOptions = computed<ComboboxOption[]>(() => {
  return teamStore.teams.map(t => ({ label: `${t.name} (Target: ${t.hourly_target} Pcs)`, value: t.id }))
})

async function handleAddTeamFromCombobox(newOpt: ComboboxOption) {
  await teamStore.addTeam(newOpt.label, 180)
  const created = teamStore.teams.find(t => t.name === newOpt.label)
  if (created) {
    selectedTeamId.value = created.id
  }
}

const currentTeam = computed(() => {
  return teamStore.teams.find(t => t.id === selectedTeamId.value || t.name === selectedTeamId.value)
})

const currentTeamMembers = computed(() => {
  const members = currentTeam.value?.members || []
  return members.filter(m => {
    const status = (m.status || '').toLowerCase()
    return !status.includes('keluar') && !status.includes('out')
  })
})

watch(
  currentTeamMembers,
  (members) => {
    presentMemberIds.value = members.map(m => m.id)
  },
  { immediate: true }
)

function toggleMemberAttendance(memberId: string) {
  if (presentMemberIds.value.includes(memberId)) {
    presentMemberIds.value = presentMemberIds.value.filter(id => id !== memberId)
  } else {
    presentMemberIds.value.push(memberId)
  }
}

const perWorkerShare = computed(() => {
  const count = presentMemberIds.value.length || 1
  return Math.floor(totalQty.value / count)
})

const canProceedToStep2 = computed(() => {
  return Boolean(selectedTeamId.value)
})

function closeModal() {
  currentStep.value = 1
  emit('close')
}

async function handleSave() {
  if (!currentTeam.value) return
  isSubmitting.value = true
  try {
    const now = new Date()
    const currentHour = now.getHours()
    const startStr = `${currentHour.toString().padStart(2, '0')}:00`
    const endStr = `${((currentHour + 1) % 24).toString().padStart(2, '0')}:00`
    const formattedSlot = `${startStr} - ${endStr}`

    await productionStore.addProductionLog({
      team_id: currentTeam.value.id,
      team_name: currentTeam.value.name,
      hour_slot: formattedSlot,
      total_qty: totalQty.value,
      present_member_ids: presentMemberIds.value,
      photo_url: photoUrl.value,
      notes: notes.value
    })
    closeModal()
  } catch (err) {
    console.error('Failed saving production log:', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.99); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 0.15s ease-out forwards;
}
</style>
