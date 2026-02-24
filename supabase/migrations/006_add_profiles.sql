-- DevLog: Add Profiles Table (username, nickname, full_name)
-- Migration 006

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username    TEXT NOT NULL UNIQUE,   -- 고유 아이디 (로그인용)
    nickname    TEXT NOT NULL UNIQUE,   -- 고유 닉네임 (게시글 표시용)
    full_name   TEXT,                  -- 실명
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON public.profiles(nickname);

-- Updated_at trigger
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read all profiles (for displaying author names)
CREATE POLICY "Profiles are publicly readable"
    ON public.profiles FOR SELECT
    USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Service role can insert (for trigger use)
CREATE POLICY "Service role can insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can delete own profile (account deletion)
CREATE POLICY "Users can delete own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (Trigger)
-- ============================================================
-- When a new auth.user is created via Social Login (Google),
-- this trigger auto-populates the profiles table with a
-- derived username and nickname from their email or metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    base_username TEXT;
    base_nickname TEXT;
    final_username TEXT;
    final_nickname TEXT;
    suffix INT := 0;
BEGIN
    -- Derive base from email prefix (e.g., "sooyeon" from "sooyeon@gmail.com")
    base_username := split_part(NEW.email, '@', 1);
    base_nickname := COALESCE(NEW.raw_user_meta_data->>'display_name',
                              NEW.raw_user_meta_data->>'full_name',
                              base_username);

    -- Ensure username uniqueness by appending a number if needed
    final_username := base_username;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
        suffix := suffix + 1;
        final_username := base_username || suffix::TEXT;
    END LOOP;

    -- Ensure nickname uniqueness by appending a number if needed
    suffix := 0;
    final_nickname := base_nickname;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE nickname = final_nickname) LOOP
        suffix := suffix + 1;
        final_nickname := base_nickname || suffix::TEXT;
    END LOOP;

    -- Only auto-insert for social/OAuth logins (not email/password signups)
    -- Email/password users have their profile inserted by the app after signup
    IF NEW.raw_app_meta_data->>'provider' != 'email' OR NEW.raw_app_meta_data->>'provider' IS NULL THEN
        INSERT INTO public.profiles (id, username, nickname, full_name)
        VALUES (
            NEW.id,
            final_username,
            final_nickname,
            COALESCE(NEW.raw_user_meta_data->>'full_name', base_username)
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RPC: get_email_by_username (for ID-based login)
-- ============================================================
-- Used by the login form to resolve a username to its email,
-- so we can pass the email to signInWithPassword.
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
    user_email TEXT;
BEGIN
    SELECT au.email INTO user_email
    FROM public.profiles p
    JOIN auth.users au ON au.id = p.id
    WHERE p.username = p_username
    LIMIT 1;
    RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: check_username_available
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_username_available(p_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE username = lower(trim(p_username))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: check_nickname_available
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_nickname_available(p_nickname TEXT, p_exclude_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE nickname = trim(p_nickname)
          AND (p_exclude_user_id IS NULL OR id != p_exclude_user_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: delete_user_account (for account deletion)
-- ============================================================
-- SECURITY DEFINER allows the function to bypass RLS and delete
-- the auth.users row (which cascades to profiles).
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS VOID AS $$
BEGIN
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
