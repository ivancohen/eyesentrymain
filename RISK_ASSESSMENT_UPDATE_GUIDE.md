# Risk Assessment Update Guide

This guide provides detailed instructions for updating the risk assessment calculation in the PatientQuestionnaireService to ensure scores are properly attributed to answers from admin-created questions.

## Key Requirements

1. **Properly calculate risk scores** for all question types
2. **Include admin-created questions** in risk assessment
3. **Display descriptive answers** in the risk assessment results
4. **Handle different answer types** (string, boolean, numeric)
5. **Avoid duplicate scoring** from duplicate questions

## Implementation Steps

### Step 1: Update Question Fetching Logic

First, modify the question fetching logic in the risk assessment calculation:

```typescript
// In PatientQuestionnaireService.ts - calculateRiskScore function

// Load all questions from database - only get active questions
const { data: allQuestions, error: questionsError } = await supabase
  .from('questions')
  .select('*')
  .eq('status', 'Active') // Only get active questions
  .order('created_at', { ascending: false }); // Get newest first
  
if (questionsError) {
  console.warn("Error fetching questions for risk assessment:", questionsError);
}

// Deduplicate questions by text to avoid duplicate scoring
const uniqueQuestionMap: Record<string, DatabaseQuestion> = {};
const questionsFromDb = (allQuestions || []).filter(q => {
  const key = q.question.trim();
  if (uniqueQuestionMap[key]) {
    return false; // Skip duplicates
  }
  uniqueQuestionMap[key] = q;
  return true;
});

console.log(`Found ${questionsFromDb.length} unique questions in database for risk assessment`);
```

### Step 2: Improve Risk Factor Display

Update the risk factor creation to show more descriptive answers:

```typescript
// Create base risk factors with more descriptive answers
const baseFactors = [
  { 
    question: "Race", 
    answer: data.race === "black" ? "Black" : 
            data.race === "hispanic" ? "Hispanic" : 
            data.race === "asian" ? "Asian" : 
            data.race === "white" ? "White" : data.race, 
    score: raceScore 
  },
  { 
    question: "Family History of Glaucoma", 
    answer: data.familyGlaucoma === "yes" ? "Yes" : "No", 
    score: riskFactorScores[0] 
  },
  { 
    question: "Ocular Steroid Use", 
    answer: data.ocularSteroid === "yes" ? "Yes" : "No", 
    score: riskFactorScores[1] 
  },
  { 
    question: "Intravitreal Steroid Use", 
    answer: data.intravitreal === "yes" ? "Yes" : "No", 
    score: riskFactorScores[2] 
  },
  { 
    question: "Systemic Steroid Use", 
    answer: data.systemicSteroid === "yes" ? "Yes" : "No", 
    score: riskFactorScores[3] 
  },
  { 
    question: "IOP Baseline", 
    answer: data.iopBaseline === "22_and_above" ? "22 mmHg and above" : "21 mmHg and under", 
    score: riskFactorScores[4] 
  },
  { 
    question: "Vertical Asymmetry", 
    answer: data.verticalAsymmetry === "0.2_and_above" ? "0.2 and above" : "Under 0.2", 
    score: riskFactorScores[5] 
  },
  { 
    question: "Vertical Ratio", 
    answer: data.verticalRatio === "0.6_and_above" ? "0.6 and above" : "Below 0.6", 
    score: riskFactorScores[6] 
  }
].filter(factor => factor.score > 0); // Only include factors that contributed
```

### Step 3: Enhance Dynamic Question Processing

Improve the handling of dynamic questions to properly process different answer types:

```typescript
// Process dynamic questions with better type handling
Object.entries(data).forEach(([key, value]) => {
  // Skip the standard question IDs we already processed
  if (!standardQuestionIds.includes(key)) {
    // This is likely a dynamic question - find it in the database
    const questionDetails = questionsFromDb.find((q: DatabaseQuestion) => q.id === key);
    
    if (questionDetails) {
      // Determine question score
      const riskScore = questionDetails.risk_score ? parseInt(String(questionDetails.risk_score)) : 1;
      
      console.log(`Processing dynamic question ${key} (${questionDetails.question})`, {
        questionValue: value,
        riskScore: riskScore,
        valueType: typeof value
      });
      
      // Handle different answer types
      if (typeof value === 'string') {
        // For dropdown/select questions
        if (value === "yes" || value === "true" || value === "1") {
          // Add to total score
          totalScore += riskScore;
          
          // Add to contributing factors with formatted answer
          additionalFactors.push({
            question: questionDetails.question || "Additional Risk Factor",
            answer: "Yes",
            score: riskScore
          });
        } else if (value !== "no" && value !== "false" && value !== "0" && value !== "") {
          // For non-boolean string values that aren't empty, also add to score
          // This handles cases where the answer is a selection with a score
          totalScore += riskScore;
          
          // Add to contributing factors with the actual answer text
          additionalFactors.push({
            question: questionDetails.question || "Additional Risk Factor",
            answer: value,
            score: riskScore
          });
        }
      } else if (typeof value === 'boolean' && value === true) {
        // For boolean true values
        totalScore += riskScore;
        
        // Add to contributing factors
        additionalFactors.push({
          question: questionDetails.question || "Additional Risk Factor",
          answer: "Yes",
          score: riskScore
        });
      } else if (typeof value === 'number' && value > 0) {
        // For numeric values > 0
        totalScore += riskScore;
        
        // Add to contributing factors
        additionalFactors.push({
          question: questionDetails.question || "Additional Risk Factor",
          answer: value.toString(),
          score: riskScore
        });
      }
    }
  }
});
```

### Step 4: Add Logging for Debugging

Add comprehensive logging to help debug risk assessment issues:

```typescript
// Log all answers being processed
console.log("All answers being processed:", data);

// Log the final risk assessment
console.log("Risk assessment result:", {
  totalScore,
  riskLevel,
  contributingFactors: [...baseFactors, ...additionalFactors]
});
```

### Step 5: Update Risk Level Determination

Ensure the risk level is determined correctly based on the total score:

```typescript
// Determine risk level based on total score
let riskLevel = "Low";
if (totalScore >= 6) {
  riskLevel = "High";
} else if (totalScore >= 3) {
  riskLevel = "Medium";
}

console.log(`Final risk score: ${totalScore}, Risk level: ${riskLevel}`);
```

## Example: Handling the IOP Baseline Question

For the specific example of the IOP Baseline question:

```typescript
// Special handling for IOP Baseline question
const iopQuestion = questionsFromDb.find(q => q.question.includes("IOP Baseline"));
if (iopQuestion && data.iopBaseline === "22_and_above") {
  // Make sure this is included in the risk factors
  const iopScore = iopQuestion.risk_score ? parseInt(String(iopQuestion.risk_score)) : 2;
  
  // Check if it's already included in baseFactors
  const alreadyIncluded = baseFactors.some(f => f.question.includes("IOP Baseline"));
  
  if (!alreadyIncluded) {
    baseFactors.push({
      question: iopQuestion.question,
      answer: "22 mmHg and above",
      score: iopScore
    });
    
    // Add to total score if not already counted
    totalScore += iopScore;
  }
}
```

## Testing Your Changes

After implementing these changes, test the risk assessment to ensure:

1. All questions contribute to the risk score correctly
2. Admin-created questions are included in the risk assessment
3. Answers display descriptively in the results
4. Different answer types (yes/no, selections, numeric) are handled properly
5. No duplicate scoring occurs from duplicate questions

## Troubleshooting

If risk scores still don't calculate correctly:

1. Check the `risk_score` field in the database for each question
2. Verify that questions are being deduplicated properly
3. Ensure all answer types are being handled correctly
4. Check the console logs for any errors or unexpected values

## Next Steps

After updating the risk assessment calculation, you should also:

1. Update the QuestionnaireResults component to display the risk factors clearly
2. Ensure the risk assessment advice is appropriate for the calculated risk level
3. Add unit tests to verify the risk calculation logic