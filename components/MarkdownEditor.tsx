'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { createClient } from '@/utils/supabase/client'
import { MarkdownComponents } from '@/components/PostContent'
import type { User } from '@supabase/supabase-js'

interface MarkdownEditorProps {
    user: User
}

export default function MarkdownEditor({ user }: MarkdownEditorProps) {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [status, setStatus] = useState<'draft' | 'published' | 'private'>('draft')
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [showPublishMenu, setShowPublishMenu] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)

    // Calculate stats
    const charCount = content.length
    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length

    const [categories, setCategories] = useState<any[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

    useEffect(() => {
        const fetchCategories = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('categories')
                .select('id, name')
                .order('sort_order')
            if (data) {
                setCategories(data)
                if (data.length > 0) {
                    setSelectedCategoryId(data[0].id)
                }
            }
        }
        fetchCategories()
    }, [])

    const handleSave = async (saveStatus: 'draft' | 'published' | 'private' = 'draft') => {
        if (!title.trim() && !content.trim()) return

        setIsSaving(true)
        const supabase = createClient()

        // Generate ASCII-only slug to avoid URL encoding issues with Korean chars
        const baseSlug = title.trim()
            ? title.toLowerCase()
                .replace(/[가-힣]/g, '') // remove Korean characters 
                .replace(/[^a-z0-9]/g, '-') // replace non-alphanumeric with dash
                .replace(/-+/g, '-') // collapse multiple dashes
                .replace(/^-|-$/g, '') // trim leading/trailing dashes
            : ''
        const slug = (baseSlug || 'post') + `-${Date.now().toString().slice(-6)}`

        // Fetch nickname from profiles table
        const { data: profile } = await supabase
            .from('profiles')
            .select('nickname')
            .eq('id', user.id)
            .single()

        // Extract first image URL from content
        const firstImageMatch = content.match(/!\[.*?\]\((.*?)\)/)
        const extractedThumbnail = firstImageMatch ? firstImageMatch[1] : null

        const postData = {
            title: title || '제목 없는 문서',
            slug: `${slug}-${Date.now().toString().slice(-4)}`, // ensure uniqueness
            content,
            status: saveStatus,
            author_name: profile?.nickname || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Unknown User',
            user_id: user.id, // Add user_id for RLS policies!
            category_id: selectedCategoryId || null,
            thumbnail_url: extractedThumbnail,
            published_at: new Date().toISOString(),
            is_featured: false,
            view_count: 0
        }

        const { data, error } = await supabase
            .from('posts')
            .insert([postData])
            .select()

        setIsSaving(false)

        if (error) {
            console.error('Error saving post (full response):', JSON.stringify(error, null, 2))
            alert(`저장 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
        } else {
            setLastSaved(new Date())
            setStatus(saveStatus)
            setShowPublishMenu(false)
            if (saveStatus === 'published' || saveStatus === 'private') {
                // Navigate to the newly created post
                const savedPost = data?.[0]
                if (savedPost?.slug) {
                    router.push(`/posts/${savedPost.slug}`)
                } else {
                    router.push('/')
                }
            }
        }
    }

    const insertText = (before: string, after: string = '') => {
        if (!textareaRef.current) return
        const start = textareaRef.current.selectionStart
        const end = textareaRef.current.selectionEnd
        const text = textareaRef.current.value
        const selected = text.slice(start, end)

        const newText = text.slice(0, start) + before + selected + after + text.slice(end)
        setContent(newText)

        // Reset cursor position
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus()
                textareaRef.current.setSelectionRange(start + before.length, end + before.length)
            }
        }, 0)
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const supabase = createClient()
        const filePath = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

        const { data, error } = await supabase.storage
            .from('post-images')
            .upload(filePath, file, { upsert: false })

        if (error) {
            console.error('Image upload error:', error)
            alert(`이미지 업로드 실패: ${error.message}`)
        } else {
            const { data: urlData } = supabase.storage
                .from('post-images')
                .getPublicUrl(data.path)
            const imageMarkdown = `![${file.name}](${urlData.publicUrl})`
            insertText(imageMarkdown)
        }

        setIsUploading(false)
        // Reset input so same file can be uploaded again
        if (imageInputRef.current) imageInputRef.current.value = ''
    }

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#0f172a] text-slate-300">
            {/* Top Bar */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 px-4">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </div>
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-white">New Post</span>
                        <div className="h-4 w-px bg-slate-800" />
                        <span className="text-sm text-slate-500">{status === 'draft' ? 'Draft' : status}</span>
                        {lastSaved && (
                            <span className="text-xs text-slate-500">
                                마지막 저장: {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 relative">
                    <button
                        onClick={() => handleSave('draft')}
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                        ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                        )}
                        임시저장
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowPublishMenu(!showPublishMenu)}
                            disabled={isSaving}
                            className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-600 transition disabled:opacity-50"
                        >
                            출간하기
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showPublishMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowPublishMenu(false)} />
                                <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-slate-700 bg-slate-800 p-1 shadow-xl z-20">
                                    <button
                                        onClick={() => handleSave('published')}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                                    >
                                        <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                        공개 출간
                                    </button>
                                    <button
                                        onClick={() => handleSave('private')}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                                    >
                                        <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        비공개 출간
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Toolbar */}
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/50 px-4">
                <div className="flex items-center gap-1">
                    <button onClick={() => insertText('**', '**')} className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white" title="Bold">
                        <span className="font-bold">B</span>
                    </button>
                    <button onClick={() => insertText('*', '*')} className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white" title="Italic">
                        <span className="italic">I</span>
                    </button>
                    <button onClick={() => insertText('~~', '~~')} className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white" title="Strikethrough">
                        <span className="line-through">S</span>
                    </button>
                    <div className="mx-2 h-4 w-px bg-slate-700" />
                    <button onClick={() => insertText('## ')} className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white font-bold" title="Heading 2">
                        H2
                    </button>
                    <button onClick={() => insertText('### ')} className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white font-bold" title="Heading 3">
                        H3
                    </button>
                    <div className="mx-2 h-4 w-px bg-slate-700" />
                    <button onClick={() => insertText('> ')} className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white text-lg font-serif font-bold" title="Quote">
                        "
                    </button>
                    <button onClick={() => insertText('```\n', '\n```')} className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white" title="Code Block">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                    </button>
                    <button onClick={() => insertText('[', '](url)')} className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white" title="Link">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    </button>
                    {/* Image Upload Button */}
                    <button
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-wait"
                        title="이미지 업로드"
                    >
                        {isUploading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                        ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        )}
                    </button>
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleImageUpload}
                    />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    {isUploading ? (
                        <span className="text-indigo-400 animate-pulse">업로드 중...</span>
                    ) : (
                        <>
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4V5H9z" /></svg>
                            Markdown Supported
                        </>
                    )}
                </div>
            </div>

            {/* Split Panes */}
            <div className="flex flex-1 overflow-hidden">
                {/* Editor Pane */}
                <div className="flex w-1/2 flex-col border-r border-slate-800 pr-2">
                    <div className="px-6 pt-6 flex items-center">
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="bg-slate-800/50 text-slate-300 text-sm rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                        >
                            <option value="" disabled>카테고리 선택</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <input
                        type="text"
                        placeholder="제목을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-transparent p-6 text-4xl font-bold text-white placeholder:text-slate-600 focus:outline-none"
                    />
                    <textarea
                        ref={textareaRef}
                        placeholder="여기에 내용을 입력하세요..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full flex-1 resize-none bg-transparent p-6 pt-0 text-lg leading-relaxed text-slate-300 placeholder:text-slate-600 focus:outline-none"
                    />
                </div>

                {/* Preview Pane */}
                <div className="w-1/2 overflow-y-auto p-8 lg:px-12">
                    <div className="mb-4 flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">PREVIEW</span>
                        <div className="ml-auto flex gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                            <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                        </div>
                    </div>

                    <h1 className="mb-8 text-4xl font-bold text-white leading-tight">
                        {title || '제목을 입력하세요'}
                    </h1>

                    <div className="text-base text-slate-300">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={MarkdownComponents}
                        >
                            {content || '여기에 내용을 입력하세요...'}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>

            {/* Footer Status Bar */}
            <footer className="flex h-8 shrink-0 items-center justify-between border-t border-slate-800 bg-[#0f172a] px-4 text-xs text-slate-500">
                <div className="flex items-center gap-4">
                    <span>Lines: {content.split('\n').length}</span>
                    <span>Words: {wordCount}</span>
                    <span>Characters: {charCount}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${content.length > 0 ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                    {status === 'draft' ? 'Draft' : 'Saved'}
                </div>
            </footer>
        </div>
    )
}
