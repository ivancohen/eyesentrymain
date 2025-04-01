import { supabase } from '@/lib/supabase';

// Define interfaces
export interface DropdownOption {
  id?: string;
  question_id?: string;
  option_text: string;
  option_value: string;
  score: number;
  display_order?: number;
}

export interface Question {
  id: string;
  question: string;
  tooltip?: string;
  page_category: string;
  question_type: string;
  display_order: number;
  risk_score: number;
  has_dropdown_options: boolean;
  has_conditional_items: boolean;
  has_dropdown_scoring: boolean;
  status: string;
  created_at: string;
  created_by?: string;
}

export interface ConditionalItem {
  id?: string;
  question_id: string;
  parent_question_id: string;
  required_value: string;
  display_mode: 'show' | 'hide' | 'disable';
  created_at?: string;
  condition_type?: string;
  condition_value?: string;
  response_message?: string;
  score?: number;
}

export class QuestionService {
  // Fetch questions
  static async fetchQuestions(): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('status', 'Active')
      .order('page_category')
      .order('display_order');
    
    if (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
    
    return data || [];
  }
  
  // Fetch questions by category
  static async fetchQuestionsByCategory(category: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('status', 'Active')
      .eq('page_category', category)
      .order('display_order');
    
    if (error) {
      console.error(`Error fetching questions for category ${category}:`, error);
      throw error;
    }
    
    return data || [];
  }
  
  // Fetch dropdown options
  static async fetchDropdownOptions(questionId: string): Promise<DropdownOption[]> {
    const timestamp = new Date().getTime();
    console.log(`[QuestionService] Fetching dropdown options for question ${questionId} at ${timestamp}`);
    
    const { data, error } = await supabase
      .from('dropdown_options')
      .select('*')
      .eq('question_id', questionId)
      .order('display_order');
    
    if (error) {
      console.error(`Error fetching dropdown options for question ${questionId}:`, error);
      throw error;
    }
    
    console.log(`[QuestionService] Found ${data?.length || 0} dropdown options`);
    return data || [];
  }
  
  // Create question
  static async createQuestion(question: Partial<Question>): Promise<Question> {
    console.log('[QuestionService] Creating new question:', question);
    
    // Remove created_by field to avoid foreign key constraint violation
    const { created_by, ...safeQuestion } = question;
    
    // Set default values for required fields if not provided
    const questionToInsert = {
      ...safeQuestion,
      status: safeQuestion.status || 'Active',
      risk_score: safeQuestion.risk_score || 0,
      display_order: safeQuestion.display_order || await this.getNextDisplayOrder(safeQuestion.page_category || ''),
      has_dropdown_options: safeQuestion.has_dropdown_options || false,
      has_conditional_items: safeQuestion.has_conditional_items || false,
      has_dropdown_scoring: safeQuestion.has_dropdown_scoring || false
    };
    
    const { data, error } = await supabase
      .from('questions')
      .insert([questionToInsert])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating question:', error);
      throw error;
    }
    
    console.log('[QuestionService] Question created successfully:', data);
    return data;
  }

  // Update an existing question
  static async updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
    console.log(`[QuestionService] Updating question ${id}:`, updates);
    
    // Remove created_by if present to avoid constraint issues
    const { created_by, ...safeUpdates } = updates;
    
    const { data, error } = await supabase
      .from('questions')
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error(`Error updating question ${id}:`, error);
      throw error;
    }
    
    console.log(`[QuestionService] Question ${id} updated successfully:`, data);
    return data;
  }

  // Fetch conditional items
  static async fetchConditionalItems(questionId: string): Promise<ConditionalItem[]> {
    const { data, error } = await supabase
      .from('conditional_items')
      .select('*')
      .eq('question_id', questionId);
    
    if (error) {
      console.error(`Error fetching conditional items for question ${questionId}:`, error);
      throw error;
    }
    
    return data || [];
  }

  // Delete conditional item
  static async deleteConditionalItem(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('conditional_items')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting conditional item ${id}:`, error);
      throw error;
    }
    
    return true;
  }

  // Save conditional item
  static async saveConditionalItem(itemData: Partial<ConditionalItem>): Promise<ConditionalItem> {
    if (itemData.id) {
      // Update existing item
      const { data, error } = await supabase
        .from('conditional_items')
        .update(itemData)
        .eq('id', itemData.id)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating conditional item ${itemData.id}:`, error);
        throw error;
      }
      
      return data;
    } else {
      // Create new item
      const { data, error } = await supabase
        .from('conditional_items')
        .insert([itemData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating conditional item:', error);
        throw error;
      }
      
      return data;
    }
  }
  
  // Create a dropdown option
  static async createDropdownOption(option: Partial<DropdownOption>): Promise<DropdownOption> {
    try {
      const { data, error } = await supabase
        .from('dropdown_options')
        .insert({
          option_text: option.option_text,
          option_value: option.option_value,
          score: option.score || 0,
          question_id: option.question_id,
          display_order: option.display_order || 999
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating dropdown option:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in createDropdownOption:', error);
      throw error;
    }
  }

  // Update a dropdown option
  static async updateDropdownOption(id: string, updates: Partial<DropdownOption>): Promise<DropdownOption> {
    try {
      const { data, error } = await supabase
        .from('dropdown_options')
        .update({
          option_text: updates.option_text,
          option_value: updates.option_value,
          score: updates.score || 0,
          display_order: updates.display_order
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error(`Error updating dropdown option ${id}:`, error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateDropdownOption:', error);
      throw error;
    }
  }
  
  // Delete dropdown option
  static async deleteDropdownOption(id: string): Promise<void> {
    const { error } = await supabase
      .from('dropdown_options')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting dropdown option ${id}:`, error);
      throw error;
    }
  }

  // Save dropdown option
  static async saveDropdownOption(optionData: any) {
    if (optionData.id) {
      return this.updateDropdownOption(optionData.id, optionData);
    } else {
      return this.createDropdownOption(optionData);
    }
  }

  // Delete question (soft delete by updating status)
  static async deleteQuestion(id: string): Promise<boolean> {
    console.log(`[QuestionService] Deleting question ${id}`);
    
    const { error: updateError } = await supabase
      .from('questions')
      .update({ status: 'Deleted' })
      .eq('id', id);

    if (updateError) {
      console.error(`Error soft deleting question ${id}:`, updateError);
      throw updateError;
    }
    
    console.log(`[QuestionService] Question ${id} marked as deleted.`);
    return true;
  }

  // Reorder dropdown options
  static async reorderDropdownOptions(updates: Array<{id: string, display_order: number}>): Promise<void> {
    try {
      if (!updates || updates.length === 0) return;
      
      for (const update of updates) {
        await supabase
          .from('dropdown_options')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    } catch (err) {
      console.error('Error in reorderDropdownOptions:', err);
      throw err;
    }
  }

  // Get the next display order for a category
  static async getNextDisplayOrder(category: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('display_order')
        .eq('page_category', category)
        .eq('status', 'Active')
        .order('display_order', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error(`Error getting next display order for category ${category}:`, error);
        return 1; // Default to 1 if there's an error
      }
      
      if (data && data.length > 0) {
        return (data[0].display_order || 0) + 1;
      }
      
      return 1; // Default to 1 if there are no questions in the category
    } catch (error) {
      console.error(`Error in getNextDisplayOrder for category ${category}:`, error);
      return 1; // Default to 1 if there's an error
    }
  }

  // Move a question up in its category
  static async moveQuestionUp(questionId: string): Promise<boolean> {
    try {
      // Get the question
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single();
      
      if (questionError || !questionData) {
        console.error(`Error fetching question ${questionId}:`, questionError);
        return false;
      }
      
      const category = questionData.page_category;
      const currentOrder = questionData.display_order;
      
      // Find the question with the next lower display_order in the same category
      const { data: prevQuestions, error: prevError } = await supabase
        .from('questions')
        .select('*')
        .eq('page_category', category)
        .eq('status', 'Active')
        .lt('display_order', currentOrder)
        .order('display_order', { ascending: false })
        .limit(1);
      
      if (prevError) {
        console.error(`Error finding previous question in category ${category}:`, prevError);
        return false;
      }
      
      if (!prevQuestions || prevQuestions.length === 0) {
        // Already at the top
        return true;
      }
      
      const prevQuestion = prevQuestions[0];
      const prevOrder = prevQuestion.display_order;
      
      // Swap display orders
      const { error: updateCurrentError } = await supabase
        .from('questions')
        .update({ display_order: prevOrder })
        .eq('id', questionId);
      
      if (updateCurrentError) {
        console.error(`Error updating current question ${questionId}:`, updateCurrentError);
        return false;
      }
      
      const { error: updatePrevError } = await supabase
        .from('questions')
        .update({ display_order: currentOrder })
        .eq('id', prevQuestion.id);
      
      if (updatePrevError) {
        console.error(`Error updating previous question ${prevQuestion.id}:`, updatePrevError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Error in moveQuestionUp for question ${questionId}:`, error);
      return false;
    }
  }

  // Move a question down in its category
  static async moveQuestionDown(questionId: string): Promise<boolean> {
    try {
      // Get the question
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single();
      
      if (questionError || !questionData) {
        console.error(`Error fetching question ${questionId}:`, questionError);
        return false;
      }
      
      const category = questionData.page_category;
      const currentOrder = questionData.display_order;
      
      // Find the question with the next higher display_order in the same category
      const { data: nextQuestions, error: nextError } = await supabase
        .from('questions')
        .select('*')
        .eq('page_category', category)
        .eq('status', 'Active')
        .gt('display_order', currentOrder)
        .order('display_order')
        .limit(1);
      
      if (nextError) {
        console.error(`Error finding next question in category ${category}:`, nextError);
        return false;
      }
      
      if (!nextQuestions || nextQuestions.length === 0) {
        // Already at the bottom
        return true;
      }
      
      const nextQuestion = nextQuestions[0];
      const nextOrder = nextQuestion.display_order;
      
      // Swap display orders
      const { error: updateCurrentError } = await supabase
        .from('questions')
        .update({ display_order: nextOrder })
        .eq('id', questionId);
      
      if (updateCurrentError) {
        console.error(`Error updating current question ${questionId}:`, updateCurrentError);
        return false;
      }
      
      const { error: updateNextError } = await supabase
        .from('questions')
        .update({ display_order: currentOrder })
        .eq('id', nextQuestion.id);
      
      if (updateNextError) {
        console.error(`Error updating next question ${nextQuestion.id}:`, updateNextError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Error in moveQuestionDown for question ${questionId}:`, error);
      return false;
    }
  }

  // Move a question to a different category
  static async moveQuestionToCategory(questionId: string, newCategory: string): Promise<boolean> {
    try {
      // Get the question
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single();
      
      if (questionError || !questionData) {
        console.error(`Error fetching question ${questionId}:`, questionError);
        return false;
      }
      
      // If already in the target category, do nothing
      if (questionData.page_category === newCategory) {
        return true;
      }
      
      // Get the next display order for the new category
      const nextOrder = await this.getNextDisplayOrder(newCategory);
      
      // Update the question with the new category and display order
      const { error: updateError } = await supabase
        .from('questions')
        .update({ 
          page_category: newCategory,
          display_order: nextOrder
        })
        .eq('id', questionId);
      
      if (updateError) {
        console.error(`Error moving question ${questionId} to category ${newCategory}:`, updateError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Error in moveQuestionToCategory for question ${questionId} to category ${newCategory}:`, error);
      return false;
    }
  }

  // Reorder questions within a category
  static async reorderQuestionsInCategory(category: string, updates: Array<{id: string, display_order: number}>): Promise<boolean> {
    try {
      if (!updates || updates.length === 0) return true;
      
      for (const update of updates) {
        const { error } = await supabase
          .from('questions')
          .update({ display_order: update.display_order })
          .eq('id', update.id)
          .eq('page_category', category); // Ensure we're only updating questions in the specified category
        
        if (error) {
          console.error(`Error updating question ${update.id} display order:`, error);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error in reorderQuestionsInCategory for category ${category}:`, error);
      return false;
    }
  }
}

// Create and export a singleton instance
export const questionService = new QuestionService();