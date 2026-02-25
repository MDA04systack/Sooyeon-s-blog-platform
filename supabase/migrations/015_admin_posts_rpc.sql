-- DevLog: Admin Posts Functions
-- Migration 015
-- Run via Supabase Dashboard SQL Editor

CREATE OR REPLACE FUNCTION public.admin_update_post_status(target_post_id UUID, new_status TEXT)
RETURNS VOID AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    UPDATE public.posts
    SET status = new_status,
        updated_at = NOW()
    WHERE id = target_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.admin_delete_post(target_post_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    DELETE FROM public.posts
    WHERE id = target_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
