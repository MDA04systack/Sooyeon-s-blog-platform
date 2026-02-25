import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PostCard from '@/components/PostCard'
import type { Post } from '@/types/post'

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const { q: rawQ } = await searchParams
    const q = rawQ || ''
    const supabase = await createClient()

    let titlePosts: Post[] = []
    let contentPosts: Post[] = []

    if (q.trim()) {
        const queryTerm = `%${q.trim()}%`

        // 1. 제목 검색 결과 (상단부) -> published인 포스트만 가져오기
        const { data: titleData } = await supabase
            .from('posts')
            .select('*, categories!inner(name, slug)')
            .eq('status', 'published')
            .ilike('title', queryTerm)
            .order('published_at', { ascending: false })

        if (titleData) {
            titlePosts = titleData as unknown as Post[]
        }

        // 2. 내용 검색 결과 (하단부) -> published인 포스트만 가져오기
        const { data: contentData } = await supabase
            .from('posts')
            .select('*, categories!inner(name, slug)')
            .eq('status', 'published')
            .ilike('content', queryTerm)
            .order('published_at', { ascending: false })

        if (contentData) {
            // 중복 제거 (제목 검색 결과에 이미 포함된 포스트 제외)
            const titleIds = new Set(titlePosts.map(p => p.id))
            contentPosts = (contentData as unknown as Post[]).filter(p => !titleIds.has(p.id))
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200">
            <Navbar />

            <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-12">
                <div className="mb-12 border-b border-[var(--border)] pb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        {q ? `"${q}" 검색 결과` : '검색어를 입력해주세요'}
                    </h1>
                    {q && (
                        <p className="mt-2 text-[var(--text-muted)]">
                            제목 검색 {titlePosts.length}건, 내용 검색 {contentPosts.length}건
                        </p>
                    )}
                </div>

                {q && (
                    <div className="space-y-16">
                        {/* Title Results */}
                        <section>
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
                                <span>제목에 포함된 게시글</span>
                                <span className="text-sm font-normal text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                                    {titlePosts.length}
                                </span>
                            </h2>

                            {titlePosts.length > 0 ? (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {titlePosts.map(post => (
                                        <PostCard key={post.id} post={post} />
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] border-dashed">
                                    제목에 일치하는 게시글이 없습니다.
                                </div>
                            )}
                        </section>

                        {/* Content Results */}
                        <section>
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-l-4 border-purple-500 pl-3">
                                <span>내용에 포함된 게시글</span>
                                <span className="text-sm font-normal text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                                    {contentPosts.length}
                                </span>
                            </h2>

                            {contentPosts.length > 0 ? (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {contentPosts.map(post => (
                                        <PostCard key={post.id} post={post} />
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] border-dashed">
                                    내용에 일치하는 게시글이 없습니다. (제목 기준 결과와 중복되지 않습니다)
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    )
}
