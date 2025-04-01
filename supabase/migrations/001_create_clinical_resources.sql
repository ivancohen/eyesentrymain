-- Migration script to create the clinical_resources table

-- Ensure uuid-ossp extension is enabled (if not already)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define categories using an ENUM type for better data integrity
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clinical_resource_category') THEN
        CREATE TYPE clinical_resource_category AS ENUM ('diagnostics', 'equipment', 'community');
    END IF;
END$$;

-- Create the clinical_resources table
CREATE TABLE IF NOT EXISTS public.clinical_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    link TEXT,
    category clinical_resource_category NOT NULL,
    icon_name TEXT, -- Optional: Store Lucide icon name as string
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comments for clarity
COMMENT ON TABLE public.clinical_resources IS 'Stores clinical information resources displayed on the doctor dashboard.';
COMMENT ON COLUMN public.clinical_resources.category IS 'Category of the resource (diagnostics, equipment, community).';
COMMENT ON COLUMN public.clinical_resources.icon_name IS 'Optional name of the Lucide icon to display.';
COMMENT ON COLUMN public.clinical_resources.is_active IS 'Soft delete flag.';

-- Enable Row Level Security (RLS)
ALTER TABLE public.clinical_resources ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
-- Allow public read access to active resources
DROP POLICY IF EXISTS "Allow public read access to active clinical resources" ON public.clinical_resources;
CREATE POLICY "Allow public read access to active clinical resources"
    ON public.clinical_resources FOR SELECT
    USING (is_active = TRUE);

-- Allow admin users full access
DROP POLICY IF EXISTS "Allow admin full access to clinical resources" ON public.clinical_resources;
CREATE POLICY "Allow admin full access to clinical resources"
    ON public.clinical_resources FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Optional: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_clinical_resources_category ON public.clinical_resources(category);
CREATE INDEX IF NOT EXISTS idx_clinical_resources_is_active ON public.clinical_resources(is_active);

-- Optional: Trigger to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_clinical_resources_updated_at ON public.clinical_resources;
CREATE TRIGGER update_clinical_resources_updated_at
BEFORE UPDATE ON public.clinical_resources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial sample data (optional)
-- INSERT INTO public.clinical_resources (title, description, link, category, icon_name) VALUES
-- ('Glaucoma Diagnostic Guidelines', 'Latest clinical guidelines for glaucoma diagnosis and treatment', 'https://www.aao.org/eye-health/diseases/glaucoma-diagnosis', 'diagnostics', 'Microscope'),
-- ('Tonometry Equipment Guide', 'Comprehensive guide to tonometry equipment and best practices', 'https://example.com/tonometry', 'equipment', 'Eye'),
-- ('Local Ophthalmology Network', 'Connect with local ophthalmologists and specialists', 'https://example.com/network', 'community', 'Building2'),
-- ('Continuing Education Resources', 'Latest courses and certifications in glaucoma management', 'https://example.com/ce', 'community', 'GraduationCap');