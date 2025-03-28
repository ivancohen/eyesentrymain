# Questionnaire Form Update Guide

This guide provides detailed instructions for updating the QuestionnaireForm component to properly display admin-created questions without duplicates, while ensuring correct question types are used.

## Key Requirements

1. **Only display active questions** from the admin questionnaire dashboard
2. **Eliminate duplicate questions** by showing only the most recent/relevant version
3. **Respect question types** (text inputs should render as text inputs, not dropdowns)
4. **Include tooltips** that were added in the admin section

## Implementation Steps

### Step 1: Update Question Filtering Logic

First, modify the question fetching logic to only retrieve active questions:

```typescript
// In QuestionService.ts or similar file
export async function getQuestionsWithTooltips() {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('status', 'Active') // Only get active questions
    .order('created_at', { ascending: false }); // Get newest first
    
  if (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
  
  return data || [];
}
```

### Step 2: Implement Question Deduplication

Add deduplication logic to the QuestionnaireForm component:

```typescript
// In QuestionnaireForm.tsx

// First deduplicate questions by text to avoid showing duplicates
const uniqueQuestions = Object.values(
  questions.reduce((acc, q) => {
    const key = q.question.trim();
    
    // Special handling for firstName and lastName to ensure they're text inputs
    if (key.includes("First Name") || key.includes("Last Name")) {
      // Force these to be text type
      q.question_type = "text";
    }
    
    // If we already have this question, only keep the newer one or admin-created one
    if (acc[key]) {
      // Prefer admin-created questions (those with created_by field set)
      if (q.created_by && !acc[key].created_by) {
        acc[key] = q;
      } 
      // If both or neither are admin-created, prefer newer ones
      else if ((!q.created_by && !acc[key].created_by) || 
              (q.created_by && acc[key].created_by)) {
        // Compare dates and keep the newer one
        const existingDate = new Date(acc[key].created_at || 0);
        const newDate = new Date(q.created_at || 0);
        if (newDate > existingDate) {
          acc[key] = q;
        }
      }
    } else {
      // First time seeing this question, add it
      acc[key] = q;
    }
    return acc;
  }, {} as Record<string, typeof questions[0]>)
);

console.log(`Deduplicated questions from ${questions.length} to ${uniqueQuestions.length}`);

// Then filter by category
const filteredDBQuestions = filterQuestionsByCategory(
  uniqueQuestions.map(q => ({
    id: q.id,
    question: q.question,
    tooltip: q.tooltip,
    question_type: q.question_type || 'select',
    page_category: q.page_category
  })), 
  currentPageCategory
);
```

### Step 3: Fix Question Type Handling

Update the rendering logic to properly handle different question types:

```typescript
// In the render function of QuestionnaireForm.tsx

// Handle text inputs (firstName, lastName, and any question with question_type="text")
if (question.id === "firstName" || question.id === "lastName" || question.type === "text") {
  return (
    <div key={question.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
      <label htmlFor={question.id} className="text-base font-medium leading-6 mb-2 block">
        {question.text}
        {question.tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 inline-block ml-1 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px] p-4">
                <p className="text-sm">{question.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </label>
      <Input
        id={question.id}
        type="text"
        name={question.id}
        value={String(answers[question.id] || "")}
        onChange={handleInputChange}
        className="w-full input-animation"
      />
    </div>
  );
}
```

### Step 4: Ensure Tooltips Are Displayed

Make sure tooltips from the admin dashboard are properly displayed:

```typescript
// When converting database questions to form questions
const convertToFormQuestions = (dbQuestions, dropdownOptions, yesNoOptions) => {
  return dbQuestions.map(q => {
    // Create form question with tooltip from database
    return {
      id: q.id,
      text: q.question,
      tooltip: q.tooltip, // Include tooltip from database
      type: q.question_type || 'select',
      options: getOptionsForQuestion(q, dropdownOptions, yesNoOptions)
    };
  });
};
```

### Step 5: Add Logging for Debugging

Add logging to help debug any issues:

```typescript
// Log questions at various stages
console.log('All questions from database:', questions);
console.log('After deduplication:', uniqueQuestions);
console.log('Filtered by category:', filteredDBQuestions);
console.log('Converted to form questions:', dbFormattedQuestions);
```

## Example: Handling the IOP Baseline Question

For the specific example of the IOP Baseline question:

```typescript
// Special handling for known questions that need specific treatment
if (question.question.includes("IOP Baseline")) {
  // Ensure we're using the version with the tooltip
  const tooltipVersion = questions.find(q => 
    q.question.includes("IOP Baseline") && q.tooltip && q.tooltip.length > 0
  );
  
  if (tooltipVersion) {
    // Use this version instead
    question = tooltipVersion;
  }
}
```

## Testing Your Changes

After implementing these changes, test the form to ensure:

1. Only active questions from the admin dashboard appear
2. No duplicate questions are shown
3. Text fields render as text inputs
4. Tooltips appear correctly
5. The IOP Baseline question shows the correct version with tooltip

## Troubleshooting

If questions still don't appear correctly:

1. Check the `status` field in the database - only 'Active' questions should be displayed
2. Verify the `question_type` field is set correctly for each question
3. Ensure the deduplication logic is working by checking the console logs
4. Confirm that tooltips are being properly passed from the database to the form

## Next Steps

After updating the QuestionnaireForm component, you should also update:

1. The PatientQuestionnaireService to properly calculate risk scores
2. The QuestionnaireEdit component to correctly display saved answers
3. Any admin interfaces that manage questions to ensure they set the correct status and question_type