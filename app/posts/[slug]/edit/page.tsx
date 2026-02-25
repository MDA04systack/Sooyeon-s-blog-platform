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

    const { data: profile } = await supabase
        .from('profiles')
        .select('suspended_until')
        .eq('id', user.id)
        .single()

    if (profile?.suspended_until && new Date(profile.suspended_until) > new Date()) {
        const suspendEnd = new Date(profile.suspended_until).toLocaleDateString()
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
                <div className="text-center bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border)] max-w-md">
                    <h2 className="text-xl font-bold text-rose-500 mb-2">수정 권한이 제한되었습니다.</h2>
                    <p className="text-[var(--text-muted)] mt-2">이용 규칙 위반으로 인해 활동이 정지되었습니다.<br />제한 해제일: {suspendEnd}</p>
                    <a href="/" className="inline-block mt-6 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 transition">홈으로 돌아가기</a>
                </div>
            </div>
        )
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
