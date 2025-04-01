import { supabase } from "@/lib/supabase";
import { geminiService } from "./GeminiService";
import { faqService } from "./FaqService";

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export class ChatbotService {
  // Get conversation history for current user
  async getConversationHistory(): Promise<Conversation | null> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      
      // Check if the table exists first
      const { error: tableCheckError } = await supabase
        .from('chatbot_conversations')
        .select('id')
        .limit(1);
      
      // If the table doesn't exist yet, return null
      if (tableCheckError && tableCheckError.code === '42P01') { // Table doesn't exist
        console.log("Chatbot tables not set up yet");
        return null;
      }
      
      try {
        const { data, error } = await supabase
          .rpc('get_conversation_history', { user_id_param: userData.user.id });
          
        if (error) {
          console.error("Error fetching conversation history:", error);
          return null;
        }
        
        return data;
      } catch (rpcError) {
        console.error("RPC function not available yet:", rpcError);
        return null;
      }
    } catch (error) {
      console.error("Error fetching conversation history:", error);
      return null;
    }
  }
  
  // Send a message and get a response
  async sendMessage(message: string): Promise<ChatMessage> {
    try {
      // 1. Get conversation history
      const history = await this.getConversationHistory();
      const messages = history?.messages || [];
      
      // 2. Search for relevant FAQs
      let faqs = [];
      try {
        faqs = await faqService.searchFaqs(message);
      } catch (error) {
        console.error("Error searching FAQs:", error);
        // Continue without FAQs
      }
      
      // 3. Get questionnaire context
      let questionnaireContext = "";
      try {
        questionnaireContext = await geminiService.getQuestionnaireContext();
      } catch (error) {
        console.error("Error getting questionnaire context:", error);
        // Continue without context
      }
      
      // 4. Generate response using Gemini
      const response = await geminiService.generateResponse(
        message,
        messages,
        faqs,
        questionnaireContext
      );
      
      // 5. Save conversation
      const newMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };
      
      const updatedMessages = [...messages, newMessage, assistantMessage];
      
      try {
        await this.saveConversation(updatedMessages);
      } catch (error) {
        console.error("Error saving conversation:", error);
        // Continue without saving
      }
      
      return assistantMessage;
    } catch (error) {
      console.error("Error sending message:", error);
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // Save conversation to database
  private async saveConversation(messages: ChatMessage[]): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      // Check if the table exists first
      const { error: tableCheckError } = await supabase
        .from('chatbot_conversations')
        .select('id')
        .limit(1);
      
      // If the table doesn't exist yet, return
      if (tableCheckError && tableCheckError.code === '42P01') { // Table doesn't exist
        console.log("Chatbot tables not set up yet, can't save conversation");
        return;
      }
      
      try {
        await supabase.rpc('save_conversation', {
          user_id_param: userData.user.id,
          messages_param: messages
        });
      } catch (rpcError) {
        console.error("RPC function not available yet:", rpcError);
      }
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  }
  
  // Clear conversation history for current user
  async clearConversationHistory(): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      // Check if the table exists first
      const { error: tableCheckError } = await supabase
        .from('chatbot_conversations')
        .select('id')
        .limit(1);
      
      // If the table doesn't exist yet, return
      if (tableCheckError && tableCheckError.code === '42P01') { // Table doesn't exist
        console.log("Chatbot tables not set up yet, nothing to clear");
        return;
      }
      
      try {
        // Try direct deletion first
        const { error: deleteError } = await supabase
          .from('chatbot_conversations')
          .delete()
          .eq('user_id', userData.user.id);
          
        if (deleteError) {
          console.log("Direct deletion failed, trying RPC method");
          // Fallback to RPC method
          await supabase.rpc('save_conversation', {
            user_id_param: userData.user.id,
            messages_param: []
          });
        }
      } catch (rpcError) {
        console.error("Error clearing conversation:", rpcError);
      }
    } catch (error) {
      console.error("Error clearing conversation history:", error);
    }
  }
  
  // Reset conversation to initial state with welcome message
  async resetConversation(): Promise<void> {
    try {
      // First clear the existing conversation
      await this.clearConversationHistory();
      
      // Then create a welcome message
      const welcomeMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Hello! I'm your EyeSentry assistant. I can help you with questions about the glaucoma risk assessment questionnaire.

How can I assist you today?`,
        timestamp: new Date().toISOString()
      };
      
      // Save the welcome message
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      try {
        await supabase.rpc('save_conversation', {
          user_id_param: userData.user.id,
          messages_param: [welcomeMessage]
        });
      } catch (error) {
        console.error("Error saving welcome message:", error);
      }
    } catch (error) {
      console.error("Error resetting conversation:", error);
    }
  }
}

// Create and export singleton instance
const chatbotServiceInstance = new ChatbotService();
export const chatbotService = chatbotServiceInstance;
export default chatbotServiceInstance;