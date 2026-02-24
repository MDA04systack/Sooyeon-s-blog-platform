-- DevLog Blog Platform - Initial Schema Migration
-- Run via: npx supabase db push (with Supabase CLI)
-- Or paste into Supabase Dashboard > SQL Editor

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

CREATE TABLE IF NOT EXISTS public.categories (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    slug          TEXT NOT NULL UNIQUE,
    sort_order    INT DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- POSTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT NOT NULL,
    slug          TEXT NOT NULL UNIQUE,
    excerpt       TEXT,
    content       TEXT,
    category_id   UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    thumbnail_url TEXT,
    author_name   TEXT NOT NULL DEFAULT 'Anonymous',
    author_avatar_url TEXT,
    published_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_featured   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON public.posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_is_featured ON public.posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at DESC);

-- Updated_at trigger for posts
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Categories: public read
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (TRUE);

-- Posts: public read
CREATE POLICY "posts_public_read" ON public.posts FOR SELECT USING (TRUE);

-- Posts: authenticated write
CREATE POLICY "posts_auth_insert" ON public.posts FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "posts_auth_update" ON public.posts FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "posts_auth_delete" ON public.posts FOR DELETE TO authenticated USING (TRUE);
