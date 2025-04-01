# Conditional Logic Implementation for EyeSentry

## Overview

I'll explain how to implement conditional logic in the questionnaire system while preserving the existing specialist functionality. The goal is to make conditional questions configurable through the admin interface rather than hardcoded in the frontend.

## Current Implementation

Let's first look at the current implementation to understand how conditional logic works now. Currently, in the patient questionnaire, conditional logic is hardcoded in the frontend components. For example:

```tsx
// Example from current implementation (simplified)
{question.id === 'ocularSteroid' && answers.ocularSteroid === 'yes' && (
  <FormControl>
    <FormLabel>Steroid Type</FormLabel>
    <Select
      name="steroidType"
      value={answers.steroidType || ''}
      onChange={handleChange}
    >
      <option value="">Select type</option>
      <option value="dexamethasone">Dexamethasone</option>
      <option value="prednisolone">Prednisolone</option>
      <option value="loteprednol">Loteprednol</option>
    </Select>
  </FormControl>
)}
```

This approach has several limitations:
1. Conditional logic is hardcoded and not configurable by admins
2. Adding new conditional questions requires code changes
3. The relationships between questions are not stored in the database

## Proposed Implementation

### 1. Database Schema

We'll add three columns to the `questions` table:
- `conditional_parent_id`: UUID reference to the parent question
- `conditional_required_value`: The value of the parent question that triggers this question
- `conditional_display_mode`: How to display the question ('hide', 'show', 'disable')

### 2. Admin Interface

In the SpecialistQuestionForm, we'll add fields to configure conditional logic:

```tsx
<FormControl>
  <FormLabel>Conditional Logic</FormLabel>
  <Checkbox
    isChecked={isConditional}
    onChange={(e) => setIsConditional(e.target.checked)}
  >
    This question depends on another question
  </Checkbox>
</FormControl>

{isConditional && (
  <>
    <FormControl>
      <FormLabel>Parent Question</FormLabel>
      <Select
        value={formData.conditional_parent_id || ''}
        onChange={(e) => setFormData({...formData, conditional_parent_id: e.target.value})}
      >
        <option value="">Select parent question</option>
        {parentQuestions.map(q => (
          <option key={q.id} value={q.id}>{q.question}</option>
        ))}
      </Select>
    </FormControl>
    
    {formData.conditional_parent_id && (
      <FormControl>
        <FormLabel>Required Value</FormLabel>
        <Select
          value={formData.conditional_required_value || ''}
          onChange={(e) => setFormData({...formData, conditional_required_value: e.target.value})}
        >
          <option value="">Select required value</option>
          {parentValues.map(val => (
            <option key={val.option_value} value={val.option_value}>{val.option_text}</option>
          ))}
        </Select>
      </FormControl>
    )}
    
    <FormControl>
      <FormLabel>Display Mode</FormLabel>
      <Select
        value={formData.conditional_display_mode || 'hide'}
        onChange={(e) => setFormData({...formData, conditional_display_mode: e.target.value})}
      >
        <option value="hide">Hide until condition is met</option>
        <option value="show">Show but disable until condition is met</option>
        <option value="disable">Show but disable until condition is met</option>
      </Select>
    </FormControl>
  </>
)}
```

### 3. Frontend Rendering

In the patient questionnaire, we'll replace the hardcoded conditional logic with a dynamic approach:

```tsx
// Helper function to determine if a question should be shown
const shouldShowQuestion = (question) => {
  // If not conditional, always show
  if (!question.conditional_parent_id) return true;
  
  // If conditional, check if parent question has the required value
  const parentValue = answers[question.conditional_parent_id];
  return parentValue === question.conditional_required_value;
};

// Helper function to determine if a question should be disabled
const isQuestionDisabled = (question) => {
  // If not conditional, never disable
  if (!question.conditional_parent_id) return false;
  
  // If conditional and display mode is 'disable' or 'show', check condition
  if (question.conditional_display_mode !== 'hide') {
    const parentValue = answers[question.conditional_parent_id];
    return parentValue !== question.conditional_required_value;
  }
  
  return false;
};

// In the render function
{questions.map(question => (
  (shouldShowQuestion(question) || question.conditional_display_mode !== 'hide') && (
    <FormControl 
      key={question.id}
      isDisabled={isQuestionDisabled(question)}
    >
      <FormLabel>{question.question}</FormLabel>
      {/* Render appropriate input based on question_type */}
      {question.question_type === 'dropdown' && (
        <Select
          name={question.id}
          value={answers[question.id] || ''}
          onChange={handleChange}
        >
          <option value="">Select an option</option>
          {question.options.map(option => (
            <option key={option.id} value={option.option_value}>
              {option.option_text}
            </option>
          ))}
        </Select>
      )}
      {/* Other question types... */}
    </FormControl>
  )
))}
```

## Example Using Current Data

Let's use the steroid questions as an example:

### Current Data (Hardcoded)

Currently, we have questions like:
- "Do you use ophthalmic topical steroids?" (ocularSteroid)
- "What type of steroid do you use?" (steroidType) - shown only if ocularSteroid = "yes"

### New Data Model

In the new model, we would have:

1. Main question:
```
{
  id: "ocularSteroid",
  question: "Do you use ophthalmic topical steroids?",
  question_type: "dropdown",
  conditional_parent_id: null,
  conditional_required_value: null,
  conditional_display_mode: null
}
```

2. Follow-up question:
```
{
  id: "steroidType",
  question: "What type of steroid do you use?",
  question_type: "dropdown",
  conditional_parent_id: "ocularSteroid",
  conditional_required_value: "yes",
  conditional_display_mode: "hide"
}
```

### Admin Configuration

In the admin interface, the specialist would:

1. Create the main question "Do you use ophthalmic topical steroids?" with dropdown options "Yes" and "No"
2. Create the follow-up question "What type of steroid do you use?" with dropdown options for different steroid types
3. Configure the follow-up question to be conditional on the main question:
   - Set Parent Question to "Do you use ophthalmic topical steroids?"
   - Set Required Value to "yes"
   - Set Display Mode to "hide"

### Patient Experience

When a patient fills out the questionnaire:
1. They see the question "Do you use ophthalmic topical steroids?"
2. If they select "Yes", the follow-up question "What type of steroid do you use?" appears
3. If they select "No", the follow-up question remains hidden

## Preserving Specialist Functionality

The specialist functionality in the admin section will be preserved and enhanced:

1. **Existing Functionality**:
   - Creating and editing questions
   - Setting question types
   - Managing dropdown options

2. **New Functionality**:
   - Configuring conditional logic
   - Setting display modes
   - Selecting parent questions and required values

The risk assessment scoring will continue to work as before, but with the added benefit that all questions (including conditional ones) can contribute to the risk score based on admin-defined values.

## Implementation Steps

1. **Database Updates**:
   - Add conditional logic columns to the questions table
   - Create indexes for performance

2. **Service Layer**:
   - Update QuestionService to handle conditional logic
   - Ensure all existing functionality is preserved

3. **Admin Interface**:
   - Enhance SpecialistQuestionForm with conditional logic configuration
   - Keep all existing specialist functionality intact

4. **Frontend Questionnaire**:
   - Replace hardcoded conditional logic with dynamic rendering
   - Ensure backward compatibility with existing questions

This implementation provides a flexible, admin-driven approach to conditional logic while preserving all existing specialist functionality.