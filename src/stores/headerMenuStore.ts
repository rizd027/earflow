import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHeaderMenuStore = defineStore('headerMenu', () => {
  const isOpen = ref(false)

  function toggle() {
    isOpen.value = !isOpen.value
  }

  function close() {
    isOpen.value = false
  }

  function open() {
    isOpen.value = true
  }

  return {
    isOpen,
    toggle,
    close,
    open
  }
})
