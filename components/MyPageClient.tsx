'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import type { Post } from '@/types/post'

type TabType = 'my_posts' | 'bookmarks'
type PostStatus = 'published' | 'private' | 'draft'

const MY_POST_TABS = [
    { id: 'all', label: '전체' },
    { id: 'published', label: '공개' },
    { id: 'private', label: '비공개' },
    { id: 'draft', label: '임시저장' },
] as const

const statusConfig: Record<PostStatus, { label: string; color: string; dot: string }> = {
    published: { label: '공개', color: 'text-emerald-500 bg-emerald-500/10', dot: 'bg-emerald-500' },
    private: { label: '비공개', color: 'text-amber-500 bg-amber-500/10', dot: 'bg-amber-500' },
    draft: { label: '임시저장', color: 'text-[var(--text-muted)] bg-[var(--bg-input)]', dot: 'bg-slate-400' },
}

interface MyPageClientProps {
    myPosts: Post[]
    bookmarkedPosts: Post[]
}

export default function MyPageClient({ myPosts: initialMyPosts, bookmarkedPosts: initialBookmarks }: MyPageClientProps) {
    const [activeMainTab, setActiveMainTab] = useState<TabType>('my_posts')
    const [activeSubTab, setActiveSubTab] = useState<string>('all')
    const [myPosts, setMyPosts] = useState<Post[]>(initialMyPosts)
    const [bookmarks, setBookmarks] = useState<Post[]>(initialBookmarks)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const supabase = createClient()

    // 1. Delete Logic (only for my posts)
    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from('posts').delete().eq('id', id)
            if (error) throw error
            setMyPosts(prev => prev.filter(post => post.id !== id))
            setConfirmDeleteId(null)
        } catch (error) {
            console.error('Failed to delete post:', error)
            alert('게시글 삭제에 실패했습니다.')
        }
    }

    // 2. Remove bookmark logic
    const handleRemoveBookmark = async (postId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('bookmarks')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', user.id)

            if (error) throw error
            setBookmarks(prev => prev.filter(post => post.id !== postId))
        } catch (error) {
            console.error('Failed to remove bookmark:', error)
            alert('북마크 해제에 실패했습니다.')
        }
    }

    // 3. Filtering
    const displayedMyPosts = myPosts.filter(post => activeSubTab === 'all' || post.status === activeSubTab)

    // 4. Counters
    const myPostCounts = MY_POST_TABS.reduce((acc, tab) => {
        if (tab.id === 'all') acc[tab.id] = myPosts.length
        else acc[tab.id] = myPosts.filter(p => p.status === tab.id).length
        return acc
    }, {} as Record<string, number>)

    return (
        <div className="flex flex-col gap-6">
            {/* Main Tabs (My Posts vs Bookmarks) */}
            <div className="flex items-center gap-6 border-b border-[var(--border)]">
                <button
                    onClick={() => setActiveMainTab('my_posts')}
                    className={`pb-3 text-lg font-semibold transition-colors relative ${activeMainTab === 'my_posts' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'
                        }`}
                >
                    내가 쓴 글
                    <span className="ml-2 rounded-full bg-[var(--bg-input)] px-2 py-0.5 text-xs text-[var(--text-muted)]">{myPosts.length}</span>
                    {activeMainTab === 'my_posts' && (
                        <div className="absolute -bottom-[1px] left-0 h-0.5 w-full bg-indigo-500" />
                    )}
                </button>
                <button
                    onClick={() => setActiveMainTab('bookmarks')}
                    className={`pb-3 text-lg font-semibold transition-colors relative ${activeMainTab === 'bookmarks' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'
                        }`}
                >
                    북마크한 글
                    <span className="ml-2 rounded-full bg-[var(--bg-input)] px-2 py-0.5 text-xs text-[var(--text-muted)]">{bookmarks.length}</span>
                    {activeMainTab === 'bookmarks' && (
                        <div className="absolute -bottom-[1px] left-0 h-0.5 w-full bg-indigo-500" />
                    )}
                </button>
            </div>

            {/* Content Area */}
            {activeMainTab === 'my_posts' ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Sub tabs for My Posts */}
                    <div className="mb-6 flex gap-1 rounded-xl bg-[var(--bg-card)] p-1 w-fit border border-[var(--border)]">
                        {MY_POST_TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSubTab(tab.id)}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${activeSubTab === tab.id
                                    ? 'bg-[var(--bg-input)] text-[var(--text-primary)] shadow-sm ring-1 ring-[var(--border)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                    }`}
                            >
                                {tab.label}
                                <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${activeSubTab === tab.id ? 'bg-indigo-500 text-white' : 'bg-[var(--bg-input)] text-[var(--text-muted)]'}`}>
                                    {myPostCounts[tab.id]}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* My Posts List */}
                    {displayedMyPosts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-20 text-center">
                            <p className="text-[var(--text-muted)] mb-4">해당하는 글이 없습니다.</p>
                            <Link href="/write" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 transition">
                                새 글 작성하기
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {displayedMyPosts.map(post => {
                                const cfg = statusConfig[post.status as PostStatus] || statusConfig.draft
                                return (
                                    <div key={post.id} className="group flex flex-col sm:flex-row sm:items-center gap-4 py-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-card-hover)] transition rounded-lg px-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                                    {cfg.label}
                                                </span>
                                                <span className="text-xs text-[var(--text-faint)]">
                                                    {new Date(post.published_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <Link href={post.status === 'draft' ? `/posts/${post.slug}/edit` : `/posts/${post.slug}`} className="block text-lg font-bold text-[var(--text-primary)] hover:text-indigo-500 transition truncate">
                                                {post.title || '제목 없음'}
                                            </Link>
                                        </div>
                                        <div className="flex shrink-0 items-center justify-end gap-2">
                                            <Link href={`/posts/${post.slug}/edit`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)] transition">
                                                수정
                                            </Link>
                                            {confirmDeleteId === post.id ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-red-400 font-medium mr-2">정말 삭제하시겠습니까?</span>
                                                    <button onClick={() => handleDelete(post.id)} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition">
                                                        확인
                                                    </button>
                                                    <button onClick={() => setConfirmDeleteId(null)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-input)] transition">
                                                        취소
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setConfirmDeleteId(post.id)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition">
                                                    삭제
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Bookmarks List */}
                    {bookmarks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-20 text-center">
                            <svg className="mb-4 h-12 w-12 text-[var(--text-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            <p className="text-[var(--text-muted)]">북마크한 글이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {bookmarks.map(post => (
                                <div key={post.id} className="group flex flex-col sm:flex-row sm:items-center gap-4 py-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-card-hover)] transition rounded-lg px-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            {post.categories && (
                                                <span className="text-xs font-medium text-indigo-400">
                                                    {post.categories.name}
                                                </span>
                                            )}
                                            <span className="text-xs text-[var(--text-faint)]">
                                                {new Date(post.published_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <Link href={`/posts/${post.slug}`} className="block text-lg font-bold text-[var(--text-primary)] hover:text-indigo-500 transition truncate">
                                            {post.title}
                                        </Link>
                                    </div>
                                    <div className="flex shrink-0 items-center justify-end gap-2">
                                        <Link href={`/posts/${post.slug}`} className="rounded-lg px-4 py-2 text-sm font-medium bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-indigo-500 hover:text-white transition">
                                            읽기
                                        </Link>
                                        <button
                                            onClick={() => handleRemoveBookmark(post.id)}
                                            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition"
                                            title="북마크 해제"
                                        >
                                            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                                                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
