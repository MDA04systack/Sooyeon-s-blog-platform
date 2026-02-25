-- DevLog: Add profile role and suspension fields
-- Migration 008

-- ============================================================
-- PROFILES TABLE UPDATES
-- ============================================================
-- 'role' can be 'user' or 'admin'
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- 'suspended_until' holds the expiration date of an account suspension
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;

-- Index for querying suspended users quickly
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended_until ON public.profiles(suspended_until);
