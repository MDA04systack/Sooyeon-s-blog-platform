'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

type Mode = 'login' | 'signup'

const inputCls = "w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-[var(--text-faint)]"
const labelCls = "block text-sm font-medium text-[var(--text-body)] mb-1"

export default function LoginPage() {
    const router = useRouter()
    const supabase = createClient()

    const [mode, setMode] = useState<Mode>('login')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Login fields
    const [loginId, setLoginId] = useState('')
    const [loginPassword, setLoginPassword] = useState('')

    // Signup fields
    const [fullName, setFullName] = useState('')
    const [username, setUsername] = useState('')
    const [nickname, setNickname] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirm, setPasswordConfirm] = useState('')

    // Duplicate check states
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
    const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
    const [usernameChecked, setUsernameChecked] = useState(false)
    const [nicknameChecked, setNicknameChecked] = useState(false)

    const switchMode = (m: Mode) => {
        setMode(m)
        setError(null)
        setUsernameStatus('idle')
        setNicknameStatus('idle')
        setUsernameChecked(false)
        setNicknameChecked(false)
    }

    // ─── Login ─────────────────────────────────────────────────
    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            // Resolve username → email via RPC
            const { data: resolvedEmail, error: rpcErr } = await supabase
                .rpc('get_email_by_username', { p_username: loginId.trim() })

            if (rpcErr || !resolvedEmail) {
                setError('존재하지 않는 아이디입니다.')
                return
            }

            const { error: signInErr } = await supabase.auth.signInWithPassword({
                email: resolvedEmail,
                password: loginPassword,
            })

            if (signInErr) {
                setError('비밀번호가 올바르지 않습니다.')
                return
            }

            router.push('/')
            router.refresh()
        } finally {
            setLoading(false)
        }
    }

    // ─── Duplicate checks ──────────────────────────────────────
    async function checkUsername() {
        if (!username.trim()) { setError('아이디를 입력해주세요.'); return }
        setUsernameStatus('checking')
        const { data } = await supabase.rpc('check_username_available', { p_username: username.trim().toLowerCase() })
        if (data) {
            setUsernameStatus('available')
            setUsernameChecked(true)
        } else {
            setUsernameStatus('taken')
            setUsernameChecked(false)
        }
    }

    async function checkNickname() {
        if (!nickname.trim()) { setError('닉네임을 입력해주세요.'); return }
        setNicknameStatus('checking')
        const { data } = await supabase.rpc('check_nickname_available', { p_nickname: nickname.trim() })
        if (data) {
            setNicknameStatus('available')
            setNicknameChecked(true)
        } else {
            setNicknameStatus('taken')
            setNicknameChecked(false)
        }
    }

    // Reset check if user edits the field after checking
    const onUsernameChange = (v: string) => { setUsername(v); setUsernameStatus('idle'); setUsernameChecked(false) }
    const onNicknameChange = (v: string) => { setNickname(v); setNicknameStatus('idle'); setNicknameChecked(false) }

    // ─── Signup ────────────────────────────────────────────────
    async function handleSignup(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        if (!usernameChecked) { setError('아이디 중복 확인을 해주세요.'); return }
        if (!nicknameChecked) { setError('닉네임 중복 확인을 해주세요.'); return }
        if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return }
        if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }

        setLoading(true)
        try {
            // 1) Create auth user
            const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        display_name: nickname.trim(),
                        full_name: fullName.trim(),
                    },
                },
            })

            if (signUpErr) { setError(signUpErr.message); return }
            if (!signUpData.user) { setError('회원가입에 실패했습니다.'); return }

            // 2) Insert profile row
            const { error: profileErr } = await supabase.from('profiles').insert({
                id: signUpData.user.id,
                username: username.trim().toLowerCase(),
                nickname: nickname.trim(),
                full_name: fullName.trim(),
            })

            if (profileErr) {
                setError('프로필 생성에 실패했습니다. 잠시 후 다시 시도해주세요.')
                return
            }

            // 3) Navigate home
            router.push('/')
            router.refresh()
        } finally {
            setLoading(false)
        }
    }

    // ─── Google OAuth ───────────────────────────────────────────
    async function handleGoogleLogin() {
        setLoading(true)
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${location.origin}/auth/callback` },
        })
    }

    // ─── Helper badge ───────────────────────────────────────────
    const DupBadge = ({ status }: { status: typeof usernameStatus }) => {
        if (status === 'checking') return <span className="text-xs text-yellow-400 ml-2">확인 중...</span>
        if (status === 'available') return <span className="text-xs text-green-400 ml-2">✓ 사용 가능</span>
        if (status === 'taken') return <span className="text-xs text-red-400 ml-2">✗ 이미 사용 중</span>
        return null
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
            <div className="w-full max-w-md p-8 bg-[var(--bg-card)] rounded-2xl shadow-lg border border-[var(--border)]">

                {/* Tab switcher */}
                <div className="flex mb-8 border-b border-[var(--border)]">
                    {(['login', 'signup'] as Mode[]).map(m => (
                        <button
                            key={m}
                            onClick={() => switchMode(m)}
                            className={`flex-1 pb-3 text-sm font-semibold transition-colors ${mode === m
                                    ? 'text-indigo-400 border-b-2 border-indigo-400'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            {m === 'login' ? '로그인' : '회원가입'}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mb-4 p-3 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg">
                        {error}
                    </div>
                )}

                {/* ─── Login Form ─── */}
                {mode === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className={labelCls} htmlFor="loginId">아이디</label>
                            <input id="loginId" type="text" required value={loginId}
                                onChange={e => setLoginId(e.target.value)}
                                className={inputCls} placeholder="아이디를 입력하세요" />
                        </div>
                        <div>
                            <label className={labelCls} htmlFor="loginPassword">비밀번호</label>
                            <input id="loginPassword" type="password" required value={loginPassword}
                                onChange={e => setLoginPassword(e.target.value)}
                                className={inputCls} placeholder="••••••••" />
                        </div>

                        {/* Find ID / Find Password links */}
                        <div className="flex justify-between text-xs text-[var(--text-muted)]">
                            <Link href="/find-id" className="hover:text-indigo-400 transition-colors">아이디 찾기</Link>
                            <Link href="/reset-password" className="hover:text-indigo-400 transition-colors">비밀번호 찾기</Link>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm transition-colors disabled:opacity-60">
                            {loading ? '로그인 중...' : '로그인'}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 py-1">
                            <div className="flex-1 h-px bg-[var(--border)]" />
                            <span className="text-xs text-[var(--text-faint)]">또는</span>
                            <div className="flex-1 h-px bg-[var(--border)]" />
                        </div>

                        {/* Google Login */}
                        <button type="button" onClick={handleGoogleLogin} disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] text-sm font-medium transition-colors disabled:opacity-60">
                            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                            </svg>
                            Google로 계속하기
                        </button>
                    </form>
                )}

                {/* ─── Signup Form ─── */}
                {mode === 'signup' && (
                    <form onSubmit={handleSignup} className="space-y-4">
                        {/* Full name */}
                        <div>
                            <label className={labelCls} htmlFor="fullName">이름 (실명)</label>
                            <input id="fullName" type="text" required value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className={inputCls} placeholder="홍길동" />
                        </div>

                        {/* Username + dup check */}
                        <div>
                            <label className={labelCls} htmlFor="username">
                                아이디 <DupBadge status={usernameStatus} />
                            </label>
                            <div className="flex gap-2">
                                <input id="username" type="text" required value={username}
                                    onChange={e => onUsernameChange(e.target.value)}
                                    className={inputCls} placeholder="영문·숫자 (소문자)" />
                                <button type="button" onClick={checkUsername}
                                    className="shrink-0 px-3 py-2 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
                                    중복확인
                                </button>
                            </div>
                        </div>

                        {/* Nickname + dup check */}
                        <div>
                            <label className={labelCls} htmlFor="nickname">
                                닉네임 <DupBadge status={nicknameStatus} />
                            </label>
                            <div className="flex gap-2">
                                <input id="nickname" type="text" required value={nickname}
                                    onChange={e => onNicknameChange(e.target.value)}
                                    className={inputCls} placeholder="게시글에 표시될 이름" />
                                <button type="button" onClick={checkNickname}
                                    className="shrink-0 px-3 py-2 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
                                    중복확인
                                </button>
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className={labelCls} htmlFor="email">이메일 주소</label>
                            <input id="email" type="email" required value={email}
                                onChange={e => setEmail(e.target.value)}
                                className={inputCls} placeholder="name@example.com (계정 복구용)" />
                        </div>

                        {/* Password */}
                        <div>
                            <label className={labelCls} htmlFor="password">비밀번호</label>
                            <input id="password" type="password" required value={password}
                                onChange={e => setPassword(e.target.value)}
                                className={inputCls} placeholder="6자 이상" />
                        </div>

                        {/* Password confirm */}
                        <div>
                            <label className={labelCls} htmlFor="passwordConfirm">비밀번호 확인</label>
                            <input id="passwordConfirm" type="password" required value={passwordConfirm}
                                onChange={e => setPasswordConfirm(e.target.value)}
                                className={`${inputCls} ${passwordConfirm && password !== passwordConfirm ? 'border-red-500' : ''}`}
                                placeholder="비밀번호 재입력" />
                            {passwordConfirm && password !== passwordConfirm && (
                                <p className="text-xs text-red-400 mt-1">비밀번호가 일치하지 않습니다.</p>
                            )}
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full py-3 mt-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm transition-colors disabled:opacity-60">
                            {loading ? '처리 중...' : '회원가입'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
