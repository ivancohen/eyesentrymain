# Questionnaire System Restore Point Guide

This guide provides instructions for creating a restore point for the questionnaire system before making major changes. Creating a restore point is an essential safety measure that allows you to revert changes if something goes wrong during implementation.

## Why Create a Restore Point?

1. **Safety Net**: Provides a way to revert to a known good state
2. **Reduced Risk**: Allows confident implementation of major architectural changes
3. **Data Preservation**: Ensures no patient data is lost during migration
4. **Quick Recovery**: Enables rapid restoration if issues are encountered

## SQL Script for Creating a Restore Point

Execute the following SQL script in your Supabase database to create a restore point:

```sql
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
```

## How to Use the Restore Point

### Creating the Restore Point

1. Connect to your Supabase database using the SQL Editor or a database client
2. Execute the SQL script above
3. Verify that the restore tables were created:
   ```sql
   SELECT COUNT(*) FROM restore_points.questions_20240326;
   SELECT COUNT(*) FROM restore_points.question_options_20240326;
   ```

### Restoring From the Restore Point

If you need to revert changes, execute:

```sql
SELECT restore_questionnaire_system();
```

This will:
1. Disable triggers temporarily to prevent side effects
2. Clear the current questions and question_options tables
3. Restore the data from the backup tables
4. Re-enable all triggers

### Verifying the Restore

After restoring, verify that the data has been correctly restored:

```sql
SELECT COUNT(*) FROM public.questions;
SELECT COUNT(*) FROM public.question_options;
```

## Implementation Notes

- The restore point is timestamped with 20240326 (March 26, 2024)
- The restore function only restores the questions and question_options tables, not the patient_questionnaires table (to preserve patient data)
- The restore function uses SECURITY DEFINER to ensure it runs with elevated privileges

## Important Safety Considerations

1. Always test the restore point in a development environment before relying on it in production
2. Create a new restore point before each major system change
3. Document when restore points are created and used
4. Consider implementing a more comprehensive backup strategy for production environments