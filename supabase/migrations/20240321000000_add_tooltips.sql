-- Create function to execute SQL statements
CREATE OR REPLACE FUNCTION execute_postgresql(sql_statement text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_statement;
END;
$$;

-- Add tooltip columns
SELECT execute_postgresql('
  ALTER TABLE questions ADD COLUMN IF NOT EXISTS tooltip TEXT;
  COMMENT ON COLUMN questions.tooltip IS ''Additional information shown when hovering over the question'';
  UPDATE questions SET tooltip = NULL WHERE tooltip IS NULL;

  ALTER TABLE conditional_items ADD COLUMN IF NOT EXISTS tooltip TEXT;
  COMMENT ON COLUMN conditional_items.tooltip IS ''Additional information shown when hovering over the conditional item'';
  UPDATE conditional_items SET tooltip = NULL WHERE tooltip IS NULL;
'); 