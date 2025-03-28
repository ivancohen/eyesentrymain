-- Fix access to the patients table
-- This script adds proper RLS policies to allow authenticated users to access the patients table

-- First, check if the patients table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'patients') THEN
    -- Create the patients table if it doesn't exist
    CREATE TABLE public.patients (
      id UUID PRIMARY KEY,
      doctor_id UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Add comment
    COMMENT ON TABLE public.patients IS 'Stores patient records';
  END IF;
END
$$;

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to select their own patients" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated users to insert patients" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated users to update their own patients" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated users to select any patient" ON public.patients;

-- Enable RLS on the patients table
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create policies for the patients table
-- Allow authenticated users to select any patient (needed for specialist access)
CREATE POLICY "Allow authenticated users to select any patient"
  ON public.patients
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert patients
CREATE POLICY "Allow authenticated users to insert patients"
  ON public.patients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update their own patients
CREATE POLICY "Allow authenticated users to update their own patients"
  ON public.patients
  FOR UPDATE
  TO authenticated
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.patients TO authenticated;