# Risk Assessment Scoring Implementation

## Overview

This document explains how the risk assessment scoring system will work with admin-defined values while preserving the existing specialist functionality. The goal is to ensure that all questions created in the admin section can contribute to the risk score calculation.

## Current Implementation

Currently, the risk assessment scoring has some hardcoded logic in the `RiskAssessmentService.ts` file:

```typescript
// Example from current implementation (simplified)
if (questionId === 'race' && (answerValue === 'black' || answerValue === 'hispanic')) {
  const score = answerValue === 'black' ? 2 : 1;
  console.log(`Using hardcoded score ${score} for race=${answerValue}`);
  totalScore += score;
  contributingFactors.push({
    question: 'Race',
    answer: answerValue,
    score: score
  });
} else if (questionId === 'familyGlaucoma' && answerValue === 'yes') {
  console.log('Using hardcoded score 2 for familyGlaucoma=yes');
  totalScore += 2;
  contributingFactors.push({
    question: 'Family History of Glaucoma',
    answer: 'Yes',
    score: 2
  });
}
// More hardcoded conditions...
```

This approach has several limitations:
1. Scores are hardcoded and not configurable by admins
2. Only specific questions contribute to the risk score
3. New questions created by admins don't automatically contribute to the risk score

## Proposed Implementation

### 1. Database Schema

We'll use the `risk_assessment_config` table to store all scoring configurations:

```sql
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

This table will store:
- `question_id`: The ID of the question
- `option_value`: The value of the answer that triggers this score
- `score`: The score to add to the total risk score

### 2. Admin Interface

In the SpecialistQuestionForm, we'll add a field for setting the risk score for each dropdown option:

```tsx
// For dropdown/select questions
{formData.question_type === 'dropdown' || formData.question_type === 'select' ? (
  <Box mt={4}>
    <Text fontWeight="bold">Dropdown Options</Text>
    {dropdownOptions.map((option, index) => (
      <HStack key={index} mt={2} spacing={4}>
        <FormControl>
          <FormLabel>Option Text</FormLabel>
          <Input
            value={option.option_text}
            onChange={(e) => updateOption(index, 'option_text', e.target.value)}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Option Value</FormLabel>
          <Input
            value={option.option_value}
            onChange={(e) => updateOption(index, 'option_value', e.target.value)}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Risk Score</FormLabel>
          <NumberInput
            min={0}
            value={option.score || 0}
            onChange={(value) => updateOption(index, 'score', parseInt(value))}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
        <IconButton
          aria-label="Remove option"
          icon={<DeleteIcon />}
          onClick={() => removeOption(index)}
        />
      </HStack>
    ))}
    <Button leftIcon={<AddIcon />} mt={2} onClick={addOption}>
      Add Option
    </Button>
  </Box>
) : (
  // For non-dropdown questions
  <FormControl mt={4}>
    <FormLabel>Risk Score (for 'yes' or positive answers)</FormLabel>
    <NumberInput
      min={0}
      value={formData.risk_score || 0}
      onChange={(value) => setFormData({...formData, risk_score: parseInt(value)})}
    >
      <NumberInputField />
      <NumberInputStepper>
        <NumberIncrementStepper />
        <NumberDecrementStepper />
      </NumberInputStepper>
    </NumberInput>
  </FormControl>
)}
```

### 3. Service Layer

We'll update the `RiskAssessmentService` to use only admin-defined scores from the database:

```typescript
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
```

### 4. Synchronization

To ensure that risk scores are properly synchronized between the dropdown options and the risk assessment configuration, we'll use database triggers:

```sql
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
```

## Example Using Current Data

Let's use the race question as an example:

### Current Data (Hardcoded)

Currently, we have hardcoded logic:
```typescript
if (questionId === 'race' && (answerValue === 'black' || answerValue === 'hispanic')) {
  const score = answerValue === 'black' ? 2 : 1;
  // ...
}
```

### New Data Model

In the new model, we would have entries in the `risk_assessment_config` table:

```
[
  {
    "question_id": "race",
    "option_value": "black",
    "score": 2
  },
  {
    "question_id": "race",
    "option_value": "hispanic",
    "score": 1
  },
  {
    "question_id": "race",
    "option_value": "asian",
    "score": 1
  },
  {
    "question_id": "race",
    "option_value": "white",
    "score": 0
  }
]
```

### Admin Configuration

In the admin interface, the specialist would:

1. Create the race question with dropdown options for different races
2. Set the risk score for each option:
   - Black: 2
   - Hispanic: 1
   - Asian: 1
   - White: 0

### Risk Assessment Calculation

When calculating the risk score:
1. The system fetches all risk configurations from the database
2. For each answer in the questionnaire, it looks up the corresponding score
3. It adds up all the scores to get the total risk score
4. It determines the risk level based on the total score

## Preserving Specialist Functionality

The specialist functionality in the admin section will be preserved and enhanced:

1. **Existing Functionality**:
   - Creating and editing questions
   - Setting question types
   - Managing dropdown options

2. **New Functionality**:
   - Setting risk scores for dropdown options
   - Viewing and editing risk scores for existing options

The risk assessment scoring will now be fully admin-driven, with no hardcoded scores in the code.

## Migration Strategy

To migrate from the current hardcoded scoring to the admin-driven approach:

1. **Create Initial Configurations**:
   ```sql
   -- Insert configurations for race
   INSERT INTO risk_assessment_config (question_id, option_value, score)
   VALUES 
   ('race', 'black', 2),
   ('race', 'hispanic', 1),
   ('race', 'asian', 1)
   ON CONFLICT (question_id, option_value) DO UPDATE
   SET score = EXCLUDED.score;

   -- Insert configurations for family history
   INSERT INTO risk_assessment_config (question_id, option_value, score)
   VALUES ('familyGlaucoma', 'yes', 2)
   ON CONFLICT (question_id, option_value) DO UPDATE
   SET score = EXCLUDED.score;

   -- Insert configurations for other risk factors
   -- ... more inserts for other hardcoded scores
   ```

2. **Sync with Dropdown Options**:
   ```sql
   -- Update dropdown options with scores from risk_assessment_config
   UPDATE dropdown_options
   SET score = rc.score
   FROM risk_assessment_config rc
   WHERE dropdown_options.question_id::text = rc.question_id 
     AND dropdown_options.option_value = rc.option_value;
   ```

3. **Remove Hardcoded Logic**:
   - Replace the hardcoded scoring logic in `RiskAssessmentService.ts` with the database-driven approach

This migration strategy ensures a smooth transition from hardcoded scores to admin-defined scores without losing any existing functionality.