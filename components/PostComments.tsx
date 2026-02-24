'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

interface Comment {
    id: string
    content: string
    created_at: string
    updated_at: string
    user_id: string
    parent_id: string | null
    profiles: { nickname: string } | null
}

interface PostCommentsProps {
    postId: string
}

export default function PostComments({ postId }: PostCommentsProps) {
    const supabase = createClient()
    const [user, setUser] = useState<User | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [newComment, setNewComment] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // Per-comment state maps
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    const [replyText, setReplyText] = useState<Record<string, string>>({})
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editText, setEditText] = useState('')

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
        fetchComments()
    }, [postId])

    async function fetchComments() {
        setLoading(true)
        const { data } = await supabase
            .from('comments')
            .select('id, content, created_at, updated_at, user_id, parent_id, profiles(nickname)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true })
        setComments((data as unknown as Comment[]) ?? [])
        setLoading(false)
    }

    async function submitComment(e: React.FormEvent) {
        e.preventDefault()
        if (!newComment.trim() || !user) return
        setSubmitting(true)
        await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content: newComment.trim() })
        setNewComment('')
        await fetchComments()
        setSubmitting(false)
    }

    async function submitReply(parentId: string) {
        const text = replyText[parentId]?.trim()
        if (!text || !user) return
        setSubmitting(true)
        await supabase.from('comments').insert({ post_id: postId, user_id: user.id, parent_id: parentId, content: text })
        setReplyText(prev => ({ ...prev, [parentId]: '' }))
        setReplyingTo(null)
        await fetchComments()
        setSubmitting(false)
    }

    async function saveEdit(id: string) {
        if (!editText.trim()) return
        await supabase.from('comments').update({ content: editText.trim() }).eq('id', id)
        setEditingId(null)
        await fetchComments()
    }

    async function deleteComment(id: string) {
        await supabase.from('comments').delete().eq('id', id)
        await fetchComments()
    }

    function formatDate(iso: string) {
        const d = new Date(iso)
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }

    // Separate top-level and replies
    const topLevel = comments.filter(c => !c.parent_id)
    const replies = (parentId: string) => comments.filter(c => c.parent_id === parentId)

    const textareaCls = "w-full px-3 py-2.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-500/60 resize-none transition-all"

    const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
        <div className={`${isReply ? 'ml-6 pl-4 border-l-2 border-[var(--border)]' : ''} py-3`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                            {comment.profiles?.nickname ?? '알 수 없음'}
                        </span>
                        <span className="text-xs text-[var(--text-faint)]">{formatDate(comment.created_at)}</span>
                        {comment.updated_at !== comment.created_at && (
                            <span className="text-xs text-[var(--text-faint)] italic">(수정됨)</span>
                        )}
                    </div>

                    {editingId === comment.id ? (
                        <div className="space-y-2">
                            <textarea rows={2} value={editText} onChange={e => setEditText(e.target.value)}
                                className={textareaCls} />
                            <div className="flex gap-2">
                                <button onClick={() => saveEdit(comment.id)}
                                    className="px-3 py-1 text-xs rounded-md bg-indigo-500 hover:bg-indigo-400 text-white transition-colors">저장</button>
                                <button onClick={() => setEditingId(null)}
                                    className="px-3 py-1 text-xs rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-input)] transition-colors">취소</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-[var(--text-body)] whitespace-pre-wrap break-words">{comment.content}</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    {!isReply && (
                        <button onClick={() => {
                            setReplyingTo(replyingTo === comment.id ? null : comment.id)
                            setReplyText(prev => ({ ...prev, [comment.id]: '' }))
                        }}
                            className="text-xs px-2 py-1 rounded text-[var(--text-muted)] hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                            답글
                        </button>
                    )}
                    {user?.id === comment.user_id && (
                        <>
                            <button onClick={() => { setEditingId(comment.id); setEditText(comment.content) }}
                                className="text-xs px-2 py-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition-colors">
                                수정
                            </button>
                            <button onClick={() => deleteComment(comment.id)}
                                className="text-xs px-2 py-1 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                삭제
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Reply form */}
            {replyingTo === comment.id && (
                <div className="mt-3 space-y-2">
                    <textarea rows={2}
                        value={replyText[comment.id] ?? ''}
                        onChange={e => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                        placeholder="답글을 입력하세요..."
                        className={textareaCls} />
                    <div className="flex gap-2">
                        <button onClick={() => submitReply(comment.id)} disabled={submitting}
                            className="px-3 py-1 text-xs rounded-md bg-indigo-500 hover:bg-indigo-400 text-white transition-colors disabled:opacity-60">
                            답글 등록
                        </button>
                        <button onClick={() => setReplyingTo(null)}
                            className="px-3 py-1 text-xs rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-input)] transition-colors">취소</button>
                    </div>
                </div>
            )}

            {/* Nested replies */}
            {replies(comment.id).map(reply => (
                <CommentItem key={reply.id} comment={reply} isReply />
            ))}
        </div>
    )

    return (
        <section className="mt-12">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                댓글 <span className="text-indigo-400">{comments.length}</span>
            </h2>

            {/* Comment input */}
            {user ? (
                <form onSubmit={submitComment} className="mb-6 space-y-2">
                    <textarea
                        rows={3}
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="댓글을 입력하세요..."
                        className={textareaCls}
                    />
                    <div className="flex justify-end">
                        <button type="submit" disabled={submitting || !newComment.trim()}
                            className="px-4 py-2 text-sm rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium transition-colors disabled:opacity-60">
                            {submitting ? '등록 중...' : '댓글 등록'}
                        </button>
                    </div>
                </form>
            ) : (
                <p className="mb-6 text-sm text-[var(--text-muted)] p-3 bg-[var(--bg-input)] rounded-lg">
                    댓글을 작성하려면 <a href="/login" className="text-indigo-400 hover:underline">로그인</a>이 필요합니다.
                </p>
            )}

            {/* Comment list - fixed height with scroll */}
            <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-6 text-center text-sm text-[var(--text-muted)]">댓글을 불러오는 중...</div>
                ) : topLevel.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[var(--text-muted)]">첫 번째 댓글을 남겨보세요 ✍️</div>
                ) : (
                    <div className="max-h-[480px] overflow-y-auto divide-y divide-[var(--border)] px-4">
                        {topLevel.map(comment => (
                            <CommentItem key={comment.id} comment={comment} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
