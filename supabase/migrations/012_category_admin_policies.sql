-- DevLog: Review Category RLS Policies for Admin
-- Migration 012

-- Previously in 001_initial_schema.sql:
-- CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (TRUE);
-- (Only READ was public)

-- We need to permit Admins to INSERT, UPDATE, DELETE categories

CREATE POLICY "categories_admin_insert" ON public.categories FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "categories_admin_update" ON public.categories FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "categories_admin_delete" ON public.categories FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
