-- DevLog: Admin Featured Posts Function
-- Migration 017
-- Run via Supabase Dashboard SQL Editor

-- 1. admin_get_all_posts 업데이트 (is_featured 포함)
CREATE OR REPLACE FUNCTION public.admin_get_all_posts()
RETURNS TABLE (
    id UUID,
    title TEXT,
    status TEXT,
    author_name TEXT,
    created_at TIMESTAMPTZ,
    slug TEXT,
    is_featured BOOLEAN
) AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT p.id, p.title, p.status, p.author_name, p.created_at, p.slug, p.is_featured
    FROM public.posts p
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. 상단 고정 토글 함수 (최대 3개 제한 검사 포함)
CREATE OR REPLACE FUNCTION public.admin_toggle_post_feature(target_post_id UUID, make_featured BOOLEAN)
RETURNS VOID AS $$
DECLARE
    current_featured_count INT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- 별표 채우기(true) 동작 시 개수 점검
    IF make_featured = TRUE THEN
        SELECT COUNT(*) INTO current_featured_count FROM public.posts WHERE is_featured = TRUE;
        
        IF current_featured_count >= 3 THEN
            RAISE EXCEPTION '메인 상단 고정 게시물은 최대 3개까지만 설정할 수 있습니다.';
        END IF;
    END IF;

    UPDATE public.posts
    SET is_featured = make_featured,
        updated_at = NOW()
    WHERE id = target_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
