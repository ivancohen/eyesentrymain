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