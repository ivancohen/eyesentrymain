-- Restore Point: Registration Flow (March 23, 2024)
-- This migration serves as a restore point marker and documents the current state
-- of the database schema related to user registration and doctor approval flow.

-- Create a restore_points table to track system states
CREATE TABLE IF NOT EXISTS restore_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by TEXT,
    related_files TEXT[],
    schema_snapshot JSONB
);

-- Insert the restore point record
INSERT INTO restore_points (name, description, created_by, related_files, schema_snapshot)
VALUES (
    'registration_flow_20240323',
    'Registration flow after removing email verification, focusing on admin approval for doctors',
    'system',
    ARRAY[
        'src/pages/Register.tsx',
        'src/contexts/AuthContext.tsx',
        'src/components/AuthForm.tsx'
    ],
    jsonb_build_object(
        'profiles', jsonb_build_object(
            'columns', jsonb_build_array(
                'id UUID PK',
                'email TEXT',
                'name TEXT',
                'is_admin BOOLEAN',
                'created_at TIMESTAMPTZ',
                'avatar_url TEXT NULL'
            )
        ),
        'doctor_approvals', jsonb_build_object(
            'columns', jsonb_build_array(
                'id UUID PK',
                'doctor_id UUID FK',
                'status TEXT',
                'approved_by UUID FK',
                'created_at TIMESTAMPTZ',
                'updated_at TIMESTAMPTZ'
            )
        )
    )
);

-- Document current RLS policies
COMMENT ON TABLE profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE doctor_approvals IS 'Doctor registration approval workflow tracking';

-- Verify required columns exist
DO $$ 
BEGIN
    -- Verify profiles table structure
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'is_admin'
    ) THEN
        RAISE EXCEPTION 'Restore point validation failed: profiles.is_admin column missing';
    END IF;

    -- Verify doctor_approvals table structure
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'doctor_approvals' 
        AND column_name = 'status'
    ) THEN
        RAISE EXCEPTION 'Restore point validation failed: doctor_approvals.status column missing';
    END IF;
END $$; 