import { supabase } from '@/lib/supabase';
export class QuestionService {
    /**
     * Fetch all active questions from the database
     */
    static async fetchQuestions() {
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
    static async fetchQuestionsByCategory(category) {
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
    static async fetchDropdownOptions(questionId) {
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
    static async createQuestion(question) {
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
    static async updateQuestion(id, updates) {
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
    static async deleteQuestion(id) {
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
    static async createDropdownOption(option) {
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
    static async updateDropdownOption(id, updates) {
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
    static async deleteDropdownOption(id) {
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
