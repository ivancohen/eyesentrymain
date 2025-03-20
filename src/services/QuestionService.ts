import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DatabaseError, getErrorMessage } from "@/types/error";
import { PostgrestResponse, PostgrestSingleResponse, PostgrestError } from "@supabase/supabase-js";

export interface Question {
  id: string;
  question: string;
  tooltip?: string;
  created_at: string;
  created_by?: string;
  question_type?: string;
  has_conditional_items?: boolean;
  has_dropdown_options?: boolean;
  has_dropdown_scoring?: boolean;
  page_category?: string;
  display_order?: number;
  category?: string;
  followup_date?: string;
  has_score?: boolean;
  requires_followup?: boolean;
  status?: string;
}

export interface ConditionalItem {
  id: string;
  question_id: string;
  condition_value: string;
  response_message: string;
  condition_type: string;
  created_at: string;
  score?: number;
  tooltip?: string;
}

export interface DropdownOption {
  id: string;
  question_id: string;
  option_text: string;
  option_value: string;
  score: number;
  created_at: string;
}

type OrderUpdate = Record<string, unknown> & {
  id: string;
  display_order: number;
};

interface QuestionOrderData {
  id: string;
  display_order: number;
}

type SupabaseError = PostgrestError | Error;

export const QuestionService = {
  async fetchQuestions(): Promise<Question[]> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('page_category', { ascending: true })
        .order('display_order', { ascending: true }) as PostgrestResponse<Question>;

      if (error) throw error;

      console.log("Questions fetched successfully:", data?.length || 0, "results");
      return data || [];
    } catch (error: unknown) {
      console.error("Error fetching questions:", error);
      toast.error(`Error fetching questions: ${getErrorMessage(error)}`);
      return [];
    }
  },

  async deleteQuestion(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Question deleted successfully");
      return true;
    } catch (error: unknown) {
      console.error("Error deleting question:", error);
      toast.error(`Error deleting question: ${getErrorMessage(error)}`);
      return false;
    }
  },

  async saveQuestion(questionData: Partial<Question>, userId: string): Promise<{ success: boolean, id?: string }> {
    try {
      let questionId = questionData.id;
      
      if (questionId) {
        // Update existing question
        const { error: updateError } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', questionId);

        if (updateError) throw updateError;
      } else {
        // Insert new question
        const { data, error: insertError } = await supabase
          .from('questions')
          .insert([{
            ...questionData,
            created_by: userId,
            created_at: new Date().toISOString()
          }])
          .select('id')
          .single() as PostgrestSingleResponse<{ id: string }>;

        if (insertError) throw insertError;
        questionId = data?.id;
      }
      
      return { success: true, id: questionId };
    } catch (error: unknown) {
      console.error("Error saving question:", error);
      toast.error(`Error saving question: ${getErrorMessage(error)}`);
      return { success: false };
    }
  },

  async fetchConditionalItems(questionId: string): Promise<ConditionalItem[]> {
    try {
      const { data, error } = await supabase
        .from('conditional_items')
        .select('*')
        .eq('question_id', questionId)
        .order('created_at', { ascending: true }) as PostgrestResponse<ConditionalItem>;

      if (error) throw error;

      console.log("Conditional items fetched successfully:", data?.length || 0, "results");
      return data || [];
    } catch (error: unknown) {
      console.error("Error fetching conditional items:", error);
      toast.error(`Error fetching conditional items: ${getErrorMessage(error)}`);
      return [];
    }
  },

  async saveConditionalItem(itemData: Partial<ConditionalItem>): Promise<boolean> {
    try {
      console.log("Saving conditional item:", itemData);

      const formattedData = {
        ...itemData,
        score: itemData.score !== undefined ? Number(itemData.score) : 0,
        tooltip: itemData.tooltip || null
      };

      if (itemData.id) {
        const { error } = await supabase
          .from('conditional_items')
          .update(formattedData)
          .eq('id', itemData.id);
        
        if (error) throw error;
        console.log("Conditional item updated successfully");
      } else {
        const { error } = await supabase
          .from('conditional_items')
          .insert([formattedData]);
        
        if (error) throw error;
        console.log("Conditional item added successfully");
      }
      
      return true;
    } catch (error: unknown) {
      console.error("Error saving conditional item:", error);
      toast.error(`Error saving conditional item: ${getErrorMessage(error)}`);
      return false;
    }
  },

  async deleteConditionalItem(id: string): Promise<boolean> {
    try {
      console.log("Deleting conditional item with ID:", id);
      const { error } = await supabase
        .from('conditional_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      console.log("Conditional item deleted successfully");
      toast.success("Conditional item deleted successfully");
      return true;
    } catch (error: unknown) {
      console.error("Error deleting conditional item:", error);
      toast.error(`Error deleting conditional item: ${getErrorMessage(error)}`);
      return false;
    }
  },

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
    } catch (error) {
      const err = error as SupabaseError;
      console.error("Error fetching dropdown options:", err);
      toast.error(`Error fetching dropdown options: ${getErrorMessage(err)}`);
      return [];
    }
  },

  async saveDropdownOption(optionData: Partial<DropdownOption>): Promise<boolean> {
    try {
      console.log("Saving dropdown option:", optionData);

      const formattedData = {
        ...optionData,
        score: optionData.score !== undefined ? Number(optionData.score) : 0
      };

      if (optionData.id) {
        const { error } = await supabase
          .from('dropdown_options')
          .update(formattedData)
          .eq('id', optionData.id);
        
        if (error) throw error;
        console.log("Dropdown option updated successfully");
      } else {
        const { error } = await supabase
          .from('dropdown_options')
          .insert([formattedData]);
        
        if (error) throw error;
        console.log("Dropdown option added successfully");
      }
      
      return true;
    } catch (error: unknown) {
      console.error("Error saving dropdown option:", error);
      toast.error(`Error saving dropdown option: ${getErrorMessage(error)}`);
      return false;
    }
  },

  async deleteDropdownOption(id: string): Promise<boolean> {
    try {
      console.log("Deleting dropdown option with ID:", id);
      const { error } = await supabase
        .from('dropdown_options')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      console.log("Dropdown option deleted successfully");
      toast.success("Dropdown option deleted successfully");
      return true;
    } catch (error: unknown) {
      console.error("Error deleting dropdown option:", error);
      toast.error(`Error deleting dropdown option: ${getErrorMessage(error)}`);
      return false;
    }
  },

  async updateQuestionOrder(questionId: string, newOrder: number, pageCategory: string): Promise<boolean> {
    try {
      // Get the current question
      const currentResponse = await supabase
        .from('questions')
        .select('display_order')
        .eq('id', questionId)
        .single();

      if (currentResponse.error) throw currentResponse.error;
      if (!currentResponse.data) throw new Error('Question not found');

      const currentData = currentResponse.data as { display_order: number };
      const currentOrder = currentData.display_order;

      // Get all questions in the same category
      const questionsResponse = await supabase
        .from('questions')
        .select('id, display_order')
        .eq('page_category', pageCategory)
        .order('display_order', { ascending: true });

      if (questionsResponse.error) throw questionsResponse.error;
      if (!questionsResponse.data) return false;

      const questionsData = questionsResponse.data as { id: string; display_order: number }[];

      // Update the order of all affected questions
      const updates = questionsData
        .filter(q => {
          const order = q.display_order;
          return (newOrder > currentOrder) 
            ? order > currentOrder && order <= newOrder
            : order >= newOrder && order < currentOrder;
        })
        .map(q => ({
          id: q.id,
          display_order: newOrder > currentOrder 
            ? q.display_order - 1
            : q.display_order + 1
        }));

      // Add the target question's new order
      updates.push({ id: questionId, display_order: newOrder });

      // Perform the updates
      const updateResponse = await supabase
        .from('questions')
        .upsert(updates);

      if (updateResponse.error) throw updateResponse.error;
      return true;
    } catch (error) {
      const err = error as SupabaseError;
      console.error("Error updating question order:", err);
      toast.error(`Error updating question order: ${getErrorMessage(err)}`);
      return false;
    }
  },

  async moveQuestionUp(questionId: string): Promise<boolean> {
    try {
      // Get the current question
      const { data: currentQuestion, error: fetchError } = await supabase
        .from('questions')
        .select('display_order, page_category')
        .eq('id', questionId)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (!currentQuestion || currentQuestion.display_order === undefined) {
        console.error("Question not found or has no display order");
        return false;
      }
      
      const currentOrder = currentQuestion.display_order;
      const pageCategory = currentQuestion.page_category || '';
      
      // If already at the top, do nothing
      if (currentOrder <= 1) {
        toast.info("Question is already at the top of its category");
        return true;
      }
      
      // Move the question up by one position
      return await this.updateQuestionOrder(questionId, currentOrder - 1, pageCategory);
    } catch (error: unknown) {
      console.error("Error moving question up:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error moving question up: ${errorMessage}`);
      return false;
    }
  },

  async moveQuestionDown(questionId: string): Promise<boolean> {
    try {
      // Get the current question
      const { data: currentQuestion, error: fetchError } = await supabase
        .from('questions')
        .select('display_order, page_category')
        .eq('id', questionId)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (!currentQuestion || currentQuestion.display_order === undefined) {
        console.error("Question not found or has no display order");
        return false;
      }
      
      const currentOrder = currentQuestion.display_order;
      const pageCategory = currentQuestion.page_category || '';
      
      // Get the count of questions in this category to check if already at the bottom
      const { count, error: countError } = await supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('page_category', pageCategory);
      
      if (countError) throw countError;
      
      // If already at the bottom, do nothing
      if (count !== null && currentOrder >= count) {
        toast.info("Question is already at the bottom of its category");
        return true;
      }
      
      // Move the question down by one position
      return await this.updateQuestionOrder(questionId, currentOrder + 1, pageCategory);
    } catch (error: unknown) {
      console.error("Error moving question down:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error moving question down: ${errorMessage}`);
      return false;
    }
  },

  async moveQuestionToCategory(questionId: string, newCategory: string): Promise<boolean> {
    try {
      // Get the current question
      const { data: currentQuestion, error: fetchError } = await supabase
        .from('questions')
        .select('page_category')
        .eq('id', questionId)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (!currentQuestion) {
        console.error("Question not found");
        return false;
      }
      
      const currentCategory = currentQuestion.page_category || '';
      
      // If already in the target category, do nothing
      if (currentCategory === newCategory) {
        toast.info("Question is already in this category");
        return true;
      }
      
      // Get the count of questions in the new category to place at the end
      const { count, error: countError } = await supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('page_category', newCategory);
      
      if (countError) throw countError;
      
      // Move the question to the end of the new category
      if (count === null) {
        throw new Error('Failed to get question count for category');
      }
      return await this.updateQuestionOrder(questionId, count + 1, newCategory);
    } catch (error: unknown) {
      console.error("Error moving question to category:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error moving question to category: ${errorMessage}`);
      return false;
    }
  }
};
