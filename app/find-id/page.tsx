'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function FindIdPage() {
    const supabase = createClient()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const inputCls = "w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-[var(--text-faint)]"

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Send magic link – when the user clicks it they'll be logged in and
        // redirected to /find-id/result where we show their username.
        const { error: magicErr } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: { emailRedirectTo: `${location.origin}/find-id/result` },
        })

        setLoading(false)
        if (magicErr) {
            setError(magicErr.message)
        } else {
            setSent(true)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
            <div className="w-full max-w-md p-8 bg-[var(--bg-card)] rounded-2xl shadow-lg border border-[var(--border)]">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">아이디 찾기</h1>
                <p className="text-sm text-[var(--text-muted)] mb-8">
                    가입 시 등록한 이메일로 로그인 링크를 발송합니다. 링크를 클릭하면 내 아이디를 확인할 수 있습니다.
                </p>

                {error && (
                    <div className="mb-4 p-3 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg">{error}</div>
                )}

                {sent ? (
                    <div className="space-y-4">
                        <div className="p-4 text-sm text-green-400 bg-green-900/20 border border-green-800 rounded-lg">
                            <p className="font-semibold mb-1">✉️ 이메일을 발송했습니다!</p>
                            <p>이메일의 링크를 클릭하면 아이디를 확인할 수 있습니다.</p>
                            <p className="mt-2 text-[var(--text-muted)]">이메일이 보이지 않는다면 <strong>스팸 메일함</strong>도 확인해주세요.</p>
                        </div>
                        <Link href="/login"
                            className="block w-full text-center py-3 rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] text-sm font-medium transition-colors">
                            로그인으로 돌아가기
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-body)] mb-1" htmlFor="email">이메일 주소</label>
                            <input id="email" type="email" required value={email}
                                onChange={e => setEmail(e.target.value)}
                                className={inputCls} placeholder="name@example.com" />
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm transition-colors disabled:opacity-60">
                            {loading ? '발송 중...' : '아이디 찾기 이메일 보내기'}
                        </button>
                        <Link href="/login"
                            className="block text-center text-sm text-[var(--text-muted)] hover:text-indigo-400 transition-colors">
                            ← 로그인으로 돌아가기
                        </Link>
                    </form>
                )}
            </div>
        </div>
    )
}
