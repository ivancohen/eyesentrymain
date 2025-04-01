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

// DEBUG TOOL - To see all advice values in browser console
console.log("FORCED FALLBACK ADVICE VALUES ALWAYS AVAILABLE:", FALLBACK_ADVICE);
window.ADVICE_DEBUG = FALLBACK_ADVICE;

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
      // ALWAYS clear the cache to force fresh database fetch
      cachedAdvice = null;
      console.log("CLEARED ADVICE CACHE TO FORCE FRESH DATABASE FETCH");

      console.log("FETCHING FRESH ADVICE USING RPC FUNCTION");

      // Use direct table access instead of RPC
      const { data, error } = await supabase
        .from('risk_assessment_advice')
        .select('*');

      // Debug what we got from the database - consistent with other services
      console.log("ADVICE RPC FUNCTION RESULT:", {
        error: error ? error.message : 'none',
        dataReceived: !!data,
        dataCount: data?.length || 0,
        dataItems: data?.map(a => ({
          id: a.id,
          level: a.risk_level,
          score_range: `${a.min_score}-${a.max_score}`,
          advice: a.advice?.substring(0, 30) + '...'
        }))
      });

      if (error) {
        // Log detailed error information - consistent with other services
        console.error("Error fetching advice via RPC:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);

        // Use fallback but never cache it
        console.warn("CRITICAL: Using fallback advice due to RPC function error");
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

        console.log("USING RPC ADVICE:", normalizedData.map(a => ({
          risk_level: a.risk_level,
          risk_level_normalized: a.risk_level_normalized,
          min_score: a.min_score,
          max_score: a.max_score,
          advice_preview: a.advice?.substring(0, 30) + '...'
        })));

        // Cache the normalized advice
        cachedAdvice = normalizedData;
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
      console.log("CALCULATING RISK SCORE (Dropdown Only Logic, UUID Keys) FOR ANSWERS:", answers);

      // Clear advice cache
      cachedAdvice = null;
      console.log("CLEARED CACHE TO FORCE FRESH DATABASE FETCH");

      // Fetch advice and all questions
      [adviceList, allQuestions] = await Promise.all([
        this.getAdvice(),
        this.getAllQuestions()
      ]);

      console.log("DATA RETRIEVED FOR RISK CALCULATION:");
      console.log("- Advice list:", adviceList.length, "items");
      console.log("- Questions:", allQuestions.length);

      // --- Scoring Logic ---
      console.log("DEBUG: Received answers object in calculateRiskScore:", answers);
      // Iterate through all known questions
      for (const question of allQuestions) {
        const questionUuid = question.id;
        const answerValue = answers[questionUuid]; // Look up answer using UUID
        
        // --- DEBUG LOG: Check looked-up answer value ---
        console.log(`  - Lookup for UUID ${questionUuid}: Found answerValue = "${answerValue}" (Type: ${typeof answerValue})`);
        // --- END DEBUG LOG ---

        // Skip if no answer provided for this question
        if (answerValue === undefined || answerValue === null || answerValue === '') {
          // Add log here too to see if skip happens
          console.log(`  - Skipping question ${questionUuid} due to empty/null/undefined answerValue.`);
          continue;
        }

        console.log(`Processing answer for Question: "${question.question}" (UUID: ${questionUuid}) = ${answerValue}`);

        let score = 0;
        let scoreSource = "None";
        let scoreApplied = false;
        const questionText = question.question; // Use actual question text

        // --- ONLY Check dropdown options score ---
        // No need to find question again, we are iterating through them
        console.log(`  - Checking Question: "${questionText}", Type: ${question.question_type}`);
        if (question.options) { // Check if options exist
            console.log(`  - Checking ${question.options.length} Dropdown Options:`, question.options.map(o => ({v: o.option_value, s: o.score})));
            // Make comparison case-insensitive
            const answerValueLower = String(answerValue).toLowerCase();
            const selectedOption = question.options.find(opt => opt.option_value.toLowerCase() === answerValueLower);
            if (selectedOption && typeof selectedOption.score === 'number') {
                score = selectedOption.score;
                scoreSource = `Dropdown Option (Value: ${selectedOption.option_value})`;
                scoreApplied = true; // Mark score as applied if found in options
            } else {
                console.log(`  - Answer value "${answerValue}" not found or has no score in options.`);
            }
        } else {
             console.log(`  - Question has no options array to check for score.`);
        }

        // --- Add score and contributing factor if a score was applied ---
        if (scoreApplied && score > 0) {
            console.log(`✅ Score Applied: ${score} from ${scoreSource} for "${questionText}" = ${answerValue}`);
            totalScore += score;
            contributingFactors.push({
                question: questionText,
                answer: String(answerValue),
                score: score
            });
        } else {
            // Only log if no score was applied
            console.log(`No score applied for Question UUID ${questionUuid}=${answerValue}`);
        }
      } // End of allQuestions loop

      console.log(`Total calculated score: ${totalScore}`);

      // Determine risk level based on score
      const calculatedRiskLevel = totalScore <= 2 ? "Low" : totalScore <= 5 ? "Moderate" : "High";
      console.log(`Calculated risk level based on score: ${calculatedRiskLevel}`);

      // Find advice using multiple matching strategies:
      console.log("MATCHING STRATEGY 1: Score range match");
      let matchedAdvice = adviceList.find(a => totalScore >= a.min_score && totalScore <= a.max_score);
      console.log("Score range match result:", matchedAdvice ? `Found: ${matchedAdvice.risk_level} (${matchedAdvice.min_score}-${matchedAdvice.max_score})` : "No match");

      if (!matchedAdvice) {
        console.log("MATCHING STRATEGY 2: Exact risk level match");
        matchedAdvice = adviceList.find(a => a.risk_level === calculatedRiskLevel);
        console.log("Exact risk level match result:", matchedAdvice ? `Found: ${matchedAdvice.risk_level}` : "No match");
      }

      if (!matchedAdvice) {
        console.log("MATCHING STRATEGY 3: Case-insensitive risk level match");
        matchedAdvice = adviceList.find(a =>
          a.risk_level.toLowerCase() === calculatedRiskLevel.toLowerCase()
        );
        console.log("Case-insensitive match result:", matchedAdvice ? `Found: ${matchedAdvice.risk_level}` : "No match");
      }

      // Get the final advice and risk level
      const adviceText = matchedAdvice?.advice || "No specific advice available for this score range.";
      const riskLevel = matchedAdvice?.risk_level || calculatedRiskLevel;

      console.log("FINAL MATCHED RESULT:");
      console.log(`- Risk level: ${riskLevel}`);
      console.log(`- Advice: ${adviceText.substring(0, 50)}...`);
      console.log(`- Matched using: ${matchedAdvice ? "Database entry" : "Fallback"}`);

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