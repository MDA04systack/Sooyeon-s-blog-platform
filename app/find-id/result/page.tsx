import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function FindIdResultPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/find-id')

    // Fetch the user's username from profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
            <div className="w-full max-w-md p-8 bg-[var(--bg-card)] rounded-2xl shadow-lg border border-[var(--border)] text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">아이디 확인</h1>
                <p className="text-sm text-[var(--text-muted)] mb-8">이메일로 인증된 회원님의 아이디입니다.</p>

                {profile ? (
                    <div className="p-5 bg-teal-500/10 border border-teal-500/30 rounded-xl mb-8">
                        <p className="text-sm text-[var(--text-muted)] mb-1">회원님의 아이디</p>
                        <p className="text-3xl font-bold text-teal-400 tracking-wide">{profile.username}</p>
                    </div>
                ) : (
                    <div className="p-4 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg mb-8">
                        아이디를 찾을 수 없습니다. 고객센터에 문의해주세요.
                    </div>
                )}

                <Link href="/login"
                    className="block w-full py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-white font-medium text-sm transition-colors">
                    로그인하러 가기
                </Link>
            </div>
        </div>
    )
}
