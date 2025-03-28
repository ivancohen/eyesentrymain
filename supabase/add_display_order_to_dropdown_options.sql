-- Add display_order column to dropdown_options table if it doesn't exist
ALTER TABLE public.dropdown_options 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update existing options to have sequential display_order values
WITH ordered_options AS (
  SELECT 
    id,
    question_id,
    ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY created_at, id) as row_num
  FROM 
    public.dropdown_options
)
UPDATE public.dropdown_options do
SET display_order = oo.row_num
FROM ordered_options oo
WHERE do.id = oo.id;

-- Create an index on display_order for better performance
CREATE INDEX IF NOT EXISTS idx_dropdown_options_display_order 
ON public.dropdown_options (question_id, display_order);

-- Add a function to reorder dropdown options
CREATE OR REPLACE FUNCTION reorder_dropdown_options(
  p_updates jsonb[]
) RETURNS void AS $$
DECLARE
  v_update jsonb;
BEGIN
  -- Loop through each update
  FOREACH v_update IN ARRAY p_updates
  LOOP
    -- Update the display_order for the option
    UPDATE public.dropdown_options
    SET display_order = (v_update->>'display_order')::integer
    WHERE id = (v_update->>'id')::uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION reorder_dropdown_options(jsonb[]) TO authenticated;

-- Verify changes
SELECT 
  id, 
  question_id, 
  option_text, 
  option_value, 
  score, 
  display_order
FROM 
  public.dropdown_options
ORDER BY 
  question_id, 
  display_order;