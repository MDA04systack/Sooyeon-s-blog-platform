-- ============================================================
-- ADD VIEW COUNT TO POSTS TABLE
-- ============================================================

-- 1. Add column to track view count
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0;

-- 2. Create RPC function to increment view count safely
CREATE OR REPLACE FUNCTION public.increment_view_count(post_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.posts
  SET view_count = view_count + 1
  WHERE slug = post_slug;
END;
$$;
