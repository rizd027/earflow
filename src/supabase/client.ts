import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://dkvdiekwjfghdnbyllxq.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_3g_R6YJPD_PRyOXN4rOx7g_fbemgN0Y'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('mock-earflow')
)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})
