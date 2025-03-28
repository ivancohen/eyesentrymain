-- SQL to verify recommendations in the database
-- Execute in Supabase SQL Editor or database client

-- Check risk_assessment_advice table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'risk_assessment_advice';

-- Check if risk_assessment_advice table has any data
SELECT 
  id,
  risk_level,
  min_score,
  max_score,
  LEFT(advice, 50) || '...' AS advice_preview,
  created_at,
  updated_at
FROM 
  risk_assessment_advice
ORDER BY
  min_score ASC;

-- Check if there's an RPC function for accessing advice
SELECT 
  routine_name, 
  routine_type 
FROM 
  information_schema.routines 
WHERE 
  routine_name LIKE '%risk%advice%' OR
  routine_name LIKE '%get%risk%' OR
  routine_name LIKE '%assessment%advice%';

-- Check permissions on risk_assessment_advice table
SELECT 
  grantee, 
  privilege_type
FROM 
  information_schema.role_table_grants
WHERE 
  table_name = 'risk_assessment_advice';

-- Verify row-level security policies
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM
  pg_policies
WHERE
  tablename = 'risk_assessment_advice';
