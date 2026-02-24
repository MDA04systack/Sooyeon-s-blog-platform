import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MyPageClient from '@/components/MyPageClient'
import type { Post } from '@/types/post'

export default async function MyPostsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Fetch user's own posts
    const { data: myPostsData } = await supabase
        .from('posts')
        .select('id, title, slug, status, published_at, view_count, categories(name, slug)')
        .eq('user_id', user.id)
        .order('published_at', { ascending: false })

    // Fetch user's bookmarked posts
    const { data: bookmarksData } = await supabase
        .from('bookmarks')
        .select(`
            post_id,
            posts (
                id, 
                title, 
                slug, 
                status, 
                published_at, 
                view_count, 
                categories(name, slug)
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    // Map bookmarks to standard post format
    const bookmarkedPosts = (bookmarksData || [])
        .map(bookmark => bookmark.posts)
        .filter(Boolean) as unknown as Post[]

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <Navbar />
            <main className="mx-auto max-w-4xl px-6 py-16">
                {/* Page Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">마이 페이지</h1>
                    <p className="mt-2 text-[var(--text-muted)]">작성한 글을 관리하고 북마크한 글을 모아보세요.</p>
                </div>

                <MyPageClient myPosts={(myPostsData || []) as unknown as Post[]} bookmarkedPosts={bookmarkedPosts} />
            </main>
            <Footer />
        </div>
    )
}
