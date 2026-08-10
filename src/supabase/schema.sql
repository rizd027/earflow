-- EarFlow: Earphone Production Management System
-- Schema Definition for Supabase (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('mandor', 'pekerja')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  shift TEXT DEFAULT '13:00 - 20:00',
  supervisor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  hourly_target INT DEFAULT 180,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TEAM MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- 4. PRODUCTION LOGS TABLE (Recorded hourly by Mandor)
CREATE TABLE IF NOT EXISTS public.production_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hour_slot TEXT NOT NULL CHECK (hour_slot IN ('13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00')),
  total_qty INT NOT NULL CHECK (total_qty >= 0),
  present_count INT NOT NULL CHECK (present_count > 0),
  photo_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, date, hour_slot)
);

-- 5. INDIVIDUAL RESULTS TABLE (Auto-calculated split per worker)
CREATE TABLE IF NOT EXISTS public.individual_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_id UUID NOT NULL REFERENCES public.production_logs(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hour_slot TEXT NOT NULL,
  individual_qty INT NOT NULL DEFAULT 0,
  is_present BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(log_id, user_id)
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_results ENABLE ROW LEVEL SECURITY;

-- Allow authenticated read access to all users
CREATE POLICY "Public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public read team_members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Public read production_logs" ON public.production_logs FOR SELECT USING (true);
CREATE POLICY "Public read individual_results" ON public.individual_results FOR SELECT USING (true);

-- Allow mandor to insert and update logs
CREATE POLICY "Mandor write production_logs" ON public.production_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mandor')
);

CREATE POLICY "Mandor write individual_results" ON public.individual_results FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mandor')
);

-- DUMMY SEED DATA FOR TESTING / PRODUCTION START
INSERT INTO public.teams (id, name, hourly_target) VALUES 
('t1111111-1111-1111-1111-111111111111', 'Tim Alpha (Solder)', 180),
('t2222222-2222-2222-2222-222222222222', 'Tim Beta (Lem)', 210),
('t3333333-3333-3333-3333-333333333333', 'Tim Gamma (Assembly)', 195)
ON CONFLICT DO NOTHING;
