# Questionnaire Dynamic Scoring Implementation Guide

This document outlines the implementation steps to fix two key issues with the questionnaire system:

1. **Patient Name Not Being Saved**: The first and last name fields are not being properly saved in the database.
2. **Risk Factor Calculation**: The system is not calculating the risk score for all questions, particularly the test question with a score of 2 for the "test2" option.

## Implementation Steps

### 1. Update Database Schema

Create a SQL migration script (`add_metadata_and_update_functions.sql`) with the following changes:

```sql
-- Create a restore point before making changes
SELECT create_questionnaire_restore_point();

-- Add metadata column to patient_questionnaires table if it doesn't exist
ALTER TABLE public.patient_questionnaires 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update the insert_patient_questionnaire function to handle metadata
CREATE OR REPLACE FUNCTION public.insert_patient_questionnaire(
  first_name TEXT,
  last_name TEXT,
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
  metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
  doctor_user_id UUID;
BEGIN
  -- Find a doctor user for doctor_id, or use the current user as fallback
  SELECT id INTO doctor_user_id 
  FROM auth.users 
  WHERE raw_app_meta_data->>'requestRole' = 'doctor' 
  LIMIT 1;
  
  -- If no doctor found, use the current user
  IF doctor_user_id IS NULL THEN
    doctor_user_id := auth.uid();
  END IF;

  -- Insert and capture the returned ID
  INSERT INTO public.patient_questionnaires (
    user_id,
    patient_id,
    doctor_id,
    first_name,
    last_name,
    age,
    race,
    family_glaucoma,
    ocular_steroid,
    steroid_type,
    intravitreal,
    intravitreal_type,
    systemic_steroid,
    systemic_steroid_type,
    iop_baseline,
    vertical_asymmetry,
    vertical_ratio,
    total_score,
    risk_level,
    metadata
  ) VALUES (
    auth.uid(),
    auth.uid(), -- Use current user ID for patient_id
    doctor_user_id, -- Use found doctor or current user for doctor_id
    first_name,
    last_name,
    age,
    race,
    family_glaucoma,
    ocular_steroid,
    steroid_type,
    intravitreal,
    intravitreal_type,
    systemic_steroid,
    systemic_steroid_type,
    iop_baseline,
    vertical_asymmetry,
    vertical_ratio,
    total_score,
    risk_level,
    metadata
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_patient_questionnaire TO authenticated;

-- Create a function to calculate scores from dropdown options
CREATE OR REPLACE FUNCTION public.calculate_question_score(
  question_id UUID,
  selected_option TEXT
) RETURNS INTEGER AS $$
DECLARE
  score_value INTEGER;
BEGIN
  -- Get the score for the selected option
  SELECT score INTO score_value
  FROM public.dropdown_options
  WHERE question_id = calculate_question_score.question_id
    AND option_value = selected_option;
  
  -- Return 0 if no score found
  RETURN COALESCE(score_value, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.calculate_question_score TO authenticated;
```

### 2. Update PatientQuestionnaireService.ts

Modify the `PatientQuestionnaireService.ts` file to:

1. Fetch all questions and their options from the database
2. Calculate scores based on the selected options for each question
3. Include all questions in the risk calculation, not just hardcoded ones

```typescript
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PatientQuestionnaireData {
  firstName: string;
  lastName: string;
  age: string;
  race: string;
  familyGlaucoma: string;
  ocularSteroid: string;
  steroidType?: string;
  intravitreal: string;
  intravitralType?: string;
  systemicSteroid: string;
  systemicSteroidType?: string;
  iopBaseline: string;
  verticalAsymmetry: string;
  verticalRatio: string;
  [key: string]: string | undefined; // Allow dynamic questions
}

export async function submitPatientQuestionnaire(data: PatientQuestionnaireData) {
  try {
    console.log("Processing questionnaire data:", data);
    
    // Set age score to 0 for all age ranges
    const ageScore = 0;

    let raceScore = 0;
    if (data.race === "black" || data.race === "hispanic") {
      raceScore = 2;
    }

    // Calculate risk factors based on answers (each worth 2 points if "yes", 0 if "no" or "not_available")
    const riskFactorScores = [
      data.familyGlaucoma === "yes" ? 2 : 0,
      data.ocularSteroid === "yes" ? 2 : 0,
      data.intravitreal === "yes" ? 2 : 0,
      data.systemicSteroid === "yes" ? 2 : 0,
      data.iopBaseline === "22_and_above" ? 2 : 0,
      data.verticalAsymmetry === "0.2_and_above" ? 2 : 0,
      data.verticalRatio === "0.6_and_above" ? 2 : 0
    ];
    
    // Fetch all questions to get their IDs
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question');
    
    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      throw new Error(questionsError.message);
    }
    
    // Fetch all dropdown options to get scores
    const { data: options, error: optionsError } = await supabase
      .from('dropdown_options')
      .select('question_id, option_value, score');
    
    if (optionsError) {
      console.error("Error fetching dropdown options:", optionsError);
      throw new Error(optionsError.message);
    }
    
    // Create a map of question IDs to their selected values
    const questionAnswers: Record<string, string> = {};
    const dynamicScores: number[] = [];
    const metadata: Record<string, any> = {};
    
    // Process all answers including dynamic questions
    for (const [key, value] of Object.entries(data)) {
      // Skip undefined values
      if (value === undefined) continue;
      
      // Find if this key is a question ID
      const question = questions.find(q => q.id === key);
      if (question) {
        questionAnswers[key] = value;
        
        // Find the score for this answer
        const option = options.find(o => 
          o.question_id === key && o.option_value === value
        );
        
        if (option) {
          dynamicScores.push(option.score || 0);
          console.log(`Adding score ${option.score} for question ${question.question} with answer ${value}`);
        }
        
        // Add to metadata
        metadata[key] = value;
      }
    }
    
    // Calculate total score by adding risk factors score to demographic scores and dynamic scores
    const riskFactorsScore = riskFactorScores.reduce((total, score) => total + score, 0);
    const dynamicScore = dynamicScores.reduce((total, score) => total + score, 0);
    const totalScore = riskFactorsScore + ageScore + raceScore + dynamicScore;
    
    console.log("Score breakdown:", {
      riskFactorsScore,
      ageScore,
      raceScore,
      dynamicScore,
      totalScore
    });
    
    // Determine risk level based on the new requirements
    let riskLevel = "Low";
    if (totalScore >= 4) {
      riskLevel = "High";
    } else if (totalScore >= 2) {
      riskLevel = "Moderate";
    }

    // Get advice based on risk level
    const { data: adviceData } = await supabase
      .from('risk_assessment_advice')
      .select('advice')
      .eq('risk_level', riskLevel)
      .single();

    // Create contributing factors array
    const contributing_factors = [
      { question: "Race", answer: data.race, score: raceScore },
      { question: "Family History of Glaucoma", answer: data.familyGlaucoma, score: riskFactorScores[0] },
      { question: "Ocular Steroid Use", answer: data.ocularSteroid, score: riskFactorScores[1] },
      { question: "Intravitreal Steroid Use", answer: data.intravitreal, score: riskFactorScores[2] },
      { question: "Systemic Steroid Use", answer: data.systemicSteroid, score: riskFactorScores[3] },
      { question: "IOP Baseline", answer: data.iopBaseline, score: riskFactorScores[4] },
      { question: "Vertical Asymmetry", answer: data.verticalAsymmetry, score: riskFactorScores[5] },
      { question: "Vertical Ratio", answer: data.verticalRatio, score: riskFactorScores[6] }
    ].filter(factor => factor.score > 0);
    
    // Add dynamic questions to contributing factors
    questions.forEach(q => {
      const answer = questionAnswers[q.id];
      if (answer) {
        const option = options.find(o => 
          o.question_id === q.id && o.option_value === answer
        );
        
        if (option && option.score > 0) {
          contributing_factors.push({
            question: q.question,
            answer: answer,
            score: option.score
          });
        }
      }
    });

    console.log("Submitting questionnaire with RPC function");
    console.log("Risk level:", riskLevel, "Total score:", totalScore);
    
    // Use the new RPC function to insert a questionnaire with metadata
    const { data: newId, error } = await supabase
      .rpc('insert_patient_questionnaire', {
        first_name: data.firstName,
        last_name: data.lastName,
        age: data.age,
        race: data.race,
        family_glaucoma: data.familyGlaucoma === "yes",
        ocular_steroid: data.ocularSteroid === "yes",
        steroid_type: data.steroidType || null,
        intravitreal: data.intravitreal === "yes",
        intravitreal_type: data.intravitralType || null,
        systemic_steroid: data.systemicSteroid === "yes",
        systemic_steroid_type: data.systemicSteroidType || null,
        iop_baseline: data.iopBaseline === "22_and_above",
        vertical_asymmetry: data.verticalAsymmetry === "0.2_and_above",
        vertical_ratio: data.verticalRatio === "0.6_and_above",
        total_score: totalScore,
        risk_level: riskLevel,
        metadata: metadata
      });

    if (error) {
      console.error("Error submitting questionnaire:", error);
      throw new Error(error.message);
    }

    if (!newId) {
      throw new Error("Failed to create questionnaire. No ID returned.");
    }

    console.log("Questionnaire created successfully with ID:", newId);
    return { 
      success: true, 
      score: totalScore, 
      riskLevel,
      contributing_factors,
      advice: adviceData?.advice || ""
    };
  } catch (error) {
    console.error("Failed to submit questionnaire:", error);
    throw error;
  }
}
```

### 3. Update QuestionnaireContainer.tsx

Modify the `handleSubmit` function in `QuestionnaireContainer.tsx` to include all question answers:

```typescript
const handleSubmit = async () => {
  // Use currentPageQuestions from the database instead of QUESTIONNAIRE_PAGES
  const { isValid, errorMessage } = validateQuestionnairePage(currentPageQuestions, answers);
  
  if (!isValid) {
    setValidationError(errorMessage);
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    // Create a dynamic object with all answers
    const questionnaireData: Record<string, any> = {
      firstName: String(answers.firstName || ''),
      lastName: String(answers.lastName || ''),
      age: String(answers.age || ''),
      race: String(answers.race || ''),
      familyGlaucoma: String(answers.familyGlaucoma || ''),
      ocularSteroid: String(answers.ocularSteroid || ''),
      steroidType: answers.steroidType ? String(answers.steroidType) : '',
      intravitreal: String(answers.intravitreal || ''),
      intravitralType: answers.intravitralType ? String(answers.intravitralType) : '', 
      systemicSteroid: String(answers.systemicSteroid || ''),
      systemicSteroidType: answers.systemicSteroidType ? String(answers.systemicSteroidType) : '',
      iopBaseline: String(answers.iopBaseline || ''),
      verticalAsymmetry: String(answers.verticalAsymmetry || ''),
      verticalRatio: String(answers.verticalRatio || '')
    };
    
    // Add all other answers from the questions array
    questions.forEach(question => {
      if (answers[question.id] !== undefined) {
        questionnaireData[question.id] = String(answers[question.id]);
      }
    });
    
    console.log("Submitting questionnaire data:", questionnaireData);
    
    const result = await submitPatientQuestionnaire(questionnaireData);
    
    setResults({
      score: result.score,
      riskLevel: result.riskLevel,
      contributing_factors: result.contributing_factors || [],
      advice: result.advice || ""
    });
    
    toast.success("Questionnaire submitted successfully!");
    
    setIsCompleted(true);
  } catch (error) {
    console.error("Error submitting questionnaire:", error);
    toast.error("Failed to submit questionnaire. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};
```

### 4. Create a Batch Script to Apply Changes

Create a batch script (`fix-questionnaire-scoring.bat`) to apply the SQL changes:

```batch
@echo off
echo ===================================================
echo Fixing Questionnaire Scoring System
echo ===================================================
echo.

echo Creating a restore point first...
npx supabase sql "SELECT create_questionnaire_restore_point();"

echo.
echo Running SQL script to add metadata support and update functions...
npx supabase sql -f supabase/add_metadata_and_update_functions.sql

echo.
echo Done! The questionnaire system now supports dynamic scoring.
echo.
echo If you need to revert these changes, run:
echo npx supabase sql "SELECT restore_questionnaire_system();"
echo.
```

## Testing the Changes

After implementing these changes:

1. Create a new questionnaire and verify that:
   - Patient names are correctly saved
   - The test question with "test2" option contributes a score of 2 to the total
   - All questions are properly scored

2. Check the database to ensure:
   - The metadata column contains all question responses
   - The total_score includes scores from all questions

## Troubleshooting

If issues persist:

1. Check the browser console for errors
2. Verify that the SQL functions were created successfully
3. Ensure the PatientQuestionnaireService.ts file is correctly updated
4. Check that all question IDs are being properly passed to the service

## Rollback Plan

If needed, you can roll back the changes by running:

```
npx supabase sql "SELECT restore_questionnaire_system();"
```

This will restore the database to the state before these changes were applied.