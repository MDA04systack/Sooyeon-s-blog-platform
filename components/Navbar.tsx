'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { useTheme } from '@/components/ThemeProvider'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null)
    const [nickname, setNickname] = useState<string | null>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [suspendedUntil, setSuspendedUntil] = useState<string | null>(null)
    const [searchValue, setSearchValue] = useState('')
    const { theme, toggleTheme } = useTheme()
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const loadUser = async (uid: string) => {
            // Try fetching with avatar_url first
            let { data: profile, error } = await supabase
                .from('profiles')
                .select('nickname, role, suspended_until, avatar_url')
                .eq('id', uid)
                .single()

            // If it fails (likely due to missing avatar_url column if migration not run)
            if (error) {
                console.warn('Profile fetch with avatar_url failed, retrying without it:', error.message)
                const { data: retryProfile, error: retryError } = await supabase
                    .from('profiles')
                    .select('nickname, role, suspended_until')
                    .eq('id', uid)
                    .single()

                if (retryError) {
                    console.error('Final profile fetch failed:', retryError.message)
                    return
                }
                profile = retryProfile as any
            }

            if (profile) {
                setNickname(profile.nickname ?? null)
                setIsAdmin(profile.role === 'admin')
                setSuspendedUntil(profile.suspended_until ?? null)
                setAvatarUrl((profile as any).avatar_url ?? null)
            }
        }
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) loadUser(session.user.id)
            else {
                setNickname(null)
                setIsAdmin(false)
                setSuspendedUntil(null)
                setAvatarUrl(null)
            }
        })
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
            if (user) loadUser(user.id)
        })
        return () => subscription.unsubscribe()
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
    }

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--bg-primary)]/90 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center justify-center">
                        <Image src="/logo_only.png" alt="BioLogic.dev Logo" width={40} height={40} className="object-contain" />
                    </div>
                    <span className="text-xl font-bold tracking-tight -ml-1">
                        <span className="text-[var(--text-primary)]">BioLogic</span>
                        <span className="bg-gradient-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent">.dev</span>
                    </span>
                </Link>

                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <button
                        onClick={() => {
                            if (searchValue.trim()) {
                                router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`)
                            }
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-teal-400 transition"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                    </button>
                    <input
                        type="text"
                        placeholder="검색어를 입력하세요..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchValue.trim()) {
                                router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`)
                            }
                        }}
                        className="w-full rounded-full bg-[var(--bg-input)] py-2 pl-9 pr-4 text-sm text-[var(--text-body)] placeholder-[var(--text-faint)] outline-none ring-1 ring-[var(--border)] transition focus:ring-teal-500/60"
                    />
                </div>

                {/* Right Side */}
                <div className="ml-auto flex items-center gap-3">
                    {/* Dark/Light Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)] transition"
                        title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
                    >
                        {theme === 'dark' ? (
                            /* Sun icon (switch to light) */
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="5" />
                                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                            </svg>
                        ) : (
                            /* Moon icon (switch to dark) */
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        )}
                    </button>

                    {user ? (
                        <>
                            {isAdmin && (
                                <Link href="/admin" className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-400 shadow-sm transition">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    관리자 대시보드
                                </Link>
                            )}

                            <Link href="/mypage" className="flex items-center gap-2 group decoration-0">
                                {avatarUrl ? (
                                    <div className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-teal-500/20 group-hover:ring-teal-500/40 transition">
                                        <Image
                                            src={avatarUrl}
                                            alt={nickname || 'User avatar'}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-input)] text-[var(--text-primary)] text-[10px] font-bold ring-2 ring-teal-500/20 group-hover:ring-teal-500/40 transition">
                                        {(nickname ?? user.email ?? 'U').slice(0, 1).toUpperCase()}
                                    </div>
                                )}
                                <div className="hidden sm:flex flex-col items-start justify-center">
                                    <span className="text-sm text-[var(--text-primary)] font-medium truncate max-w-[120px] group-hover:text-teal-400 transition">
                                        {nickname ?? user.email}
                                    </span>
                                    {suspendedUntil && new Date(suspendedUntil) > new Date() && (
                                        <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-[1px] rounded-sm tracking-tight">
                                            정지됨
                                        </span>
                                    )}
                                </div>
                            </Link>

                            <Link href="/write" className="hidden md:flex items-center gap-1.5 rounded-full bg-teal-500/10 px-4 py-1.5 text-sm font-medium text-teal-400 hover:bg-teal-500/20 transition">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                새 글 작성
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="rounded-full px-4 py-1.5 text-sm font-medium text-[var(--text-body)] hover:text-[var(--text-primary)] ring-1 ring-[var(--border)] hover:ring-[var(--border-focus)] transition"
                            >
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-medium text-[var(--text-body)] hover:text-[var(--text-primary)] transition px-1">
                                로그인
                            </Link>
                            <Link href="/login" className="rounded-full bg-teal-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-400 transition">
                                회원가입
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
