// Simple script to verify database connection and question access
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

// Add constants for magic numbers and strings
const DEFAULT_SCORE = 0;
const DEFAULT_DISPLAY_ORDER = 1;
const MAX_DISPLAY_ORDER = 999;

// Immediately invoked async function
(async () => {
  console.log("Verifying database connection and question access...");
  
  try {
    // Check question count
    const { count, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error("Error counting questions:", countError);
    } else {
      console.log(`Found ${count} questions in database`);
    }
    
    // Get sample questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question, question_type')
      .limit(5);
    
    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
    } else {
      console.log("Sample questions:", questions);
    }
    
    // Get dropdown options
    const { data: options, error: optionsError } = await supabase
      .from('dropdown_options')
      .select('id, question_id, option_text, score')
      .limit(10);
    
    if (optionsError) {
      console.error("Error fetching dropdown options:", optionsError);
    } else {
      console.log("Sample dropdown options:", options);
    }
    
    console.log("Verification complete");
  } catch (error: any) {
    console.error("Error during verification:", error);
  }
})();

// The fetchDropdownOptions function has inconsistent error handling
async fetchDropdownOptions(questionId: string): Promise<DropdownOption[]> {
  try {
    const response = await supabase
      .from('dropdown_options')
      .select('id, question_id, option_text, option_value, score, created_at')
      .eq('question_id', questionId)
      .order('created_at', { ascending: true });

    if (response.error) throw response.error;
    const data = response.data as DropdownOption[] | null;
    return data ?? [];
  } catch (error: any) {
    const err = error as SupabaseError;  // This is inconsistent with other functions
    console.error("Error fetching dropdown options:", err);
    toast.error(`Error fetching dropdown options: ${getErrorMessage(err)}`);
    return [];
  }
}

// Add null checks for page_category
const pageCategory = currentQuestion.page_category ?? '';  // Use nullish coalescing

// The updateQuestionOrder function should be wrapped in a transaction
// to ensure all updates succeed or none do

/**
 * Updates the display order of questions within a category
 * @param questionId - The ID of the question to move
 * @param newOrder - The new display order position
 * @param pageCategory - The category containing the question
 * @returns Promise<boolean> - Success status of the operation
 */
async updateQuestionOrder(questionId: string, newOrder: number, pageCategory: string): Promise<boolean>

// Add validation for required fields
async saveQuestion(questionData: Partial<Question>, userId: string): Promise<{ success: boolean, id?: string }> {
  if (!questionData.question) {
    toast.error("Question text is required");
    return { success: false };
  }
  // ... rest of the function
}

// Add caching for frequently accessed data
const questionCache = new Map<string, Question>();

async fetchQuestions(): Promise<Question[]> {
  // Check cache first
  if (questionCache.size > 0) {
    return Array.from(questionCache.values());
  }
  // ... rest of the function
}

// Add support for batch operations
async saveMultipleQuestions(questions: Partial<Question>[], userId: string): Promise<{ success: boolean, ids?: string[] }>

// Add structured logging for better debugging
interface QuestionEvent {
  type: 'create' | 'update' | 'delete' | 'reorder';
  questionId: string;
  userId: string;
  timestamp: string;
  details: Record<string, unknown>;
}
