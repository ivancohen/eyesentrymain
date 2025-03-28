# Questionnaire Conditional Logic Fix

## Problem Identified

The conditional logic for medication items in the questionnaire system is broken. After analyzing the code and database, we've identified the root cause:

1. The current code in `QuestionnaireForm.tsx` expects database questions to have `conditional_parent_id` and `conditional_required_value` fields:

```javascript
if (isDBQuestion(question)) {
    parentId = question.conditional_parent_id;
    requiredValue = question.conditional_required_value;
}
```

2. However, the database questions do not have these fields populated. When we query the database, these fields are missing or null.

3. In the previous working version (from the restore point), conditional relationships were defined using a different structure:

```javascript
// QUESTION DEFINITION
{
  id: "steroidType",
  conditionalOptions: {
    parentValue: "ocularSteroid:yes",  // Format: "parentId:requiredValue"
  }
}

// CONDITIONAL LOGIC
const isConditionalQuestionDisabled = (question: DBQuestion) => {
  if (!question.conditionalOptions) return false;
  const [parentId, requiredValue] = question.conditionalOptions.parentValue.split(':');
  const parentAnswer = answers[parentId];
  const isDisabled = String(parentAnswer) !== requiredValue;
  return isDisabled;
};
```

## Solution

Since we can't immediately modify the database schema, we need to adapt our code to work with the existing data. The solution is to add a hardcoded mapping of child question IDs to their parent question IDs and required values.

### Conditional Relationships to Implement

Based on the database questions, here are the relationships we need to establish:

1. "Which ophthalmic topical steroid are you taking or have taken?" (ID: 27b24dae-f107-431a-8422-bf49df018e1f)
   - Parent: "Are you taking or have you ever taken any ophthalmic topical steroids?" (ID: 879cd028-1b29-4529-9cdb-7adcaf44d553)
   - Required value: "yes"

2. "Which intravitreal steroid are you taking or have taken?" (ID: 986f807c-bc31-4241-9ce3-6c6d3bbf09ad)
   - Parent: "Are you taking or have you ever taken any intravitreal steroids?" (ID: 631db108-0f4c-46ff-941e-c37f6856060c)
   - Required value: "yes"

3. "Which systemic steroid are you taking or have taken?" (ID: 468969a4-0f2b-4a03-8cc1-b9f80efff559)
   - Parent: "Are you taking or have you ever taken any systemic steroids?" (ID: a43ecfbc-413f-4925-8908-f9fc0d35ea0f)
   - Required value: "yes"

### Code Changes Required

Modify the `isConditionalQuestionDisabled` function in `QuestionnaireForm.tsx` to include these hardcoded relationships:

```javascript
const isConditionalQuestionDisabled = (question: DBQuestion | QuestionItem): boolean => {
  let parentId: string | undefined;
  let requiredValue: string | undefined;

  // Hardcoded conditional relationships for known DB questions
  const conditionalMappings: Record<string, { parentId: string, requiredValue: string }> = {
    // Which ophthalmic topical steroid
    "27b24dae-f107-431a-8422-bf49df018e1f": {
      parentId: "879cd028-1b29-4529-9cdb-7adcaf44d553",
      requiredValue: "yes"
    },
    // Which intravitreal steroid
    "986f807c-bc31-4241-9ce3-6c6d3bbf09ad": {
      parentId: "631db108-0f4c-46ff-941e-c37f6856060c",
      requiredValue: "yes"
    },
    // Which systemic steroid
    "468969a4-0f2b-4a03-8cc1-b9f80efff559": {
      parentId: "a43ecfbc-413f-4925-8908-f9fc0d35ea0f",
      requiredValue: "yes"
    }
  };

  // Check if this is a known conditional question
  if (isDBQuestion(question) && conditionalMappings[question.id]) {
    parentId = conditionalMappings[question.id].parentId;
    requiredValue = conditionalMappings[question.id].requiredValue;
  } else if (isDBQuestion(question)) {
    // Fall back to database fields if they exist
    parentId = question.conditional_parent_id;
    requiredValue = question.conditional_required_value;
  } else { // It's a QuestionItem
    if (question.conditionalOptions) {
      [parentId, requiredValue] = question.conditionalOptions.parentValue.split(':');
    }
  }

  if (!parentId || !requiredValue) {
    return false; // Not a conditional question or missing data
  }
  
  const parentAnswer = answers[parentId];
  const isDisabled = String(parentAnswer) !== requiredValue;
  
  // Debugging
  console.log(`Conditional Check for Q: ${question.id}`, {
    parentId,
    requiredValue,
    parentAnswer: parentAnswer,
    parentAnswerType: typeof parentAnswer,
    comparison: `${String(parentAnswer)} !== ${requiredValue}`,
    isDisabled
  });
  
  return isDisabled;
};
```

### Long-term Solution

For a more sustainable solution, the database schema should be updated to include the `conditional_parent_id` and `conditional_required_value` fields for all questions. This would eliminate the need for hardcoded mappings and make the system more maintainable.

## Implementation Steps

1. Switch to Code mode to implement the changes to `QuestionnaireForm.tsx`
2. Test the conditional logic by:
   - Going to the "Family & Medication History" page
   - Selecting "Yes" for one of the parent steroid questions
   - Verifying that the corresponding child question becomes enabled
3. Consider adding a database migration script to add and populate the missing fields for a long-term solution