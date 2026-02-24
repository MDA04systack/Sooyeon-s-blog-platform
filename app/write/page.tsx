import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import MarkdownEditor from '@/components/MarkdownEditor'

export default async function WritePage() {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <MarkdownEditor user={user} />
        </div>
    )
}
