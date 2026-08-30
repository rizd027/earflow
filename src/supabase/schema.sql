-- =========================================================================
-- EarFlow: Earphone Production Management System
-- Robust Schema Definition for Supabase (PostgreSQL)
-- Compatible with dynamic string IDs (TEXT PRIMARY KEY) & JSONB structures
-- =========================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'mandor',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TEAMS TABLE (Includes embedded members JSONB or relational rows)
CREATE TABLE IF NOT EXISTS public.teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  shift TEXT DEFAULT 'Shift Pagi (07:00 - 14:00)',
  hourly_target INT DEFAULT 180,
  members JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTION LOGS TABLE (Supports all dynamic shifts & custom slots)
CREATE TABLE IF NOT EXISTS public.production_logs (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  team_name TEXT,
  date TEXT NOT NULL,
  hour_slot TEXT NOT NULL,
  total_qty INT NOT NULL DEFAULT 0,
  present_count INT NOT NULL DEFAULT 1,
  present_member_ids JSONB DEFAULT '[]'::jsonb,
  photo_url TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast date and team queries
CREATE INDEX IF NOT EXISTS idx_prod_logs_date ON public.production_logs(date);
CREATE INDEX IF NOT EXISTS idx_prod_logs_team ON public.production_logs(team_id);

-- 4. CELL & WORKER OVERRIDES TABLE (Cell edits from WorkerReport & MonthlyRecap)
CREATE TABLE IF NOT EXISTS public.overrides (
  key TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'daily', -- 'daily' or 'worker'
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for override types
CREATE INDEX IF NOT EXISTS idx_overrides_type ON public.overrides(type);

-- 5. SHIFTS CONFIG TABLE
CREATE TABLE IF NOT EXISTS public.shifts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'System',
  action TEXT NOT NULL,
  details TEXT,
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- 7. APP SETTINGS & MASTER CONFIG TABLE (Foreman name, process types & groups)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Permissive policies for instant sync with Supabase anon & authenticated key
-- =========================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow read/write for all client tables
DROP POLICY IF EXISTS "Allow all for users" ON public.users;
CREATE POLICY "Allow all for users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for teams" ON public.teams;
CREATE POLICY "Allow all for teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for production_logs" ON public.production_logs;
CREATE POLICY "Allow all for production_logs" ON public.production_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for overrides" ON public.overrides;
CREATE POLICY "Allow all for overrides" ON public.overrides FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for shifts" ON public.shifts;
CREATE POLICY "Allow all for shifts" ON public.shifts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for audit_logs" ON public.audit_logs;
CREATE POLICY "Allow all for audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for app_settings" ON public.app_settings;
CREATE POLICY "Allow all for app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for all tables in publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams, public.production_logs, public.overrides, public.shifts, public.app_settings;
