import { supabase } from "@/lib/supabase";
import { getQuestionsWithTooltips } from './PatientQuestionnaireService';
import type { DBQuestion } from './PatientQuestionnaireService';

// NOTE: RiskAssessmentConfig interface is no longer used for scoring
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
    advice: "FORCED FIX: Low risk. Regular eye exams as recommended by your optometrist are sufficient.",
    risk_level: "Low"
  },
  {
    min_score: 3,
    max_score: 5,
    advice: "FORCED FIX: Moderate risk. Consider more frequent eye exams and discuss with your doctor about potential preventive measures.",
    risk_level: "Moderate"
  },
  {
    min_score: 6,
    max_score: 100,
    advice: "FORCED FIX: High risk. Regular monitoring is strongly recommended. Discuss with your specialist about comprehensive eye exams and treatment options.",
    risk_level: "High"
  }
];

// Make fallback advice available for debugging if needed
window.ADVICE_DEBUG = FALLBACK_ADVICE;

// Local cache for advice with expiration
interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

let cachedAdvice: CachedData<RiskAssessmentAdvice[]> | null = null;
let cachedQuestions: CachedData<DBQuestion[]> | null = null;

// Cache expiration time (10 minutes)
const CACHE_EXPIRATION = 10 * 60 * 1000; // 10 minutes in milliseconds

export class RiskAssessmentService {
  // Helper to fetch and cache questions with expiration
  private async getAllQuestions(): Promise<DBQuestion[]> {
    // Check if cache is valid
    if (cachedQuestions &&
        (Date.now() - cachedQuestions.timestamp) < cachedQuestions.expiresIn) {
      return cachedQuestions.data;
    }
    
    // Cache expired or not set, fetch fresh data
    const questions = await getQuestionsWithTooltips();
    
    // Update cache
    cachedQuestions = {
      data: questions,
      timestamp: Date.now(),
      expiresIn: CACHE_EXPIRATION
    };
    
    return questions;
  }

  // REMOVED getConfigurations() method

  // Updated to use RPC function instead of hardcoded values
  async getDirectFixAdvice(riskLevel = ""): Promise<RiskAssessmentAdvice[]> {
    console.log("ADMIN RECOMMENDATIONS FIX: Fetching admin-entered recommendations for risk level:", riskLevel);

    try {
      // Use the same RPC function as getAdvice - consistent with other services
      const { data, error } = await supabase
        .rpc('get_risk_assessment_recommendations');

      console.log("ADMIN-ENTERED RECOMMENDATIONS:", {
        error: error ? error.message : 'none',
        dataCount: data?.length || 0,
        items: data?.map(a => ({
          id: a.id,
          level: a.risk_level,
          score_range: `${a.min_score}-${a.max_score}`,
          preview: a.advice?.substring(0, 30) + '...'
        }))
      });

      // If we failed to fetch from database, only then use fallback
      if (error || !data || data.length === 0) {
        console.warn("Failed to fetch admin recommendations, using fallback");
        return [...FALLBACK_ADVICE];
      }

      // For the specific risk level requested, log the matching recommendation
      if (riskLevel && riskLevel.trim() !== "") {
        const normalizedRiskLevel = riskLevel.toLowerCase();
        const exactMatch = data.find(a =>
          a.risk_level && a.risk_level.toLowerCase() === normalizedRiskLevel
        );

        if (exactMatch) {
          console.log("MATCHING ADMIN RECOMMENDATION FOUND FOR", riskLevel, ":",
            exactMatch.advice?.substring(0, 50) + "...");
        } else {
          console.log("NO EXACT MATCH FOUND FOR", riskLevel);
        }
      }

      // Normalize and return the database values
      const normalizedData = data.map(item => ({
        ...item,
        risk_level: this.normalizeRiskLevel(item.risk_level),
        risk_level_normalized: item.risk_level?.toLowerCase() || '',
        advice: item.advice || "No specific advice available."
      }));

      return normalizedData;
    } catch (error) {
      console.error("Error in getDirectFixAdvice:", error);
      return [...FALLBACK_ADVICE]; // Use fallback only on error
    }
  }


  // Get all risk assessment advice using RPC function for consistent access pattern
  async getAdvice(): Promise<RiskAssessmentAdvice[]> {
    try {
      // Check if cache is valid
      if (cachedAdvice &&
          (Date.now() - cachedAdvice.timestamp) < cachedAdvice.expiresIn) {
        return cachedAdvice.data;
      }
      
      // Cache expired or not set, fetch fresh data

      // Use direct table access instead of RPC
      const { data, error } = await supabase
        .from('risk_assessment_advice')
        .select('*');

      if (error) {
        // Use fallback but never cache it
        return [...FALLBACK_ADVICE];
      }

      // If we got data from the database
      if (data && data.length > 0) {
        // Normalize the risk levels for case-insensitive matching
        const normalizedData = data.map(item => ({
          ...item,
          // Use our standard risk level normalization for consistency
          risk_level: this.normalizeRiskLevel(item.risk_level),
          // Also keep normalized version for easier matching
          risk_level_normalized: item.risk_level?.toLowerCase() || '',
          // Ensure advice has a value
          advice: item.advice || "No specific advice available."
        }));


        // Cache the normalized advice with expiration
        cachedAdvice = {
          data: normalizedData,
          timestamp: Date.now(),
          expiresIn: CACHE_EXPIRATION
        };
        return normalizedData;
      }

      // If we got NO data from the database (empty array)
      console.warn("RPC RETURNED EMPTY ADVICE LIST - Using fallback");
      return [...FALLBACK_ADVICE]; // Don't cache fallbacks
    } catch (error) {
      console.error('Error getting advice via RPC:', error);
      // Use fallback on any error, but NEVER cache it
      console.warn("CRITICAL ERROR: Using fallback advice due to exception");
      return [...FALLBACK_ADVICE]; // Return but don't cache
    }
  }

  // REMOVED updateConfiguration method as config table is no longer used for scoring

  // Update risk assessment advice using RPC function for consistent access pattern
  async updateAdvice(advice: Partial<RiskAssessmentAdvice>): Promise<RiskAssessmentAdvice> {
    if (!advice.risk_level && (advice.min_score === undefined || advice.max_score === undefined)) {
      throw new Error('Risk level or score range is required to update advice.');
    }

    // ALWAYS clear the cache to force fresh database fetches
    console.log("CLEARING ALL CACHED ADVICE TO FORCE DATABASE FETCHES");
    cachedAdvice = null;

    // Determine risk level if not provided
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
      updated_at: new Date().toISOString(),
      id: advice.id // Include id if it exists for upsert to work correctly
    };

    console.log("ATTEMPTING TO UPDATE ADVICE USING DIRECT TABLE ACCESS (UPSERT):", {
      min_score: completeAdvice.min_score,
      max_score: completeAdvice.max_score,
      risk_level: completeAdvice.risk_level,
      advice_preview: completeAdvice.advice.substring(0, 30) + '...'
    });

    try {
      // Use direct table upsert instead of RPC, specifying the conflict target
      const { data: upsertedData, error } = await supabase
        .from('risk_assessment_advice')
        .upsert(completeAdvice, {
          onConflict: 'risk_level' // Tell Supabase to update if risk_level matches
        })
        .select() // Select the upserted record
        .single(); // Expect a single record back

      if (error) {
        console.error('DIRECT TABLE UPSERT ERROR:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.log("ADVICE WAS NOT SAVED TO DATABASE");
        // Return the input object but don't cache it
        return completeAdvice;
      }

      if (!upsertedData) {
        console.error('Upsert returned no data');
        // Return the input object but don't cache it
        return completeAdvice;
      }

      console.log("ADVICE SUCCESSFULLY UPSERTED:", {
        id: upsertedData.id,
        risk_level: upsertedData.risk_level,
        advice_preview: upsertedData.advice?.substring(0, 30) + '...'
      });

      // Force a refresh of all data to ensure cache is updated
      await this.getAdvice();

      return upsertedData; // Return the actual record from the database
    } catch (error) {
      console.error('ERROR UPDATING ADVICE VIA UPSERT:', error);
      // Return the input object but don't cache it
      return completeAdvice; // Return input advice on error
    }
  }


  // Helper to normalize risk level text to standard formats (Low, Moderate, High)
  private normalizeRiskLevel(riskLevel: string | null | undefined): string {
    if (!riskLevel) return "Unknown";

    const lowercaseRisk = riskLevel.toLowerCase();

    if (lowercaseRisk.includes('low')) {
      return "Low";
    } else if (lowercaseRisk.includes('mod') || lowercaseRisk.includes('med')) {
      return "Moderate";
    } else if (lowercaseRisk.includes('high')) {
      return "High";
    }

    // Return original if no match
    return riskLevel;
  }

  // Calculate risk score based on answers - Final Simplified Logic (Dropdown Only, UUID keys)
  async calculateRiskScore(answers: Record<string, string>): Promise<RiskAssessmentResult> {
    let totalScore = 0;
    const contributingFactors: { question: string; answer: string; score: number }[] = [];
    let adviceList: RiskAssessmentAdvice[] = [];
    let allQuestions: DBQuestion[] = [];

    try {
      // Fetch advice and all questions using cached data when available
      [adviceList, allQuestions] = await Promise.all([
        this.getAdvice(),
        this.getAllQuestions()
      ]);
// Process the data

      // Iterate through all known questions to calculate score
      for (const question of allQuestions) {
        const questionUuid = question.id;
        const answerValue = answers[questionUuid]; // Look up answer using UUID
        
        // Skip if no answer provided for this question
        if (answerValue === undefined || answerValue === null || answerValue === '') {
          continue;
        }

        let score = 0;
        let scoreApplied = false;
        const questionText = question.question; // Use actual question text

        // Check dropdown options score
        if (question.options) { // Check if options exist
            // Make comparison case-insensitive
            const answerValueLower = String(answerValue).toLowerCase();
            const selectedOption = question.options.find(opt => opt.option_value.toLowerCase() === answerValueLower);
            if (selectedOption && typeof selectedOption.score === 'number') {
                score = selectedOption.score;
                scoreApplied = true; // Mark score as applied if found in options
            }
        }

        // Add score and contributing factor if a score was applied
        if (scoreApplied && score > 0) {
            totalScore += score;
            contributingFactors.push({
                question: questionText,
                answer: String(answerValue),
                score: score
            });
        }
      } // End of allQuestions loop

      // Determine risk level based on score
      const calculatedRiskLevel = totalScore <= 2 ? "Low" : totalScore <= 5 ? "Moderate" : "High";

      // Find advice using multiple matching strategies
      let matchedAdvice = adviceList.find(a => totalScore >= a.min_score && totalScore <= a.max_score);

      if (!matchedAdvice) {
        // Try exact risk level match
        matchedAdvice = adviceList.find(a => a.risk_level === calculatedRiskLevel);
      }

      if (!matchedAdvice) {
        // Try case-insensitive risk level match
        matchedAdvice = adviceList.find(a =>
          a.risk_level.toLowerCase() === calculatedRiskLevel.toLowerCase()
        );
      }

      // Get the final advice and risk level
      const adviceText = matchedAdvice?.advice || "No specific advice available for this score range.";
      const riskLevel = matchedAdvice?.risk_level || calculatedRiskLevel;

      return {
        total_score: totalScore,
        contributing_factors: contributingFactors,
        advice: adviceText,
        risk_level: riskLevel
      }; // Added semicolon
    } catch (error) {
      console.error("Error calculating risk score:", error);
      // Return default/fallback values in case of error
      return {
        total_score: 0,
        contributing_factors: [],
        advice: "Unable to calculate risk score due to an error.",
        risk_level: "Unknown"
      }; // Added semicolon
    }
  } // End of calculateRiskScore
}; // End of RiskAssessmentService class - Added semicolon

// Create and export a singleton instance
export const riskAssessmentService = new RiskAssessmentService();