-- Function to update risk assessment advice with proper permissions
-- This avoids direct table access issues and standardizes data updating
CREATE OR REPLACE FUNCTION update_risk_assessment_advice(
  p_min_score integer,
  p_max_score integer,
  p_advice text,
  p_risk_level text
)
RETURNS SETOF risk_assessment_advice
LANGUAGE plpgsql
SECURITY DEFINER -- Uses the privileges of the function creator
AS $$
DECLARE
  v_updated_record risk_assessment_advice;
BEGIN
  -- Upsert the record based on risk_level
  INSERT INTO risk_assessment_advice (
    min_score,
    max_score,
    advice,
    risk_level,
    updated_at
  )
  VALUES (
    p_min_score,
    p_max_score,
    p_advice,
    p_risk_level,
    now()
  )
  ON CONFLICT (risk_level)
  DO UPDATE SET
    min_score = p_min_score,
    max_score = p_max_score,
    advice = p_advice,
    updated_at = now()
  RETURNING * INTO v_updated_record;
  
  -- Return the updated record
  RETURN QUERY SELECT * FROM risk_assessment_advice WHERE id = v_updated_record.id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_risk_assessment_advice(integer, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_risk_assessment_advice(integer, integer, text, text) TO anon;
GRANT EXECUTE ON FUNCTION update_risk_assessment_advice(integer, integer, text, text) TO service_role;