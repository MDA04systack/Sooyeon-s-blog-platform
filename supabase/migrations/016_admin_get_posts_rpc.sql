-- DevLog: Admin Get All Posts Function
-- Migration 016
-- Run via Supabase Dashboard SQL Editor

CREATE OR REPLACE FUNCTION public.admin_get_all_posts()
RETURNS TABLE (
    id UUID,
    title TEXT,
    status TEXT,
    author_name TEXT,
    created_at TIMESTAMPTZ,
    slug TEXT
) AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT 
        p.id, 
        p.title, 
        p.status, 
        p.author_name, 
        p.created_at, 
        p.slug
    FROM public.posts p
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
