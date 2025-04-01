# Service Layer Updates

Below are the enhanced service layer implementations for `QuestionService` and `RiskAssessmentService`.

## Enhanced QuestionService

Create a file named `src/services/QuestionService.enhanced.ts` with the following content:

```typescript
import { supabase } from "@/lib/supabase";

export interface Question {
  id: string;
  question: string;
  tooltip?: string;
  status: string;
  page_category: string;
  question_type: string;
  display_order: number;
  conditional_parent_id?: string;
  conditional_required_value?: string;
  conditional_display_mode?: string;
  risk_score: number;
  has_dropdown_options: boolean;
}

export interface DropdownOption {
  id: string;
  question_id: string;
  option_text: string;
  option_value: string;
  score: number;
  display_order: number;
}

export class QuestionService {
  // Fetch all questions with proper ordering
  static async fetchQuestions(): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('page_category', { ascending: true })
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
    
    return data || [];
  }
  
  // Create a new question with proper ordering
  static async createQuestion(question: Partial<Question>): Promise<Question> {
    // The display_order will be set by the database trigger
    const newQuestion = {
      ...question,
      status: question.status || 'Active',
      question_type: question.question_type || 'text',
      risk_score: question.risk_score || 0
    };
    
    // Remove created_by to avoid foreign key issues
    delete newQuestion.created_by;
    
    const { data, error } = await supabase
      .from('questions')
      .insert([newQuestion])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating question:', error);
      throw error;
    }
    
    return data;
  }
  
  // Update a question
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
  
  // Update question order
  static async updateQuestionOrder(id: string, newOrder: number, category: string): Promise<void> {
    // Get current question
    const { data: currentQuestion, error: fetchError } = await supabase
      .from('questions')
      .select('display_order')
      .eq('id', id)
      .single();
    
    if (fetchError || !currentQuestion) {
      console.error(`Error fetching question ${id}:`, fetchError);
      throw fetchError;
    }
    
    const currentOrder = currentQuestion.display_order;
    
    // Call the RPC function to update order
    const { error: transactionError } = await supabase.rpc('update_question_order', {
      question_id: id,
      new_order: newOrder,
      category: category,
      current_order: currentOrder
    });
    
    if (transactionError) {
      console.error('Error updating question order:', transactionError);
      throw transactionError;
    }
  }
  
  // Fetch dropdown options with proper ordering
  static async fetchDropdownOptions(questionId: string): Promise<DropdownOption[]> {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    console.log(`Fetching dropdown options for question ID: ${questionId} at ${timestamp}`);
    
    const { data, error } = await supabase
      .from('dropdown_options')
      .select('*')
      .eq('question_id', questionId)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error(`Error fetching dropdown options for question ${questionId}:`, error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} dropdown options for question ${questionId}`);
    return data || [];
  }
  
  // Create a dropdown option with proper ordering
  static async createDropdownOption(option: Partial<DropdownOption>): Promise<DropdownOption> {
    // The display_order will be set by the database trigger
    const newOption = {
      ...option,
      score: option.score || 0
    };
    
    // Insert the option
    const { data, error } = await supabase
      .from('dropdown_options')
      .insert([newOption])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating dropdown option:', error);
      throw error;
    }
    
    // The trigger sync_dropdown_score_trigger will handle syncing with risk_assessment_config
    
    return data;
  }
  
  // Update a dropdown option
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
    
    // The trigger sync_dropdown_score_trigger will handle syncing with risk_assessment_config
    
    return data;
  }
  
  // Update dropdown option order
  static async updateDropdownOptionOrder(id: string, newOrder: number, questionId: string): Promise<void> {
    // Get current option
    const { data: currentOption, error: fetchError } = await supabase
      .from('dropdown_options')
      .select('display_order')
      .eq('id', id)
      .single();
    
    if (fetchError || !currentOption) {
      console.error(`Error fetching dropdown option ${id}:`, fetchError);
      throw fetchError;
    }
    
    const currentOrder = currentOption.display_order;
    
    // Call the RPC function to update order
    const { error: transactionError } = await supabase.rpc('update_dropdown_option_order', {
      option_id: id,
      new_order: newOrder,
      question_id: questionId,
      current_order: currentOrder
    });
    
    if (transactionError) {
      console.error('Error updating dropdown option order:', transactionError);
      throw transactionError;
    }
  }
  
  // Delete a dropdown option
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
```

## Enhanced RiskAssessmentService

Create a file named `src/services/RiskAssessmentService.enhanced.ts` with the following content:

```typescript
import { supabase } from "@/lib/supabase";

export interface RiskAssessmentConfig {
  id: string;
  question_id: string;
  option_value: string;
  score: number;
}

export interface RiskAssessmentResult {
  total_score: number;
  contributing_factors: {
    question: string;
    answer: string;
    score: number;
  }[];
  advice: string;
  risk_level: string;
}

export class RiskAssessmentService {
  // Get all risk assessment configurations
  static async getConfigurations(): Promise<RiskAssessmentConfig[]> {
    const { data, error } = await supabase
      .from('risk_assessment_config')
      .select('*');
    
    if (error) {
      console.error('Error fetching risk configurations:', error);
      throw error;
    }
    
    return data || [];
  }
  
  // Calculate risk score based on answers - fully admin-driven
  static async calculateRiskScore(answers: Record<string, string>): Promise<RiskAssessmentResult> {
    console.log("Calculating risk score for answers:", answers);
    
    // Get all configurations and questions
    const [configs, questions] = await Promise.all([
      this.getConfigurations(),
      this.getAllQuestions()
    ]);
    
    console.log(`Fetched ${configs.length} risk configs and ${questions.length} questions`);
    
    // Calculate total score and collect contributing factors
    let totalScore = 0;
    const contributingFactors: { question: string; answer: string; score: number }[] = [];
    
    // Process each answer to calculate score
    for (const [questionId, answerValue] of Object.entries(answers)) {
      // Skip empty answers
      if (!answerValue) continue;
      
      console.log(`Processing answer: ${questionId} = ${answerValue}`);
      
      // Find configuration for this answer
      const config = configs.find(c => 
        c.question_id === questionId && 
        c.option_value === answerValue
      );
      
      if (config) {
        console.log(`Found config with score ${config.score} for ${questionId}=${answerValue}`);
        totalScore += config.score;
        
        // Find the question text for nicer output
        const question = questions.find(q => q.id === questionId);
        
        contributingFactors.push({
          question: question?.question || questionId,
          answer: answerValue,
          score: config.score
        });
      } else {
        console.log(`No score configuration found for ${questionId}=${answerValue}`);
      }
    }
    
    console.log(`Total calculated score: ${totalScore}`);
    
    // Determine risk level based on score
    let riskLevel = "Unknown";
    let advice = "No specific advice available.";
    
    if (totalScore <= 2) {
      riskLevel = "Low";
      advice = "Regular eye exams as recommended by your optometrist are sufficient.";
    } else if (totalScore <= 5) {
      riskLevel = "Moderate";
      advice = "Consider more frequent eye exams and discuss with your doctor about potential preventive measures.";
    } else {
      riskLevel = "High";
      advice = "Recommend eye exams every 2–3 years up to the age of 40 (or annually if three or more risk factors) and a comprehensive screening eye exam at 40 years old. Eye examination annually after age 40.";
    }
    
    // Try to get advice from database
    try {
      const { data: adviceData } = await supabase
        .from('risk_assessment_advice')
        .select('*')
        .eq('risk_level', riskLevel)
        .single();
      
      if (adviceData && adviceData.advice) {
        advice = adviceData.advice;
      }
    } catch (error) {
      console.warn('Could not fetch advice from database:', error);
    }
    
    return {
      total_score: totalScore,
      contributing_factors: contributingFactors,
      advice,
      risk_level: riskLevel
    };
  }
  
  // Get all questions
  private static async getAllQuestions() {
    const { data, error } = await supabase
      .from('questions')
      .select('*');
    
    if (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
    
    return data || [];
  }
}
```

## How to Use

1. Replace the existing `QuestionService.ts` and `RiskAssessmentService.ts` files with the content of these enhanced versions.
2. Update any imports in your application to use the enhanced services.

These enhanced services provide the necessary functionality to support the new features, including:
- Proper ordering of questions and options
- Handling of conditional logic
- Admin-driven risk assessment scoring
- Synchronization between admin settings and risk assessment

After updating the service layer, you can proceed with updating the admin interface and frontend questionnaire components.