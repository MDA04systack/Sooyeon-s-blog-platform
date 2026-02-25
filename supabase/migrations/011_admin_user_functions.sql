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
