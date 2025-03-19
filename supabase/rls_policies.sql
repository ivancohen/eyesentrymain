-- Create a function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is admin through profiles table
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on patient_responses table
ALTER TABLE patient_responses ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all patient responses
CREATE POLICY "Admins can view all patient responses"
ON patient_responses
FOR SELECT
TO authenticated
USING (
  public.is_admin()
);

-- Policy for regular users to only view their own responses
CREATE POLICY "Users can view own responses"
ON patient_responses
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Enable RLS on questions table
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Allow admins full access to questions
CREATE POLICY "Admins have full access to questions"
ON questions
FOR ALL
TO authenticated
USING (
  public.is_admin()
);

-- Allow read access to all authenticated users for questions
CREATE POLICY "All users can read questions"
ON questions
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on dropdown_options table
ALTER TABLE dropdown_options ENABLE ROW LEVEL SECURITY;

-- Allow admins full access to dropdown_options
CREATE POLICY "Admins have full access to dropdown_options"
ON dropdown_options
FOR ALL
TO authenticated
USING (
  public.is_admin()
);

-- Allow read access to all authenticated users for dropdown_options
CREATE POLICY "All users can read dropdown_options"
ON dropdown_options
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on conditional_items table
ALTER TABLE conditional_items ENABLE ROW LEVEL SECURITY;

-- Allow admins full access to conditional_items
CREATE POLICY "Admins have full access to conditional_items"
ON conditional_items
FOR ALL
TO authenticated
USING (
  public.is_admin()
);

-- Allow read access to all authenticated users for conditional_items
CREATE POLICY "All users can read conditional_items"
ON conditional_items
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  public.is_admin()
);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
);

-- Users can view own profile
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
);
