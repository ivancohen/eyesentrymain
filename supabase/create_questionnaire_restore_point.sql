-- Script to create a restore point for questions system
CREATE SCHEMA IF NOT EXISTS restore_points;

-- Copy questions table data
CREATE TABLE restore_points.questions_20240326 AS 
SELECT * FROM public.questions;

-- Copy question options table data
CREATE TABLE restore_points.question_options_20240326 AS 
SELECT * FROM public.question_options;

-- Copy patient questionnaires data
CREATE TABLE restore_points.patient_questionnaires_20240326 AS 
SELECT * FROM public.patient_questionnaires;

-- Create restore function
CREATE OR REPLACE FUNCTION public.restore_questionnaire_system()
RETURNS void AS $$
BEGIN
  -- Disable triggers temporarily
  ALTER TABLE public.questions DISABLE TRIGGER ALL;
  ALTER TABLE public.question_options DISABLE TRIGGER ALL;
  ALTER TABLE public.patient_questionnaires DISABLE TRIGGER ALL;
  
  -- Clear existing data
  DELETE FROM public.questions;
  DELETE FROM public.question_options;
  
  -- Restore data
  INSERT INTO public.questions SELECT * FROM restore_points.questions_20240326;
  INSERT INTO public.question_options SELECT * FROM restore_points.question_options_20240326;
  
  -- Re-enable triggers
  ALTER TABLE public.questions ENABLE TRIGGER ALL;
  ALTER TABLE public.question_options ENABLE TRIGGER ALL;
  ALTER TABLE public.patient_questionnaires ENABLE TRIGGER ALL;
  
  RAISE NOTICE 'Questionnaire system restored to 2024-03-26 state';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users with admin role
GRANT EXECUTE ON FUNCTION public.restore_questionnaire_system() TO authenticated;