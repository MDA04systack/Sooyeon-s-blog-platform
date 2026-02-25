import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MyPageClient from '@/components/MyPageClient'
import Link from 'next/link'
import type { Post } from '@/types/post'
import type { MyComment } from '@/types/comment'

export default async function MyPostsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Fetch profile (nickname, username, suspended_until)
    const { data: profile } = await supabase
        .from('profiles')
        .select('username, nickname, full_name, suspended_until')
        .eq('id', user.id)
        .single()

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

    // Fetch user's own comments with post info
    const { data: myCommentsData } = await supabase
        .from('comments')
        .select('id, content, created_at, updated_at, post_id, parent_id, posts(title, slug)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    const myComments = (myCommentsData || []) as unknown as MyComment[]

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <Navbar />
            <main className="mx-auto max-w-6xl px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* ─── Left Sidebar ─── */}
                    <aside className="w-full lg:w-60 shrink-0">
                        <div className="sticky top-24 space-y-4">
                            {/* Profile Card */}
                            <div className="p-5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-lg font-bold text-indigo-400">
                                            {(profile?.nickname ?? user.email ?? '?')[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-[var(--text-primary)] truncate">
                                            {profile?.nickname ?? '닉네임 없음'}
                                        </p>
                                        <p className="text-xs text-[var(--text-faint)] truncate">
                                            @{profile?.username ?? '—'}
                                        </p>
                                    </div>
                                </div>

                                {profile?.suspended_until && new Date(profile.suspended_until) > new Date() && (
                                    <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-center">
                                        <p className="text-rose-500 font-bold text-sm mb-1">🚨 활동 정지 상태입니다</p>
                                        <p className="text-rose-400 text-xs">해제 예정일: {new Date(profile.suspended_until).toLocaleDateString()}</p>
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="flex gap-4 text-center py-3 border-y border-[var(--border)]">
                                    <div className="flex-1">
                                        <p className="text-lg font-bold text-[var(--text-primary)]">{(myPostsData || []).length}</p>
                                        <p className="text-xs text-[var(--text-faint)]">게시글</p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-lg font-bold text-[var(--text-primary)]">{bookmarkedPosts.length}</p>
                                        <p className="text-xs text-[var(--text-faint)]">북마크</p>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="flex flex-col gap-1.5">
                                <Link href="/write"
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-400 transition-colors">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    새 글 작성
                                </Link>

                                <Link href="/mypage/settings"
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-body)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border)] transition-all">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    계정 설정
                                </Link>
                            </nav>
                        </div>
                    </aside>

                    {/* ─── Main Content ─── */}
                    <div className="flex-1 min-w-0">
                        <MyPageClient
                            myPosts={(myPostsData || []) as unknown as Post[]}
                            bookmarkedPosts={bookmarkedPosts}
                            myComments={myComments}
                        />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}

