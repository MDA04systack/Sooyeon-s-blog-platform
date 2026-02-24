import Link from 'next/link'
import Image from 'next/image'
import type { Post } from '@/types/post'

const CATEGORY_COLORS: Record<string, string> = {
    '프론트엔드': 'bg-blue-500/20 text-blue-300',
    '백엔드': 'bg-green-500/20 text-green-300',
    '툴링': 'bg-amber-500/20 text-amber-300',
    '보안': 'bg-red-500/20 text-red-300',
    '커리어': 'bg-purple-500/20 text-purple-300',
    'DevOps': 'bg-cyan-500/20 text-cyan-300',
    'AI': 'bg-pink-500/20 text-pink-300',
    'general': 'bg-slate-500/20 text-slate-300',
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}`
}

interface PostCardProps {
    post: Post
}

export default function PostCard({ post }: PostCardProps) {
    const categoryName = post.categories?.name || '일반'
    const categoryColor = CATEGORY_COLORS[categoryName] || CATEGORY_COLORS.general

    return (
        <article className="group flex flex-col overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] transition-all hover:border-[var(--border-focus)] hover:bg-[var(--bg-card-hover)] hover:-translate-y-0.5">
            {/* Thumbnail */}
            <div className="relative h-52 w-full overflow-hidden bg-slate-700">
                {post.thumbnail_url ? (
                    <Image
                        src={post.thumbnail_url}
                        alt={post.title}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                        unoptimized
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-600">
                        <svg className="h-12 w-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
                        </svg>
                    </div>
                )}
                {/* Category badge on image */}
                <div className="absolute left-3 top-3">
                    <span className="rounded-md bg-[var(--bg-primary)]/80 px-2 py-0.5 text-xs font-medium text-[var(--text-body)] backdrop-blur-sm">
                        {categoryName}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col p-5">
                <h3 className="mb-2 text-base font-bold leading-snug text-[var(--text-primary)] group-hover:text-indigo-400 transition line-clamp-2">
                    {post.title}
                </h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-[var(--text-muted)] line-clamp-2">
                    {post.excerpt}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        <span>{formatDate(post.published_at)}</span>
                    </div>
                    <Link
                        href={`/posts/${post.slug}`}
                        className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                    >
                        읽기
                        <svg className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>
        </article>
    )
}
