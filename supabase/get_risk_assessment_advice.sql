-- Function to get risk assessment advice with proper permissions
-- This avoids direct table access issues and standardizes data fetching
CREATE OR REPLACE FUNCTION get_risk_assessment_advice()
RETURNS SETOF risk_assessment_advice
LANGUAGE plpgsql
SECURITY DEFINER -- Uses the privileges of the function creator
AS $$
BEGIN
  -- Simple but effective - returns all advice entries
  -- Security definer ensures proper access regardless of calling user's permissions
  RETURN QUERY
    SELECT *
    FROM risk_assessment_advice
    ORDER BY min_score ASC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_risk_assessment_advice() TO authenticated;
GRANT EXECUTE ON FUNCTION get_risk_assessment_advice() TO anon;
GRANT EXECUTE ON FUNCTION get_risk_assessment_advice() TO service_role;