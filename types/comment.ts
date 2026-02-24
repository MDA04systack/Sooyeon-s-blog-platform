export interface MyComment {
    id: string
    content: string
    created_at: string
    updated_at: string
    post_id: string
    parent_id: string | null
    posts: { title: string; slug: string } | null
}
