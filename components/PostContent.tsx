'use client'

import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx'
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript'
import javascript from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript'
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css'
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json'
import markdown from 'react-syntax-highlighter/dist/cjs/languages/prism/markdown'
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash'
import sql from 'react-syntax-highlighter/dist/cjs/languages/prism/sql'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import type { Post } from '@/types/post'
import type { Components } from 'react-markdown'

// Register syntax highlighter languages to bundle smaller
SyntaxHighlighter.registerLanguage('tsx', tsx)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('sql', sql)

// Custom Markdown Components map for styling
export const MarkdownComponents: Components = {
    h2: ({ children }) => (
        <h2 className="mt-12 mb-6 text-2xl font-bold text-[var(--text-primary)]">{children}</h2>
    ),
    h3: ({ children }) => (
        <h3 className="mt-8 mb-4 text-xl font-bold text-[var(--text-primary)] opacity-90">{children}</h3>
    ),
    p: ({ children }) => (
        <p className="mb-6 leading-relaxed text-[var(--text-body)] break-keep">{children}</p>
    ),
    ul: ({ children }) => (
        <ul className="mb-6 ml-6 list-disc space-y-2 text-[var(--text-body)]">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="mb-6 ml-6 list-decimal space-y-2 text-[var(--text-body)]">{children}</ol>
    ),
    li: ({ children }) => (
        <li className="text-[var(--text-body)]">{children}</li>
    ),
    a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline transition">
            {children}
        </a>
    ),
    strong: ({ children }) => (
        <strong className="font-bold text-[var(--text-primary)]">{children}</strong>
    ),
    blockquote: ({ children }) => (
        <blockquote className="my-6 border-l-4 border-indigo-500 bg-[var(--bg-input)] py-3 pr-4 pl-6 italic text-[var(--text-body)] rounded-r-lg">
            {children}
        </blockquote>
    ),
    code: ({ className, children, ...props }) => {
        const match = /language-(\w+)/.exec(className || '')
        const isInline = !match

        if (isInline) {
            return (
                <code className="rounded bg-[var(--bg-input)] px-1.5 py-0.5 text-sm font-mono text-indigo-500 dark:text-indigo-300 before:content-[''] after:content-['']" {...props}>
                    {children}
                </code>
            )
        }

        const language = match[1]

        // Mac OS Style Window header for code blocks
        return (
            <div className="my-8 overflow-hidden rounded-xl border border-[var(--border)] bg-[#1E1E1E]">
                <div className="flex items-center border-b border-white/5 bg-[#252526] px-4 py-3">
                    <div className="flex gap-2">
                        <div className="h-3 w-3 rounded-full bg-[#FF5F56]" />
                        <div className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
                        <div className="h-3 w-3 rounded-full bg-[#27C93F]" />
                    </div>
                    <span className="ml-4 text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">{language}</span>
                </div>
                <div className="p-4 text-sm overflow-x-auto">
                    <SyntaxHighlighter
                        style={vscDarkPlus as any}
                        language={language}
                        PreTag="div"
                        customStyle={{
                            margin: 0,
                            padding: 0,
                            background: 'transparent',
                            fontSize: '14px',
                            fontFamily: 'var(--font-geist-mono), monospace',
                        }}
                    >
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                </div>
            </div>
        )
    }
}

export default function PostContent({ post }: { post: Post }) {
    return (
        <article className="mx-auto max-w-3xl px-6 pb-24">
            {/* Markdown Content */}
            <div className="prose dark:prose-invert max-w-none text-base">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={MarkdownComponents}
                >
                    {post.content || ''}
                </ReactMarkdown>
            </div>
        </article>
    )
}
