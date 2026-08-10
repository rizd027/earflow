import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDB, type LocalAuditLog } from '@/services/db'

export const useAuditStore = defineStore('audit', () => {
  const auditLogs = ref<LocalAuditLog[]>([])
  const isLoading = ref(false)

  async function loadLogs() {
    isLoading.value = true
    try {
      const db = await getDB()
      const fetched = await db.getAllFromIndex('audit_logs', 'by-timestamp')
      // Sort newest first
      auditLogs.value = fetched.reverse()
    } catch (e) {
      console.warn('Failed to load audit logs:', e)
    } finally {
      isLoading.value = false
    }
  }

  async function logAction(
    category: 'Target' | 'Absensi' | 'Tim' | 'Pekerja' | 'System',
    action: string,
    details: string,
    user: string = 'Mandor'
  ) {
    const newEntry: LocalAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      category,
      action,
      details,
      user
    }

    auditLogs.value.unshift(newEntry)

    try {
      const db = await getDB()
      await db.put('audit_logs', JSON.parse(JSON.stringify(newEntry)))
    } catch (e) {
      console.warn('Failed to save audit log:', e)
    }
  }

  async function clearLogs() {
    auditLogs.value = []
    try {
      const db = await getDB()
      await db.clear('audit_logs')
    } catch (e) {
      console.warn('Failed to clear audit logs:', e)
    }
  }

  return {
    auditLogs,
    isLoading,
    loadLogs,
    logAction,
    clearLogs
  }
})
