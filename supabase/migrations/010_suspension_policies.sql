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
