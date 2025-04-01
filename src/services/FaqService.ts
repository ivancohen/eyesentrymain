import { supabase } from "@/lib/supabase";

export interface FaqCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Faq {
  id: string;
  categoryId: string;
  category?: string;
  question: string;
  answer: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export class FaqService {
  // Get all FAQ categories
  async getCategories(): Promise<FaqCategory[]> {
    try {
      const { data, error } = await supabase
        .from('chatbot_faq_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
        
      if (error) {
        console.error("Error fetching FAQ categories:", error);
        return [];
      }
      
      return data.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description || '',
        createdAt: category.created_at,
        updatedAt: category.updated_at,
        isActive: category.is_active
      }));
    } catch (error) {
      console.error("Error fetching FAQ categories:", error);
      return [];
    }
  }
  
  // Get FAQs by category
  async getFaqsByCategory(categoryId: string): Promise<Faq[]> {
    try {
      const { data, error } = await supabase
        .from('chatbot_faqs')
        .select(`
          *,
          chatbot_faq_categories(name)
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('priority', { ascending: false });
        
      if (error) {
        console.error("Error fetching FAQs:", error);
        return [];
      }
      
      return data.map(faq => ({
        id: faq.id,
        categoryId: faq.category_id,
        category: faq.chatbot_faq_categories?.name || '',
        question: faq.question,
        answer: faq.answer,
        priority: faq.priority,
        createdAt: faq.created_at,
        updatedAt: faq.updated_at,
        isActive: faq.is_active
      }));
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      return [];
    }
  }
  
  // Get all FAQs
  async getAllFaqs(): Promise<Faq[]> {
    try {
      const { data, error } = await supabase
        .from('chatbot_faqs')
        .select(`
          *,
          chatbot_faq_categories(name)
        `)
        .eq('is_active', true)
        .order('priority', { ascending: false });
        
      if (error) {
        console.error("Error fetching FAQs:", error);
        return [];
      }
      
      return data.map(faq => ({
        id: faq.id,
        categoryId: faq.category_id,
        category: faq.chatbot_faq_categories?.name || '',
        question: faq.question,
        answer: faq.answer,
        priority: faq.priority,
        createdAt: faq.created_at,
        updatedAt: faq.updated_at,
        isActive: faq.is_active
      }));
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      return [];
    }
  }
  
  // Create a new FAQ category
  async createCategory(category: Omit<FaqCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<FaqCategory | null> {
    try {
      const { data, error } = await supabase
        .from('chatbot_faq_categories')
        .insert({
          name: category.name,
          description: category.description,
          is_active: category.isActive
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error creating FAQ category:", error);
        return null;
      }
      
      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        isActive: data.is_active
      };
    } catch (error) {
      console.error("Error creating FAQ category:", error);
      return null;
    }
  }
  
  // Update an FAQ category
  async updateCategory(id: string, category: Partial<FaqCategory>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chatbot_faq_categories')
        .update({
          name: category.name,
          description: category.description,
          is_active: category.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) {
        console.error("Error updating FAQ category:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error updating FAQ category:", error);
      return false;
    }
  }
  
  // Delete an FAQ category
  async deleteCategory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chatbot_faq_categories')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Error deleting FAQ category:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting FAQ category:", error);
      return false;
    }
  }
  
  // Create a new FAQ
  async createFaq(faq: Omit<Faq, 'id' | 'createdAt' | 'updatedAt' | 'category'>): Promise<Faq | null> {
    try {
      const { data, error } = await supabase
        .from('chatbot_faqs')
        .insert({
          category_id: faq.categoryId,
          question: faq.question,
          answer: faq.answer,
          priority: faq.priority,
          is_active: faq.isActive
        })
        .select(`
          *,
          chatbot_faq_categories(name)
        `)
        .single();
        
      if (error) {
        console.error("Error creating FAQ:", error);
        return null;
      }
      
      return {
        id: data.id,
        categoryId: data.category_id,
        category: data.chatbot_faq_categories?.name || '',
        question: data.question,
        answer: data.answer,
        priority: data.priority,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        isActive: data.is_active
      };
    } catch (error) {
      console.error("Error creating FAQ:", error);
      return null;
    }
  }
  
  // Update an FAQ
  async updateFaq(id: string, faq: Partial<Faq>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chatbot_faqs')
        .update({
          category_id: faq.categoryId,
          question: faq.question,
          answer: faq.answer,
          priority: faq.priority,
          is_active: faq.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) {
        console.error("Error updating FAQ:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error updating FAQ:", error);
      return false;
    }
  }
  
  // Delete an FAQ
  async deleteFaq(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chatbot_faqs')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Error deleting FAQ:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      return false;
    }
  }
  
  // Search FAQs
  async searchFaqs(query: string): Promise<Faq[]> {
    try {
      if (!query.trim()) {
        return [];
      }
      
      // Try direct query first - more reliable than RPC
      try {
        const { data, error } = await supabase
          .from('chatbot_faqs')
          .select(`
            *,
            chatbot_faq_categories(name)
          `)
          .eq('is_active', true)
          .or(`question.ilike.%${query}%,answer.ilike.%${query}%`)
          .order('priority', { ascending: false })
          .limit(5);
          
        if (!error && data && data.length > 0) {
          return data.map(faq => ({
            id: faq.id,
            categoryId: faq.category_id,
            category: faq.chatbot_faq_categories?.name || '',
            question: faq.question,
            answer: faq.answer,
            priority: faq.priority,
            createdAt: faq.created_at,
            updatedAt: faq.updated_at,
            isActive: faq.is_active
          }));
        }
      } catch (directError) {
        // Silently continue to next attempt
      }
      
      // If direct query fails, try RPC as fallback
      try {
        const { data, error } = await supabase
          .rpc('search_faqs', { search_query: query });
          
        if (!error && data && data.length > 0) {
          return data.map((faq: any) => ({
            id: faq.id,
            categoryId: '',
            category: faq.category,
            question: faq.question,
            answer: faq.answer,
            priority: faq.priority,
            createdAt: '',
            updatedAt: '',
            isActive: true
          }));
        }
      } catch (rpcError) {
        // Silently continue to fallback
      }
      
      // If all attempts fail, return empty array
      return [];
    } catch (error) {
      console.error("Error searching FAQs:", error);
      return [];
    }
  }
}

// Create and export singleton instance
export const faqService = new FaqService();