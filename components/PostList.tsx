'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import PostCard from './PostCard'
import type { Post, Category } from '@/types/post'

const POSTS_PER_PAGE = 6

export default function PostList() {
    const [posts, setPosts] = useState<Post[]>([])
    const [featuredPosts, setFeaturedPosts] = useState<Post[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [activeCategorySlug, setActiveCategorySlug] = useState('all')
    const [sortOption, setSortOption] = useState<'latest' | 'oldest' | 'popular'>('latest')
    const [isSortOpen, setIsSortOpen] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(true)

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('categories').select('*').order('sort_order')
            if (data) setCategories(data)
        }
        fetchCategories()
    }, [])

    const fetchPosts = async (categorySlug: string, currentPage: number, sort: string) => {
        setLoading(true)
        const supabase = createClient()

        // 1. Fetch featured posts (only on page 1 and 'all' category)
        if (currentPage === 1 && categorySlug === 'all') {
            const { data: fData } = await supabase
                .from('posts')
                .select('*, categories!inner(name, slug)')
                .eq('status', 'published')
                .eq('is_featured', true)
                .order('published_at', { ascending: false })
                .limit(3)

            if (fData) setFeaturedPosts(fData as unknown as Post[])
        } else if (currentPage === 1) {
            setFeaturedPosts([])
        }

        // 2. Fetch normal posts
        // Use !inner to filter posts by the joined category table
        let query = supabase
            .from('posts')
            .select('*, categories!inner(name, slug)', { count: 'exact' })
            .eq('status', 'published')
            .eq('is_featured', false) // Exclude featured from normal list to prevent duplication
            .range(0, currentPage * POSTS_PER_PAGE - 1)

        // Apply filtering
        if (categorySlug !== 'all') {
            query = query.eq('categories.slug', categorySlug)
        }

        // Apply sorting
        if (sort === 'oldest') {
            query = query.order('published_at', { ascending: true })
        } else if (sort === 'popular') {
            query = query.order('view_count', { ascending: false })
            query = query.order('published_at', { ascending: false }) // tie breaker
        } else {
            // default: latest
            query = query.order('published_at', { ascending: false })
        }

        const { data, count, error } = await query

        if (!error && data) {
            setPosts(data as unknown as Post[])
            setHasMore(count ? count > currentPage * POSTS_PER_PAGE : false)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchPosts(activeCategorySlug, page, sortOption)
    }, [activeCategorySlug, page, sortOption])

    const handleCategoryChange = (slug: string) => {
        setActiveCategorySlug(slug)
        setPage(1)
    }

    const handleSortChange = (sort: 'latest' | 'oldest' | 'popular') => {
        setSortOption(sort)
        setPage(1)
        setIsSortOpen(false)
    }

    const handleLoadMore = () => {
        setPage((prev) => prev + 1)
    }

    return (
        <section className="mx-auto max-w-7xl px-6 py-8 relative">
            {/* Category Filter + Sort */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleCategoryChange('all')}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${activeCategorySlug === 'all'
                            ? 'bg-indigo-500 text-white'
                            : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] ring-1 ring-[var(--border)]'
                            }`}
                    >
                        전체 보기
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.slug)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${activeCategorySlug === cat.slug
                                ? 'bg-indigo-500 text-white'
                                : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] ring-1 ring-[var(--border)]'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3 6h18M7 12h10M11 18h2" />
                        </svg>
                        <span>
                            {sortOption === 'latest' ? '최신순' : sortOption === 'oldest' ? '오래된 순' : '인기순'}
                        </span>
                        <svg className={`h-4 w-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isSortOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-32 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1 shadow-xl z-20">
                                {[
                                    { id: 'latest', label: '최신순' },
                                    { id: 'oldest', label: '오래된 순' },
                                    { id: 'popular', label: '인기순' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleSortChange(opt.id as any)}
                                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition transition-colors ${sortOption === opt.id
                                            ? 'bg-indigo-500/10 text-indigo-500 font-medium'
                                            : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Featured Posts (Only visible on page 1 / 'all' category) */}
            {featuredPosts.length > 0 && (
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <h2 className="text-xl font-bold tracking-tight">주목받는 게시글</h2>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {featuredPosts.map((post) => (
                            <div key={`featured-${post.id}`} className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-indigo-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                                <div className="relative h-full ring-1 ring-yellow-500/50 rounded-2xl overflow-hidden">
                                    <PostCard post={post} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Normal Post Grid */}
            {loading && posts.length === 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-80 rounded-2xl bg-[var(--bg-card)] animate-pulse" />
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-[var(--text-muted)]">
                    <svg className="mb-4 h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium">게시글이 없습니다</p>
                    <p className="mt-1 text-sm">다른 카테고리를 선택해보세요.</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}

            {/* Load More Button */}
            {hasMore && !loading && (
                <div className="mt-12 flex justify-center">
                    <button
                        onClick={handleLoadMore}
                        className="rounded-full border border-[var(--border)] px-8 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition"
                    >
                        더 많은 게시글 보기
                    </button>
                </div>
            )}

            {loading && posts.length > 0 && (
                <div className="mt-12 flex justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                </div>
            )}
        </section>
    )
}
