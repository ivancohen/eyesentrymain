# Comprehensive Plan to Fix EyeSentry Questionnaire System

## Current Issues Analysis

After reviewing the codebase and error logs, I've identified several fundamental issues with the questionnaire system:

1. **Question Ordering**: Unable to change the order of questions in the admin section
2. **Dropdown Options Order**: Options not consistently displaying in order of entry
3. **Conditional Logic**: Conditional questions (like medication follow-ups) are hardcoded rather than admin-configurable
4. **Risk Assessment Scoring**: Some scores are hardcoded rather than being fully admin-driven
5. **Database Schema Issues**: Column ambiguity and missing columns causing errors

## Root Causes

The root causes of these issues are:

1. **Incomplete Admin Interface**: The admin interface doesn't fully expose all the configuration options needed
2. **Hardcoded Logic**: Critical business logic is hardcoded in the frontend and services
3. **Database Schema Limitations**: The current schema doesn't support all the required functionality
4. **Synchronization Issues**: Changes in the admin section aren't properly reflected in the questionnaire

## Implementation Plan

### Phase 1: Database Schema Enhancement

#### 1.1 Enhance Questions Table
```sql
-- Add missing columns to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS conditional_parent_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS conditional_required_value TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS conditional_display_mode TEXT DEFAULT 'hide';

-- Create index on display_order for performance
CREATE INDEX IF NOT EXISTS idx_questions_display_order 
ON questions(page_category, display_order);
```

#### 1.2 Enhance Dropdown Options Table
```sql
-- Add display_order column to dropdown_options
ALTER TABLE dropdown_options
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index on display_order for performance
CREATE INDEX IF NOT EXISTS idx_dropdown_options_display_order 
ON dropdown_options(question_id, display_order);
```

#### 1.3 Create Risk Assessment Configuration Table
```sql
-- Ensure risk_assessment_config has all needed columns
CREATE TABLE IF NOT EXISTS risk_assessment_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id TEXT NOT NULL,
  option_value TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_id, option_value)
);
```

### Phase 2: SQL Functions and Triggers

```sql
-- Function to update question order
CREATE OR REPLACE FUNCTION update_question_order(
  question_id UUID,
  new_order INTEGER,
  category TEXT,
  current_order INTEGER
) RETURNS VOID AS $$
BEGIN
  -- If moving down (increasing order)
  IF new_order > current_order THEN
    -- Shift questions in between down
    UPDATE questions
    SET display_order = display_order - 1
    WHERE page_category = category
      AND display_order > current_order
      AND display_order <= new_order;
  -- If moving up (decreasing order)
  ELSIF new_order < current_order THEN
    -- Shift questions in between up
    UPDATE questions
    SET display_order = display_order + 1
    WHERE page_category = category
      AND display_order >= new_order
      AND display_order < current_order;
  END IF;
  
  -- Set the new order for the question
  UPDATE questions
  SET display_order = new_order
  WHERE id = question_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update dropdown option order
CREATE OR REPLACE FUNCTION update_dropdown_option_order(
  option_id UUID,
  new_order INTEGER,
  question_id UUID,
  current_order INTEGER
) RETURNS VOID AS $$
BEGIN
  -- If moving down (increasing order)
  IF new_order > current_order THEN
    -- Shift options in between down
    UPDATE dropdown_options
    SET display_order = display_order - 1
    WHERE question_id = update_dropdown_option_order.question_id
      AND display_order > current_order
      AND display_order <= new_order;
  -- If moving up (decreasing order)
  ELSIF new_order < current_order THEN
    -- Shift options in between up
    UPDATE dropdown_options
    SET display_order = display_order + 1
    WHERE question_id = update_dropdown_option_order.question_id
      AND display_order >= new_order
      AND display_order < current_order;
  END IF;
  
  -- Set the new order for the option
  UPDATE dropdown_options
  SET display_order = new_order
  WHERE id = option_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync risk_assessment_config with dropdown_options
CREATE OR REPLACE FUNCTION sync_dropdown_option_score()
RETURNS TRIGGER AS $$
BEGIN
  -- If score is updated in dropdown_options, update risk_assessment_config
  IF NEW.score IS NOT NULL THEN
    INSERT INTO risk_assessment_config (question_id, option_value, score)
    VALUES (NEW.question_id::text, NEW.option_value, NEW.score)
    ON CONFLICT (question_id, option_value) 
    DO UPDATE SET score = EXCLUDED.score;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS sync_dropdown_score_trigger ON dropdown_options;
CREATE TRIGGER sync_dropdown_score_trigger
AFTER INSERT OR UPDATE ON dropdown_options
FOR EACH ROW
EXECUTE FUNCTION sync_dropdown_option_score();

-- Trigger to sync dropdown_options with risk_assessment_config
CREATE OR REPLACE FUNCTION sync_risk_config_score()
RETURNS TRIGGER AS $$
DECLARE
  dropdown_id UUID;
BEGIN
  -- Find the corresponding dropdown option
  SELECT id INTO dropdown_id
  FROM dropdown_options
  WHERE question_id::text = NEW.question_id AND option_value = NEW.option_value
  LIMIT 1;
  
  -- If found, update the score
  IF dropdown_id IS NOT NULL THEN
    UPDATE dropdown_options
    SET score = NEW.score
    WHERE id = dropdown_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS sync_risk_config_trigger ON risk_assessment_config;
CREATE TRIGGER sync_risk_config_trigger
AFTER INSERT OR UPDATE ON risk_assessment_config
FOR EACH ROW
EXECUTE FUNCTION sync_risk_config_score();

-- Trigger to set display_order for new questions
CREATE OR REPLACE FUNCTION set_question_display_order()
RETURNS TRIGGER AS $$
DECLARE
  max_order INTEGER;
BEGIN
  -- If display_order is not set, set it to max + 1
  IF NEW.display_order IS NULL OR NEW.display_order = 0 THEN
    SELECT COALESCE(MAX(display_order), 0) INTO max_order
    FROM questions
    WHERE page_category = NEW.page_category;
    
    NEW.display_order := max_order + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS set_question_display_order_trigger ON questions;
CREATE TRIGGER set_question_display_order_trigger
BEFORE INSERT ON questions
FOR EACH ROW
EXECUTE FUNCTION set_question_display_order();

-- Trigger to set display_order for new dropdown options
CREATE OR REPLACE FUNCTION set_dropdown_option_display_order()
RETURNS TRIGGER AS $$
DECLARE
  max_order INTEGER;
BEGIN
  -- If display_order is not set, set it to max + 1
  IF NEW.display_order IS NULL OR NEW.display_order = 0 THEN
    SELECT COALESCE(MAX(display_order), 0) INTO max_order
    FROM dropdown_options
    WHERE question_id = NEW.question_id;
    
    NEW.display_order := max_order + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS set_dropdown_option_display_order_trigger ON dropdown_options;
CREATE TRIGGER set_dropdown_option_display_order_trigger
BEFORE INSERT ON dropdown_options
FOR EACH ROW
EXECUTE FUNCTION set_dropdown_option_display_order();
```

### Phase 3: Service Layer Improvements

#### 3.1 Enhanced QuestionService

The QuestionService needs to be updated to:
1. Support ordering of questions and dropdown options
2. Handle conditional logic
3. Sync with risk assessment scoring

Key methods to implement:
- `fetchQuestions()` - with proper ordering
- `createQuestion()` - with automatic display order
- `updateQuestion()` - with support for conditional logic
- `updateQuestionOrder()` - to change question order
- `fetchDropdownOptions()` - with proper ordering
- `createDropdownOption()` - with automatic display order and risk score sync
- `updateDropdownOption()` - with risk score sync
- `updateDropdownOptionOrder()` - to change option order

#### 3.2 Enhanced RiskAssessmentService

The RiskAssessmentService needs to be updated to:
1. Use only admin-defined scores from the database
2. Remove all hardcoded scoring logic
3. Properly handle all question types

Key methods to implement:
- `getConfigurations()` - to get all risk assessment configurations
- `calculateRiskScore()` - using only admin-defined scores
- `getAdvice()` - to get risk level advice from the database

### Phase 4: Admin Interface Enhancements

The admin interface needs to be updated to:
1. Allow reordering of questions and dropdown options
2. Support conditional logic configuration
3. Allow setting risk scores for all question types

Key components to enhance:
- `SpecialistQuestionForm` - to support all new features
- `SpecialistQuestionManager` - to support reordering
- `DropdownOptionEditor` - to support reordering and risk scores

### Phase 5: Frontend Questionnaire Enhancements

The frontend questionnaire needs to be updated to:
1. Display questions in the correct order
2. Handle conditional logic as defined by the admin
3. Calculate risk scores based on admin-defined values

## Implementation Steps

1. **Database Schema Updates**:
   - Execute SQL to enhance the questions table
   - Execute SQL to enhance the dropdown_options table
   - Create the risk_assessment_config table if it doesn't exist

2. **SQL Functions and Triggers**:
   - Create functions for updating question and option order
   - Create triggers for syncing risk scores
   - Create triggers for setting display order

3. **Service Layer Updates**:
   - Update QuestionService with enhanced methods
   - Update RiskAssessmentService to use only admin-defined scores

4. **Admin Interface Updates**:
   - Enhance SpecialistQuestionForm with conditional logic support
   - Add drag-and-drop reordering to questions and options
   - Add risk score configuration to all question types

5. **Frontend Questionnaire Updates**:
   - Update to use the enhanced services
   - Implement conditional display logic
   - Use admin-defined risk scores

## Expected Outcomes

After implementing these changes:

1. **Question Ordering**:
   - Admins will be able to change the order of questions
   - Questions will display in the specified order in the questionnaire

2. **Dropdown Options Order**:
   - Options will be displayed in the order specified by the admin
   - New options will be added at the end by default

3. **Conditional Logic**:
   - Admins will be able to configure which questions are conditional
   - Conditional questions will be displayed or hidden based on admin-defined rules

4. **Risk Assessment Scoring**:
   - All scores will be defined by the admin
   - No hardcoded scoring logic will remain
   - Risk levels and advice will be fully configurable

This comprehensive plan addresses all the issues with the current implementation and provides a flexible, admin-driven solution for the questionnaire system.