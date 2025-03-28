# Questionnaire Mapping Fix

## Problem Identified

The questionnaire system has three related issues:

1. **Patient Names Not Showing**: New entries don't display patient names correctly.
2. **Risk Assessment Scores Not Calculating**: Scores aren't being calculated properly.
3. **Edit Screen Fields Not Populated**: Fields aren't being populated in the edit screen.

The root cause is the same for all three issues: **unreliable text-based mapping between old string IDs and new UUIDs**.

## Detailed Analysis

### 1. In `QuestionnaireContainer.tsx`

The mapping from old string IDs to UUIDs uses case-sensitive text matching that doesn't match the actual question text in the database:

```javascript
const uuidMap: Record<string, string | undefined> = {
  // ...
  "intravitreal": allDbQuestions.find(q => q.question.includes("Intravitreal Steroids"))?.id, // Case sensitive!
  "verticalAsymmetry": allDbQuestions.find(q => q.question.includes("Vertical C:D disc asymmetry"))?.id, // Text mismatch!
  // ...
};
```

### 2. In `RiskAssessmentService.ts`

We already fixed similar issues in this file, but the fix needs to be applied to other files as well.

### 3. In `QuestionnaireEdit.tsx`

The mapping logic for fetched questionnaire data uses similar text matching that's unreliable:

```javascript
const findQuestionId = (identifier: string): string | undefined => {
  const q = allDbQuestions.find(
    (q) => (q as any).identifier === identifier || q.question.toLowerCase().includes(identifier.toLowerCase())
  );
  return q?.id;
};
```

## Solution

### 1. Fix `QuestionnaireContainer.tsx`

Update the mapping to use case-insensitive matching and more accurate text snippets:

```javascript
const uuidMap: Record<string, string | undefined> = {
  "firstName": allDbQuestions.find(q => q.question === "Patient First Name")?.id,
  "lastName": allDbQuestions.find(q => q.question === "Patient Last Name")?.id,
  "age": allDbQuestions.find(q => q.question === "Age")?.id,
  "race": allDbQuestions.find(q => q.question === "Race")?.id,
  "familyGlaucoma": allDbQuestions.find(q => q.question.includes("Has anyone in your immediate family"))?.id,
  "ocularSteroid": allDbQuestions.find(q => q.question.toLowerCase().includes("ophthalmic topical steroids"))?.id,
  "steroidType": allDbQuestions.find(q => q.question === "Which ophthalmic topical steroid are you taking or have taken?")?.id,
  "intravitreal": allDbQuestions.find(q => q.question.toLowerCase().includes("intravitreal steroids"))?.id, // Fixed: lowercase
  "intravitralType": allDbQuestions.find(q => q.question === "Which intravitreal steroid are you taking or have taken?")?.id,
  "systemicSteroid": allDbQuestions.find(q => q.question.toLowerCase().includes("systemic steroids"))?.id,
  "systemicSteroidType": allDbQuestions.find(q => q.question === "Which systemic steroid are you taking or have taken?")?.id,
  "iopBaseline": allDbQuestions.find(q => q.question.includes("IOP Baseline"))?.id,
  "verticalAsymmetry": allDbQuestions.find(q => q.question.includes("ratio asymmetry"))?.id, // Fixed: "ratio asymmetry" not "disc asymmetry"
  "verticalRatio": allDbQuestions.find(q => q.question.includes("Vertical C:D ratio"))?.id,
};
```

### 2. Fix `QuestionnaireEdit.tsx`

Update the mapping logic in the `useEffect` for fetching questionnaire data:

```javascript
const mapping: { [key in keyof FetchedQuestionnaireData]?: { idIdentifier: string; transform?: (val: any) => AnswerValue } } = {
  age: { idIdentifier: 'age' },
  race: { idIdentifier: 'race' },
  family_glaucoma: { idIdentifier: 'family history', transform: (val) => val ? "yes" : "no" },
  ocular_steroid: { idIdentifier: 'ophthalmic topical', transform: (val) => val ? "yes" : "no" }, // More specific
  steroid_type: { idIdentifier: 'which ophthalmic topical steroid' }, // More specific
  intravitreal: { idIdentifier: 'intravitreal steroids', transform: (val) => val ? "yes" : "no" }, // Lowercase
  intravitreal_type: { idIdentifier: 'which intravitreal steroid' }, // More specific
  systemic_steroid: { idIdentifier: 'systemic steroids', transform: (val) => val ? "yes" : "no" },
  systemic_steroid_type: { idIdentifier: 'which systemic steroid' }, // More specific
  iop_baseline: { idIdentifier: 'iop baseline', transform: (val) => val ? "22_and_above" : "21_and_under" },
  vertical_asymmetry: { idIdentifier: 'ratio asymmetry', transform: (val) => val ? "0.2_and_above" : "under_0.2" }, // Fixed
  vertical_ratio: { idIdentifier: 'vertical c:d ratio', transform: (val) => val ? "0.6_and_above" : "below_0.6" },
};
```

Also, update the `findQuestionId` function to be more robust:

```javascript
const findQuestionId = (identifier: string): string | undefined => {
  // Make the search case-insensitive
  const lowerIdentifier = identifier.toLowerCase();
  const q = allDbQuestions.find(
    (q) => (q as any).identifier === identifier || q.question.toLowerCase().includes(lowerIdentifier)
  );
  return q?.id;
};
```

## Implementation Steps

1. Update the mapping in `QuestionnaireContainer.tsx`
2. Update the mapping in `QuestionnaireEdit.tsx`
3. Test the questionnaire submission and editing to ensure patient names, risk scores, and edit fields are working correctly

## Expected Outcome

After implementing these changes:
- Patient names should appear correctly on new entries
- Risk assessment scores should calculate properly
- Edit screen fields should be populated correctly