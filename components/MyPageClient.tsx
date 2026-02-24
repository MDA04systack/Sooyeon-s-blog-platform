'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import type { Post } from '@/types/post'
import type { MyComment } from '@/types/comment'

type TabType = 'my_posts' | 'bookmarks' | 'my_comments'
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
    myComments: MyComment[]
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function MyPageClient({ myPosts: initialMyPosts, bookmarkedPosts: initialBookmarks, myComments: initialMyComments }: MyPageClientProps) {
    const [activeMainTab, setActiveMainTab] = useState<TabType>('my_posts')
    const [activeSubTab, setActiveSubTab] = useState<string>('all')
    const [myPosts, setMyPosts] = useState<Post[]>(initialMyPosts)
    const [bookmarks, setBookmarks] = useState<Post[]>(initialBookmarks)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    // ─── Comments state ───────────────────────────────────────
    const [myComments, setMyComments] = useState<MyComment[]>(initialMyComments)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
    const [editCommentText, setEditCommentText] = useState('')
    const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null)
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

    const supabase = createClient()

    // ─── Post delete ──────────────────────────────────────────
    const handleDeletePost = async (id: string) => {
        try {
            const { error } = await supabase.from('posts').delete().eq('id', id)
            if (error) throw error
            setMyPosts(prev => prev.filter(post => post.id !== id))
            setConfirmDeleteId(null)
        } catch {
            alert('게시글 삭제에 실패했습니다.')
        }
    }

    // ─── Bookmark remove ──────────────────────────────────────
    const handleRemoveBookmark = async (postId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { error } = await supabase.from('bookmarks').delete().eq('post_id', postId).eq('user_id', user.id)
            if (error) throw error
            setBookmarks(prev => prev.filter(post => post.id !== postId))
        } catch {
            alert('북마크 해제에 실패했습니다.')
        }
    }

    // ─── Comment CRUD ─────────────────────────────────────────
    const startEditComment = (comment: MyComment) => {
        setEditingCommentId(comment.id)
        setEditCommentText(comment.content)
    }

    const saveEditComment = async (id: string) => {
        if (!editCommentText.trim()) return
        const { error } = await supabase.from('comments').update({ content: editCommentText.trim() }).eq('id', id)
        if (!error) {
            setMyComments(prev => prev.map(c => c.id === id ? { ...c, content: editCommentText.trim(), updated_at: new Date().toISOString() } : c))
            setEditingCommentId(null)
        }
    }

    const deleteComment = async (id: string) => {
        const { error } = await supabase.from('comments').delete().eq('id', id)
        if (!error) {
            setMyComments(prev => prev.filter(c => c.id !== id))
            setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s })
        }
        setConfirmDeleteCommentId(null)
    }

    const deleteSelected = async () => {
        const ids = [...selectedIds]
        const { error } = await supabase.from('comments').delete().in('id', ids)
        if (!error) {
            setMyComments(prev => prev.filter(c => !selectedIds.has(c.id)))
            setSelectedIds(new Set())
        }
        setConfirmBulkDelete(false)
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const s = new Set(prev)
            s.has(id) ? s.delete(id) : s.add(id)
            return s
        })
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === myComments.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(myComments.map(c => c.id)))
        }
    }

    // ─── Post filter ──────────────────────────────────────────
    const displayedMyPosts = myPosts.filter(post => activeSubTab === 'all' || post.status === activeSubTab)
    const myPostCounts = MY_POST_TABS.reduce((acc, tab) => {
        acc[tab.id] = tab.id === 'all' ? myPosts.length : myPosts.filter(p => p.status === tab.id).length
        return acc
    }, {} as Record<string, number>)

    const allSelected = myComments.length > 0 && selectedIds.size === myComments.length

    return (
        <div className="flex flex-col gap-6">
            {/* ─── Main Tabs ─── */}
            <div className="flex items-center gap-6 border-b border-[var(--border)]">
                {([
                    { id: 'my_posts', label: '내가 쓴 글', count: myPosts.length },
                    { id: 'bookmarks', label: '북마크한 글', count: bookmarks.length },
                    { id: 'my_comments', label: '내가 쓴 댓글', count: myComments.length },
                ] as const).map(tab => (
                    <button key={tab.id}
                        onClick={() => setActiveMainTab(tab.id)}
                        className={`pb-3 text-lg font-semibold transition-colors relative ${activeMainTab === tab.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}
                    >
                        {tab.label}
                        <span className="ml-2 rounded-full bg-[var(--bg-input)] px-2 py-0.5 text-xs text-[var(--text-muted)]">{tab.count}</span>
                        {activeMainTab === tab.id && <div className="absolute -bottom-[1px] left-0 h-0.5 w-full bg-indigo-500" />}
                    </button>
                ))}
            </div>

            {/* ─── My Posts ─── */}
            {activeMainTab === 'my_posts' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-6 flex gap-1 rounded-xl bg-[var(--bg-card)] p-1 w-fit border border-[var(--border)]">
                        {MY_POST_TABS.map(tab => (
                            <button key={tab.id} onClick={() => setActiveSubTab(tab.id)}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${activeSubTab === tab.id ? 'bg-[var(--bg-input)] text-[var(--text-primary)] shadow-sm ring-1 ring-[var(--border)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                                {tab.label}
                                <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${activeSubTab === tab.id ? 'bg-indigo-500 text-white' : 'bg-[var(--bg-input)] text-[var(--text-muted)]'}`}>
                                    {myPostCounts[tab.id]}
                                </span>
                            </button>
                        ))}
                    </div>

                    {displayedMyPosts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-20 text-center">
                            <p className="text-[var(--text-muted)] mb-4">해당하는 글이 없습니다.</p>
                            <Link href="/write" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 transition">새 글 작성하기</Link>
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
                                                <span className="text-xs text-[var(--text-faint)]">{new Date(post.published_at).toLocaleDateString()}</span>
                                            </div>
                                            <Link href={post.status === 'draft' ? `/posts/${post.slug}/edit` : `/posts/${post.slug}`}
                                                className="block text-lg font-bold text-[var(--text-primary)] hover:text-indigo-500 transition truncate">
                                                {post.title || '제목 없음'}
                                            </Link>
                                        </div>
                                        <div className="flex shrink-0 items-center justify-end gap-2">
                                            <Link href={`/posts/${post.slug}/edit`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)] transition">수정</Link>
                                            {confirmDeleteId === post.id ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-red-400 font-medium mr-2">정말 삭제하시겠습니까?</span>
                                                    <button onClick={() => handleDeletePost(post.id)} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition">확인</button>
                                                    <button onClick={() => setConfirmDeleteId(null)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-input)] transition">취소</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setConfirmDeleteId(post.id)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition">삭제</button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ─── Bookmarks ─── */}
            {activeMainTab === 'bookmarks' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                                            {post.categories && <span className="text-xs font-medium text-indigo-400">{post.categories.name}</span>}
                                            <span className="text-xs text-[var(--text-faint)]">{new Date(post.published_at).toLocaleDateString()}</span>
                                        </div>
                                        <Link href={`/posts/${post.slug}`} className="block text-lg font-bold text-[var(--text-primary)] hover:text-indigo-500 transition truncate">{post.title}</Link>
                                    </div>
                                    <div className="flex shrink-0 items-center justify-end gap-2">
                                        <Link href={`/posts/${post.slug}`} className="rounded-lg px-4 py-2 text-sm font-medium bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-indigo-500 hover:text-white transition">읽기</Link>
                                        <button onClick={() => handleRemoveBookmark(post.id)} className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition" title="북마크 해제">
                                            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ─── My Comments ─── */}
            {activeMainTab === 'my_comments' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {myComments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-20 text-center">
                            <svg className="mb-4 h-12 w-12 text-[var(--text-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-[var(--text-muted)]">작성한 댓글이 없습니다.</p>
                        </div>
                    ) : (
                        <>
                            {/* Bulk action bar */}
                            <div className="flex items-center gap-3 mb-4 p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 rounded accent-indigo-500"
                                    />
                                    <span className="text-sm text-[var(--text-muted)]">전체 선택</span>
                                </label>
                                {selectedIds.size > 0 && (
                                    <button
                                        onClick={() => setConfirmBulkDelete(true)}
                                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                                    >
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        선택 삭제 ({selectedIds.size})
                                    </button>
                                )}
                            </div>

                            {/* Bulk delete confirm */}
                            {confirmBulkDelete && (
                                <div className="mb-4 flex items-center gap-3 p-3 bg-red-900/20 border border-red-800 rounded-xl text-sm">
                                    <span className="text-red-400 font-medium flex-1">{selectedIds.size}개의 댓글을 삭제할까요?</span>
                                    <button onClick={deleteSelected} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition">삭제</button>
                                    <button onClick={() => setConfirmBulkDelete(false)} className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] text-xs hover:bg-[var(--bg-input)] transition">취소</button>
                                </div>
                            )}

                            {/* Comment list */}
                            <div className="flex flex-col divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden">
                                {myComments.map(comment => (
                                    <div key={comment.id} className="flex gap-3 p-4 hover:bg-[var(--bg-card-hover)] transition">
                                        {/* Checkbox */}
                                        <div className="pt-0.5 shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(comment.id)}
                                                onChange={() => toggleSelect(comment.id)}
                                                className="h-4 w-4 rounded accent-indigo-500"
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Post link */}
                                            <div className="flex items-center gap-2 mb-1">
                                                {comment.posts ? (
                                                    <Link
                                                        href={`/posts/${comment.posts.slug}#comments`}
                                                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:underline truncate max-w-[280px]"
                                                    >
                                                        📄 {comment.posts.title}
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs text-[var(--text-faint)]">(삭제된 글)</span>
                                                )}
                                                {comment.parent_id && (
                                                    <span className="text-xs text-[var(--text-faint)] shrink-0">↩ 답글</span>
                                                )}
                                                <span className="ml-auto text-xs text-[var(--text-faint)] shrink-0">{formatDate(comment.created_at)}</span>
                                            </div>

                                            {/* Edit or read mode */}
                                            {editingCommentId === comment.id ? (
                                                <div className="space-y-2">
                                                    <textarea
                                                        rows={2}
                                                        value={editCommentText}
                                                        onChange={e => setEditCommentText(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/60 resize-none"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => saveEditComment(comment.id)}
                                                            className="px-3 py-1 text-xs rounded-md bg-indigo-500 hover:bg-indigo-400 text-white transition">저장</button>
                                                        <button onClick={() => setEditingCommentId(null)}
                                                            className="px-3 py-1 text-xs rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-input)] transition">취소</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-[var(--text-body)] line-clamp-2 break-words">{comment.content}</p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {editingCommentId !== comment.id && (
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <button onClick={() => startEditComment(comment)}
                                                    className="text-xs px-2 py-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition">
                                                    수정
                                                </button>
                                                {confirmDeleteCommentId === comment.id ? (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => deleteComment(comment.id)}
                                                            className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition">확인</button>
                                                        <button onClick={() => setConfirmDeleteCommentId(null)}
                                                            className="text-xs px-2 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-input)] transition">취소</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setConfirmDeleteCommentId(comment.id)}
                                                        className="text-xs px-2 py-1 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition">
                                                        삭제
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
