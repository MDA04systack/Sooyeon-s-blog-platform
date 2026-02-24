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

const textareaCls =
    'w-full px-3 py-2.5 text-sm bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-500/60 resize-none transition-all'

function formatDate(iso: string) {
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ─── CommentItem ─────────────────────────────────────────────────────────────
// All typing state (edit text, reply text) is LOCAL to this component.
// This prevents the parent from re-rendering on every keystroke,
// which was causing the textarea cursor to jump.
interface CommentItemProps {
    comment: Comment
    isReply?: boolean
    user: User | null
    childReplies: Comment[]
    onSaveEdit: (id: string, text: string) => Promise<void>
    onDeleteComment: (id: string) => Promise<void>
    onSubmitReply: (parentId: string, text: string) => Promise<void>
}

function CommentItem({
    comment,
    isReply = false,
    user,
    childReplies,
    onSaveEdit,
    onDeleteComment,
    onSubmitReply,
}: CommentItemProps) {
    // Local edit state — changes here never touch the parent component
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState('')

    // Local reply state
    const [isReplying, setIsReplying] = useState(false)
    const [replyText, setReplyText] = useState('')

    const [saving, setSaving] = useState(false)

    function startEdit() {
        setEditText(comment.content)
        setIsEditing(true)
    }

    async function handleSave() {
        if (!editText.trim()) return
        setSaving(true)
        await onSaveEdit(comment.id, editText.trim())
        setIsEditing(false)
        setSaving(false)
    }

    async function handleReply() {
        if (!replyText.trim()) return
        setSaving(true)
        await onSubmitReply(comment.id, replyText.trim())
        setReplyText('')
        setIsReplying(false)
        setSaving(false)
    }

    return (
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

                    {isEditing ? (
                        <div className="space-y-2">
                            <textarea
                                rows={2}
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                className={textareaCls}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button onClick={handleSave} disabled={saving}
                                    className="px-3 py-1 text-xs rounded-md bg-indigo-500 hover:bg-indigo-400 text-white transition-colors disabled:opacity-60">
                                    {saving ? '저장 중...' : '저장'}
                                </button>
                                <button onClick={() => setIsEditing(false)}
                                    className="px-3 py-1 text-xs rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-input)] transition-colors">
                                    취소
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-[var(--text-body)] whitespace-pre-wrap break-words">{comment.content}</p>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                    {!isReply && (
                        <button onClick={() => setIsReplying(r => !r)}
                            className="text-xs px-2 py-1 rounded text-[var(--text-muted)] hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                            답글
                        </button>
                    )}
                    {user?.id === comment.user_id && (
                        <>
                            <button onClick={startEdit}
                                className="text-xs px-2 py-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition-colors">
                                수정
                            </button>
                            <button onClick={() => onDeleteComment(comment.id)}
                                className="text-xs px-2 py-1 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                삭제
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Reply form */}
            {isReplying && (
                <div className="mt-3 space-y-2">
                    <textarea
                        rows={2}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="답글을 입력하세요..."
                        className={textareaCls}
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button onClick={handleReply} disabled={saving}
                            className="px-3 py-1 text-xs rounded-md bg-indigo-500 hover:bg-indigo-400 text-white transition-colors disabled:opacity-60">
                            답글 등록
                        </button>
                        <button onClick={() => setIsReplying(false)}
                            className="px-3 py-1 text-xs rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-input)] transition-colors">
                            취소
                        </button>
                    </div>
                </div>
            )}

            {/* Nested replies */}
            {childReplies.map(reply => (
                <CommentItem
                    key={reply.id}
                    comment={reply}
                    isReply
                    user={user}
                    childReplies={[]}
                    onSaveEdit={onSaveEdit}
                    onDeleteComment={onDeleteComment}
                    onSubmitReply={onSubmitReply}
                />
            ))}
        </div>
    )
}

// ─── PostComments ─────────────────────────────────────────────────────────────
export default function PostComments({ postId }: PostCommentsProps) {
    const supabase = createClient()
    const [user, setUser] = useState<User | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [newComment, setNewComment] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
        fetchComments()
    }, [postId])

    async function fetchComments() {
        setLoading(true)
        const { data: commentsData, error } = await supabase
            .from('comments')
            .select('id, content, created_at, updated_at, user_id, parent_id')
            .eq('post_id', postId)
            .order('created_at', { ascending: true })

        if (error || !commentsData) { setComments([]); setLoading(false); return }

        const userIds = [...new Set(commentsData.map(c => c.user_id))]
        const { data: profilesData } = await supabase
            .from('profiles').select('id, nickname').in('id', userIds)

        const profileMap: Record<string, string> = {}
        for (const p of profilesData || []) profileMap[p.id] = p.nickname

        setComments(commentsData.map(c => ({
            ...c,
            profiles: profileMap[c.user_id] ? { nickname: profileMap[c.user_id] } : null,
        })))
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

    async function handleSaveEdit(id: string, text: string) {
        await supabase.from('comments').update({ content: text }).eq('id', id)
        await fetchComments()
    }

    async function handleDeleteComment(id: string) {
        await supabase.from('comments').delete().eq('id', id)
        await fetchComments()
    }

    async function handleSubmitReply(parentId: string, text: string) {
        if (!user) return
        await supabase.from('comments').insert({ post_id: postId, user_id: user.id, parent_id: parentId, content: text })
        await fetchComments()
    }

    const topLevel = comments.filter(c => !c.parent_id)
    const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId)

    return (
        <section className="mt-12">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                댓글 <span className="text-indigo-400">{comments.length}</span>
            </h2>

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

            <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-6 text-center text-sm text-[var(--text-muted)]">댓글을 불러오는 중...</div>
                ) : topLevel.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[var(--text-muted)]">첫 번째 댓글을 남겨보세요 ✍️</div>
                ) : (
                    <div className="max-h-[480px] overflow-y-auto divide-y divide-[var(--border)] px-4">
                        {topLevel.map(comment => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                user={user}
                                childReplies={getReplies(comment.id)}
                                onSaveEdit={handleSaveEdit}
                                onDeleteComment={handleDeleteComment}
                                onSubmitReply={handleSubmitReply}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
