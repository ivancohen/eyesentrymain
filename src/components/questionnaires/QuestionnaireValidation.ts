
/**
 * Validates the current page of the questionnaire
 */
export const validateQuestionnairePage = (
  currentQuestions: any[], 
  answers: Record<string, any>
): { isValid: boolean; errorMessage: string | null } => {
  // Check if all required questions are answered
  for (const question of currentQuestions) {
    // Skip validation for conditional questions whose parent condition is not met
    if (question.conditionalOptions) {
      const [parentId, requiredValue] = question.conditionalOptions.parentValue.split(':');
      
      // If parent condition is not met, this question shouldn't be validated
      if (answers[parentId] !== requiredValue) {
        continue;
      }
    }
    
    if (question.required && (!answers[question.id] || answers[question.id] === "")) {
      return {
        isValid: false,
        errorMessage: "Please answer all required questions before proceeding."
      };
    }
  }
  
  return { isValid: true, errorMessage: null };
};
