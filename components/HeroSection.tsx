'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import type { Post } from '@/types/post'

function formatRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}분 전`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}시간 전`
    const days = Math.floor(hours / 24)
    return `${days}일 전`
}

export default function HeroSection() {
    const [featured, setFeatured] = useState<Post | null>(null)
    const [sidePosts, setSidePosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchHeroPosts = async () => {
            const supabase = createClient()

            const { data: featuredData } = await supabase
                .from('posts')
                .select('*, categories(name, slug)')
                .eq('status', 'published')
                .eq('is_featured', true)
                .order('published_at', { ascending: false })
                .limit(1)
                .single()

            // Fetch 2 side posts (not featured)
            const { data: sideData } = await supabase
                .from('posts')
                .select('*, categories(name, slug)')
                .eq('status', 'published')
                .eq('is_featured', false)
                .order('published_at', { ascending: false })
                .limit(2)

            setFeatured(featuredData)
            setSidePosts(sideData || [])
            setLoading(false)
        }

        fetchHeroPosts()
    }, [])

    if (loading) {
        return (
            <section className="mx-auto max-w-7xl px-6 py-8">
                <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                    <div className="h-80 rounded-2xl bg-[var(--bg-card)] animate-pulse" />
                    <div className="flex flex-col gap-4">
                        <div className="h-36 rounded-2xl bg-[var(--bg-card)] animate-pulse" />
                        <div className="h-36 rounded-2xl bg-[var(--bg-card)] animate-pulse" />
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="mx-auto max-w-7xl px-6 py-8">
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                {/* Featured Post (Left large card) */}
                {featured && (
                    <Link href={`/posts/${featured.slug}`} className="group relative overflow-hidden rounded-2xl bg-[var(--bg-card)]">
                        {featured.thumbnail_url && (
                            <div className="relative h-80 w-full">
                                <Image
                                    src={featured.thumbnail_url}
                                    alt={featured.title}
                                    fill
                                    className="object-cover brightness-50 group-hover:brightness-60 transition duration-300"
                                    unoptimized
                                />
                            </div>
                        )}
                        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/30 to-transparent p-6">
                            <span className="mb-3 inline-block w-fit rounded-full bg-indigo-500 px-3 py-0.5 text-xs font-semibold text-white">
                                Featured
                            </span>
                            <h2 className="mb-2 text-2xl font-bold leading-snug text-white group-hover:text-indigo-200 transition">
                                {featured.title}
                            </h2>
                            <p className="mb-4 text-sm text-slate-300 line-clamp-2">{featured.excerpt}</p>
                            <div className="flex items-center gap-2">
                                {featured.author_avatar_url && (
                                    <Image
                                        src={featured.author_avatar_url}
                                        alt={featured.author_name}
                                        width={24}
                                        height={24}
                                        className="rounded-full bg-slate-700"
                                        unoptimized
                                    />
                                )}
                                <span className="text-sm text-slate-300">{featured.author_name}</span>
                                <span className="text-slate-500">·</span>
                                <span className="text-sm text-slate-400">{formatRelativeTime(featured.published_at)}</span>
                            </div>
                        </div>
                    </Link>
                )}

                {/* Side Posts (Right column) */}
                <div className="flex flex-col gap-4">
                    {sidePosts.map((post) => (
                        <Link
                            key={post.id}
                            href={`/posts/${post.slug}`}
                            className="group relative overflow-hidden rounded-2xl bg-[var(--bg-card)] flex-1"
                        >
                            {post.thumbnail_url && (
                                <div className="relative h-36 w-full">
                                    <Image
                                        src={post.thumbnail_url}
                                        alt={post.title}
                                        fill
                                        className="object-cover brightness-50 group-hover:brightness-60 transition duration-300"
                                        unoptimized
                                    />
                                </div>
                            )}
                            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4">
                                <span className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-400">
                                    {post.categories?.name || '일반'}
                                </span>
                                <h3 className="text-base font-bold text-white leading-snug group-hover:text-indigo-200 transition line-clamp-2">
                                    {post.title}
                                </h3>
                                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{post.excerpt}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
