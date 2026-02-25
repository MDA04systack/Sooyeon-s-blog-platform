'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'
import Navbar from '@/components/Navbar'
import { sendSuspensionEmail, sendUnsuspensionEmail } from '@/app/actions/sendEmail'

type Tab = 'users' | 'posts' | 'categories' | 'settings'

export default function AdminPage() {
    const router = useRouter()
    const supabase = createClient()
    const [user, setUser] = useState<User | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<Tab>('users')

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }
            setUser(session.user)

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()

            if (profile?.role === 'admin') {
                setIsAdmin(true)
            } else {
                alert('관리자 권한이 없습니다.')
                router.push('/')
            }
            setLoading(false)
        }
        checkAdmin()
    }, [router, supabase])

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">로딩 중...</div>
    }

    if (!isAdmin) return null // Wait for redirect

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
                <div className="flex items-center justify-between mb-8 border-b border-[var(--border)] pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)]">관리자 대시보드</h1>
                        <p className="mt-2 text-[var(--text-muted)]">서비스 전반의 회원, 게시물, 설정 및 카테고리를 관리합니다.</p>
                    </div>
                </div>

                <div className="flex gap-2 mb-8 bg-[var(--bg-card)] p-1.5 rounded-xl border border-[var(--border)] w-fit">
                    {(['users', 'posts', 'categories', 'settings'] as Tab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === t
                                ? 'bg-indigo-500 text-white shadow-md'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                                }`}
                        >
                            {t === 'users' && '회원 관리'}
                            {t === 'posts' && '게시물 관리'}
                            {t === 'categories' && '카테고리 관리'}
                            {t === 'settings' && '서비스 설정'}
                        </button>
                    ))}
                </div>

                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 min-h-[500px]">
                    {activeTab === 'users' && <UsersAdminTab supabase={supabase} />}
                    {activeTab === 'posts' && <PostsAdminTab supabase={supabase} />}
                    {activeTab === 'categories' && <CategoriesAdminTab supabase={supabase} />}
                    {activeTab === 'settings' && <SettingsAdminTab supabase={supabase} />}
                </div>
            </main>
        </div>
    )
}

function UsersAdminTab({ supabase }: { supabase: any }) {
    const [users, setUsers] = useState<any[]>([])

    const loadUsers = async () => {
        const { data, error } = await supabase.rpc('admin_get_users')
        if (data) setUsers(data)
    }

    useEffect(() => { loadUsers() }, [])

    const handleSuspend = async (uid: string, days: number, email: string) => {
        if (!confirm(`${days}일 활동 정지를 부여하시겠습니까?`)) return
        const until = new Date()
        until.setDate(until.getDate() + days)
        const untilString = until.toISOString()

        const { error } = await supabase.rpc('admin_suspend_user', { target_uid: uid, until_timestamp: untilString })
        if (error) {
            alert('정지 실패: ' + error.message)
            return
        }

        // 이메일 발송 (비동기 처리로 UI block 최소화)
        sendSuspensionEmail(email, days, untilString).catch(console.error)

        alert('처리되었습니다.')
        loadUsers()
    }

    const handleUnsuspend = async (uid: string, email: string) => {
        if (!confirm('해당 유저의 활동 정지를 즉시 해제하시겠습니까?')) return

        const { error } = await supabase.rpc('admin_unsuspend_user', { target_uid: uid })
        if (error) {
            alert('해제 실패: ' + error.message)
            return
        }

        // 비동기 복구 안내 메일 발송
        sendUnsuspensionEmail(email).catch(console.error)

        alert('정지가 해제되었습니다.')
        loadUsers()
    }

    const handleDelete = async (uid: string) => {
        if (!confirm('경고: 이 회원을 정말 강제 탈퇴(삭제)하시겠습니까? 관련 데이터가 모두 삭제되며 복구할 수 없습니다.')) return
        const { error } = await supabase.rpc('admin_delete_user', { target_user_id: uid })
        if (error) alert('삭제 실패: ' + error.message)
        else { alert('삭제되었습니다.'); loadUsers() }
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[var(--bg-hover)] text-[var(--text-muted)] uppercase">
                    <tr>
                        <th className="px-4 py-3 rounded-l-lg">아이디 / 닉네임</th>
                        <th className="px-4 py-3">이메일</th>
                        <th className="px-4 py-3">가입 시기</th>
                        <th className="px-4 py-3">상태</th>
                        <th className="px-4 py-3 rounded-r-lg text-right">관리</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                    {users.map(u => (
                        <tr key={u.id} className="hover:bg-[var(--bg-hover)]">
                            <td className="px-4 py-4 font-medium">
                                <span className="block">{u.username}</span>
                                <span className="text-xs text-[var(--text-muted)]">{u.nickname}</span>
                            </td>
                            <td className="px-4 py-4">{u.email}</td>
                            <td className="px-4 py-4 text-[var(--text-muted)]">{new Date(u.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-4">
                                {u.role === 'admin' ? <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-md text-xs font-bold">Admin</span>
                                    : u.suspended_until && new Date(u.suspended_until) > new Date() ? <span className="px-2 py-1 bg-rose-500/10 text-rose-400 rounded-md text-xs font-bold">정지됨(~{new Date(u.suspended_until).toLocaleDateString()})</span>
                                        : <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-xs font-bold">정상</span>}
                            </td>
                            <td className="px-4 py-4 text-right space-x-2">
                                {u.role !== 'admin' && (
                                    <>
                                        {u.suspended_until && new Date(u.suspended_until) > new Date() ? (
                                            <button onClick={() => handleUnsuspend(u.id, u.email)} className="px-3 py-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-md text-xs font-medium transition">정지 해제</button>
                                        ) : (
                                            <>
                                                <button onClick={() => handleSuspend(u.id, 1, u.email)} className="px-3 py-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-md text-xs font-medium transition">1일 정지</button>
                                                <button onClick={() => handleSuspend(u.id, 7, u.email)} className="px-3 py-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-md text-xs font-medium transition">7일 정지</button>
                                            </>
                                        )}
                                        <button onClick={() => handleDelete(u.id)} className="px-3 py-1 bg-red-600 outline outline-1 outline-red-700 text-white hover:bg-red-500 rounded-md text-xs font-medium transition ml-4">강제 탈퇴</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">조회된 회원이 없습니다.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

function PostsAdminTab({ supabase }: { supabase: any }) {
    const [posts, setPosts] = useState<any[]>([])

    const loadPosts = async () => {
        const { data } = await supabase.from('posts').select('id, title, status, author_name, created_at, slug').order('created_at', { ascending: false })
        if (data) setPosts(data)
    }

    useEffect(() => { loadPosts() }, [])

    const updateStatus = async (id: string, newStatus: string) => {
        if (!confirm(`게시글을 ${newStatus === 'private' ? '비공개' : '공개'} 처리하시겠습니까?`)) return
        const { error } = await supabase.rpc('admin_update_post_status', { target_post_id: id, new_status: newStatus })
        if (error) {
            alert('상태 변경 실패: ' + error.message)
            return
        }
        loadPosts()
    }

    const deletePost = async (id: string) => {
        if (!confirm('이 게시글을 영구 삭제하시겠습니까?')) return
        const { error } = await supabase.rpc('admin_delete_post', { target_post_id: id })
        if (error) {
            alert('삭제 실패: ' + error.message)
            return
        }
        loadPosts()
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[var(--bg-hover)] text-[var(--text-muted)] uppercase">
                    <tr>
                        <th className="px-4 py-3 rounded-l-lg">제목</th>
                        <th className="px-4 py-3">작성자</th>
                        <th className="px-4 py-3">작성일</th>
                        <th className="px-4 py-3">상태</th>
                        <th className="px-4 py-3 rounded-r-lg text-right">관리</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                    {posts.map(p => (
                        <tr key={p.id} className="hover:bg-[var(--bg-hover)]">
                            <td className="px-4 py-4 font-medium max-w-xs truncate" title={p.title}>
                                <a href={`/posts/${p.slug}`} target="_blank" className="hover:underline">{p.title}</a>
                            </td>
                            <td className="px-4 py-4">{p.author_name}</td>
                            <td className="px-4 py-4 text-[var(--text-muted)]">{new Date(p.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${p.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : p.status === 'private' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-400'}`}>
                                    {p.status}
                                </span>
                            </td>
                            <td className="px-4 py-4 text-right space-x-2">
                                {p.status === 'published' ? (
                                    <button onClick={() => updateStatus(p.id, 'private')} className="px-3 py-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-md text-xs font-medium transition">비공개 처리</button>
                                ) : (
                                    <button onClick={() => updateStatus(p.id, 'published')} className="px-3 py-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-md text-xs font-medium transition">공개 처리</button>
                                )}
                                <button onClick={() => deletePost(p.id)} className="px-3 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md text-xs font-medium transition ml-2">삭제</button>
                            </td>
                        </tr>
                    ))}
                    {posts.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">게시글이 없습니다.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

function CategoriesAdminTab({ supabase }: { supabase: any }) {
    const [categories, setCategories] = useState<any[]>([])
    const [newCatName, setNewCatName] = useState('')
    const [newCatSlug, setNewCatSlug] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')

    const loadCategories = async () => {
        const { data } = await supabase.from('categories').select('*').order('sort_order', { ascending: true })
        if (data) setCategories(data)
    }

    useEffect(() => { loadCategories() }, [])

    const handleCreate = async () => {
        if (!newCatName.trim() || !newCatSlug.trim()) return alert('이름과 슬러그를 모두 입력하세요')
        const { error } = await supabase.from('categories').insert([{ name: newCatName, slug: newCatSlug }])
        if (error) alert('추가 실패: ' + error.message)
        else { setNewCatName(''); setNewCatSlug(''); loadCategories() }
    }

    const handleUpdate = async (id: string) => {
        if (!editName.trim()) return
        const { error } = await supabase.from('categories').update({ name: editName }).eq('id', id)
        if (error) alert('수정 실패: ' + error.message)
        else { setEditingId(null); loadCategories() }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`'${name}' 카테고리를 삭제하시겠습니까? 관련된 게시물은 '카테고리 없음' 처리됩니다.`)) return
        const { error } = await supabase.from('categories').delete().eq('id', id)
        if (error) alert('삭제 실패: ' + error.message)
        else loadCategories()
    }

    return (
        <div className="space-y-8">
            {/* Create Category */}
            <div className="bg-[var(--bg-primary)] p-5 rounded-xl border border-[var(--border)] max-w-xl">
                <h3 className="font-bold mb-4">새 카테고리 추가</h3>
                <div className="flex gap-3">
                    <input type="text" placeholder="이름 (예: 프론트엔드)" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="flex-1 px-3 py-2 bg-[var(--bg-input)] border border-[var(--border)] rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500" />
                    <input type="text" placeholder="슬러그 (예: frontend)" value={newCatSlug} onChange={(e) => setNewCatSlug(e.target.value)} className="w-32 px-3 py-2 bg-[var(--bg-input)] border border-[var(--border)] rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500" />
                    <button onClick={handleCreate} className="px-4 py-2 bg-indigo-500 text-white rounded-md text-sm font-medium hover:bg-indigo-400 transition">추가</button>
                </div>
            </div>

            {/* List */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[var(--bg-hover)] text-[var(--text-muted)] uppercase">
                        <tr>
                            <th className="px-4 py-3 rounded-l-lg">이름</th>
                            <th className="px-4 py-3">슬러그</th>
                            <th className="px-4 py-3">생성일</th>
                            <th className="px-4 py-3 rounded-r-lg text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {categories.map(c => (
                            <tr key={c.id} className="hover:bg-[var(--bg-hover)]">
                                <td className="px-4 py-4 font-medium">
                                    {editingId === c.id ? (
                                        <input type="text" autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} className="px-2 py-1 bg-[var(--bg-input)] border border-[var(--border)] rounded outline-none" />
                                    ) : c.name}
                                </td>
                                <td className="px-4 py-4 text-[var(--text-muted)]">{c.slug}</td>
                                <td className="px-4 py-4 text-[var(--text-muted)]">{new Date(c.created_at).toLocaleDateString()}</td>
                                <td className="px-4 py-4 text-right space-x-2">
                                    {editingId === c.id ? (
                                        <>
                                            <button onClick={() => handleUpdate(c.id)} className="px-3 py-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-md text-xs font-medium transition">저장</button>
                                            <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 rounded-md text-xs font-medium transition">취소</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => { setEditingId(c.id); setEditName(c.name) }} className="px-3 py-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-md text-xs font-medium transition">이름 수정</button>
                                            <button onClick={() => handleDelete(c.id, c.name)} className="px-3 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md text-xs font-medium transition">삭제</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {categories.length === 0 && (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--text-muted)]">카테고리가 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function SettingsAdminTab({ supabase }: { supabase: any }) {
    const [signupEnabled, setSignupEnabled] = useState(true)

    const loadSettings = async () => {
        const { data } = await supabase.from('site_settings').select('signup_enabled').eq('id', 1).single()
        if (data) setSignupEnabled(data.signup_enabled)
    }

    useEffect(() => { loadSettings() }, [])

    const toggleSignup = async () => {
        const newVal = !signupEnabled
        const { error } = await supabase.from('site_settings').update({ signup_enabled: newVal }).eq('id', 1)
        if (!error) setSignupEnabled(newVal)
    }

    return (
        <div className="max-w-xl">
            <h2 className="text-xl font-bold mb-6">글로벌 서비스 설정</h2>

            <div className="flex items-center justify-between p-5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl">
                <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">회원가입 허용</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">이 기능을 끄면 누구나 진행할 수 있었던 신규 회원가입이 전면 차단됩니다. (로그인 창 탭 잠김)</p>
                </div>

                <button
                    onClick={toggleSignup}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${signupEnabled ? 'bg-indigo-500' : 'bg-slate-500'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${signupEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
        </div>
    )
}
