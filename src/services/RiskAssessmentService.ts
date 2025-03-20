import { supabase } from "@/lib/supabase";
import { QUESTIONNAIRE_PAGES } from '@/constants/questionnaireConstants';
import type { QuestionItem } from '@/constants/questionnaireConstants';

export interface RiskAssessmentConfig {
  id: string;
  question_id: string;
  option_value: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface RiskAssessmentAdvice {
  id?: string;
  min_score: number;
  max_score: number;
  advice: string;
  risk_level: string;
  created_at?: string;
  updated_at?: string;
}

export interface RiskAssessmentResult {
  total_score: number;
  contributing_factors: {
    question: string;
    answer: string;
    score: number;
  }[];
  advice: string;
}

export class RiskAssessmentService {
  // Get all risk assessment configurations
  async getConfigurations(): Promise<RiskAssessmentConfig[]> {
    const { data, error } = await supabase
      .from('risk_assessment_config')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get all risk assessment advice
  async getAdvice(): Promise<RiskAssessmentAdvice[]> {
    try {
      // First try to get advice with risk_level
      const { data, error } = await supabase
        .from('risk_assessment_advice')
        .select('*')
        .order('min_score', { ascending: true });

      if (error) {
        // If we get a 406 error, it means the risk_level column doesn't exist yet
        if (error.code === '406') {
          // Try to get advice without risk_level
          const { data: dataWithoutRisk, error: errorWithoutRisk } = await supabase
            .from('risk_assessment_advice')
            .select('id, min_score, max_score, advice, created_at, updated_at')
            .order('min_score', { ascending: true });

          if (errorWithoutRisk) throw errorWithoutRisk;

          // Map the data to include risk_level based on score ranges
          return (dataWithoutRisk || []).map(item => ({
            ...item,
            risk_level: item.min_score <= 3 ? 'low' : 
                       item.min_score <= 7 ? 'moderate' : 'high'
          }));
        }
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting advice:', error);
      throw error;
    }
  }

  // Update risk assessment configuration
  async updateConfiguration(config: Partial<RiskAssessmentConfig>): Promise<RiskAssessmentConfig> {
    const { data, error } = await supabase
      .from('risk_assessment_config')
      .upsert(config)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update risk assessment advice
  async updateAdvice(advice: Partial<RiskAssessmentAdvice>): Promise<RiskAssessmentAdvice> {
    if (!advice.risk_level) {
      throw new Error('Risk level is required');
    }

    try {
      // First try to find existing advice by risk level
      const { data: existingAdvice, error: findError } = await supabase
        .from('risk_assessment_advice')
        .select('*')
        .eq('risk_level', advice.risk_level)
        .single();

      if (findError) {
        // If we get a 406 error, it means the risk_level column doesn't exist yet
        if (findError.code === '406') {
          // Try to find by score range instead
          const { data: existingByScore, error: scoreError } = await supabase
            .from('risk_assessment_advice')
            .select('*')
            .eq('min_score', advice.min_score)
            .eq('max_score', advice.max_score)
            .single();

          if (scoreError && scoreError.code !== 'PGRST116') throw scoreError;

          if (existingByScore) {
            // Update existing advice
            const { data, error } = await supabase
              .from('risk_assessment_advice')
              .update({
                min_score: advice.min_score,
                max_score: advice.max_score,
                advice: advice.advice,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingByScore.id)
              .select()
              .single();

            if (error) throw error;
            return data;
          }
        } else if (findError.code !== 'PGRST116') {
          throw findError;
        }
      }

      if (existingAdvice) {
        // Update existing advice
        const { data, error } = await supabase
          .from('risk_assessment_advice')
          .update({
            min_score: advice.min_score,
            max_score: advice.max_score,
            advice: advice.advice,
            updated_at: new Date().toISOString()
          })
          .eq('risk_level', advice.risk_level)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new advice
        const { data, error } = await supabase
          .from('risk_assessment_advice')
          .insert({
            min_score: advice.min_score,
            max_score: advice.max_score,
            advice: advice.advice,
            risk_level: advice.risk_level,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error updating advice:', error);
      throw error;
    }
  }

  // Calculate risk score based on answers
  async calculateRiskScore(answers: Record<string, string>): Promise<RiskAssessmentResult> {
    // Get all configurations
    const configs = await this.getConfigurations();
    
    // Get all advice
    const adviceList = await this.getAdvice();
    
    // Calculate total score and collect contributing factors
    let totalScore = 0;
    const contributingFactors: { question: string; answer: string; score: number }[] = [];
    
    // Flatten all questions from all pages
    const allQuestions = QUESTIONNAIRE_PAGES.flat();
    
    // Calculate scores for each answer
    for (const [questionId, answer] of Object.entries(answers)) {
      const question = allQuestions.find((q: QuestionItem) => q.id === questionId);
      if (!question) continue;
      
      const config = configs.find(c => c.question_id === questionId && c.option_value === answer);
      if (config) {
        totalScore += config.score;
        contributingFactors.push({
          question: question.text,
          answer: answer,
          score: config.score
        });
      }
    }
    
    // Find appropriate advice based on score
    const advice = adviceList.find(a => totalScore >= a.min_score && totalScore <= a.max_score)?.advice || 
      "No specific advice available for this score range.";
    
    return {
      total_score: totalScore,
      contributing_factors: contributingFactors,
      advice: advice
    };
  }
}

// Create and export a singleton instance
export const riskAssessmentService = new RiskAssessmentService(); 