-- ============================================================
-- CREATE STORAGE BUCKET FOR POST IMAGES
-- ============================================================

-- Create a public bucket for post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'post-images',
    'post-images',
    true,
    10485760, -- 10MB max file size
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access (anyone can view uploaded images)
DROP POLICY IF EXISTS "post_images_public_read" ON storage.objects;
CREATE POLICY "post_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- Allow authenticated users to upload images
DROP POLICY IF EXISTS "post_images_auth_upload" ON storage.objects;
CREATE POLICY "post_images_auth_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own images
DROP POLICY IF EXISTS "post_images_auth_delete" ON storage.objects;
CREATE POLICY "post_images_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
