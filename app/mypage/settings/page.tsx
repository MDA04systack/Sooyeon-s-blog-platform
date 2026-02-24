'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const inputCls = "w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-[var(--text-faint)]"
const labelCls = "block text-sm font-medium text-[var(--text-body)] mb-1"
const sectionCls = "p-5 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]"

type Profile = { username: string; nickname: string; full_name: string | null }

export default function AccountSettingsPage() {
    const supabase = createClient()
    const router = useRouter()

    // Gate: user must verify password before seeing settings
    const [gatePassword, setGatePassword] = useState('')
    const [gateError, setGateError] = useState<string | null>(null)
    const [gateLoading, setGateLoading] = useState(false)
    const [verified, setVerified] = useState(false)

    const [profile, setProfile] = useState<Profile | null>(null)
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

    // Nickname change
    const [newNickname, setNewNickname] = useState('')
    const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
    const [nicknameChecked, setNicknameChecked] = useState(false)

    // Email change
    const [newEmail, setNewEmail] = useState('')

    // Delete modal
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    // Load user data after gate passes
    useEffect(() => {
        if (!verified) return
            ; (async () => {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) { router.push('/login'); return }
                setEmail(user.email ?? '')
                const { data: p } = await supabase.from('profiles').select('username, nickname, full_name').eq('id', user.id).single()
                if (p) { setProfile(p); setNewNickname(p.nickname) }
            })()
    }, [verified])

    const showMsg = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type })
        setTimeout(() => setMessage(null), 4000)
    }

    // ─── Gate: verify password ────────────────────────────────
    async function handleGate(e: React.FormEvent) {
        e.preventDefault()
        setGateLoading(true)
        setGateError(null)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.email) { setGateError('로그인 상태가 아닙니다.'); setGateLoading(false); return }
        const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: gatePassword })
        setGateLoading(false)
        if (error) {
            setGateError('비밀번호가 올바르지 않습니다.')
        } else {
            setVerified(true)
        }
    }

    // ─── Nickname change ──────────────────────────────────────
    async function checkNickname() {
        if (!newNickname.trim()) return
        setNicknameStatus('checking')
        const { data: { user } } = await supabase.auth.getUser()
        const { data } = await supabase.rpc('check_nickname_available', {
            p_nickname: newNickname.trim(),
            p_exclude_user_id: user?.id,
        })
        if (data) { setNicknameStatus('available'); setNicknameChecked(true) }
        else { setNicknameStatus('taken'); setNicknameChecked(false) }
    }

    async function handleNicknameChange(e: React.FormEvent) {
        e.preventDefault()
        if (!nicknameChecked) { showMsg('닉네임 중복 확인을 해주세요.', 'error'); return }
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from('profiles').update({ nickname: newNickname.trim() }).eq('id', user!.id)
        setLoading(false)
        if (error) showMsg('닉네임 변경에 실패했습니다.', 'error')
        else { showMsg('닉네임이 변경되었습니다.', 'success'); setProfile(p => p ? { ...p, nickname: newNickname.trim() } : p) }
    }

    const onNicknameInput = (v: string) => { setNewNickname(v); setNicknameStatus('idle'); setNicknameChecked(false) }

    // ─── Email change ─────────────────────────────────────────
    async function handleEmailChange(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
        setLoading(false)
        if (error) showMsg(error.message, 'error')
        else showMsg('확인 이메일을 발송했습니다. 새 이메일을 확인해주세요.', 'success')
    }

    // ─── Send password reset ──────────────────────────────────
    async function handlePasswordReset() {
        setLoading(true)
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${location.origin}/update-password`,
        })
        setLoading(false)
        if (error) showMsg(error.message, 'error')
        else showMsg('비밀번호 재설정 링크를 이메일로 발송했습니다.', 'success')
    }

    // ─── Account deletion ─────────────────────────────────────
    async function handleDeleteAccount() {
        setLoading(true)
        const { error } = await supabase.rpc('delete_user_account')
        if (error) { showMsg('탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error'); setLoading(false); return }
        await supabase.auth.signOut()
        router.push('/')
    }

    const DupBadge = ({ status }: { status: typeof nicknameStatus }) => {
        if (status === 'checking') return <span className="text-xs text-yellow-400 ml-2">확인 중...</span>
        if (status === 'available') return <span className="text-xs text-green-400 ml-2">✓ 사용 가능</span>
        if (status === 'taken') return <span className="text-xs text-red-400 ml-2">✗ 이미 사용 중</span>
        return null
    }

    // ─── Gate Screen ──────────────────────────────────────────
    if (!verified) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
                <div className="w-full max-w-md p-8 bg-[var(--bg-card)] rounded-2xl shadow-lg border border-[var(--border)]">
                    <div className="text-center mb-8">
                        <div className="text-3xl mb-3">🔒</div>
                        <h1 className="text-xl font-bold text-[var(--text-primary)]">계정 설정</h1>
                        <p className="text-sm text-[var(--text-muted)] mt-2">보안을 위해 현재 비밀번호를 입력해주세요.</p>
                    </div>
                    {gateError && (
                        <div className="mb-4 p-3 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg">{gateError}</div>
                    )}
                    <form onSubmit={handleGate} className="space-y-4">
                        <div>
                            <label className={labelCls} htmlFor="gatePassword">현재 비밀번호</label>
                            <input id="gatePassword" type="password" required value={gatePassword}
                                onChange={e => setGatePassword(e.target.value)}
                                className={inputCls} placeholder="••••••••" />
                        </div>
                        <button type="submit" disabled={gateLoading}
                            className="w-full py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm transition-colors disabled:opacity-60">
                            {gateLoading ? '확인 중...' : '계정 설정 열기'}
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    // ─── Settings Screen ──────────────────────────────────────
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] py-12 px-4">
            <div className="max-w-xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">계정 설정</h1>

                {message && (
                    <div className={`p-3 text-sm rounded-lg border ${message.type === 'success'
                            ? 'text-green-400 bg-green-900/20 border-green-800'
                            : 'text-red-400 bg-red-900/20 border-red-800'
                        }`}>{message.text}</div>
                )}

                {/* Current info */}
                {profile && (
                    <div className={sectionCls}>
                        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">현재 정보</h2>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-[var(--text-faint)]">아이디</span><p className="font-medium text-[var(--text-primary)] mt-0.5">{profile.username}</p></div>
                            <div><span className="text-[var(--text-faint)]">닉네임</span><p className="font-medium text-[var(--text-primary)] mt-0.5">{profile.nickname}</p></div>
                            <div><span className="text-[var(--text-faint)]">이메일</span><p className="font-medium text-[var(--text-primary)] mt-0.5">{email}</p></div>
                        </div>
                    </div>
                )}

                {/* Nickname change */}
                <div className={sectionCls}>
                    <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-4">닉네임 변경</h2>
                    <form onSubmit={handleNicknameChange} className="space-y-3">
                        <div>
                            <label className={labelCls} htmlFor="newNickname">
                                새 닉네임 <DupBadge status={nicknameStatus} />
                            </label>
                            <div className="flex gap-2">
                                <input id="newNickname" type="text" required value={newNickname}
                                    onChange={e => onNicknameInput(e.target.value)}
                                    className={inputCls} placeholder="새 닉네임 입력" />
                                <button type="button" onClick={checkNickname}
                                    className="shrink-0 px-3 py-2 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
                                    중복확인
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading}
                            className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors disabled:opacity-60">
                            닉네임 변경
                        </button>
                    </form>
                </div>

                {/* Email change */}
                <div className={sectionCls}>
                    <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-4">이메일 변경</h2>
                    <form onSubmit={handleEmailChange} className="space-y-3">
                        <div>
                            <label className={labelCls} htmlFor="newEmail">새 이메일 주소</label>
                            <input id="newEmail" type="email" required value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                className={inputCls} placeholder="new@example.com" />
                        </div>
                        <button type="submit" disabled={loading}
                            className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors disabled:opacity-60">
                            이메일 변경 요청
                        </button>
                    </form>
                </div>

                {/* Password reset */}
                <div className={sectionCls}>
                    <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">비밀번호 변경</h2>
                    <p className="text-xs text-[var(--text-muted)] mb-4">현재 이메일({email})로 비밀번호 재설정 링크를 전송합니다.</p>
                    <button onClick={handlePasswordReset} disabled={loading}
                        className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] text-sm font-medium transition-colors disabled:opacity-60">
                        재설정 링크 보내기
                    </button>
                </div>

                {/* Account deletion */}
                <div className={`${sectionCls} border-red-900/50`}>
                    <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-2">회원 탈퇴</h2>
                    <p className="text-xs text-[var(--text-muted)] mb-4">탈퇴 시 모든 게시글, 댓글, 북마크 데이터가 영구 삭제됩니다.</p>
                    <button onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors">
                        회원 탈퇴
                    </button>
                </div>
            </div>

            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="w-full max-w-sm p-6 bg-[var(--bg-card)] rounded-2xl border border-red-800">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">정말 탈퇴하시겠습니까?</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-6">이 작업은 되돌릴 수 없습니다. 모든 데이터가 영구적으로 삭제됩니다.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] text-sm font-medium transition-colors">
                                취소
                            </button>
                            <button onClick={handleDeleteAccount} disabled={loading}
                                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-60">
                                {loading ? '처리 중...' : '탈퇴 확인'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
