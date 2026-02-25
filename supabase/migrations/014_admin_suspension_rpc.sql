-- DevLog: Admin Suspension Functions
-- Migration 014
-- Run via Supabase Dashboard SQL Editor

CREATE OR REPLACE FUNCTION public.admin_suspend_user(target_uid UUID, until_timestamp TIMESTAMPTZ)
RETURNS VOID AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Prevent self-suspension
    IF auth.uid() = target_uid THEN
        RAISE EXCEPTION 'Cannot suspend your own admin account';
    END IF;

    UPDATE public.profiles
    SET suspended_until = until_timestamp,
        updated_at = NOW()
    WHERE id = target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.admin_unsuspend_user(target_uid UUID)
RETURNS VOID AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    UPDATE public.profiles
    SET suspended_until = NULL,
        updated_at = NOW()
    WHERE id = target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
