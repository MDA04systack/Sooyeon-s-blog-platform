import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PostHeader from '@/components/PostHeader'
import PostContent from '@/components/PostContent'
import type { Post } from '@/types/post'

export default async function PostDetail({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // Decode URL-encoded slug (Korean chars become %XX%XX in URL)
    const decodedSlug = decodeURIComponent(slug)

    // Get current user (may be null if not logged in)
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch post joined with categories (LEFT join so private posts still load)
    const { data: post, error } = await supabase
        .from('posts')
        .select('*, categories(name, slug)')
        .eq('slug', decodedSlug)
        .single()

    // Increment view count via RPC
    if (post) {
        await supabase.rpc('increment_view_count', { post_slug: decodedSlug })
    }

    if (error || !post) {
        console.error(`[PostDetail] 404 for slug: "${decodedSlug}"`, { error, post })
        notFound()
    }

    const isOwner = !!(user && post.user_id === user.id)

    // Check if current user has bookmarked this post
    let initialIsBookmarked = false
    if (user) {
        const { data: bookmark } = await supabase
            .from('bookmarks')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .single()

        if (bookmark) {
            initialIsBookmarked = true
        }
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <Navbar />
            <main>
                <PostHeader
                    post={post as unknown as Post}
                    initialIsBookmarked={initialIsBookmarked}
                    isOwner={isOwner}
                    postId={post.id}
                    postSlug={decodedSlug}
                />
                <PostContent post={post as unknown as Post} />
            </main>
            <Footer />
        </div>
    )
}
