-- Drop the existing function first
DROP FUNCTION IF EXISTS update_dropdown_option(uuid, text, text, integer);

-- Update the function to handle dropdown option updates without ambiguity
CREATE OR REPLACE FUNCTION update_dropdown_option(
  p_option_id UUID,
  p_option_text TEXT,
  p_option_value TEXT,
  p_score INTEGER
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  UPDATE dropdown_options
  SET 
    option_text = p_option_text,
    option_value = p_option_value,
    score = p_score
  WHERE id = p_option_id;
  
  SELECT row_to_json(d)::jsonb INTO result
  FROM (SELECT * FROM dropdown_options WHERE id = p_option_id) d;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;