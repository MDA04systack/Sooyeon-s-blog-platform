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
-- DevLog: Add site settings for signup control
-- Migration 009

CREATE TABLE IF NOT EXISTS public.site_settings (
    id INT PRIMARY KEY CHECK (id = 1),
    signup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert the default single row
INSERT INTO public.site_settings (id, signup_enabled)
VALUES (1, TRUE)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "site_settings_public_read"
    ON public.site_settings FOR SELECT
    USING (true);

-- Only admins can update settings (assumes profile.role = 'admin')
CREATE POLICY "site_settings_admin_update"
    ON public.site_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
-- DevLog: Suspension Policies for Posts and Comments
-- Migration 010

-- ============================================================
-- POLICIES FOR SUSPENDED USERS
-- ============================================================
-- We use a trigger instead of RLS to prevent INSERT/UPDATE for posts and comments
-- because Supabase RLS USING/WITH CHECK can be tricky when checking another table's 
-- real-time state for every single row. A BEFORE trigger is safer.

CREATE OR REPLACE FUNCTION public.check_user_suspension()
RETURNS TRIGGER AS $$
DECLARE
    v_suspended_until TIMESTAMPTZ;
BEGIN
    SELECT suspended_until INTO v_suspended_until
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_suspended_until IS NOT NULL AND v_suspended_until > NOW() THEN
        RAISE EXCEPTION 'Account suspended until %', v_suspended_until;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for posts
DROP TRIGGER IF EXISTS trg_check_suspension_posts ON public.posts;
CREATE TRIGGER trg_check_suspension_posts
    BEFORE INSERT OR UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.check_user_suspension();

-- Trigger for comments
DROP TRIGGER IF EXISTS trg_check_suspension_comments ON public.comments;
CREATE TRIGGER trg_check_suspension_comments
    BEFORE INSERT OR UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.check_user_suspension();
-- DevLog: Admin User Functions
-- Migration 011

-- ============================================================
-- RPC: admin_get_users
-- ============================================================
-- RETURNS: id, username, nickname, email, created_at, role, suspended_until
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE (
    id UUID,
    username TEXT,
    nickname TEXT,
    email TEXT,
    created_at TIMESTAMPTZ,
    role TEXT,
    suspended_until TIMESTAMPTZ
) AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT 
        p.id, 
        p.username, 
        p.nickname, 
        au.email::text, 
        p.created_at, 
        p.role, 
        p.suspended_until
    FROM public.profiles p
    JOIN auth.users au ON au.id = p.id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- RPC: admin_delete_user
-- ============================================================
-- Hard deletes an auth.user record which cascades to profiles, posts, etc.
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Prevent self-deletion via this admin route
    IF auth.uid() = target_user_id THEN
        RAISE EXCEPTION 'Cannot delete your own admin account';
    END IF;

    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- DevLog: Review Category RLS Policies for Admin
-- Migration 012

-- Previously in 001_initial_schema.sql:
-- CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (TRUE);
-- (Only READ was public)

-- We need to permit Admins to INSERT, UPDATE, DELETE categories

CREATE POLICY "categories_admin_insert" ON public.categories FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "categories_admin_update" ON public.categories FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "categories_admin_delete" ON public.categories FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
-- DevLog: Create Initial Admin User securely
-- Migration 013 (Admin Auth Seed via pg_crypto/auth schema)
-- Using hardcoded uuid so we can cross-reference it if we want, or gen_random_uuid
DO $$
DECLARE
    admin_uid UUID := gen_random_uuid();
    admin_email TEXT := 'ocarrotcakeo@gmail.com';
    admin_password TEXT := 'admin'; 
    encrypted_pw TEXT;
BEGIN
    -- Only create if this email does not exist yet to prevent errors on multiple runs
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
        
        -- Generate encrypted password using pgcrypto extension manually mimicking Supabase
        encrypted_pw := extensions.crypt(admin_password, extensions.gen_salt('bf', 10));

        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            role,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            admin_uid,
            '00000000-0000-0000-0000-000000000000',
            admin_email,
            encrypted_pw,
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "관리자", "display_name": "관리자"}',
            NOW(),
            NOW(),
            'authenticated',
            '',
            '',
            '',
            ''
        );

        -- The handle_new_user() Trigger from 006 migration might catch this and auto-insert,
        -- BUT it ignores email providers. So we manually insert the profile.
        INSERT INTO public.profiles (
            id,
            username,
            nickname,
            full_name,
            role
        ) VALUES (
            admin_uid,
            'admin',      -- requested username
            '관리자',      -- requested nickname
            '관리자',
            'admin'       -- MUST BE ADMIN
        );

    END IF;
END $$;
