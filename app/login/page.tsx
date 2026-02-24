import { login, signup } from './actions'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const params = await searchParams;
    const error = params.error

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-[var(--bg-card)] rounded-2xl shadow-lg border border-[var(--border)]">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">환영합니다</h1>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">이메일로 로그인하거나 회원가입하세요</p>
                </div>

                {error && (
                    <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <form className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-body)] mb-1" htmlFor="email">
                                이메일
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-[var(--text-faint)]"
                                placeholder="name@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-body)] mb-1" htmlFor="password">
                                비밀번호
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-[var(--text-faint)]"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <button
                            formAction={login}
                            className="w-full px-4 py-3 text-white bg-indigo-500 rounded-lg hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors font-medium text-sm"
                        >
                            로그인
                        </button>
                        <button
                            formAction={signup}
                            className="w-full px-4 py-3 text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-card-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors font-medium text-sm"
                        >
                            회원가입
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
