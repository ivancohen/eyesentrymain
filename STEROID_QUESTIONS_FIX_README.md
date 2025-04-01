# Steroid Questions Fix

This package contains scripts to fix the issue with the steroid questions in the questionnaire where users can't revert from "yes" to "no".

## Problem Description

The questionnaire has three steroid-related parent questions:
1. Are you taking ophthalmic topical steroids?
2. Are you taking intravitreal steroids?
3. Are you taking systemic steroids?

Each of these questions has a corresponding child question that becomes available when the parent question is answered with "yes":
1. Which ophthalmic topical steroid are you taking?
2. Which intravitreal steroid are you taking?
3. Which systemic steroid are you taking?

The issue is that when a user selects "yes" for a parent question and then tries to change their answer to "no" or "not available", the child question remains visible and enabled, which is confusing and prevents the user from properly changing their answer.

## Root Causes

After analyzing the code, the following issues were identified:

1. **Incomplete Conditional Logic**: When a parent question's answer is changed from "yes" to something else, the child question's answer is not cleared, causing it to remain visible.

2. **Case Sensitivity**: The comparison between the parent answer and the required value ("yes") is case-sensitive, which can cause inconsistent behavior.

## Fix Implementation

The fix addresses these issues by:

1. **Clearing Child Answers**: When a parent question's answer is changed from "yes" to something else, the child question's answer is now cleared, causing it to be hidden.

2. **Case-Insensitive Comparison**: The comparison between the parent answer and the required value is now case-insensitive, ensuring consistent behavior regardless of capitalization.

## Files Modified

1. **src/components/questionnaires/QuestionnaireContainer.tsx**:
   - Modified the `handleAnswerChange` function to clear child question answers when parent questions are not answered with "yes"
   - Added a mapping of parent question IDs to child question IDs for steroid questions

2. **src/components/questionnaires/QuestionnaireForm.tsx**:
   - Modified the `isConditionalQuestionDisabled` function to use case-insensitive comparison

## How to Use

### For Windows Users:
```
fix-steroid-questions.bat
```

### For Unix/Linux/Mac Users:
```
chmod +x fix-steroid-questions.sh
./fix-steroid-questions.sh
```

### Manual Implementation:
```
node fix-steroid-questions.js
```

After implementation:
1. Restart your development server
2. Test the steroid questions to verify the fix

## Troubleshooting

If you encounter issues after applying the fix:

1. **Check Console Logs**: The fix adds detailed logging to help diagnose issues. Check the browser console for error messages.

2. **Restore from Backup**: If needed, you can restore the original files from the backups created by the fix script:
   - `src/components/questionnaires/QuestionnaireContainer.tsx.steroid-fix-backup-[timestamp]`
   - `src/components/questionnaires/QuestionnaireForm.tsx.steroid-fix-backup-[timestamp]`

## Technical Details

### Parent-Child Question Mapping

The fix adds a mapping of parent question IDs to child question IDs:

```javascript
const parentToChildMap = {
  "879cd028-1b29-4529-9cdb-7adcaf44d553": "27b24dae-f107-431a-8422-bf49df018e1f", // ophthalmic -> which ophthalmic
  "631db108-0f4c-46ff-941e-c37f6856060c": "986f807c-bc31-4241-9ce3-6c6d3bbf09ad", // intravitreal -> which intravitreal
  "a43ecfbc-413f-4925-8908-f9fc0d35ea0f": "468969a4-0f2b-4a03-8cc1-b9f80efff559"  // systemic -> which systemic
};
```

### Modified handleAnswerChange Function

The `handleAnswerChange` function is modified to clear child question answers when parent questions are not answered with "yes":

```javascript
const handleAnswerChange = (questionId: string, value: AnswerValue) => {
  console.log(`DEBUG: handleAnswerChange - questionId: ${questionId}, value: ${value}`);
  
  // Create a new object explicitly to ensure React detects the change
  const newAnswers = {
    ...answers,
    [questionId]: value
  };
  
  // Check if this is a steroid parent question
  const isParentQuestion = Object.keys(parentToChildMap).includes(questionId);
  
  // If it's a parent question and the value is not "yes", clear the child question answer
  if (isParentQuestion && String(value).toLowerCase() !== "yes") {
    const childId = parentToChildMap[questionId];
    newAnswers[childId] = ""; // Clear the child question answer
    console.log(`DEBUG: Clearing child question ${childId} because parent ${questionId} is not "yes"`);
  }
  
  setAnswers(newAnswers);

  if (validationError) {
    setValidationError(null);
  }
};
```

### Case-Insensitive Comparison

The `isConditionalQuestionDisabled` function is modified to use case-insensitive comparison:

```javascript
const isDisabled = String(parentAnswer).toLowerCase() !== requiredValue.toLowerCase();