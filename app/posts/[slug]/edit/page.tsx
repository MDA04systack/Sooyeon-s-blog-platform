import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import EditMarkdownEditor from '@/components/EditMarkdownEditor'

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const decodedSlug = decodeURIComponent(slug)

    // Fetch the post
    const { data: post, error } = await supabase
        .from('posts')
        .select('*, categories(id, name)')
        .eq('slug', decodedSlug)
        .single()

    if (error || !post) {
        notFound()
    }

    // Check ownership
    if (post.user_id !== user.id) {
        redirect(`/posts/${slug}`)
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <EditMarkdownEditor user={user} post={post} />
        </div>
    )
}
