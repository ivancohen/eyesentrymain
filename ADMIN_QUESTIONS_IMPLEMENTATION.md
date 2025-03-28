# Admin Questions Implementation Guide

This guide focuses specifically on ensuring that **only questions from the admin section** are displayed in the patient questionnaire, while preserving important functionality like conditional responses.

## Core Requirements

1. **Only display admin-created questions** from the admin dashboard
2. **Preserve conditional logic** for medication questions
3. **Maintain question types** (text inputs, dropdowns, etc.)
4. **Keep tooltips** from admin-created questions

## Understanding the Current System

The current system has two sources of questions:

1. **Hardcoded questions** in `questionnaireConstants.ts`
2. **Database questions** created through the admin interface

The issue is that both sets are being displayed or mixed incorrectly, causing duplicates and inconsistencies.

## Implementation Approach

### Step 1: Identify Admin Questions

First, we need to ensure we can identify which questions come from the admin section:

```typescript
// In QuestionService.ts
export async function getAdminQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('status', 'Active') // Only get active questions
    .order('created_at', { ascending: false }); // Get newest first
    
  if (error) {
    console.error("Error fetching admin questions:", error);
    throw error;
  }
  
  return data || [];
}
```

### Step 2: Update QuestionnaireForm to Prioritize Admin Questions

Modify the QuestionnaireForm component to prioritize admin questions over hardcoded ones:

```typescript
// In QuestionnaireForm.tsx

// Get questions from both sources
const [adminQuestions, setAdminQuestions] = useState<AdminQuestion[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  async function fetchAdminQuestions() {
    try {
      setIsLoading(true);
      const questions = await getAdminQuestions();
      setAdminQuestions(questions);
    } catch (error) {
      console.error("Error fetching admin questions:", error);
    } finally {
      setIsLoading(false);
    }
  }
  
  fetchAdminQuestions();
}, []);

// Convert admin questions to form format
const adminFormattedQuestions = convertToFormQuestions(
  adminQuestions.filter(q => q.page_category === currentPageCategory),
  questionDropdownOptions,
  yesNoOptions
);

// Only use hardcoded questions if no admin questions found for this page
const useHardcodedQuestions = adminFormattedQuestions.length === 0;

// Use admin questions or fall back to hardcoded ones
let questionsWithTooltips = useHardcodedQuestions 
  ? QUESTIONNAIRE_PAGES[currentPage] 
  : adminFormattedQuestions;
```

### Step 3: Preserve Conditional Logic

Ensure conditional logic for medication questions is preserved:

```typescript
// In QuestionnaireForm.tsx

// Function to process conditional questions
const processConditionalQuestions = (questions) => {
  return questions.map(question => {
    // If this is a hardcoded question with conditional logic
    if (question.conditionalOptions) {
      // Find the equivalent admin question
      const adminQuestion = adminQuestions.find(q => 
        q.question.includes(question.text) || 
        question.text.includes(q.question)
      );
      
      if (adminQuestion) {
        // Use the admin question but preserve the conditional logic
        return {
          ...adminQuestion,
          conditionalOptions: question.conditionalOptions
        };
      }
    }
    
    return question;
  });
};

// Apply conditional processing
questionsWithTooltips = processConditionalQuestions(questionsWithTooltips);
```

### Step 4: Handle Special Cases for Medication Questions

Add special handling for medication questions with conditional responses:

```typescript
// In QuestionnaireForm.tsx

// Special handling for medication questions
const handleMedicationQuestions = (questions) => {
  const medicationQuestions = questions.filter(q => 
    q.text.includes("steroid") || 
    q.text.includes("Steroid") ||
    q.text.includes("medication")
  );
  
  // Ensure medication questions have proper conditional logic
  medicationQuestions.forEach(question => {
    // Find the corresponding hardcoded question with conditional logic
    const hardcodedQuestion = QUESTIONNAIRE_PAGES.flatMap(page => page)
      .find(q => q.text.includes(question.text) || question.text.includes(q.text));
      
    if (hardcodedQuestion && hardcodedQuestion.conditionalOptions) {
      question.conditionalOptions = hardcodedQuestion.conditionalOptions;
    }
  });
  
  return questions;
};

// Apply medication question handling
questionsWithTooltips = handleMedicationQuestions(questionsWithTooltips);
```

### Step 5: Ensure Proper Question Types

Make sure question types are respected:

```typescript
// In convertToFormQuestions function

const convertToFormQuestions = (dbQuestions, dropdownOptions, yesNoOptions) => {
  return dbQuestions.map(q => {
    // Determine the correct question type
    let questionType = q.question_type || 'select';
    
    // Force text type for name fields
    if (q.question.includes("First Name") || q.question.includes("Last Name")) {
      questionType = 'text';
    }
    
    // Create form question
    return {
      id: q.id,
      text: q.question,
      tooltip: q.tooltip,
      type: questionType,
      options: getOptionsForQuestion(q, dropdownOptions, yesNoOptions)
    };
  });
};
```

## Migrating Hardcoded Questions to Admin

To ensure all hardcoded questions are available in the admin section:

### Step 1: Create a Migration Script

```typescript
// In migrateHardcodedQuestions.ts

import { supabase } from "@/lib/supabase";
import { QUESTIONNAIRE_PAGES } from "@/constants/questionnaireConstants";

async function migrateHardcodedQuestions() {
  // Flatten all hardcoded questions
  const hardcodedQuestions = QUESTIONNAIRE_PAGES.flatMap((page, pageIndex) => {
    return page.map(q => ({
      ...q,
      page_category: pageIndex === 0 ? 'patient_info' :
                    pageIndex === 1 ? 'medical_history' :
                    pageIndex === 2 ? 'clinical_measurements' : ''
    }));
  });
  
  console.log(`Found ${hardcodedQuestions.length} hardcoded questions to migrate`);
  
  // Check which questions already exist in the database
  const { data: existingQuestions, error: fetchError } = await supabase
    .from('questions')
    .select('question');
    
  if (fetchError) {
    console.error("Error fetching existing questions:", fetchError);
    return;
  }
  
  const existingQuestionTexts = new Set(existingQuestions.map(q => q.question));
  
  // Filter out questions that already exist
  const questionsToMigrate = hardcodedQuestions.filter(q => 
    !existingQuestionTexts.has(q.text)
  );
  
  console.log(`Migrating ${questionsToMigrate.length} new questions to the database`);
  
  // Insert new questions
  for (const question of questionsToMigrate) {
    const { error: insertError } = await supabase
      .from('questions')
      .insert({
        question: question.text,
        tooltip: question.tooltip || null,
        question_type: question.type || 'select',
        page_category: question.page_category,
        status: 'Active',
        is_active: true,
        risk_score: 1, // Default risk score
        has_dropdown_options: !!question.options && question.options.length > 0,
        has_conditional_items: !!question.conditionalOptions
      });
      
    if (insertError) {
      console.error(`Error inserting question "${question.text}":`, insertError);
    } else {
      console.log(`Successfully migrated question: ${question.text}`);
    }
  }
  
  console.log("Migration completed");
}

// Run the migration
migrateHardcodedQuestions();
```

### Step 2: Run the Migration Script

```bash
# Run the migration script
npx ts-node src/scripts/migrateHardcodedQuestions.ts
```

## Preserving Conditional Logic

The key to preserving conditional logic is to:

1. Keep the conditional logic definitions in the hardcoded questions
2. Apply that logic to the admin questions when rendering
3. Ensure the question IDs and parent-child relationships are maintained

```typescript
// In QuestionnaireForm.tsx

// Function to apply conditional logic from hardcoded questions to admin questions
const applyConditionalLogic = (adminQuestions, hardcodedQuestions) => {
  const result = [...adminQuestions];
  
  // Create a map of question text to hardcoded question
  const hardcodedMap = hardcodedQuestions.reduce((map, q) => {
    map[q.text] = q;
    return map;
  }, {});
  
  // Apply conditional logic
  for (let i = 0; i < result.length; i++) {
    const adminQ = result[i];
    const hardcodedQ = Object.values(hardcodedMap).find(q => 
      q.text.includes(adminQ.text) || adminQ.text.includes(q.text)
    );
    
    if (hardcodedQ && hardcodedQ.conditionalOptions) {
      // Find the parent question in admin questions
      const parentId = hardcodedQ.conditionalOptions.parentValue.split(':')[0];
      const parentHardcoded = hardcodedQuestions.find(q => q.id === parentId);
      
      if (parentHardcoded) {
        // Find matching admin question for parent
        const parentAdmin = result.find(q => 
          q.text.includes(parentHardcoded.text) || 
          parentHardcoded.text.includes(q.text)
        );
        
        if (parentAdmin) {
          // Apply conditional logic with updated parent ID
          adminQ.conditionalOptions = {
            ...hardcodedQ.conditionalOptions,
            parentValue: `${parentAdmin.id}:${hardcodedQ.conditionalOptions.parentValue.split(':')[1]}`
          };
        }
      }
    }
  }
  
  return result;
};
```

## Testing Your Implementation

After implementing these changes, test the form to ensure:

1. Only admin questions are displayed
2. Conditional logic for medication questions works correctly
3. Question types are respected (text inputs, dropdowns)
4. All tooltips from admin questions are displayed

## Troubleshooting

If you encounter issues:

1. **Missing Questions**
   - Run the migration script to ensure all hardcoded questions are in the admin section
   - Check that questions have the correct `status` and `page_category`

2. **Broken Conditional Logic**
   - Verify the parent-child relationships are correctly mapped
   - Check that question IDs are consistent

3. **Incorrect Question Types**
   - Ensure the `question_type` field is set correctly in the database
   - Verify the type mapping in the `convertToFormQuestions` function

## Next Steps

After implementing these changes:

1. Verify all admin questions appear correctly in the questionnaire
2. Test conditional logic for medication questions
3. Ensure risk scores are calculated correctly
4. Update the admin interface to make it easier to manage questions