import { QuestionItem } from "../constants/questionnaireConstants";
// Manually create QUESTIONNAIRE_PAGES until the constants file is updated
const QUESTIONNAIRE_PAGES = {
  MEDICAL_HISTORY: {
    id: "medical-history",
    title: "Medical History",
    questions: []
  },
  CLINICAL: {
    id: "clinical",
    title: "Clinical Assessment",
    questions: []
  },
  DEMOGRAPHICS: {
    id: "demographics",
    title: "Demographics",
    questions: []
  }
};

/**
 * Interface for a question from the database
 */
export interface DatabaseQuestion {
  id: string;
  question: string;
  tooltip?: string;
  question_type: string;
  page_category: string;
  risk_score?: number;
  has_dropdown_options?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

/**
 * Result from the fallback function
 */
export interface FallbackResult {
  questions: DatabaseQuestion[];
  source: 'database' | 'hardcoded' | 'hardcoded_error';
  success: boolean;
  error?: any;
}

/**
 * Get questions with fallback to hardcoded if database fetch fails
 * @param dbFetchFn Function that fetches questions from the database
 * @returns Questions either from database or hardcoded fallback
 */
export async function getQuestionsWithFallback(
  dbFetchFn: () => Promise<DatabaseQuestion[]>
): Promise<FallbackResult> {
  try {
    // Try to get questions from database
    const dbQuestions = await dbFetchFn();
    
    // If we got questions from DB, return them
    if (dbQuestions && dbQuestions.length > 0) {
      console.log(`Successfully fetched ${dbQuestions.length} questions from database`);
      return {
        questions: dbQuestions,
        source: 'database',
        success: true
      };
    }
    
    // Otherwise, fall back to hardcoded
    console.warn("No questions fetched from database, falling back to hardcoded questions");
    
    
    
    // Convert hardcoded questions format to match DB format
    const fallbackQuestions = Object.values(QUESTIONNAIRE_PAGES).flatMap(page => { // Use Object.values(), removed pageIndex
      // Determine category based on page id or title if needed, or use page.id directly if it matches DB categories
      const category = page.id === 'medical-history' ? 'medical_history' :
                      page.id === 'clinical' ? 'clinical_measurements' :
                      'patient_info'; // Default or adjust logic
      
      return page.questions.map(q => ({ // Map over page.questions
        id: q.id, // Add missing id property
        question: q.text,
        tooltip: q.tooltip || '',
        question_type: q.type,
        page_category: category,
        risk_score: getRiskScoreForQuestion(q),
        has_dropdown_options: !!q.options && q.options.length > 0,
        display_order: 0,
      }));
    });
    
    return {
      questions: fallbackQuestions,
      source: 'hardcoded',
      success: true
    };
  } catch (error) {
    console.error("Error fetching questions with fallback:", error);
    
    
    
    // Return hardcoded as last resort
    const fallbackQuestions = Object.values(QUESTIONNAIRE_PAGES).flatMap(page => { // Use Object.values(), removed pageIndex
      // Determine category based on page id or title if needed, or use page.id directly if it matches DB categories
      const category = page.id === 'medical-history' ? 'medical_history' :
                      page.id === 'clinical' ? 'clinical_measurements' :
                      'patient_info'; // Default or adjust logic
       
       return page.questions.map(q => ({ // Map over page.questions
         id: q.id, // Add missing id property
         question: q.text,
        tooltip: q.tooltip || '',
        question_type: q.type,
        page_category: category,
        risk_score: getRiskScoreForQuestion(q),
        has_dropdown_options: !!q.options && q.options.length > 0,
        display_order: 0,
      }));
    });
    
    return {
      questions: fallbackQuestions,
      source: 'hardcoded_error',
      success: false,
      error
    };
  }
}

/**
 * Determine risk score for a question based on known patterns
 * @param question Question to determine risk score for
 * @returns Risk score (1 or 2)
 */
function getRiskScoreForQuestion(question: QuestionItem): number {
  // Known risk factors get a score of 2
  if (['familyGlaucoma', 'ocularSteroid', 'intravitreal', 'systemicSteroid', 
       'iopBaseline', 'verticalAsymmetry', 'verticalRatio'].includes(question.id)) {
    return 2;
  }
  
  // Race gets special handling
  if (question.id === 'race') {
    return 2; // The individual options will determine actual score
  }
  
  // Default risk score is 1
  return 1;
}

/**
 * Filter questions by page category with robust matching
 * @param questions All questions
 * @param pageCategory Target page category
 * @returns Filtered questions for the page
 */
export function filterQuestionsByCategory(
  questions: DatabaseQuestion[], 
  pageCategory: string
): DatabaseQuestion[] {
  const normalizedTargetCategory = pageCategory.trim().toLowerCase();
  
  return questions.filter(q => {
    const dbCategory = (q.page_category || '').trim().toLowerCase();
    
    // More flexible matching - exact match plus partial matches as fallback
    return dbCategory === normalizedTargetCategory || 
           (dbCategory.includes(normalizedTargetCategory) && normalizedTargetCategory.length > 3) ||
           (normalizedTargetCategory.includes(dbCategory) && dbCategory.length > 3);
  });
}

/**
 * Converts database questions to the format needed by the form component
 * @param dbQuestions Questions from database
 * @param questionDropdownOptions Map of dropdown options by question ID
 * @param yesNoOptions Default yes/no options to use as fallback
 * @returns Questions formatted for the form component
 */
export function convertToFormQuestions(
  dbQuestions: DatabaseQuestion[],
  questionDropdownOptions: Record<string, any[]>,
  yesNoOptions: any[]
): QuestionItem[] {
  return dbQuestions.map(dbQ => ({
    id: dbQ.id,
    question: dbQ.question, // Use 'question' property for QuestionItem
    type: dbQ.question_type === 'boolean' ? 'select' : (dbQ.question_type as any || 'select'),
    options: questionDropdownOptions[dbQ.id] ||
             (dbQ.question_type === 'boolean' || dbQ.question_type === 'select' ? yesNoOptions : []),
    required: true,
    tooltip: dbQ.tooltip || ''
    // Removed incorrect 'question: dbQ.text' line
  }));
}