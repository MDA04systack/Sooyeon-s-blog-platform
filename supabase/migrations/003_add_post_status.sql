-- ============================================================
-- ADD POST STATUS AND UPDATE RLS POLICIES
-- ============================================================

-- 1. Add status column with check constraint (if not exists)
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
CHECK (status IN ('draft', 'published', 'private'));

-- 2. Update existing posts to be 'published' since they were created before this feature
UPDATE public.posts
SET status = 'published'
WHERE status = 'draft';

-- ============================================================
-- UPDATE ROW LEVEL SECURITY (RLS) POLICIES FOR BLOG WRITING
-- ============================================================

-- Drop old read policy
DROP POLICY IF EXISTS "posts_public_read" ON public.posts;

-- 1. Read Policy:
-- Anyone can read 'published' posts.
-- Authenticated users can read their *own* 'draft' or 'private' posts.
-- (We assume the user is identified by an auth.uid() column or similar. Wait, the posts table doesn't have a user_id column. It only has author_name!)
-- 🚨 CRITICAL FIX: To use RLS properly, we NEED a user_id column tracking who owns the post.
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

-- Now we can create proper RLS policies based on ownership
DROP POLICY IF EXISTS "posts_read_policy" ON public.posts;
CREATE POLICY "posts_read_policy" ON public.posts
FOR SELECT USING (
    status = 'published' 
    OR 
    (auth.uid() = user_id)
);

-- Drop old write policies
DROP POLICY IF EXISTS "posts_auth_insert" ON public.posts;
DROP POLICY IF EXISTS "posts_auth_update" ON public.posts;
DROP POLICY IF EXISTS "posts_auth_delete" ON public.posts;

-- 2. Insert Policy: 
-- Authenticated users can insert posts (user_id is set to their uid automatically by default, but we enforce it).
DROP POLICY IF EXISTS "posts_insert_policy" ON public.posts;
CREATE POLICY "posts_insert_policy" ON public.posts
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 3. Update Policy:
-- Users can only update their *own* posts.
DROP POLICY IF EXISTS "posts_update_policy" ON public.posts;
CREATE POLICY "posts_update_policy" ON public.posts
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Delete Policy:
-- Users can only delete their *own* posts.
DROP POLICY IF EXISTS "posts_delete_policy" ON public.posts;
CREATE POLICY "posts_delete_policy" ON public.posts
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Force schema cache reload (PostgREST specific)
NOTIFY pgrst, 'reload schema';
