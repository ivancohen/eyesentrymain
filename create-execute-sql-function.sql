-- Create the execute_sql function that can execute arbitrary SQL statements
-- This is needed for our SQL script execution
CREATE OR REPLACE FUNCTION public.execute_sql(sql_statement text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql_statement;
  RETURN json_build_object('success', true, 'message', 'SQL executed successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM, 'error_detail', SQLSTATE);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO service_role;

-- Add comment to the function
COMMENT ON FUNCTION public.execute_sql(text) IS 'Executes arbitrary SQL statements. Use with caution as this has full database access.';