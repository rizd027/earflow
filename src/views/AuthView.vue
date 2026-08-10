<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
    <!-- Ambient Background Accents -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <div class="w-full max-w-md space-y-5 relative z-10">
      <!-- App Header Branding -->
      <div class="text-center space-y-2">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-md bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 font-black text-2xl shadow-lg shadow-teal-500/30 mb-1">
          E
        </div>
        <h1 class="text-2xl font-extrabold tracking-tight font-mono text-white">EarFlow</h1>
        <p class="text-xs text-slate-400">
          Sistem Manajemen Produksi Earphone Shift 13:00 - 20:00
        </p>
      </div>

      <!-- Auth Form Card (Borderless & Cardless Style) -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-md p-5 shadow-2xl backdrop-blur-xl space-y-4">
        <div class="flex border-b border-slate-800 text-xs font-semibold">
          <button
            type="button"
            @click="isRegister = false"
            class="flex-1 pb-2.5 text-center transition border-b-2"
            :class="[!isRegister ? 'border-teal-500 text-teal-400 font-bold' : 'border-transparent text-slate-400']"
          >
            Masuk Akun
          </button>
          <button
            type="button"
            @click="isRegister = true"
            class="flex-1 pb-2.5 text-center transition border-b-2"
            :class="[isRegister ? 'border-teal-500 text-teal-400 font-bold' : 'border-transparent text-slate-400']"
          >
            Daftar Baru
          </button>
        </div>

        <form @submit.prevent="handleAuthSubmit" class="space-y-3">
          <div v-if="isRegister">
            <label class="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap</label>
            <input
              type="text"
              v-model="fullName"
              placeholder="Contoh: Pak Hendra"
              required
              class="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Email</label>
            <input
              type="email"
              v-model="email"
              placeholder="mandor@earflow.com"
              required
              class="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Kata Sandi</label>
            <input
              type="password"
              v-model="password"
              placeholder="••••••••"
              required
              class="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Peran Akses</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="role = 'mandor'"
                class="py-2 px-3 rounded-md border text-xs font-medium transition flex items-center justify-center gap-1.5"
                :class="[role === 'mandor' ? 'border-teal-500 bg-teal-500/10 text-teal-300 font-bold' : 'border-slate-800 bg-slate-950 text-slate-400']"
              >
                <ShieldCheck class="w-4 h-4 text-teal-400" />
                <span>Mandor / Pengawas</span>
              </button>
              <button
                type="button"
                @click="role = 'pekerja'"
                class="py-2 px-3 rounded-md border text-xs font-medium transition flex items-center justify-center gap-1.5"
                :class="[role === 'pekerja' ? 'border-teal-500 bg-teal-500/10 text-teal-300 font-bold' : 'border-slate-800 bg-slate-950 text-slate-400']"
              >
                <Wrench class="w-4 h-4 text-teal-400" />
                <span>Pekerja Produksi</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-2.5 rounded-md bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shadow-teal-500/20 hover:opacity-90 transition active:scale-98"
          >
            {{ isLoading ? 'Memproses...' : (isRegister ? 'Buat Akun EarFlow' : 'Masuk ke Aplikasi') }}
          </button>
        </form>

        <!-- Quick Demo Login Switcher -->
        <div class="pt-3 border-t border-slate-800 space-y-2">
          <p class="text-[10px] text-slate-400 text-center font-semibold uppercase tracking-wider">
            {{ t('auth.quickDemo') }}
          </p>

          <div class="grid grid-cols-1 gap-2">
            <button
              type="button"
              @click="quickMandorLogin"
              class="w-full py-2 px-3 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-teal-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <ShieldCheck class="w-4 h-4 text-teal-400" />
              <span>{{ t('auth.mandorDemo') }}</span>
            </button>

            <button
              type="button"
              @click="quickWorkerLogin"
              class="w-full py-2 px-3 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Wrench class="w-4 h-4 text-slate-400" />
              <span>{{ t('auth.workerDemo') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import { isSupabaseConfigured, supabase } from '@/supabase/client'
import { ShieldCheck, Wrench } from 'lucide-vue-next'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const isRegister = ref(false)
const email = ref('')
const password = ref('')
const fullName = ref('')
const role = ref<'mandor' | 'pekerja'>('mandor')
const isLoading = ref(false)

async function handleAuthSubmit() {
  isLoading.value = true
  try {
    if (isSupabaseConfigured) {
      if (isRegister.value) {
        await supabase.auth.signUp({
          email: email.value,
          password: password.value,
          options: {
            data: { full_name: fullName.value, role: role.value }
          }
        })
      } else {
        await supabase.auth.signInWithPassword({
          email: email.value,
          password: password.value
        })
      }
    }
    authStore.currentUser = {
      id: `u_${Date.now()}`,
      email: email.value || 'user@earflow.com',
      full_name: fullName.value || (role.value === 'mandor' ? 'Pak Hendra' : 'Budi Santoso'),
      role: role.value
    }
    authStore.isMandor = role.value === 'mandor'
    if (role.value === 'mandor' && fullName.value.trim()) {
      authStore.setForemanName(fullName.value.trim())
    }
    router.push('/')
  } catch (err) {
    console.error('Auth error:', err)
  } finally {
    isLoading.value = false
  }
}

function quickMandorLogin() {
  authStore.loginAsMandor()
  router.push('/')
}

function quickWorkerLogin() {
  authStore.loginAsWorker()
  router.push('/')
}
</script>
