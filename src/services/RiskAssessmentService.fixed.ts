import { supabase } from "@/lib/supabase";
import { getQuestionsWithTooltips } from './PatientQuestionnaireService'; 
import type { DBQuestion } from './PatientQuestionnaireService';

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
  risk_level: string;
}

// Fallback advice when database operations fail
const FALLBACK_ADVICE = [
  {
    min_score: 0,
    max_score: 2,
    advice: "Low risk. Regular eye exams as recommended by your optometrist are sufficient.",
    risk_level: "Low"
  },
  {
    min_score: 3,
    max_score: 5,
    advice: "Moderate risk. Consider more frequent eye exams and discuss with your doctor about potential preventive measures.",
    risk_level: "Moderate"
  },
  {
    min_score: 6,
    max_score: 100,
    advice: "High risk. Regular monitoring is strongly recommended. Discuss with your specialist about comprehensive eye exams and treatment options.",
    risk_level: "High"
  }
];

// Local cache for advice
let cachedAdvice: RiskAssessmentAdvice[] | null = null;

export class RiskAssessmentService {
  private allQuestions: DBQuestion[] | null = null; // Cache for questions

  // Helper to fetch and cache questions
  private async getAllQuestions(): Promise<DBQuestion[]> {
    if (this.allQuestions === null) {
      console.log("RiskAssessmentService: Fetching questions...");
      this.allQuestions = await getQuestionsWithTooltips();
    }
    return this.allQuestions;
  }

  // Get all risk assessment configurations
  async getConfigurations(): Promise<RiskAssessmentConfig[]> {
    try {
      const { data, error } = await supabase
        .from('risk_assessment_config')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching risk configurations:", error);
      // Return empty array on error
      return [];
    }
  }

  // Get all risk assessment advice
  async getAdvice(): Promise<RiskAssessmentAdvice[]> {
    try {
      // Use cached advice if available
      if (cachedAdvice) {
        return cachedAdvice;
      }

      const { data, error } = await supabase
        .from('risk_assessment_advice')
        .select('*')
        .order('min_score', { ascending: true });

      if (error) {
        // Handle potential missing risk_level column gracefully
        if (error.code === '42703') { // PostgreSQL code for undefined column
          console.warn("RiskAssessmentService: 'risk_level' column not found in 'risk_assessment_advice'. Falling back to score-based levels.");
          const { data: dataWithoutRisk, error: errorWithoutRisk } = await supabase
            .from('risk_assessment_advice')
            .select('id, min_score, max_score, advice, created_at, updated_at')
            .order('min_score', { ascending: true });

          if (errorWithoutRisk) {
            console.error("Error fetching advice without risk level:", errorWithoutRisk);
            cachedAdvice = [...FALLBACK_ADVICE];
            return cachedAdvice;
          }

          // Map the data to include risk_level based on score ranges
          cachedAdvice = (dataWithoutRisk || []).map(item => ({
            ...item,
            risk_level: item.min_score <= 1 ? 'Low' :
                      item.min_score <= 3 ? 'Moderate' : 'High'
          }));
          return cachedAdvice;
        }
        
        // For permission issues or network failures, use fallback
        console.error("Error fetching advice, using fallback:", error);
        cachedAdvice = [...FALLBACK_ADVICE];
        return cachedAdvice;
      }

      // Cache the advice
      cachedAdvice = data || [...FALLBACK_ADVICE];
      return cachedAdvice;
    } catch (error) {
      console.error('Error getting advice:', error);
      // Use fallback on any error
      cachedAdvice = [...FALLBACK_ADVICE];
      return cachedAdvice;
    }
  }

  // Update risk assessment configuration
  async updateConfiguration(config: Partial<RiskAssessmentConfig>): Promise<RiskAssessmentConfig> {
    try {
      const { data, error } = await supabase
        .from('risk_assessment_config')
        .upsert(config)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating configuration:", error);
      // Return the input config as a fallback
      return config as RiskAssessmentConfig;
    }
  }

  // Update risk assessment advice - with client-side caching for fallback
  async updateAdvice(advice: Partial<RiskAssessmentAdvice>): Promise<RiskAssessmentAdvice> {
    if (!advice.risk_level && (advice.min_score === undefined || advice.max_score === undefined)) {
      throw new Error('Risk level or score range is required to update advice.');
    }
    
    const riskLevel = advice.risk_level || (
      advice.min_score !== undefined && advice.min_score <= 1 ? 'Low' :
      advice.min_score !== undefined && advice.min_score <= 3 ? 'Moderate' : 'High'
    );

    // Create a complete advice object
    const completeAdvice: RiskAssessmentAdvice = {
      min_score: advice.min_score || 0,
      max_score: advice.max_score || 100,
      advice: advice.advice || "No specific advice available.",
      risk_level: riskLevel,
      updated_at: new Date().toISOString()
    };

    try {
      // Try to update in database
      const { data, error } = await supabase
        .from('risk_assessment_advice')
        .upsert({
          min_score: completeAdvice.min_score,
          max_score: completeAdvice.max_score,
          advice: completeAdvice.advice,
          risk_level: completeAdvice.risk_level,
          updated_at: completeAdvice.updated_at
        }, { onConflict: 'risk_level' })
        .select()
        .single();

      if (error) {
        console.error('Supabase upsert error:', error);
        // Update local cache even if database update fails
        if (cachedAdvice) {
          const index = cachedAdvice.findIndex(a => a.risk_level === completeAdvice.risk_level);
          if (index >= 0) {
            cachedAdvice[index] = completeAdvice;
          } else {
            cachedAdvice.push(completeAdvice);
          }
          // Sort by min_score
          cachedAdvice.sort((a, b) => a.min_score - b.min_score);
        }
        // Return the updated advice even though database update failed
        return completeAdvice;
      }

      // Update cache with the new data
      if (cachedAdvice) {
        const index = cachedAdvice.findIndex(a => a.risk_level === data.risk_level);
        if (index >= 0) {
          cachedAdvice[index] = data;
        } else {
          cachedAdvice.push(data);
        }
        // Sort by min_score
        cachedAdvice.sort((a, b) => a.min_score - b.min_score);
      }

      return data;
    } catch (error) {
      console.error('Error updating advice:', error);
      // Update local cache even if there's an error
      if (cachedAdvice) {
        const index = cachedAdvice.findIndex(a => a.risk_level === completeAdvice.risk_level);
        if (index >= 0) {
          cachedAdvice[index] = completeAdvice;
        } else {
          cachedAdvice.push(completeAdvice);
        }
        // Sort by min_score
        cachedAdvice.sort((a, b) => a.min_score - b.min_score);
      }
      // Return the advice object even though it wasn't saved to database
      return completeAdvice;
    }
  }

  // Calculate risk score based on answers
  async calculateRiskScore(answers: Record<string, string>): Promise<RiskAssessmentResult> {
    try {
      console.log("Calculating risk score for answers:", answers);
      
      // Get configurations, advice, and all questions
      const [configs, adviceList, allQuestions] = await Promise.all([
        this.getConfigurations(),
        this.getAdvice(),
        this.getAllQuestions()
      ]);
      
      console.log("Fetched risk configs:", configs.length);
      console.log("Fetched risk advice:", adviceList.length);
      console.log("Fetched questions:", allQuestions.length);

      // Calculate total score and collect contributing factors
      let totalScore = 0;
      const contributingFactors: { question: string; answer: string; score: number }[] = [];

      // Process each answer to calculate score
      for (const [questionId, answerValue] of Object.entries(answers)) {
        // Skip empty answers
        if (!answerValue) continue;
        
        console.log(`Processing answer: ${questionId} = ${answerValue}`);
        
        // Calculate score for this answer
        // SIMPLIFIED: Use direct lookup in the risk_assessment_config table
        const config = configs.find(c => 
          c.question_id === questionId && 
          c.option_value === answerValue
        );
        
        if (config) {
          console.log(`Found config with score ${config.score} for ${questionId}=${answerValue}`);
          totalScore += config.score;
          
          // Find the question text for nicer output
          const question = allQuestions.find(q => {
            // Try multiple match strategies:
            // 1. Direct ID match
            if (q.id === questionId) return true;
            // 2. Question ID in older string format (e.g., "familyGlaucoma")
            const lowercaseQuestion = q.question.toLowerCase();
            if (questionId === "familyGlaucoma" && lowercaseQuestion.includes("family")) return true;
            if (questionId === "ocularSteroid" && lowercaseQuestion.includes("ophthalmic")) return true;
            if (questionId === "intravitreal" && lowercaseQuestion.includes("intravitreal")) return true;
            if (questionId === "systemicSteroid" && lowercaseQuestion.includes("systemic")) return true;
            if (questionId === "iopBaseline" && lowercaseQuestion.includes("iop")) return true;
            if (questionId === "verticalAsymmetry" && lowercaseQuestion.includes("asymmetry")) return true;
            if (questionId === "verticalRatio" && lowercaseQuestion.includes("ratio")) return true;
            return false;
          });
          
          contributingFactors.push({
            question: question?.question || questionId,
            answer: answerValue,
            score: config.score
          });
        } else {
          // Special handling for known important fields
          if (questionId === 'race' && (answerValue === 'black' || answerValue === 'hispanic')) {
            const score = answerValue === 'black' ? 2 : 1;
            console.log(`Using hardcoded score ${score} for race=${answerValue}`);
            totalScore += score;
            contributingFactors.push({
              question: 'Race',
              answer: answerValue,
              score: score
            });
          } else if (questionId === 'familyGlaucoma' && answerValue === 'yes') {
            console.log('Using hardcoded score 2 for familyGlaucoma=yes');
            totalScore += 2;
            contributingFactors.push({
              question: 'Family History of Glaucoma',
              answer: 'Yes',
              score: 2
            });
          } else if (questionId === 'ocularSteroid' && answerValue === 'yes') {
            console.log('Using hardcoded score 2 for ocularSteroid=yes');
            totalScore += 2;
            contributingFactors.push({
              question: 'Ophthalmic Topical Steroids',
              answer: 'Yes',
              score: 2
            });
          } else if (questionId === 'intravitreal' && answerValue === 'yes') {
            console.log('Using hardcoded score 2 for intravitreal=yes');
            totalScore += 2;
            contributingFactors.push({
              question: 'Intravitreal Steroids',
              answer: 'Yes',
              score: 2
            });
          } else if (questionId === 'systemicSteroid' && answerValue === 'yes') {
            console.log('Using hardcoded score 2 for systemicSteroid=yes');
            totalScore += 2;
            contributingFactors.push({
              question: 'Systemic Steroids',
              answer: 'Yes',
              score: 2
            });
          } else if (questionId === 'iopBaseline' && answerValue === '22_and_above') {
            console.log('Using hardcoded score 2 for iopBaseline=22_and_above');
            totalScore += 2;
            contributingFactors.push({
              question: 'IOP Baseline',
              answer: '22 and above',
              score: 2
            });
          } else if (questionId === 'verticalAsymmetry' && answerValue === '0.2_and_above') {
            console.log('Using hardcoded score 2 for verticalAsymmetry=0.2_and_above');
            totalScore += 2;
            contributingFactors.push({
              question: 'Vertical Asymmetry',
              answer: '0.2 and above',
              score: 2
            });
          } else if (questionId === 'verticalRatio' && answerValue === '0.6_and_above') {
            console.log('Using hardcoded score 2 for verticalRatio=0.6_and_above');
            totalScore += 2;
            contributingFactors.push({
              question: 'Vertical Ratio',
              answer: '0.6 and above',
              score: 2
            });
          } else {
            console.log(`No score configuration found for ${questionId}=${answerValue}`);
          }
        }
      }

      console.log(`Total calculated score: ${totalScore}`);
      
      // Find appropriate advice and risk level based on score
      const matchedAdvice = adviceList.find(a => totalScore >= a.min_score && totalScore <= a.max_score);
      const adviceText = matchedAdvice?.advice || "No specific advice available for this score range.";
      const riskLevel = matchedAdvice?.risk_level || 
                      (totalScore <= 2 ? "Low" : 
                       totalScore <= 5 ? "Moderate" : "High");

      console.log(`Risk level: ${riskLevel}, Advice: ${adviceText}`);
      
      return {
        total_score: totalScore,
        contributing_factors: contributingFactors,
        advice: adviceText,
        risk_level: riskLevel
      };
    } catch (error) {
      console.error("Error calculating risk score:", error);
      // Return default/fallback values in case of error
      return {
        total_score: 0,
        contributing_factors: [],
        advice: "Unable to calculate risk score due to an error.",
        risk_level: "Unknown"
      };
    }
  }
}

// Create and export a singleton instance
export const riskAssessmentService = new RiskAssessmentService();