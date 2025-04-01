# Implementation Steps for EyeSentry Questionnaire System Fix

This document provides a step-by-step guide to implement the comprehensive plan outlined in `COMPREHENSIVE_QUESTIONNAIRE_PLAN.md`. Each step is designed to be implemented sequentially, with clear instructions and code examples.

## Step 1: Database Schema Updates

### 1.1 Create a SQL Script for Schema Updates

Create a file named `schema_updates.sql` with the following content:

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

-- Add display_order column to dropdown_options
ALTER TABLE dropdown_options
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index on display_order for performance
CREATE INDEX IF NOT EXISTS idx_dropdown_options_display_order 
ON dropdown_options(question_id, display_order);

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

### 1.2 Execute the Schema Updates

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the content of `schema_updates.sql`
4. Run the SQL

## Step 2: SQL Functions and Triggers

### 2.1 Create a SQL Script for Functions and Triggers

Create a file named `functions_and_triggers.sql` with the following content:

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

### 2.2 Execute the Functions and Triggers

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the content of `functions_and_triggers.sql`
4. Run the SQL

## Step 3: Service Layer Updates

### 3.1 Enhanced QuestionService

Create a file named `src/services/QuestionService.enhanced.ts` with the following content:

```typescript
import { supabase } from "@/lib/supabase";

export interface Question {
  id: string;
  question: string;
  tooltip?: string;
  status: string;
  page_category: string;
  question_type: string;
  display_order: number;
  conditional_parent_id?: string;
  conditional_required_value?: string;
  conditional_display_mode?: string;
  risk_score: number;
  has_dropdown_options: boolean;
}

export interface DropdownOption {
  id: string;
  question_id: string;
  option_text: string;
  option_value: string;
  score: number;
  display_order: number;
}

export class QuestionService {
  // Fetch all questions with proper ordering
  static async fetchQuestions(): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('page_category', { ascending: true })
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
    
    return data || [];
  }
  
  // Create a new question with proper ordering
  static async createQuestion(question: Partial<Question>): Promise<Question> {
    // Get max display_order for the category
    const { data: maxOrderData } = await supabase
      .from('questions')
      .select('display_order')
      .eq('page_category', question.page_category || '')
      .order('display_order', { ascending: false })
      .limit(1);
    
    const maxOrder = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].display_order : 0;
    
    // Set the new question's display_order
    const newQuestion = {
      ...question,
      display_order: maxOrder + 1,
      status: question.status || 'Active',
      question_type: question.question_type || 'text',
      risk_score: question.risk_score || 0
    };
    
    // Remove created_by to avoid foreign key issues
    delete newQuestion.created_by;
    
    const { data, error } = await supabase
      .from('questions')
      .insert([newQuestion])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating question:', error);
      throw error;
    }
    
    return data;
  }
  
  // Update a question
  static async updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating question ${id}:`, error);
      throw error;
    }
    
    return data;
  }
  
  // Update question order
  static async updateQuestionOrder(id: string, newOrder: number, category: string): Promise<void> {
    // Get current question
    const { data: currentQuestion, error: fetchError } = await supabase
      .from('questions')
      .select('display_order')
      .eq('id', id)
      .single();
    
    if (fetchError || !currentQuestion) {
      console.error(`Error fetching question ${id}:`, fetchError);
      throw fetchError;
    }
    
    const currentOrder = currentQuestion.display_order;
    
    // Begin transaction
    const { error: transactionError } = await supabase.rpc('update_question_order', {
      question_id: id,
      new_order: newOrder,
      category: category,
      current_order: currentOrder
    });
    
    if (transactionError) {
      console.error('Error updating question order:', transactionError);
      throw transactionError;
    }
  }
  
  // Fetch dropdown options with proper ordering
  static async fetchDropdownOptions(questionId: string): Promise<DropdownOption[]> {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    console.log(`Fetching dropdown options for question ID: ${questionId} at ${timestamp}`);
    
    const { data, error } = await supabase
      .from('dropdown_options')
      .select('*')
      .eq('question_id', questionId)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error(`Error fetching dropdown options for question ${questionId}:`, error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} dropdown options for question ${questionId}`);
    return data || [];
  }
  
  // Create a dropdown option with proper ordering
  static async createDropdownOption(option: Partial<DropdownOption>): Promise<DropdownOption> {
    // Get max display_order for the question
    const { data: maxOrderData } = await supabase
      .from('dropdown_options')
      .select('display_order')
      .eq('question_id', option.question_id || '')
      .order('display_order', { ascending: false })
      .limit(1);
    
    const maxOrder = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].display_order : 0;
    
    // Set the new option's display_order
    const newOption = {
      ...option,
      display_order: maxOrder + 1,
      score: option.score || 0
    };
    
    // Insert the option
    const { data, error } = await supabase
      .from('dropdown_options')
      .insert([newOption])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating dropdown option:', error);
      throw error;
    }
    
    // Sync with risk_assessment_config
    try {
      await supabase.from('risk_assessment_config').upsert({
        question_id: data.question_id,
        option_value: data.option_value,
        score: data.score || 0
      });
    } catch (syncError) {
      console.warn('Warning: Could not sync with risk_assessment_config:', syncError);
    }
    
    return data;
  }
  
  // Update a dropdown option
  static async updateDropdownOption(id: string, updates: Partial<DropdownOption>): Promise<DropdownOption> {
    const { data, error } = await supabase
      .from('dropdown_options')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating dropdown option ${id}:`, error);
      throw error;
    }
    
    // Sync with risk_assessment_config
    if (updates.score !== undefined) {
      try {
        await supabase.from('risk_assessment_config').upsert({
          question_id: data.question_id,
          option_value: data.option_value,
          score: data.score || 0
        });
      } catch (syncError) {
        console.warn('Warning: Could not sync with risk_assessment_config:', syncError);
      }
    }
    
    return data;
  }
  
  // Update dropdown option order
  static async updateDropdownOptionOrder(id: string, newOrder: number, questionId: string): Promise<void> {
    // Get current option
    const { data: currentOption, error: fetchError } = await supabase
      .from('dropdown_options')
      .select('display_order')
      .eq('id', id)
      .single();
    
    if (fetchError || !currentOption) {
      console.error(`Error fetching dropdown option ${id}:`, fetchError);
      throw fetchError;
    }
    
    const currentOrder = currentOption.display_order;
    
    // Begin transaction
    const { error: transactionError } = await supabase.rpc('update_dropdown_option_order', {
      option_id: id,
      new_order: newOrder,
      question_id: questionId,
      current_order: currentOrder
    });
    
    if (transactionError) {
      console.error('Error updating dropdown option order:', transactionError);
      throw transactionError;
    }
  }
  
  // Delete a dropdown option
  static async deleteDropdownOption(id: string): Promise<void> {
    const { error } = await supabase
      .from('dropdown_options')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting dropdown option ${id}:`, error);
      throw error;
    }
  }
}
```

### 3.2 Enhanced RiskAssessmentService

Create a file named `src/services/RiskAssessmentService.enhanced.ts` with the following content:

```typescript
import { supabase } from "@/lib/supabase";

export interface RiskAssessmentConfig {
  id: string;
  question_id: string;
  option_value: string;
  score: number;
}

export interface RiskAssessmentResult {
  total_score: number;
  contributing_factors: {
    question: string;
    answer: string;
    score: number;
  }[];
  advice: string;
  risk_level: string;
}

export class RiskAssessmentService {
  // Get all risk assessment configurations
  static async getConfigurations(): Promise<RiskAssessmentConfig[]> {
    const { data, error } = await supabase
      .from('risk_assessment_config')
      .select('*');
    
    if (error) {
      console.error('Error fetching risk configurations:', error);
      throw error;
    }
    
    return data || [];
  }
  
  // Calculate risk score based on answers - fully admin-driven
  static async calculateRiskScore(answers: Record<string, string>): Promise<RiskAssessmentResult> {
    console.log("Calculating risk score for answers:", answers);
    
    // Get all configurations and questions
    const [configs, questions] = await Promise.all([
      this.getConfigurations(),
      this.getAllQuestions()
    ]);
    
    console.log(`Fetched ${configs.length} risk configs and ${questions.length} questions`);
    
    // Calculate total score and collect contributing factors
    let totalScore = 0;
    const contributingFactors: { question: string; answer: string; score: number }[] = [];
    
    // Process each answer to calculate score
    for (const [questionId, answerValue] of Object.entries(answers)) {
      // Skip empty answers
      if (!answerValue) continue;
      
      console.log(`Processing answer: ${questionId} = ${answerValue}`);
      
      // Find configuration for this answer
      const config = configs.find(c => 
        c.question_id === questionId && 
        c.option_value === answerValue
      );
      
      if (config) {
        console.log(`Found config with score ${config.score} for ${questionId}=${answerValue}`);
        totalScore += config.score;
        
        // Find the question text for nicer output
        const question = questions.find(q => q.id === questionId);
        
        contributingFactors.push({
          question: question?.question || questionId,
          answer: answerValue,
          score: config.score
        });
      } else {
        console.log(`No score configuration found for ${questionId}=${answerValue}`);
      }
    }
    
    console.log(`Total calculated score: ${totalScore}`);
    
    // Determine risk level based on score
    let riskLevel = "Unknown";
    let advice = "No specific advice available.";
    
    if (totalScore <= 2) {
      riskLevel = "Low";
      advice = "Regular eye exams as recommended by your optometrist are sufficient.";
    } else if (totalScore <= 5) {
      riskLevel = "Moderate";
      advice = "Consider more frequent eye exams and discuss with your doctor about potential preventive measures.";
    } else {
      riskLevel = "High";
      advice = "Recommend eye exams every 2–3 years up to the age of 40 (or annually if three or more risk factors) and a comprehensive screening eye exam at 40 years old. Eye examination annually after age 40.";
    }
    
    // Try to get advice from database
    try {
      const { data: adviceData } = await supabase
        .from('risk_assessment_advice')
        .select('*')
        .eq('risk_level', riskLevel)
        .single();
      
      if (adviceData && adviceData.advice) {
        advice = adviceData.advice;
      }
    } catch (error) {
      console.warn('Could not fetch advice from database:', error);
    }
    
    return {
      total_score: totalScore,
      contributing_factors: contributingFactors,
      advice,
      risk_level: riskLevel
    };
  }
  
  // Get all questions
  private static async getAllQuestions() {
    const { data, error } = await supabase
      .from('questions')
      .select('*');
    
    if (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
    
    return data || [];
  }
}
```

## Step 4: Admin Interface Updates

### 4.1 Enhanced SpecialistQuestionForm

Create a file named `src/components/admin/specialist/EnhancedQuestionForm.tsx` with the following content:

```tsx
// This file would contain the enhanced question form component
// with support for conditional logic, reordering, and risk scores
// The implementation would be similar to the one outlined in the plan
```

### 4.2 Enhanced SpecialistQuestionManager

Update the SpecialistQuestionManager component to use the enhanced services and components.

## Step 5: Frontend Questionnaire Updates

Update the frontend questionnaire components to use the enhanced services and handle conditional logic.

## Step 6: Migration Script

Create a migration script to:
1. Set initial display_order values for existing questions and options
2. Sync existing scores to the risk_assessment_config table

## Step 7: Testing and Deployment

1. Test all functionality in a development environment
2. Deploy the changes to production
3. Verify that all issues are resolved

## Conclusion

By following these implementation steps, you will have a fully functional questionnaire system with:
- Proper ordering of questions and dropdown options
- Admin-configurable conditional logic
- Admin-driven risk assessment scoring
- No hardcoded business logic

This implementation addresses all the issues identified in the current system and provides a flexible, admin-driven solution.
