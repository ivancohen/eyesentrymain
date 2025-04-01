-- Add RLS policy to allow authenticated users to read dropdown options.
-- This is likely needed for questionnaires and other forms.

-- Ensure RLS is enabled on dropdown_options (if not already)
-- Note: Replace 'dropdown_options' if your actual table name is different.
ALTER TABLE public.dropdown_options ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all dropdown options
DROP POLICY IF EXISTS "Allow authenticated users read access to dropdown options" ON public.dropdown_options;
CREATE POLICY "Allow authenticated users read access to dropdown options"
    ON public.dropdown_options FOR SELECT
    USING (auth.role() = 'authenticated');