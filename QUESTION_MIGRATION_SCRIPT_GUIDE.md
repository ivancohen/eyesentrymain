# Question Migration Script Guide

This guide provides SQL scripts and instructions for migrating the questionnaire system to be fully database-driven, with proper handling of admin-created questions.

## Database Scripts

### 1. Create Restore Point

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

### 2. Add Status Column

```sql
-- Add status column if it doesn't exist
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- Set all questions to active initially
UPDATE public.questions 
SET status = 'Active' 
WHERE status IS NULL;

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_questions_status 
ON public.questions(status);
```

### 3. Add is_active Column

```sql
-- Add is_active column if it doesn't exist
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Set all questions to active initially
UPDATE public.questions 
SET is_active = true 
WHERE is_active IS NULL;

-- Create index on is_active
CREATE INDEX IF NOT EXISTS idx_questions_is_active 
ON public.questions(is_active);
```

### 4. Standardize Question Categories

```sql
-- Standardize category names
UPDATE public.questions
SET page_category = 'patient_info'
WHERE page_category LIKE '%patient%info%';

UPDATE public.questions
SET page_category = 'medical_history'
WHERE page_category LIKE '%medical%history%';

UPDATE public.questions
SET page_category = 'clinical_measurements'
WHERE page_category LIKE '%clinical%measurement%';

-- Create index on page_category
CREATE INDEX IF NOT EXISTS idx_questions_page_category 
ON public.questions(page_category);
```

### 5. Add Risk Score to Questions

```sql
-- Add risk_score column if it doesn't exist
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 1;

-- Set default risk scores
UPDATE public.questions 
SET risk_score = 1 
WHERE risk_score IS NULL OR risk_score = 0;

-- Set specific risk scores for known questions
UPDATE public.questions 
SET risk_score = 2 
WHERE question LIKE '%Family History of Glaucoma%';

UPDATE public.questions 
SET risk_score = 2 
WHERE question LIKE '%IOP Baseline%' AND question LIKE '%22%';

UPDATE public.questions 
SET risk_score = 2 
WHERE question LIKE '%Vertical Asymmetry%' AND question LIKE '%0.2%';

UPDATE public.questions 
SET risk_score = 2 
WHERE question LIKE '%Vertical Ratio%' AND question LIKE '%0.6%';
```

### 6. Deactivate Duplicate Questions

```sql
-- Create a temporary table to identify duplicates
CREATE TEMP TABLE duplicate_questions AS
WITH ranked_questions AS (
  SELECT 
    id,
    question,
    created_at,
    created_by,
    ROW_NUMBER() OVER (
      PARTITION BY question 
      ORDER BY 
        CASE WHEN created_by IS NOT NULL THEN 0 ELSE 1 END,
        created_at DESC
    ) as rn
  FROM public.questions
)
SELECT id
FROM ranked_questions
WHERE rn > 1;

-- Deactivate duplicates
UPDATE public.questions
SET status = 'Inactive', is_active = false
WHERE id IN (SELECT id FROM duplicate_questions);

-- Drop the temporary table
DROP TABLE duplicate_questions;
```

### 7. Add Performance Indexes

```sql
-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_question 
ON public.questions(question);

CREATE INDEX IF NOT EXISTS idx_questions_created_by 
ON public.questions(created_by);

CREATE INDEX IF NOT EXISTS idx_questions_created_at 
ON public.questions(created_at);
```

### 8. Fix Question Types

```sql
-- Set text input types correctly
UPDATE public.questions
SET question_type = 'text'
WHERE question LIKE '%First Name%' OR question LIKE '%Last Name%';

-- Create index on question_type
CREATE INDEX IF NOT EXISTS idx_questions_question_type 
ON public.questions(question_type);
```

### 9. Verify Changes

```sql
-- Check for duplicate active questions
SELECT question, COUNT(*) 
FROM public.questions 
WHERE status = 'Active' 
GROUP BY question 
HAVING COUNT(*) > 1;

-- Check question types
SELECT question, question_type, COUNT(*) 
FROM public.questions 
GROUP BY question, question_type 
ORDER BY question;

-- Check risk scores
SELECT question, risk_score 
FROM public.questions 
ORDER BY risk_score DESC, question;
```

## Implementation Steps

1. **Create a Restore Point First**
   - Run the restore point creation script
   - Verify the restore tables were created
   - Test the restore function with a dry run

2. **Run the Schema Updates**
   - Add the status column
   - Add the is_active column
   - Standardize question categories
   - Add risk scores

3. **Clean Up Duplicate Questions**
   - Run the deactivate duplicates script
   - Verify only one version of each question is active
   - Check that the correct version (with tooltip) is active

4. **Add Performance Optimizations**
   - Create the recommended indexes
   - Verify indexes were created

5. **Fix Question Types**
   - Update text input types
   - Verify question types are correct

6. **Final Verification**
   - Run the verification queries
   - Check for any remaining issues

## Troubleshooting

If you encounter issues:

1. **Permission Errors**
   - Ensure you're running the scripts with admin privileges
   - Check that the authenticated role has the necessary permissions

2. **Duplicate Questions Still Active**
   - Run the deactivate duplicates script again
   - Manually check and update specific questions

3. **Restore Function Fails**
   - Check that the restore tables exist
   - Verify the function has the correct permissions
   - Try running the restore steps manually

4. **Index Creation Fails**
   - Check if the indexes already exist
   - Verify column names and types

## Next Steps

After running these scripts:

1. Update the application code as described in the QUESTIONNAIRE_FORM_UPDATE_GUIDE.md
2. Update the risk assessment as described in the RISK_ASSESSMENT_UPDATE_GUIDE.md
3. Follow the implementation checklist in QUESTIONNAIRE_MIGRATION_CHECKLIST.md