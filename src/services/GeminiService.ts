import { supabase } from "@/lib/supabase";
import { ChatMessage } from "./ChatbotService";
import { Faq } from "./FaqService";

// This service integrates with Google's Gemini API for AI-powered responses

export class GeminiService {
  private apiKey: string;
  private apiEndpoint: string;
  private systemPrompt: string;

  constructor() {
    // Using the provided API key
    // In a production environment, this should be loaded from environment variables
    this.apiKey = 'AIzaSyCP9L57mnvRenrrnSR6c-5VsZjh1aIxK8U';
    // Updated endpoint to use the correct API version and model name
    // Using the most stable version of the API
    this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
    
    // Define the system prompt for the chatbot
    this.systemPrompt = `
You are an expert ophthalmology assistant for the EyeSentry glaucoma risk assessment application.
Your role is to help doctors understand and use the glaucoma risk assessment questionnaire effectively.

When responding to questions:
1. Be concise, accurate, and professional
2. Focus on providing evidence-based information about glaucoma risk factors, assessment techniques, and interpretation
3. Explain medical concepts clearly using appropriate terminology
4. When uncertain, acknowledge limitations rather than providing potentially incorrect information
5. Format responses with clear headings, bullet points, and paragraphs for readability

Key areas of expertise:
- Intraocular pressure measurement techniques and interpretation
- Cup-to-disc ratio assessment
- Family history risk factors for glaucoma
- Steroid use and its impact on glaucoma risk
- Age-related risk factors
- Interpretation of risk assessment scores
- Equipment recommendations for accurate measurements
- Patient communication strategies for explaining risk

Always maintain a helpful, informative tone while prioritizing medical accuracy.
`;
  }
  
  // Get questionnaire context from the database
  async getQuestionnaireContext(): Promise<string> {
    // Default context if tables don't exist or errors occur
    let context = "# Glaucoma Risk Assessment Questionnaire\n\n";
    context += "This questionnaire helps assess the risk of glaucoma based on various factors including:\n";
    context += "- Intraocular pressure measurements\n";
    context += "- Cup-to-disc ratio\n";
    context += "- Family history of glaucoma\n";
    context += "- Age-related factors\n";
    context += "- Steroid use history\n\n";
    
    try {
      // Try to get questions from the database - try both table names
      let questions = null;
      
      // First try patient_questions table
      try {
        const { data, error } = await supabase
          .from('patient_questions')
          .select('*')
          .eq('is_active', true)
          .order('display_order');
          
        if (!error && data) {
          questions = data;
        }
      } catch (e) {
        // Silently continue to next attempt
      }
      
      // If that fails, try questions table
      if (!questions) {
        try {
          const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('status', 'Active')
            .order('display_order');
            
          if (!error && data) {
            questions = data;
          }
        } catch (e) {
          // Silently continue
        }
      }
      
      // If we still don't have questions, return default context
      if (!questions || questions.length === 0) {
        return context;
      }
      
      // Get dropdown options - don't filter by is_active as it might not exist
      const { data: options, error: optionsError } = await supabase
        .from('dropdown_options')
        .select('*');
        
      if (optionsError) {
        // Silently continue without options
        return context;
      }
      
      // If we have questions, create a more detailed context
      if (questions && questions.length > 0) {
        // Reset context with more detailed information
        context = "# Glaucoma Risk Assessment Questionnaire\n\n";
        
        questions.forEach(question => {
          context += `## Question: ${question.question_text}\n`;
          context += `Type: ${question.question_type}\n`;
          
          if (question.question_type === 'dropdown') {
            context += "Options:\n";
            const questionOptions = options.filter(opt => opt.question_id === question.id);
            questionOptions.forEach(opt => {
              context += `- ${opt.option_text} (Score: ${opt.score_value})\n`;
            });
          }
          
          if (question.help_text) {
            context += `Help text: ${question.help_text}\n`;
          }
          
          context += "\n";
        });
      }
      
      return context;
    } catch (error) {
      console.error("Error getting questionnaire context:", error);
      return context; // Return the default context on error
    }
  }

  // Generate a response using the Gemini API
  async generateResponse(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    relevantFaqs: Faq[] = [],
    questionnaireContext: string = ""
  ): Promise<string> {
    try {
      // Format conversation history
      const formattedHistory = conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      
      // Format FAQs as context
      let faqContext = "";
      if (relevantFaqs.length > 0) {
        faqContext = "# Relevant FAQs\n\n";
        relevantFaqs.forEach(faq => {
          faqContext += `## Q: ${faq.question}\n`;
          faqContext += `A: ${faq.answer}\n\n`;
        });
      }
      
      // Combine all context
      const fullContext = `
${this.systemPrompt}

${questionnaireContext}

${faqContext}

Remember to be helpful, accurate, and professional in your response.
`;
      
      // Prepare the request
      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [{ text: fullContext }]
          },
          ...formattedHistory,
          {
            role: "user",
            parts: [{ text: userMessage }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      };
      
      // Make the API request
      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error("Gemini API error:", await response.text());
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        console.error("Gemini API returned no candidates:", data);
        throw new Error("No response generated");
      }
      
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Error generating response with Gemini:", error);
      return "I'm sorry, I encountered an error processing your request. Please try again later.";
    }
  }
}

// Create and export singleton instance
export const geminiService = new GeminiService();