-- SQL functions for patient analytics dashboard
-- These functions provide anonymized data for questionnaire analysis

-- Function to retrieve anonymized questionnaire data with filters
CREATE OR REPLACE FUNCTION public.get_anonymized_questionnaire_data(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  age_ranges TEXT[] DEFAULT NULL,
  races TEXT[] DEFAULT NULL,
  risk_levels TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,  -- Keep ID for reference but not patient info
  age TEXT,
  race TEXT,
  family_glaucoma BOOLEAN,
  ocular_steroid BOOLEAN,
  steroid_type TEXT,
  intravitreal BOOLEAN,
  intravitreal_type TEXT,
  systemic_steroid BOOLEAN,
  systemic_steroid_type TEXT,
  iop_baseline BOOLEAN,
  vertical_asymmetry BOOLEAN,
  vertical_ratio BOOLEAN,
  total_score INTEGER,
  risk_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.age,
    q.race,
    q.family_glaucoma,
    q.ocular_steroid,
    q.steroid_type,
    q.intravitreal,
    q.intravitreal_type,
    q.systemic_steroid,
    q.systemic_steroid_type,
    q.iop_baseline,
    q.vertical_asymmetry,
    q.vertical_ratio,
    q.total_score,
    q.risk_level,
    q.created_at
  FROM 
    public.patient_questionnaires q
  WHERE
    -- Apply date range filter if provided
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    -- Apply age filter if provided
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    -- Apply race filter if provided
    (races IS NULL OR q.race = ANY(races)) AND
    -- Apply risk level filter if provided
    (risk_levels IS NULL OR q.risk_level = ANY(risk_levels))
  ORDER BY 
    q.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get risk factor distribution
CREATE OR REPLACE FUNCTION public.get_risk_factor_distribution(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  age_ranges TEXT[] DEFAULT NULL,
  races TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  factor TEXT,
  count BIGINT,
  percentage NUMERIC
) AS $$
DECLARE
  total_count BIGINT;
BEGIN
  -- Get total number of questionnaires for percentage calculation
  SELECT COUNT(*) INTO total_count FROM public.patient_questionnaires q
  WHERE
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races));

  RETURN QUERY
  
  -- Family Glaucoma
  SELECT 
    'Family Glaucoma' AS factor,
    COUNT(*) AS count,
    ROUND((COUNT(*) * 100.0 / NULLIF(total_count, 0)), 1) AS percentage
  FROM 
    public.patient_questionnaires q
  WHERE 
    q.family_glaucoma = TRUE AND
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races))
    
  UNION ALL
  
  -- Ocular Steroid
  SELECT 
    'Ocular Steroid' AS factor,
    COUNT(*) AS count,
    ROUND((COUNT(*) * 100.0 / NULLIF(total_count, 0)), 1) AS percentage
  FROM 
    public.patient_questionnaires q
  WHERE 
    q.ocular_steroid = TRUE AND
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races))
    
  UNION ALL
  
  -- Intravitreal
  SELECT 
    'Intravitreal' AS factor,
    COUNT(*) AS count,
    ROUND((COUNT(*) * 100.0 / NULLIF(total_count, 0)), 1) AS percentage
  FROM 
    public.patient_questionnaires q
  WHERE 
    q.intravitreal = TRUE AND
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races))
    
  UNION ALL
  
  -- Systemic Steroid
  SELECT 
    'Systemic Steroid' AS factor,
    COUNT(*) AS count,
    ROUND((COUNT(*) * 100.0 / NULLIF(total_count, 0)), 1) AS percentage
  FROM 
    public.patient_questionnaires q
  WHERE 
    q.systemic_steroid = TRUE AND
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races))
    
  UNION ALL
  
  -- IOP Baseline
  SELECT 
    'IOP Baseline' AS factor,
    COUNT(*) AS count,
    ROUND((COUNT(*) * 100.0 / NULLIF(total_count, 0)), 1) AS percentage
  FROM 
    public.patient_questionnaires q
  WHERE 
    q.iop_baseline = TRUE AND
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races))
    
  UNION ALL
  
  -- Vertical Asymmetry
  SELECT 
    'Vertical Asymmetry' AS factor,
    COUNT(*) AS count,
    ROUND((COUNT(*) * 100.0 / NULLIF(total_count, 0)), 1) AS percentage
  FROM 
    public.patient_questionnaires q
  WHERE 
    q.vertical_asymmetry = TRUE AND
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races))
    
  UNION ALL
  
  -- Vertical Ratio
  SELECT 
    'Vertical Ratio' AS factor,
    COUNT(*) AS count,
    ROUND((COUNT(*) * 100.0 / NULLIF(total_count, 0)), 1) AS percentage
  FROM 
    public.patient_questionnaires q
  WHERE 
    q.vertical_ratio = TRUE AND
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races))
    
  ORDER BY 
    count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get risk level distribution
CREATE OR REPLACE FUNCTION public.get_risk_level_distribution(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  age_ranges TEXT[] DEFAULT NULL,
  races TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  risk_level TEXT,
  count BIGINT,
  percentage NUMERIC
) AS $$
DECLARE
  total_count BIGINT;
BEGIN
  -- Get total number of questionnaires for percentage calculation
  SELECT COUNT(*) INTO total_count FROM public.patient_questionnaires q
  WHERE
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races));

  RETURN QUERY
  SELECT 
    q.risk_level,
    COUNT(*) AS count,
    ROUND((COUNT(*) * 100.0 / NULLIF(total_count, 0)), 1) AS percentage
  FROM 
    public.patient_questionnaires q
  WHERE
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races))
  GROUP BY 
    q.risk_level
  ORDER BY 
    CASE 
      WHEN q.risk_level = 'High' THEN 1
      WHEN q.risk_level = 'Moderate' THEN 2
      WHEN q.risk_level = 'Low' THEN 3
      ELSE 4
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get age distribution
CREATE OR REPLACE FUNCTION public.get_age_distribution(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  races TEXT[] DEFAULT NULL,
  risk_levels TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  age_range TEXT,
  count BIGINT,
  percentage NUMERIC
) AS $$
DECLARE
  total_count BIGINT;
BEGIN
  -- Get total number of questionnaires for percentage calculation
  SELECT COUNT(*) INTO total_count FROM public.patient_questionnaires q
  WHERE
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (races IS NULL OR q.race = ANY(races)) AND
    (risk_levels IS NULL OR q.risk_level = ANY(risk_levels));

  RETURN QUERY
  SELECT 
    q.age AS age_range,
    COUNT(*) AS count,
    ROUND((COUNT(*) * 100.0 / NULLIF(total_count, 0)), 1) AS percentage
  FROM 
    public.patient_questionnaires q
  WHERE
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (races IS NULL OR q.race = ANY(races)) AND
    (risk_levels IS NULL OR q.risk_level = ANY(risk_levels))
  GROUP BY 
    q.age
  ORDER BY 
    CASE 
      WHEN q.age = '0-50' THEN 1
      WHEN q.age = '51-60' THEN 2
      WHEN q.age = '61-70' THEN 3
      WHEN q.age = '71-80' THEN 4
      WHEN q.age = '81-90' THEN 5
      WHEN q.age = '91+' THEN 6
      ELSE 7
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get race distribution
CREATE OR REPLACE FUNCTION public.get_race_distribution(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  age_ranges TEXT[] DEFAULT NULL,
  risk_levels TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  race TEXT,
  count BIGINT,
  percentage NUMERIC
) AS $$
DECLARE
  total_count BIGINT;
BEGIN
  -- Get total number of questionnaires for percentage calculation
  SELECT COUNT(*) INTO total_count FROM public.patient_questionnaires q
  WHERE
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (risk_levels IS NULL OR q.risk_level = ANY(risk_levels));

  RETURN QUERY
  SELECT 
    q.race,
    COUNT(*) AS count,
    ROUND((COUNT(*) * 100.0 / NULLIF(total_count, 0)), 1) AS percentage
  FROM 
    public.patient_questionnaires q
  WHERE
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (risk_levels IS NULL OR q.risk_level = ANY(risk_levels))
  GROUP BY 
    q.race
  ORDER BY 
    count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get submission counts by time period (day, week, month)
CREATE OR REPLACE FUNCTION public.get_submission_trend(
  period TEXT DEFAULT 'month',
  months_back INTEGER DEFAULT 6,
  age_ranges TEXT[] DEFAULT NULL,
  races TEXT[] DEFAULT NULL,
  risk_levels TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  time_period TEXT,
  count BIGINT
) AS $$
BEGIN
  IF period = 'day' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(q.created_at, 'YYYY-MM-DD') AS time_period,
      COUNT(*) AS count
    FROM 
      public.patient_questionnaires q
    WHERE
      q.created_at >= NOW() - INTERVAL '1 month' AND
      (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
      (races IS NULL OR q.race = ANY(races)) AND
      (risk_levels IS NULL OR q.risk_level = ANY(risk_levels))
    GROUP BY 
      TO_CHAR(q.created_at, 'YYYY-MM-DD')
    ORDER BY 
      time_period;
  ELSIF period = 'week' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(DATE_TRUNC('week', q.created_at), 'YYYY-MM-DD') AS time_period,
      COUNT(*) AS count
    FROM 
      public.patient_questionnaires q
    WHERE
      q.created_at >= NOW() - INTERVAL '3 months' AND
      (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
      (races IS NULL OR q.race = ANY(races)) AND
      (risk_levels IS NULL OR q.risk_level = ANY(risk_levels))
    GROUP BY 
      DATE_TRUNC('week', q.created_at)
    ORDER BY 
      DATE_TRUNC('week', q.created_at);
  ELSE -- month is default
    RETURN QUERY
    SELECT 
      TO_CHAR(DATE_TRUNC('month', q.created_at), 'YYYY-MM') AS time_period,
      COUNT(*) AS count
    FROM 
      public.patient_questionnaires q
    WHERE
      q.created_at >= NOW() - (months_back * INTERVAL '1 month') AND
      (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
      (races IS NULL OR q.race = ANY(races)) AND
      (risk_levels IS NULL OR q.risk_level = ANY(risk_levels))
    GROUP BY 
      DATE_TRUNC('month', q.created_at)
    ORDER BY 
      DATE_TRUNC('month', q.created_at);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get the total count and average score
CREATE OR REPLACE FUNCTION public.get_questionnaire_summary(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  age_ranges TEXT[] DEFAULT NULL,
  races TEXT[] DEFAULT NULL,
  risk_levels TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  total_count BIGINT,
  avg_score NUMERIC,
  month_over_month_change NUMERIC
) AS $$
DECLARE
  current_month_count BIGINT;
  previous_month_count BIGINT;
  mom_change NUMERIC;
BEGIN
  -- Get current month's count
  SELECT COUNT(*) INTO current_month_count
  FROM public.patient_questionnaires q
  WHERE
    q.created_at >= DATE_TRUNC('month', NOW()) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races)) AND
    (risk_levels IS NULL OR q.risk_level = ANY(risk_levels));
    
  -- Get previous month's count
  SELECT COUNT(*) INTO previous_month_count
  FROM public.patient_questionnaires q
  WHERE
    q.created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month' AND
    q.created_at < DATE_TRUNC('month', NOW()) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races)) AND
    (risk_levels IS NULL OR q.risk_level = ANY(risk_levels));
    
  -- Calculate month over month change
  IF previous_month_count > 0 THEN
    mom_change := ROUND(((current_month_count - previous_month_count) * 100.0 / previous_month_count), 1);
  ELSE
    mom_change := NULL;
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*) AS total_count,
    ROUND(AVG(q.total_score), 1) AS avg_score,
    mom_change
  FROM 
    public.patient_questionnaires q
  WHERE
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races)) AND
    (risk_levels IS NULL OR q.risk_level = ANY(risk_levels));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get correlation data
CREATE OR REPLACE FUNCTION public.get_risk_factor_correlation(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  age_ranges TEXT[] DEFAULT NULL,
  races TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  factor1 TEXT,
  factor2 TEXT,
  correlation_count BIGINT,
  percentage NUMERIC
) AS $$
DECLARE
  total_count BIGINT;
BEGIN
  -- Get total number of questionnaires for percentage calculation
  SELECT COUNT(*) INTO total_count FROM public.patient_questionnaires q
  WHERE
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races));

  -- Return data for the heatmap
  RETURN QUERY
  
  -- Family Glaucoma and High Risk
  SELECT 
    'Family Glaucoma' AS factor1,
    'High Risk' AS factor2,
    COUNT(*) AS correlation_count,
    ROUND((COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM public.patient_questionnaires WHERE family_glaucoma = TRUE), 0)), 1) AS percentage
  FROM 
    public.patient_questionnaires q
  WHERE 
    q.family_glaucoma = TRUE AND
    q.risk_level = 'High' AND
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races))
    
  UNION ALL
  
  -- Family Glaucoma and Moderate Risk
  SELECT 
    'Family Glaucoma' AS factor1,
    'Moderate Risk' AS factor2,
    COUNT(*) AS correlation_count,
    ROUND((COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM public.patient_questionnaires WHERE family_glaucoma = TRUE), 0)), 1) AS percentage
  FROM 
    public.patient_questionnaires q
  WHERE 
    q.family_glaucoma = TRUE AND
    q.risk_level = 'Moderate' AND
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races))
    
  UNION ALL
  
  -- Ocular Steroid and High Risk
  SELECT 
    'Ocular Steroid' AS factor1,
    'High Risk' AS factor2,
    COUNT(*) AS correlation_count,
    ROUND((COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM public.patient_questionnaires WHERE ocular_steroid = TRUE), 0)), 1) AS percentage
  FROM 
    public.patient_questionnaires q
  WHERE 
    q.ocular_steroid = TRUE AND
    q.risk_level = 'High' AND
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races))
    
  UNION ALL
  
  -- Continue with other combinations...
  -- This would include all combinations of risk factors with risk levels and with each other
  
  SELECT 
    'Systemic Steroid' AS factor1,
    'High Risk' AS factor2,
    COUNT(*) AS correlation_count,
    ROUND((COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM public.patient_questionnaires WHERE systemic_steroid = TRUE), 0)), 1) AS percentage
  FROM 
    public.patient_questionnaires q
  WHERE 
    q.systemic_steroid = TRUE AND
    q.risk_level = 'High' AND
    (start_date IS NULL OR q.created_at >= start_date) AND
    (end_date IS NULL OR q.created_at <= end_date) AND
    (age_ranges IS NULL OR q.age = ANY(age_ranges)) AND
    (races IS NULL OR q.race = ANY(races))
    
  ORDER BY 
    factor1, factor2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to these functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_anonymized_questionnaire_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_risk_factor_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_risk_level_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_age_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_race_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_submission_trend TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_questionnaire_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_risk_factor_correlation TO authenticated;
