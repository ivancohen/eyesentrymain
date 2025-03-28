// JavaScript version of verify-questions.js
// TypeScript version is available at verify-questions.ts
// This file is a simplified version without TypeScript syntax

import { supabase } from '@/lib/supabase';

// Simple class to verify questions
export class QuestionVerifier {
  constructor() {
    this.questionCache = new Map();
  }
  
  // Fetch questions
  async fetchQuestions() {
    try {
      if (this.questionCache.size > 0) {
        return Array.from(this.questionCache.values());
      }
      
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      
      // Cache the questions
      if (data) {
        data.forEach(question => {
          this.questionCache.set(question.id, question);
        });
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
  }
  
  // Fetch dropdown options
  async fetchDropdownOptions(questionId) {
    try {
      const response = await supabase
        .from('dropdown_options')
        .select('*')
        .eq('question_id', questionId)
        .order('created_at', { ascending: true });
      
      if (response.error) throw response.error;
      
      const data = response.data;
      return data ?? [];
    } catch (error) {
      console.error(`Error fetching dropdown options for question ${questionId}:`, error);
      return [];
    }
  }
  
  // Update question order
  async updateQuestionOrder(questionId, newOrder, pageCategory) {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ display_order: newOrder, page_category: pageCategory })
        .eq('id', questionId);
      
      if (error) throw error;
      
      // Clear cache to ensure fresh data
      this.questionCache.clear();
      
      return true;
    } catch (error) {
      console.error('Error updating question order:', error);
      return false;
    }
  }
  
  // Save question
  async saveQuestion(questionData, userId) {
    if (!questionData.question) {
      return { success: false };
    }
    
    try {
      // Add created_by if userId is provided
      if (userId) {
        questionData.created_by = userId;
      }
      
      // Insert or update the question
      const { data, error } = await supabase
        .from('questions')
        .upsert([questionData])
        .select();
      
      if (error) throw error;
      
      // Clear cache to ensure fresh data
      this.questionCache.clear();
      
      return { success: true, id: data?.[0]?.id };
    } catch (error) {
      console.error('Error saving question:', error);
      return { success: false };
    }
  }
  
  // Save multiple questions
  async saveMultipleQuestions(questions, userId) {
    try {
      // Add created_by to each question if userId is provided
      if (userId) {
        questions = questions.map(q => ({ ...q, created_by: userId }));
      }
      
      // Insert or update the questions
      const { data, error } = await supabase
        .from('questions')
        .upsert(questions)
        .select();
      
      if (error) throw error;
      
      // Clear cache to ensure fresh data
      this.questionCache.clear();
      
      return { 
        success: true, 
        ids: data?.map(q => q.id) || [] 
      };
    } catch (error) {
      console.error('Error saving multiple questions:', error);
      return { success: false };
    }
  }
  
  // Log question event
  async logQuestionEvent(eventType, questionId, details) {
    try {
      const { error } = await supabase
        .from('question_events')
        .insert([{
          event_type: eventType,
          question_id: questionId,
          details: details || {}
        }]);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error logging question event:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const questionVerifier = new QuestionVerifier();
