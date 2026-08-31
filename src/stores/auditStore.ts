import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDB, type LocalAuditLog } from '@/services/db'
import { supabase } from '@/supabase/client'
import { isCloudEnabled } from '@/services/supabaseSyncService'

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

      if (isCloudEnabled.value && navigator.onLine) {
        supabase.from('audit_logs').upsert({
          id: newEntry.id,
          timestamp: newEntry.timestamp,
          category: newEntry.category,
          action: newEntry.action,
          details: newEntry.details || null,
          user_name: newEntry.user || null,
          created_at: newEntry.timestamp
        }, { onConflict: 'id' }).then()
      }
    } catch (e) {
      console.warn('Failed to save audit log:', e)
    }
  }

  async function clearLogs() {
    auditLogs.value = []
    try {
      const db = await getDB()
      await db.clear('audit_logs')
      if (isCloudEnabled.value && navigator.onLine) {
        supabase.from('audit_logs').delete().neq('id', '___none___').then()
      }
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
