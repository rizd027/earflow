<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 h-16 px-1 font-sans pb-safe">
    <div class="grid grid-cols-5 h-full items-center">
      <router-link
        to="/"
        class="flex flex-col items-center justify-center gap-1 h-full text-[9px] font-semibold transition"
        :class="[route.path === '/' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200']"
      >
        <UserCheck class="w-4 h-4" />
        <span>Absensi</span>
      </router-link>

      <router-link
        to="/performance"
        class="flex flex-col items-center justify-center gap-1 h-full text-[9px] font-semibold transition"
        :class="[route.path === '/performance' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200']"
      >
        <TrendingUp class="w-4 h-4" />
        <span>Performa</span>
      </router-link>

      <router-link
        to="/teams"
        class="flex flex-col items-center justify-center gap-1 h-full text-[9px] font-semibold transition"
        :class="[route.path === '/teams' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200']"
      >
        <Users class="w-4 h-4" />
        <span>Tim</span>
      </router-link>

      <router-link
        to="/history"
        class="flex flex-col items-center justify-center gap-1 h-full text-[9px] font-semibold transition"
        :class="[route.path === '/history' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200']"
      >
        <ClipboardList class="w-4 h-4" />
        <span>Rekap</span>
      </router-link>

      <router-link
        to="/settings"
        class="flex flex-col items-center justify-center gap-1 h-full text-[9px] font-semibold transition"
        :class="[route.path === '/settings' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200']"
      >
        <Settings class="w-4 h-4" />
        <span>Setelan</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { UserCheck, Users, ClipboardList, Settings, TrendingUp } from 'lucide-vue-next'

const route = useRoute()
</script>
