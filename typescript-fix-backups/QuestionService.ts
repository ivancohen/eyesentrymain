import { supabase } from '@/lib/supabase';

export interface DropdownOption {
  id: string;
  question_id: string;
  option_text: string;
  option_value: string;
  score: number;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
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

export class QuestionService {
  /**
   * Fetch all active questions from the database
   */
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
  
  /**
   * Fetch questions by category
   */
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
  
  /**
   * Fetch dropdown options for a specific question
   */
  static async fetchDropdownOptions(questionId: string): Promise<DropdownOption[]> {
    const { data, error } = await supabase
      .from('dropdown_options')
      .select('*')
      .eq('question_id', questionId)
      .order('id');
    
    if (error) {
      console.error(`Error fetching dropdown options for question ${questionId}:`, error);
      throw error;
    }
    
    return data || [];
  }
  
  /**
   * Create a new question
   */
  static async createQuestion(question: Partial<Question>): Promise<Question> {
    const { data, error } = await supabase
      .from('questions')
      .insert([question])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating question:', error);
      throw error;
    }
    
    return data;
  }
  
  /**
   * Update an existing question
   */
  static async updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating question ${id}:`, error);
      throw error;
    }
    
    return data;
  }
  
  /**
   * Delete a question (set status to Inactive)
   */
  static async deleteQuestion(id: string): Promise<void> {
    const { error } = await supabase
      .from('questions')
      .update({ status: 'Inactive' })
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting question ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a dropdown option for a question
   */
  static async createDropdownOption(option: Partial<DropdownOption>): Promise<DropdownOption> {
    const { data, error } = await supabase
      .from('dropdown_options')
      .insert([option])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating dropdown option:', error);
      throw error;
    }
    
    return data;
  }
  
  /**
   * Update a dropdown option
   */
  static async updateDropdownOption(id: string, updates: Partial<DropdownOption>): Promise<DropdownOption> {
    const { data, error } = await supabase
      .from('dropdown_options')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating dropdown option ${id}:`, error);
      throw error;
    }
    
    return data;
  }
  
  /**
   * Delete a dropdown option
   */
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
}
