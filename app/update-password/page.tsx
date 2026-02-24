'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function UpdatePasswordPage() {
    const supabase = createClient()
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [passwordConfirm, setPasswordConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const inputCls = "w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-[var(--text-faint)]"

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return }
        if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }

        setLoading(true)
        const { error: updateErr } = await supabase.auth.updateUser({ password })
        setLoading(false)

        if (updateErr) {
            setError(updateErr.message)
        } else {
            setSuccess(true)
            setTimeout(() => router.push('/'), 2000)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
            <div className="w-full max-w-md p-8 bg-[var(--bg-card)] rounded-2xl shadow-lg border border-[var(--border)]">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">새 비밀번호 설정</h1>
                <p className="text-sm text-[var(--text-muted)] mb-8">새로 사용할 비밀번호를 입력해주세요.</p>

                {error && (
                    <div className="mb-4 p-3 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg">{error}</div>
                )}

                {success ? (
                    <div className="p-4 text-sm text-green-400 bg-green-900/20 border border-green-800 rounded-lg">
                        ✅ 비밀번호가 성공적으로 변경되었습니다! 잠시 후 메인 페이지로 이동합니다.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-body)] mb-1" htmlFor="password">새 비밀번호</label>
                            <input id="password" type="password" required value={password}
                                onChange={e => setPassword(e.target.value)}
                                className={inputCls} placeholder="6자 이상" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-body)] mb-1" htmlFor="confirm">비밀번호 확인</label>
                            <input id="confirm" type="password" required value={passwordConfirm}
                                onChange={e => setPasswordConfirm(e.target.value)}
                                className={`${inputCls} ${passwordConfirm && password !== passwordConfirm ? 'border-red-500' : ''}`}
                                placeholder="비밀번호 재입력" />
                            {passwordConfirm && password !== passwordConfirm && (
                                <p className="text-xs text-red-400 mt-1">비밀번호가 일치하지 않습니다.</p>
                            )}
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm transition-colors disabled:opacity-60">
                            {loading ? '변경 중...' : '비밀번호 변경'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
