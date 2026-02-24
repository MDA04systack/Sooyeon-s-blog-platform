export interface Category {
    id: string
    name: string
    slug: string
    sort_order: number
}

export interface Post {
    id: string
    title: string
    slug: string
    excerpt: string | null
    content: string | null
    category_id: string | null
    categories?: Category | null // Joined table data from Supabase
    thumbnail_url: string | null
    author_name: string
    author_avatar_url: string | null
    published_at: string
    is_featured: boolean
    view_count: number
    status: 'draft' | 'published' | 'private'
}
