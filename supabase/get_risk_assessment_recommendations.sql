-- Create RPC function for risk assessment recommendations
-- This follows the same pattern as other successful RPC functions in the system
CREATE OR REPLACE FUNCTION get_risk_assessment_recommendations()
RETURNS SETOF risk_assessment_advice
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return all recommendations from the risk_assessment_advice table
  -- Ordered by min_score to ensure consistent results
  RETURN QUERY
    SELECT *
    FROM risk_assessment_advice
    ORDER BY min_score ASC;
END;
$$;

-- Grant necessary permissions to match other RPC functions
GRANT EXECUTE ON FUNCTION get_risk_assessment_recommendations() TO authenticated;
GRANT EXECUTE ON FUNCTION get_risk_assessment_recommendations() TO anon;
GRANT EXECUTE ON FUNCTION get_risk_assessment_recommendations() TO service_role;

-- Create a view for debugging and verification
CREATE OR REPLACE VIEW vw_risk_assessment_recommendations AS
SELECT 
  id,
  risk_level,
  min_score,
  max_score,
  substr(advice, 1, 50) || '...' AS advice_preview,
  created_at,
  updated_at
FROM 
  risk_assessment_advice
ORDER BY 
  min_score ASC;

-- Comment
COMMENT ON FUNCTION get_risk_assessment_recommendations() IS 
  'Returns risk assessment recommendations using the same pattern as other successful RPC functions';