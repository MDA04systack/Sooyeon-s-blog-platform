'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { Post } from '@/types/post'

function formatReadTime(content: string | null): number {
    if (!content) return 1
    const words = content.trim().split(/\s+/).length
    const wpm = 225 // words per minute
    return Math.max(1, Math.ceil(words / wpm))
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default function PostHeader({
    post,
    initialIsBookmarked = false,
    isOwner = false,
    postId,
    postSlug
}: {
    post: Post,
    initialIsBookmarked?: boolean,
    isOwner?: boolean,
    postId?: string,
    postSlug?: string
}) {
    const readTime = formatReadTime(post.content)
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
    const [isLiking, setIsLiking] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleBookmark = async () => {
        setIsLiking(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                alert('북마크 기능은 로그인 후 이용할 수 있습니다.')
                setIsLiking(false)
                return
            }

            if (isBookmarked) {
                // Delete bookmark
                const { error } = await supabase
                    .from('bookmarks')
                    .delete()
                    .eq('post_id', post.id)
                    .eq('user_id', user.id)

                if (error) throw error
                setIsBookmarked(false)
            } else {
                // Add bookmark
                const { error } = await supabase
                    .from('bookmarks')
                    .insert({ post_id: post.id, user_id: user.id })

                if (error) throw error
                setIsBookmarked(true)
            }
        } catch (error) {
            console.error('Bookmark toggle failed', error)
            alert('북마크 처리에 실패했습니다.')
        } finally {
            setIsLiking(false)
        }
    }

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href)
            alert('URL이 복사되었습니다.')
        } catch (error) {
            console.error('Failed to copy URL', error)
            alert('URL 복사에 실패했습니다.')
        }
    }

    const handleDelete = async () => {
        if (!postId) return
        setIsDeleting(true)
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)

        if (error) {
            console.error('Delete error:', error)
            alert('삭제 중 오류가 발생했습니다.')
            setIsDeleting(false)
        } else {
            router.push('/')
            router.refresh()
        }
    }

    return (
        <header className="mx-auto max-w-3xl px-6 pt-16 pb-8">
            {/* Categories */}
            <div className="mb-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--bg-card)] px-3 py-1 text-xs font-semibold text-[var(--text-body)] ring-1 ring-[var(--border)]">
                    {post.categories?.name || '일반'}
                </span>
            </div>

            {/* Title */}
            <h1 className="mb-6 text-3xl font-bold leading-tight text-[var(--text-primary)] md:text-5xl md:leading-tight">
                {post.title}
            </h1>

            {/* Author & Meta & Share */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-8">
                <div className="flex items-center gap-3">
                    {post.author_avatar_url ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-indigo-500/30">
                            <Image
                                src={post.author_avatar_url}
                                alt={post.author_name}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)] ring-2 ring-indigo-500/30">
                            <span className="text-sm font-bold text-white uppercase">{post.author_name.slice(0, 2)}</span>
                        </div>
                    )}

                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{post.author_name}</span>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                            <span>{formatDate(post.published_at)}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-600" />
                            <span>{readTime}분 소요</span>
                            <span className="h-1 w-1 rounded-full bg-slate-600" />
                            <div className="flex items-center gap-1">
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>{post.view_count || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Share Buttons & Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Owner Actions */}
                    {isOwner && postId && postSlug && (
                        <>
                            {showDeleteConfirm ? (
                                <div className="flex items-center gap-1 bg-red-500/10 rounded-full pr-1 animate-in fade-in slide-in-from-right-4 duration-200">
                                    <span className="text-xs text-red-500 font-medium ml-3 mr-1">삭제할까요?</span>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="h-7 px-2.5 rounded-full text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50"
                                    >
                                        확인
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition"
                                    >
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Link
                                        href={`/posts/${postSlug}/edit`}
                                        className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-indigo-400 transition"
                                        title="수정하기"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </Link>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition"
                                        title="삭제하기"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </>
                            )}
                            <div className="w-px h-5 bg-[var(--border)] mx-1" />
                        </>
                    )}

                    {/* Bookmark */}
                    <button
                        onClick={handleBookmark}
                        disabled={isLiking}
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition ${isBookmarked
                            ? 'text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20'
                            : 'text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]'
                            }`}
                        aria-label={isBookmarked ? "북마크 해제" : "북마크 저장"}
                        title={isBookmarked ? "북마크 해제" : "북마크 저장"}
                    >
                        <svg className="h-4 w-4" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </button>

                    {/* Copy URL */}
                    <button
                        onClick={handleCopyUrl}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)] transition"
                        aria-label="URL 복사"
                        title="URL 복사"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    )
}
