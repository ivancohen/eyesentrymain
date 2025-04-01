import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
// Import RiskAssessmentService to use its calculation logic
import { riskAssessmentService, RiskAssessmentResult } from './RiskAssessmentService';

// Define and Export DBQuestion interface
export interface DBQuestion {
  id: string;
  question: string;
  tooltip?: string;
  page_category: string;
  question_type?: string;
  options?: Array<{
      option_value: string;
      option_text: string;
      score?: number;
      display_order?: number; // Re-added for ordering support
  }>;
  display_order?: number;
  conditional_parent_id?: string;
  conditional_required_value?: string;
}

// Define DropdownOption type locally for fetching
interface DropdownOption {
    option_value: string;
    option_text: string;
    score?: number;
    display_order?: number; // Re-added for ordering support
    question_id: string; // Foreign key
}


export interface PatientQuestionnaireData {
  firstName: string;
  lastName: string;
  age: string;
  race: string;
  familyGlaucoma: string;
  ocularSteroid: string;
  steroidType?: string;
  intravitreal: string;
  intravitralType?: string; // Consistently name this property
  systemicSteroid: string;
  systemicSteroidType?: string;
  iopBaseline: string;
  verticalAsymmetry: string;
  verticalRatio: string;
  // Allow any other string keys for dynamic answers
  [key: string]: string | undefined;
}

// Interface for a questionnaire record from the database
interface PatientQuestionnaire {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  age: string;
  race: string;
  family_glaucoma: boolean;
  ocular_steroid: boolean;
  steroid_type: string | null;
  intravitreal: boolean;
  intravitreal_type: string | null;
  systemic_steroid: boolean;
  systemic_steroid_type: string | null;
  iop_baseline: boolean;
  vertical_asymmetry: boolean;
  vertical_ratio: boolean;
  total_score: number;
  risk_level: string;
  created_at: string;
  updated_at: string;
  // Add answers JSONB field if it exists
  answers?: Record<string, string | undefined>;
}

// REMOVED formatAnswersForScoring function - No longer needed as we pass UUID-keyed answers directly

// Helper function to map PatientQuestionnaireData to DB boolean fields
// This needs careful alignment with question IDs used in PatientQuestionnaireData
// **NOTE:** This still relies on the string-keyed `data` object.
function mapDataToDbBooleans(data: PatientQuestionnaireData): Partial<PatientQuestionnaire> {
    return {
        family_glaucoma: data.familyGlaucoma === "yes", // Assumes data.familyGlaucoma is 'yes' or 'no'
        ocular_steroid: data.ocularSteroid === "yes",
        intravitreal: data.intravitreal === "yes",
        systemic_steroid: data.systemicSteroid === "yes",
        // These might need adjustment if the DB expects boolean but data has different strings
        iop_baseline: data.iopBaseline === "22 and above", // Match exact string value
        vertical_asymmetry: data.verticalAsymmetry === "0.2 and above", // Match exact string value
        vertical_ratio: data.verticalRatio === "0.6 and above", // Match exact string value
    };
}


// Modified signature to accept UUID-keyed answers object
export async function submitPatientQuestionnaire(
    data: PatientQuestionnaireData, // Original string-keyed data for DB insertion fields
    answersByUuid: Record<string, string> // UUID-keyed answers for scoring and storing in JSON
) {
  try {
    console.log("Processing questionnaire data for submission (string keys):", data);
    console.log("Processing questionnaire answers for scoring (UUID keys):", answersByUuid);
    
    // REMOVED fetching allDbQuestions here
    // REMOVED call to formatAnswersForScoring
    
    // Step 1: Calculate score using RiskAssessmentService, passing UUID-keyed answers
    const assessmentResult: RiskAssessmentResult = await riskAssessmentService.calculateRiskScore(answersByUuid);
    const totalScore = assessmentResult.total_score;
    const riskLevel = assessmentResult.risk_level; // Get risk level from assessment
    const contributing_factors = assessmentResult.contributing_factors;
    const advice = assessmentResult.advice;

    console.log("Calculated Score:", totalScore, "Risk Level:", riskLevel);

    // Step 2: Prepare data for insertion (map to DB schema using string-keyed `data`)
    const dbBooleans = mapDataToDbBooleans(data); // Use original `data` for boolean mapping
    const submissionData = {
        first_name: data.firstName,
        last_name: data.lastName,
        age: data.age,
        race: data.race, // Use string-keyed data for direct fields
        ...dbBooleans, // Spread the calculated boolean fields
        steroid_type: data.steroidType || null,
        intravitreal_type: data.intravitralType || null,
        systemic_steroid_type: data.systemicSteroidType || null,
        total_score: totalScore,
        risk_level: riskLevel,
        answers: answersByUuid, // Store the UUID-keyed answers JSON in the 'answers' column
        metadata: { // Keep metadata for potential fallback/logging
          firstName: data.firstName,
          lastName: data.lastName,
          // Store UUID-keyed answers in metadata as well
          answers: answersByUuid
        }
    };

    console.log("Data prepared for RPC insert_patient_questionnaire:", submissionData);

    // Step 3: Call RPC function matching our updated comprehensive fix
    const { data: newId, error } = await supabase.rpc(
      'insert_patient_questionnaire',
      {
        // Match parameters with no prefix, consistent with our SQL function
        first_name: submissionData.first_name,
        last_name: submissionData.last_name,
        age: submissionData.age,
        race: submissionData.race,
        family_glaucoma: submissionData.family_glaucoma,
        ocular_steroid: submissionData.ocular_steroid, // Already boolean from mapDataToDbBooleans
        steroid_type: submissionData.steroid_type,
        intravitreal: submissionData.intravitreal, // Already boolean from mapDataToDbBooleans
        intravitreal_type: submissionData.intravitreal_type,
        systemic_steroid: submissionData.systemic_steroid, // Already boolean from mapDataToDbBooleans
        systemic_steroid_type: submissionData.systemic_steroid_type,
        iop_baseline: submissionData.iop_baseline, // This is text, ensure DB function expects text or adjust mapDataToDbBooleans
        vertical_asymmetry: submissionData.vertical_asymmetry,
        vertical_ratio: submissionData.vertical_ratio,
        total_score: submissionData.total_score,
        risk_level: submissionData.risk_level,
        metadata: submissionData.metadata // Includes both names and answers
      }
    );

    if (error) {
      console.error("Error submitting questionnaire via RPC:", error);
      throw new Error(error.message);
    }

    if (!newId) {
      // Handle case where RPC succeeded but didn't return an ID
      console.error("Questionnaire RPC insert succeeded but no ID returned.");
      throw new Error("Failed to retrieve questionnaire ID after submission via RPC.");
    }

    console.log("Questionnaire created successfully with ID:", newId);

    // Step 4: Return results consistent with previous structure
    return {
      success: true,
      score: totalScore,
      riskLevel,
      contributing_factors,
      advice
    };
  } catch (error) {
    console.error("Failed to submit questionnaire:", error);
    // Consider more specific error handling or re-throwing
    throw error instanceof Error ? error : new Error("An unknown error occurred during submission.");
  }
}

export async function getUserQuestionnaires() {
  try {
    // Get the current authenticated user directly from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting user:", userError);
      throw new Error("User not authenticated");
    }

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Use our new database function to avoid infinite recursion
    const { data, error } = await supabase
      .rpc('get_patient_questionnaires_for_user', { user_id_param: user.id });

    if (error) {
      console.error("Error fetching questionnaires:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching questionnaires:", error);
    throw error;
  }
}

export async function getQuestionnaireById(id: string) {
  try {
    // Get current authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting user:", userError);
      throw new Error("User not authenticated");
    }

    const userId = userData.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Use our get_patient_questionnaires_for_user RPC function and filter by ID
    // This avoids the recursion issue by using a security definer function
    const { data, error } = await supabase
      .rpc('get_patient_questionnaires_for_user', { user_id_param: userId })
      .then(response => {
        if (response.error) throw response.error;
        // Filter the results to get just the one questionnaire we want
        // Type assertion to tell TypeScript this is an array of PatientQuestionnaire
        const questionnaire = (response.data as PatientQuestionnaire[]).find(q => q.id === id);
        return { data: questionnaire, error: null };
      });

    if (error) {
      console.error("Error fetching questionnaire:", error);
      throw error;
    }

    if (!data) {
      throw new Error("Questionnaire not found");
    }

    return data;
  } catch (error) {
    console.error("Error fetching questionnaire by ID:", error);
    throw error;
  }
}

// Update function removed - we no longer support editing questionnaires

// Function to check if a string is a valid UUID
function isValidUUID(str: string | null | undefined): boolean {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

// Type guard to ensure fetched data matches DBQuestion structure
function isDBQuestion(obj: any): obj is DBQuestion {
    // Add more checks if needed for robustness
    return obj && typeof obj.id === 'string' && typeof obj.question === 'string';
}

export async function getQuestionsWithTooltips(): Promise<DBQuestion[]> {
  try {
    // Step 1: Fetch active questions
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('status', 'Active') // Filter for active questions
      .order('page_category', { ascending: true })
      .order('display_order', { ascending: true });

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      throw questionsError;
    }
    
    // --- DEBUG LOG: Log raw fetched questions data ---
    console.log("DEBUG: Raw questions fetched from DB:", questionsData?.map(q => ({id: q.id, question: q.question, status: q.status})) || 'No data');
    // --- END DEBUG LOG ---

    // Filter out questions with non-UUID IDs and ensure basic structure
    console.log("DEBUG: Filtering fetched questions...");
    let validQuestions = questionsData?.filter(q => {
        const isUUID = isValidUUID(q.id);
        const isQuestion = isDBQuestion(q);
        const passes = isUUID && isQuestion;
        console.log(`  - Filtering Q ID: ${q.id}, Text: "${q.question?.substring(0,20)}...", isUUID: ${isUUID}, isQuestion: ${isQuestion}, Passes: ${passes}`);
        return passes;
    }) || [];
    // Updated log message for clarity
    console.log(`Fetched ${questionsData?.length || 0} questions with status='Active' (raw), found ${validQuestions.length} valid after filtering.`);

    // Step 2: Fetch all options for the valid questions in a single query
    const questionIds = validQuestions.map(q => q.id);
    let allOptions: DropdownOption[] = [];
    if (questionIds.length > 0) {
        try {
            // Use dropdown_options as the standardized table with proper ordering
            const { data: dropdownData, error: dropdownError } = await supabase
                .from('dropdown_options')
                .select('question_id, option_value, option_text, score, display_order')
                .in('question_id', questionIds)
                .order('display_order', { ascending: true });

            if (dropdownError) {
                console.error("Error fetching options from dropdown_options table:", dropdownError);
                // Continue without options if fetch fails
            } else {
                allOptions = dropdownData || [];
                console.log(`Found ${allOptions.length} options from dropdown_options table`);
            }
        } catch (error) {
            console.error("Error during options fetching:", error);
            // Continue without options
        }
    }

    // Step 3: Map options to their respective questions and process
    validQuestions = validQuestions.map(q => {
        const questionOptions = allOptions
            .filter(opt => opt.question_id === q.id)
            // Map to the structure expected in DBQuestion.options
            // Now include display_order and maintain the same order
            .map(opt => ({
                option_value: opt.option_value,
                option_text: opt.option_text,
                score: opt.score,
                display_order: opt.display_order
            }));

        return {
            ...q,
            tooltip: (q.tooltip && q.tooltip.trim()) ? q.tooltip.trim() : undefined,
            // Assign options if type is 'select' OR 'dropdown'
            options: (q.question_type === 'select' || q.question_type === 'dropdown') ? questionOptions : undefined,
            conditional_parent_id: q.conditional_parent_id || undefined,
            conditional_required_value: q.conditional_required_value || undefined,
        };
    });

    return validQuestions;
  } catch (error) {
    console.error("Error fetching questions with tooltips:", error);
    throw error;
  }
}


// Add stub for updateQuestionnaire
export async function updateQuestionnaire(id: string, data: PatientQuestionnaireData) {
  console.warn("updateQuestionnaire is deprecated and no longer supported");
  throw new Error("Editing questionnaires is no longer supported");
}

// Add the calculateRiskScore function that just forwards to the service
export async function calculateRiskScore(answers: Record<string, string>) {
  return await riskAssessmentService.calculateRiskScore(answers);
}

export async function deleteQuestionnaireById(id: string): Promise<void> {
  try {
    console.log(`Attempting to delete questionnaire with ID: ${id}`);
    const { error } = await supabase
      .from('patient_questionnaires') // Ensure this is the correct table name
      .delete()
      .match({ id });

    if (error) {
      console.error(`Error deleting questionnaire ${id}:`, error);
      // Check for specific errors like RLS violation if needed
      if (error.code === '42501') { // Example: PostgreSQL permission denied
        throw new Error("Permission denied. You may not have the rights to delete this questionnaire.");
      }
      throw new Error(error.message || "Failed to delete questionnaire due to a database error.");
    }

    console.log(`Questionnaire ${id} deleted successfully.`);
    // No return value needed for a successful delete

  } catch (error) {
    console.error(`Failed to delete questionnaire ${id}:`, error);
    // Re-throw the error or a more user-friendly version
    throw error instanceof Error ? error : new Error("An unknown error occurred while deleting the questionnaire.");
  }
}
