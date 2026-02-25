-- DevLog: Add site settings for signup control
-- Migration 009

CREATE TABLE IF NOT EXISTS public.site_settings (
    id INT PRIMARY KEY CHECK (id = 1),
    signup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert the default single row
INSERT INTO public.site_settings (id, signup_enabled)
VALUES (1, TRUE)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "site_settings_public_read"
    ON public.site_settings FOR SELECT
    USING (true);

-- Only admins can update settings (assumes profile.role = 'admin')
CREATE POLICY "site_settings_admin_update"
    ON public.site_settings FOR UPDATE
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
