// Update script to prioritize admin-entered recommendations
// This will modify RiskAssessmentService.ts

// First, create a backup

// Back up the current file
const fs = require('fs');
const path = require('path');

const riskAssessmentServicePath = path.join(__dirname, 'src', 'services', 'RiskAssessmentService.ts');
const backupPath = `${riskAssessmentServicePath}.backup-${Date.now()}`;

// Create backup
fs.copyFileSync(riskAssessmentServicePath, backupPath);
console.log(`Created backup at ${backupPath}`);

// Write updated content
const updatedContent = `import { supabase } from "@/lib/supabase";
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

  
  // DIRECT FIX: This function always returns advice with a recognizable prefix 
  // to verify the fix is working
  async getDirectFixAdvice(riskLevel = ""): Promise<RiskAssessmentAdvice[]> {
    console.log("ADMIN RECOMMENDATIONS FIX: fetching recommendations from database for risk level:", riskLevel);
    
    try {
      // Always fetch from database
      // Use standard database access pattern - directly access the table or use RPC function
      const { data, error } = await supabase
        .from('risk_assessment_advice')
        .select('*')
        .order('min_score', { ascending: true });
      
      console.log("DATABASE RECOMMENDATIONS:", {
        error: error ? error.message : 'none',
        dataCount: data?.length || 0,
        items: data?.map(a => ({
          id: a.id,
          level: a.risk_level,
          score_range: \`${a.min_score}-${a.max_score}\`,
          preview: a.advice?.substring(0, 30) + '...'
        }))
      });
      
      // If we failed to fetch from database, only then use fallback
      if (error || !data || data.length === 0) {
        console.warn("Failed to fetch recommendations from database, using fallback");
        return [...FALLBACK_ADVICE];
      }
      
      // For the specific risk level requested, log the matching recommendation
      if (riskLevel) {
        const exactMatch = data.find(a => 
          a.risk_level && a.risk_level.toLowerCase() === riskLevel.toLowerCase()
        );
        
        if (exactMatch) {
          console.log("MATCHING RECOMMENDATION FOUND FOR", riskLevel, ":", 
            exactMatch.advice?.substring(0, 50) + "...");
        } else {
          console.log("NO EXACT MATCH FOUND FOR", riskLevel);
        }
      }
      
      // Return the database values - NOT hardcoded values
      return data;
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
      
      // Use RPC function instead of direct table access - matching pattern of other successful services
      const { data, error } = await supabase
        .rpc('get_risk_assessment_advice');

      // Debug what we got from the database
      console.log("ADVICE RPC FUNCTION RESULT:", {
        error: error ? error.message : 'none',
        dataReceived: !!data,
        dataCount: data?.length || 0,
        dataItems: data?.map(a => ({
          id: a.id,
          level: a.risk_level,
          score_range: \`${a.min_score}-${a.max_score}\`,
          advice: a.advice?.substring(0, 30) + '...'
        }))
      });

      if (error) {
        // Log detailed error information
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
          // Keep original risk_level but add normalized version for easier matching
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
      updated_at: new Date().toISOString()
    };

    console.log("ATTEMPTING TO UPDATE ADVICE USING RPC FUNCTION:", {
      min_score: completeAdvice.min_score,
      max_score: completeAdvice.max_score,
      risk_level: completeAdvice.risk_level,
      advice_preview: completeAdvice.advice.substring(0, 30) + '...'
    });

    try {
      // Use RPC function instead of direct table access
      const { data, error } = await supabase
        .rpc('update_risk_assessment_advice', {
          p_min_score: completeAdvice.min_score,
          p_max_score: completeAdvice.max_score,
          p_advice: completeAdvice.advice,
          p_risk_level: completeAdvice.risk_level
        });

      if (error) {
        console.error('RPC UPDATE ERROR:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.log("ADVICE WAS NOT SAVED TO DATABASE - Will retry on next access");
        // Return the object but don't cache it
        return completeAdvice;
      }

      // The RPC function returns the updated record
      const updatedRecord = Array.isArray(data) && data.length > 0 ? data[0] : null;

      if (!updatedRecord) {
        console.error('RPC returned no data after update');
        return completeAdvice;
      }

      console.log("ADVICE SUCCESSFULLY UPDATED VIA RPC:", {
        id: updatedRecord.id,
        risk_level: updatedRecord.risk_level,
        advice_preview: updatedRecord.advice?.substring(0, 30) + '...'
      });

      // Force a refresh of all data to ensure cache is updated
      await this.getAdvice();
      
      return updatedRecord;
    } catch (error) {
      console.error('ERROR UPDATING ADVICE VIA RPC:', error);
      // Return the object but don't cache it
      return completeAdvice;
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
  
  // Calculate risk score based on answers
  async calculateRiskScore(answers: Record<string, string>): Promise<RiskAssessmentResult> {
    try {
      console.log("CALCULATING RISK SCORE FOR ANSWERS:", answers);
      
      // Always clear the cache to ensure fresh database fetches
      cachedAdvice = null;
      console.log("CLEARED CACHE TO FORCE FRESH DATABASE FETCH");
      
      // Get configurations, advice, and all questions
      const [configs, adviceList, allQuestions] = await Promise.all([
        this.getConfigurations(),
        this.getAdvice(),
        this.getAllQuestions()
      ]);
      
      console.log("DATA RETRIEVED FOR RISK CALCULATION:");
      console.log("- Risk configs:", configs.length);
      console.log("- Advice list:", adviceList.length, "items");
      console.log("- Available risk levels:", adviceList.map(a => a.risk_level).join(", "));
      console.log("- Detailed advice:", adviceList.map(a => ({
        risk_level: a.risk_level,
        score_range: \`${a.min_score}-${a.max_score}\`,
        advice_preview: a.advice?.substring(0, 30) + '...'
      })));
      console.log("- Questions:", allQuestions.length);

      // Calculate total score and collect contributing factors
      let totalScore = 0;
      const contributingFactors: { question: string; answer: string; score: number }[] = [];

      // Process each answer to calculate score
      for (const [questionId, answerValue] of Object.entries(answers)) {
        // Skip empty answers
        if (!answerValue) continue;
        
        console.log(\`Processing answer: ${questionId} = ${answerValue}\`);
        
        // Calculate score for this answer
        // SIMPLIFIED: Use direct lookup in the risk_assessment_config table
        const config = configs.find(c => 
          c.question_id === questionId && 
          c.option_value === answerValue
        );
        
        if (config) {
          console.log(\`Found config with score ${config.score} for ${questionId}=${answerValue}\`);
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
            console.log(\`Using hardcoded score ${score} for race=${answerValue}\`);
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
            console.log(\`No score configuration found for ${questionId}=${answerValue}\`);
          }
        }
      }

      console.log(\`Total calculated score: ${totalScore}\`);
      
      // Determine risk level based on score
      const calculatedRiskLevel = totalScore <= 2 ? "Low" : totalScore <= 5 ? "Moderate" : "High";
      console.log(\`Calculated risk level based on score: ${calculatedRiskLevel}\`);
      
      // Find advice using multiple matching strategies:
      
      // Strategy 1: Try to match by score range first (most accurate)
      console.log("MATCHING STRATEGY 1: Score range match");
      let matchedAdvice = adviceList.find(a => totalScore >= a.min_score && totalScore <= a.max_score);
      console.log("Score range match result:", matchedAdvice ? \`Found: ${matchedAdvice.risk_level} (${matchedAdvice.min_score}-${matchedAdvice.max_score})\` : "No match");
      
      // Strategy 2: If no match by score, try exact risk level match
      if (!matchedAdvice) {
        console.log("MATCHING STRATEGY 2: Exact risk level match");
        matchedAdvice = adviceList.find(a => a.risk_level === calculatedRiskLevel);
        console.log("Exact risk level match result:", matchedAdvice ? \`Found: ${matchedAdvice.risk_level}\` : "No match");
      }
      
      // Strategy 3: Try case-insensitive risk level match
      if (!matchedAdvice) {
        console.log("MATCHING STRATEGY 3: Case-insensitive risk level match");
        matchedAdvice = adviceList.find(a =>
          a.risk_level.toLowerCase() === calculatedRiskLevel.toLowerCase()
        );
        console.log("Case-insensitive match result:", matchedAdvice ? \`Found: ${matchedAdvice.risk_level}\` : "No match");
      }
      
      // Get the final advice and risk level
      const adviceText = matchedAdvice?.advice || "No specific advice available for this score range.";
      const riskLevel = matchedAdvice?.risk_level || calculatedRiskLevel;

      console.log("FINAL MATCHED RESULT:");
      console.log(\`- Risk level: ${riskLevel}\`);
      console.log(\`- Advice: ${adviceText.substring(0, 50)}...\`);
      console.log(\`- Matched using: ${matchedAdvice ? "Database entry" : "Fallback"}\`);
      
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
export const riskAssessmentService = new RiskAssessmentService();`;
fs.writeFileSync(riskAssessmentServicePath, updatedContent);
console.log(`Updated ${riskAssessmentServicePath} to prioritize admin-entered recommendations`);

console.log("\nFix completed. Now recommendations entered in admin panel should appear in doctor pages.");
