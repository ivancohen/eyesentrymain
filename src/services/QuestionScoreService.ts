import { supabase } from "@/lib/supabase";
import { safeQueryWithFallback } from "@/utils/supabaseErrorHandler";
import { toast } from "sonner";

/**
 * @fileoverview Service for managing question scores.
 */

/**
 * Represents the structure of a question score record.
 */
export interface QuestionScore {
  id: string; // Usually the question ID or a specific score record ID
  question: string; // Text of the question
  question_type: string; // Type of the question (e.g., multiple_choice)
  score: number; // The assigned score
  option_id?: string; // ID of the specific option if applicable
  option_text?: string; // Text of the specific option if applicable
}

/**
 * Provides methods for fetching and updating question scores.
 */
export const QuestionScoreService = {
  /**
   * Fetches question scores from the database.
   * The exact source ('question_scores' table or a view) needs verification.
   * @returns {Promise<QuestionScore[]>} A promise resolving to an array of question scores.
   */
  async fetchQuestionScores(): Promise<QuestionScore[]> {
    console.log("Fetching question scores...");

    // Adjust the table/view name if necessary
    // Removed explicit type argument <QuestionScore[]> as it might not be supported
    const data = await safeQueryWithFallback(
      () => supabase.from('question_scores').select('*'), // Assuming 'question_scores' table
      [], // Fallback
      2   // Retries
    );

    // Basic mapping, adjust based on actual table columns
    const scores: QuestionScore[] = (data || []).map((item: any) => ({
      id: item.id,
      question: item.question,
      question_type: item.question_type,
      score: item.score,
      option_id: item.option_id,
      option_text: item.option_text,
    }));

    console.log("Question scores fetched successfully:", scores.length, "results");
    return scores;
  },

  /**
   * Updates the score for a specific question or option.
   * The exact implementation depends on the database structure (e.g., updating a specific option's score).
   * @param {string} questionId - The ID of the question.
   * @param {string | undefined} optionId - The ID of the option (if applicable).
   * @param {number} score - The new score to set.
   * @returns {Promise<boolean>} A promise resolving to true if successful, false otherwise.
   */
  async updateQuestionScore(questionId: string, optionId: string | undefined, score: number): Promise<boolean> {
    try {
      console.log(`Updating score for question ${questionId}` + (optionId ? ` / option ${optionId}` : '') + ` to ${score}`);

      // This implementation assumes updating a score based on question_id and potentially option_id.
      // Adjust the query based on the actual table structure and primary keys.
      let updateQuery = supabase
        .from('question_scores') // Adjust table name if needed
        .update({ score: score });

      // Example: Update score for a specific option within a question
      if (optionId) {
        updateQuery = updateQuery
          .eq('question_id', questionId) // Assuming a question_id column exists
          .eq('option_id', optionId);
      }
      // Example: Update score for a question directly (if no options)
      else {
        updateQuery = updateQuery
          .eq('id', questionId); // Assuming 'id' is the question_score record ID or question ID
      }

      // Execute the query and destructure the error
      const { error } = await updateQuery;

      if (error) {
        console.error("Error updating question score:", error);
        throw error;
      }

      toast.success("Question score updated successfully");
      return true;
    } catch (error: unknown) {
      console.error("Error updating question score:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error updating question score: ${errorMessage}`);
      return false;
    }
  },
};