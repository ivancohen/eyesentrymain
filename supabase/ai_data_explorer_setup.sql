-- ai_data_explorer_setup.sql
-- Creates a secure function to execute AI-generated SQL queries with safety constraints

-- Create a function to execute SQL queries safely
CREATE OR REPLACE FUNCTION public.execute_safe_query(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  lower_query TEXT;
  is_select BOOLEAN;
  has_multiple_statements BOOLEAN;
  result_rows INT;
BEGIN
  -- Basic validation
  IF query_text IS NULL OR length(query_text) < 10 THEN
    RAISE EXCEPTION 'Invalid query: too short or null';
  END IF;
  
  -- Convert to lowercase for easier pattern matching
  lower_query := lower(query_text);
  
  -- Check if it's a SELECT query
  is_select := starts_with(trim(lower_query), 'select');
  IF NOT is_select THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed for security reasons';
  END IF;
  
  -- Check for multiple statements
  has_multiple_statements := (position(';' in query_text) < length(query_text));
  IF has_multiple_statements THEN
    RAISE EXCEPTION 'Multiple SQL statements are not allowed';
  END IF;
  
  -- Check for dangerous keywords (additional security)
  IF lower_query ~ 'drop|truncate|delete|update|insert|alter|create|grant|revoke' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;
  
  -- Execute the query and get the results as JSON
  EXECUTE 'WITH query_result AS (' || query_text || ') 
           SELECT jsonb_agg(row_to_json(query_result)) 
           FROM query_result' 
  INTO result;
  
  -- Check if any results were returned
  IF result IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  
  -- Limit large result sets
  result_rows := jsonb_array_length(result);
  IF result_rows > 1000 THEN
    -- Extract the first 1000 rows
    result := jsonb_path_query_array(result, '$[0 to 999]');
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error as JSON
    RETURN jsonb_build_object(
      'error', true,
      'message', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_safe_query TO authenticated;

-- Add documentation comment
COMMENT ON FUNCTION public.execute_safe_query IS 
'Safely executes a SELECT query with security constraints and returns results as JSON. 
Only SELECT queries are allowed, and they are further validated for dangerous operations.
Maximum 1000 rows are returned to prevent memory issues.';

-- Test the function
DO $$
BEGIN
  RAISE NOTICE 'Testing execute_safe_query function...';
  
  -- Test valid query
  DECLARE 
    test_result JSONB;
  BEGIN
    SELECT public.execute_safe_query('SELECT 1 as test, ''example'' as text_value')
    INTO test_result;
    
    RAISE NOTICE 'Valid query test result: %', test_result;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error testing valid query: %', SQLERRM;
  END;
  
  -- Test invalid query (non-SELECT)
  BEGIN
    PERFORM public.execute_safe_query('UPDATE profiles SET is_admin = true');
    RAISE NOTICE 'Security failure: Non-SELECT query passed validation';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Security check success: Non-SELECT query blocked with message: %', SQLERRM;
  END;
  
  -- Test multiple statements
  BEGIN
    PERFORM public.execute_safe_query('SELECT 1; SELECT 2;');
    RAISE NOTICE 'Security failure: Multiple statements passed validation';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Security check success: Multiple statements blocked with message: %', SQLERRM;
  END;
  
  RAISE NOTICE 'Function testing complete.';
END;
$$;
