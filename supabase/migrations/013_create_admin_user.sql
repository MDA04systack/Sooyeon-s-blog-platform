-- DevLog: Create Initial Admin User securely
-- Migration 013 (Admin Auth Seed via pg_crypto/auth schema)
-- Using hardcoded uuid so we can cross-reference it if we want, or gen_random_uuid
DO $$
DECLARE
    admin_uid UUID := gen_random_uuid();
    admin_email TEXT := 'ocarrotcakeo@gmail.com';
    admin_password TEXT := 'admin'; 
    encrypted_pw TEXT;
BEGIN
    -- Only create if this email does not exist yet to prevent errors on multiple runs
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
        
        -- Generate encrypted password using pgcrypto extension manually mimicking Supabase
        encrypted_pw := extensions.crypt(admin_password, extensions.gen_salt('bf', 10));

        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            role,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            admin_uid,
            '00000000-0000-0000-0000-000000000000',
            admin_email,
            encrypted_pw,
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "관리자", "display_name": "관리자"}',
            NOW(),
            NOW(),
            'authenticated',
            '',
            '',
            '',
            ''
        );

        -- The handle_new_user() Trigger from 006 migration might catch this and auto-insert,
        -- BUT it ignores email providers. So we manually insert the profile.
        INSERT INTO public.profiles (
            id,
            username,
            nickname,
            full_name,
            role
        ) VALUES (
            admin_uid,
            'admin',      -- requested username
            '관리자',      -- requested nickname
            '관리자',
            'admin'       -- MUST BE ADMIN
        );

    END IF;
END $$;
