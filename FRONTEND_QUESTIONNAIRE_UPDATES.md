# Frontend Questionnaire Updates

Below are the key updates needed for the frontend questionnaire components to support the new features.

## Enhanced Questionnaire Rendering

Update the component responsible for rendering the questionnaire pages (e.g., `PatientQuestionnaireForm.tsx`) to:

1. **Fetch Questions Using Enhanced Service**:
   - Use `QuestionService.enhanced.ts` to fetch questions, ensuring they are ordered correctly.

2. **Implement Conditional Logic**:
   - Use helper functions to determine if questions should be shown or disabled based on admin-defined conditional logic.

```tsx
import React, { useState, useEffect } from 'react';
import { Button, FormControl, FormLabel, Select, Input, Checkbox, RadioGroup, Radio, Stack, Box, Text } from '@chakra-ui/react';
import { QuestionService } from '@/services/QuestionService.enhanced';
import { RiskAssessmentService } from '@/services/RiskAssessmentService.enhanced';

interface QuestionnaireProps {
  onSubmit: (results: any) => void;
}

export const EnhancedPatientQuestionnaire: React.FC<QuestionnaireProps> = ({ onSubmit }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(0);
  
  // Fetch questions on component mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const fetchedQuestions = await QuestionService.fetchQuestions();
        setQuestions(fetchedQuestions);
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    };
    fetchQuestions();
  }, []);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAnswers(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setAnswers(prev => ({ ...prev, [name]: checked ? 'yes' : 'no' }));
  };
  
  // Handle radio changes
  const handleRadioChange = (name: string, value: string) => {
    setAnswers(prev => ({ ...prev, [name]: value }));
  };
  
  // Helper function to determine if a question should be shown
  const shouldShowQuestion = (question: any) => {
    // If not conditional, always show
    if (!question.conditional_parent_id) return true;
    
    // If conditional, check if parent question has the required value
    const parentValue = answers[question.conditional_parent_id];
    return parentValue === question.conditional_required_value;
  };
  
  // Helper function to determine if a question should be disabled
  const isQuestionDisabled = (question: any) => {
    // If not conditional, never disable
    if (!question.conditional_parent_id) return false;
    
    // If conditional and display mode is 'disable' or 'show', check condition
    if (question.conditional_display_mode !== 'hide') {
      const parentValue = answers[question.conditional_parent_id];
      return parentValue !== question.conditional_required_value;
    }
    
    return false;
  };
  
  // Get questions for the current page
  const categories = ['patient_info', 'family_medication', 'clinical_measurements'];
  const currentCategory = categories[currentPage];
  const currentQuestions = questions.filter(q => q.page_category === currentCategory);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentPage < categories.length - 1) {
      // Move to the next page
      setCurrentPage(prev => prev + 1);
    } else {
      // Submit the questionnaire
      try {
        const results = await RiskAssessmentService.calculateRiskScore(answers);
        onSubmit(results);
      } catch (error) {
        console.error('Error submitting questionnaire:', error);
      }
    }
  };
  
  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Text fontSize="xl" fontWeight="bold" mb={4}>
        Page {currentPage + 1}: {currentCategory.replace('_', ' ')}
      </Text>
      
      {currentQuestions.map(question => (
        (shouldShowQuestion(question) || question.conditional_display_mode !== 'hide') && (
          <FormControl 
            key={question.id}
            isDisabled={isQuestionDisabled(question)}
            mb={4}
          >
            <FormLabel>{question.question}</FormLabel>
            {question.tooltip && <Text fontSize="sm" color="gray.500" mb={2}>{question.tooltip}</Text>}
            
            {question.question_type === 'text' && (
              <Input 
                name={question.id} 
                value={answers[question.id] || ''} 
                onChange={handleChange} 
              />
            )}
            
            {question.question_type === 'number' && (
              <Input 
                type="number" 
                name={question.id} 
                value={answers[question.id] || ''} 
                onChange={handleChange} 
              />
            )}
            
            {question.question_type === 'dropdown' && (
              <Select
                name={question.id}
                value={answers[question.id] || ''}
                onChange={handleChange}
                placeholder="Select an option"
              >
                {question.options?.map((option: any) => (
                  <option key={option.id} value={option.option_value}>
                    {option.option_text}
                  </option>
                ))}
              </Select>
            )}
            
            {question.question_type === 'checkbox' && (
              <Checkbox
                name={question.id}
                isChecked={answers[question.id] === 'yes'}
                onChange={handleCheckboxChange}
              >
                Yes
              </Checkbox>
            )}
            
            {question.question_type === 'radio' && (
              <RadioGroup 
                name={question.id} 
                value={answers[question.id] || ''} 
                onChange={(value) => handleRadioChange(question.id, value)}
              >
                <Stack direction="row">
                  {question.options?.map((option: any) => (
                    <Radio key={option.id} value={option.option_value}>
                      {option.option_text}
                    </Radio>
                  ))}
                </Stack>
              </RadioGroup>
            )}
            
          </FormControl>
        )
      ))}
      
      <Button type="submit" colorScheme="blue" mt={4}>
        {currentPage < categories.length - 1 ? 'Next Page' : 'Submit Questionnaire'}
      </Button>
    </Box>
  );
};
```

## Key Changes

1. **Use Enhanced Services**:
   - Import and use `QuestionService.enhanced.ts` and `RiskAssessmentService.enhanced.ts`.

2. **Conditional Logic Handling**:
   - Implement `shouldShowQuestion` and `isQuestionDisabled` helper functions.
   - Use these functions to conditionally render and disable questions based on admin-defined rules.

3. **Rendering Questions**:
   - Fetch questions using `QuestionService.fetchQuestions()`.
   - Filter questions based on the current page category.
   - Render each question based on its `question_type`.
   - Use the `isDisabled` prop on `FormControl` to disable questions based on conditional logic.

4. **Submission**:
   - Use `RiskAssessmentService.calculateRiskScore()` to calculate the score based on admin-defined values.

## How to Use

1. Replace the existing frontend questionnaire component with the `EnhancedPatientQuestionnaire` component.
2. Ensure the component is properly integrated into your application's routing and state management.

These updates will ensure that the frontend questionnaire:
- Displays questions in the correct order
- Handles conditional logic dynamically based on admin settings
- Calculates risk scores using only admin-defined values

After updating the frontend, the entire questionnaire system will be fully functional and admin-driven.