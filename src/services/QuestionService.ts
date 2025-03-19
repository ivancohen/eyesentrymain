
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

export interface Question {
  id: string;
  question: string;
  created_at: string;
  created_by?: string;
  question_type?: string;
  has_conditional_items?: boolean;
  has_dropdown_options?: boolean;
  has_dropdown_scoring?: boolean;
  page_category?: string;
  display_order?: number;
}

export interface ConditionalItem {
  id: string;
  question_id: string;
  condition_value: string;
  response_message: string;
  condition_type: string;
  created_at: string;
  score?: number;
}

export interface DropdownOption {
  id: string;
  question_id: string;
  option_text: string;
  option_value: string;
  score: number;
  created_at: string;
}

export const QuestionService = {
  async fetchQuestions(): Promise<Question[]> {
    try {
      console.log("Fetching questions from Supabase...");
      // Don't set any role, use the authenticated user's default permissions
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('page_category', { ascending: true })
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error("Supabase error when fetching questions:", error);
        throw error;
      }
      
      console.log("Questions fetched successfully:", data?.length || 0, "results");
      return data || [];
    } catch (error: any) {
      console.error("Error fetching questions:", error);
      toast.error(`Error fetching questions: ${error.message}`);
      return [];
    }
  },

  async deleteQuestion(id: string): Promise<boolean> {
    try {
      console.log("Deleting question with ID:", id);
      
      // Don't set any role for conditional items deletion
      const { error: conditionalItemsError } = await supabase
        .from('conditional_items')
        .delete()
        .eq('question_id', id);
      
      if (conditionalItemsError) throw conditionalItemsError;
      
      // Don't set any role for dropdown options deletion
      const { error: dropdownOptionsError } = await supabase
        .from('dropdown_options')
        .delete()
        .eq('question_id', id);
      
      if (dropdownOptionsError) throw dropdownOptionsError;
      
      // Don't set any role for question deletion
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      console.log("Question deleted successfully");
      toast.success("Question deleted successfully");
      return true;
    } catch (error: any) {
      console.error("Error deleting question:", error);
      toast.error(`Error deleting question: ${error.message}`);
      return false;
    }
  },

  async saveQuestion(questionData: Partial<Question>, userId: string): Promise<{ success: boolean, id?: string }> {
    try {
      const formattedData = {
        ...questionData,
        created_by: userId,
        has_conditional_items: questionData.has_conditional_items === true || 
                              (typeof questionData.has_conditional_items === 'string' && 
                               questionData.has_conditional_items === "true"),
        has_dropdown_scoring: questionData.has_dropdown_scoring === true || 
                            (typeof questionData.has_dropdown_scoring === 'string' && 
                             questionData.has_dropdown_scoring === "true"),
        has_dropdown_options: questionData.question_type === "dropdown" || 
                            (questionData.has_dropdown_options === true || 
                            (typeof questionData.has_dropdown_options === 'string' && 
                             questionData.has_dropdown_options === "true"))
      };

      console.log("Saving question data:", formattedData);

      let questionId = questionData.id;

      if (questionId) {
        // Don't set any role for question update
        const { error } = await supabase
          .from('questions')
          .update(formattedData)
          .eq('id', questionId);
        
        if (error) throw error;
        console.log("Question updated successfully");
        toast.success("Question updated successfully");
      } else {
        // Don't set any role for question insertion
        const { data, error } = await supabase
          .from('questions')
          .insert([formattedData])
          .select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          questionId = data[0].id;
        }
        
        console.log("Question added successfully");
        toast.success("Question added successfully");
      }
      
      return { success: true, id: questionId };
    } catch (error: any) {
      console.error("Error saving question:", error);
      toast.error(`Error saving question: ${error.message}`);
      return { success: false };
    }
  },

  async fetchConditionalItems(questionId: string): Promise<ConditionalItem[]> {
    try {
      console.log("Fetching conditional items for question:", questionId);
      // Don't set any role for conditional items fetching
      const { data, error } = await supabase
        .from('conditional_items')
        .select('*')
        .eq('question_id', questionId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Supabase error when fetching conditional items:", error);
        throw error;
      }
      
      console.log("Conditional items fetched successfully:", data?.length || 0, "results");
      return data || [];
    } catch (error: any) {
      console.error("Error fetching conditional items:", error);
      toast.error(`Error fetching conditional items: ${error.message}`);
      return [];
    }
  },

  async saveConditionalItem(itemData: Partial<ConditionalItem>): Promise<boolean> {
    try {
      console.log("Saving conditional item:", itemData);

      const formattedData = {
        ...itemData,
        score: itemData.score !== undefined ? Number(itemData.score) : 0
      };

      if (itemData.id) {
        // Don't set any role for conditional item update
        const { error } = await supabase
          .from('conditional_items')
          .update(formattedData)
          .eq('id', itemData.id);
        
        if (error) throw error;
        console.log("Conditional item updated successfully");
      } else {
        // Don't set any role for conditional item insertion
        const { error } = await supabase
          .from('conditional_items')
          .insert([formattedData]);
        
        if (error) throw error;
        console.log("Conditional item added successfully");
      }
      
      return true;
    } catch (error: any) {
      console.error("Error saving conditional item:", error);
      toast.error(`Error saving conditional item: ${error.message}`);
      return false;
    }
  },

  async deleteConditionalItem(id: string): Promise<boolean> {
    try {
      console.log("Deleting conditional item with ID:", id);
      // Don't set any role for conditional item deletion
      const { error } = await supabase
        .from('conditional_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      console.log("Conditional item deleted successfully");
      toast.success("Conditional item deleted successfully");
      return true;
    } catch (error: any) {
      console.error("Error deleting conditional item:", error);
      toast.error(`Error deleting conditional item: ${error.message}`);
      return false;
    }
  },

  async fetchDropdownOptions(questionId: string): Promise<DropdownOption[]> {
    try {
      console.log("Fetching dropdown options for question:", questionId);
      // Don't set any role for dropdown options fetching
      const { data, error } = await supabase
        .from('dropdown_options')
        .select('*')
        .eq('question_id', questionId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Supabase error when fetching dropdown options:", error);
        throw error;
      }
      
      console.log("Dropdown options fetched successfully:", data?.length || 0, "results");
      return data || [];
    } catch (error: any) {
      console.error("Error fetching dropdown options:", error);
      toast.error(`Error fetching dropdown options: ${error.message}`);
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
        // Don't set any role for dropdown option update
        const { error } = await supabase
          .from('dropdown_options')
          .update(formattedData)
          .eq('id', optionData.id);
        
        if (error) throw error;
        console.log("Dropdown option updated successfully");
      } else {
        // Don't set any role for dropdown option insertion
        const { error } = await supabase
          .from('dropdown_options')
          .insert([formattedData]);
        
        if (error) throw error;
        console.log("Dropdown option added successfully");
      }
      
      return true;
    } catch (error: any) {
      console.error("Error saving dropdown option:", error);
      toast.error(`Error saving dropdown option: ${error.message}`);
      return false;
    }
  },

  async deleteDropdownOption(id: string): Promise<boolean> {
    try {
      console.log("Deleting dropdown option with ID:", id);
      // Don't set any role for dropdown option deletion
      const { error } = await supabase
        .from('dropdown_options')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      console.log("Dropdown option deleted successfully");
      toast.success("Dropdown option deleted successfully");
      return true;
    } catch (error: any) {
      console.error("Error deleting dropdown option:", error);
      toast.error(`Error deleting dropdown option: ${error.message}`);
      return false;
    }
  },

  async updateQuestionOrder(questionId: string, newOrder: number, pageCategory: string): Promise<boolean> {
    try {
      console.log(`Updating question ${questionId} order to ${newOrder} in category ${pageCategory}`);
      
      // First, get the current order of the question
      const { data: currentQuestion, error: fetchError } = await supabase
        .from('questions')
        .select('display_order, page_category')
        .eq('id', questionId)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (!currentQuestion) {
        console.error("Question not found");
        return false;
      }
      
      // Check if display_order column exists
      if (currentQuestion.display_order === undefined) {
        console.error("display_order column not found. Please run the SQL script in supabase/ultra_simple_admin.sql");
        toast.error("Please run the SQL script to add the display_order column first");
        return false;
      }
      
      const currentOrder = currentQuestion.display_order || 0;
      const currentCategory = currentQuestion.page_category || '';
      
      // If moving within the same category
      if (currentCategory === pageCategory) {
        if (newOrder > currentOrder) {
          // Moving down: decrement display_order for questions between old and new position
          // First, get all questions that need to be updated
          const { data: questionsToUpdate, error: fetchError } = await supabase
            .from('questions')
            .select('id, display_order')
            .eq('page_category', pageCategory)
            .gt('display_order', currentOrder)
            .lte('display_order', newOrder);
          
          if (fetchError) throw fetchError;
          
          // Update each question individually
          for (const question of questionsToUpdate || []) {
            const { error: updateError } = await supabase
              .from('questions')
              .update({ display_order: question.display_order - 1 })
              .eq('id', question.id);
              
            if (updateError) throw updateError;
          }
        } else if (newOrder < currentOrder) {
          // Moving up: increment display_order for questions between new and old position
          // First, get all questions that need to be updated
          const { data: questionsToUpdate, error: fetchError } = await supabase
            .from('questions')
            .select('id, display_order')
            .eq('page_category', pageCategory)
            .gte('display_order', newOrder)
            .lt('display_order', currentOrder);
          
          if (fetchError) throw fetchError;
          
          // Update each question individually
          for (const question of questionsToUpdate || []) {
            const { error: updateError } = await supabase
              .from('questions')
              .update({ display_order: question.display_order + 1 })
              .eq('id', question.id);
              
            if (updateError) throw updateError;
          }
        } else {
          // No change in order
          return true;
        }
      } else {
        // Moving to a different category
        
        // 1. Decrement display_order for questions after the current position in the old category
        // First, get all questions that need to be updated
        const { data: questionsToDecrement, error: fetchDecrementError } = await supabase
          .from('questions')
          .select('id, display_order')
          .eq('page_category', currentCategory)
          .gt('display_order', currentOrder);
        
        if (fetchDecrementError) throw fetchDecrementError;
        
        // Update each question individually
        for (const question of questionsToDecrement || []) {
          const { error: updateError } = await supabase
            .from('questions')
            .update({ display_order: question.display_order - 1 })
            .eq('id', question.id);
          
          if (updateError) throw updateError;
        }
        
        // 2. Increment display_order for questions at or after the new position in the new category
        // First, get all questions that need to be updated
        const { data: questionsToIncrement, error: fetchIncrementError } = await supabase
          .from('questions')
          .select('id, display_order')
          .eq('page_category', pageCategory)
          .gte('display_order', newOrder);
        
        if (fetchIncrementError) throw fetchIncrementError;
        
        // Update each question individually
        for (const question of questionsToIncrement || []) {
          const { error: updateError } = await supabase
            .from('questions')
            .update({ display_order: question.display_order + 1 })
            .eq('id', question.id);
          
          if (updateError) throw updateError;
        }
      }
      
      // Update the question with the new order and category
      const { error: questionUpdateError } = await supabase
        .from('questions')
        .update({ 
          display_order: newOrder,
          page_category: pageCategory 
        })
        .eq('id', questionId);
      
      if (questionUpdateError) throw questionUpdateError;
      
      console.log("Question order updated successfully");
      return true;
    } catch (error: unknown) {
      console.error("Error updating question order:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error updating question order: ${errorMessage}`);
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
      if (currentOrder >= count) {
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
      return await this.updateQuestionOrder(questionId, count + 1, newCategory);
    } catch (error: unknown) {
      console.error("Error moving question to category:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error moving question to category: ${errorMessage}`);
      return false;
    }
  }
};
