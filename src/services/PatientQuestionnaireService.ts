
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

interface PatientQuestionnaireData {
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
}

export async function submitPatientQuestionnaire(data: PatientQuestionnaireData) {
  try {
    console.log("Processing questionnaire data:", data);
    
    // Set age score to 0 for all age ranges
    const ageScore = 0;

    let raceScore = 0;
    if (data.race === "black" || data.race === "hispanic") {
      raceScore = 2;
    }

    // Calculate risk factors based on answers (each worth 2 points if "yes", 0 if "no" or "not_available")
    const riskFactorScores = [
      data.familyGlaucoma === "yes" ? 2 : 0,
      // For ocular steroid, it's 2 points if yes with any steroid type
      data.ocularSteroid === "yes" ? 2 : 0,
      data.intravitreal === "yes" ? 2 : 0,
      data.systemicSteroid === "yes" ? 2 : 0,
      data.iopBaseline === "22_and_above" ? 2 : 0,
      data.verticalAsymmetry === "0.2_and_above" ? 2 : 0,
      data.verticalRatio === "0.6_and_above" ? 2 : 0
    ];
    
    // Calculate total score by adding risk factors score to demographic scores
    const riskFactorsScore = riskFactorScores.reduce((total, score) => total + score, 0);
    const totalScore = riskFactorsScore + ageScore + raceScore;
    
    // Determine risk level based on the new requirements
    let riskLevel = "Low";
    if (totalScore >= 4) {
      riskLevel = "High";
    } else if (totalScore >= 2) {
      riskLevel = "Moderate";
    }

    console.log("Submitting questionnaire with RPC function");
    console.log("Risk level:", riskLevel, "Total score:", totalScore);
    
    // Use the new RPC function to insert a questionnaire, preventing the infinite recursion error
    const { data: newId, error } = await supabase
      .rpc('insert_patient_questionnaire', {
        first_name: data.firstName,
        last_name: data.lastName,
        age: data.age,
        race: data.race,
        family_glaucoma: data.familyGlaucoma === "yes",
        ocular_steroid: data.ocularSteroid === "yes",
        steroid_type: data.steroidType || null,
        intravitreal: data.intravitreal === "yes",
        intravitreal_type: data.intravitralType || null, // Ensure consistency with frontend naming
        systemic_steroid: data.systemicSteroid === "yes",
        systemic_steroid_type: data.systemicSteroidType || null,
        iop_baseline: data.iopBaseline === "22_and_above",
        vertical_asymmetry: data.verticalAsymmetry === "0.2_and_above",
        vertical_ratio: data.verticalRatio === "0.6_and_above",
        total_score: totalScore,
        risk_level: riskLevel
      });

    if (error) {
      console.error("Error submitting questionnaire:", error);
      throw new Error(error.message);
    }

    if (!newId) {
      throw new Error("Failed to create questionnaire. No ID returned.");
    }

    console.log("Questionnaire created successfully with ID:", newId);
    return { success: true, score: totalScore, riskLevel };
  } catch (error) {
    console.error("Failed to submit questionnaire:", error);
    throw error;
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

export async function updateQuestionnaire(id: string, data: PatientQuestionnaireData) {
  try {
    // Set age score to 0 for all age ranges
    const ageScore = 0;

    let raceScore = 0;
    if (data.race === "black" || data.race === "hispanic") {
      raceScore = 2;
    }

    // Calculate risk factors based on answers (each worth 2 points if "yes", 0 if "no" or "not_available")
    const riskFactorScores = [
      data.familyGlaucoma === "yes" ? 2 : 0,
      data.ocularSteroid === "yes" ? 2 : 0,
      data.intravitreal === "yes" ? 2 : 0,
      data.systemicSteroid === "yes" ? 2 : 0,
      data.iopBaseline === "22_and_above" ? 2 : 0,
      data.verticalAsymmetry === "0.2_and_above" ? 2 : 0,
      data.verticalRatio === "0.6_and_above" ? 2 : 0
    ];
    
    // Calculate total score by adding risk factors score to demographic scores
    const riskFactorsScore = riskFactorScores.reduce((total, score) => total + score, 0);
    const totalScore = riskFactorsScore + ageScore + raceScore;
    
    // Determine risk level based on the new requirements
    let riskLevel = "Low";
    if (totalScore >= 4) {
      riskLevel = "High";
    } else if (totalScore >= 2) {
      riskLevel = "Moderate";
    }

    console.log("Updating questionnaire with RPC function, ID:", id);
    console.log("Risk level:", riskLevel, "Total score:", totalScore);
    
    // Use the new RPC function to update the questionnaire, preventing the infinite recursion error
    const { data: updateResult, error } = await supabase
      .rpc('update_patient_questionnaire', {
        questionnaire_id: id,
        first_name: data.firstName,
        last_name: data.lastName,
        age: data.age,
        race: data.race,
        family_glaucoma: data.familyGlaucoma === "yes",
        ocular_steroid: data.ocularSteroid === "yes",
        steroid_type: data.steroidType || null,
        intravitreal: data.intravitreal === "yes",
        intravitreal_type: data.intravitralType || null,
        systemic_steroid: data.systemicSteroid === "yes",
        systemic_steroid_type: data.systemicSteroidType || null,
        iop_baseline: data.iopBaseline === "22_and_above",
        vertical_asymmetry: data.verticalAsymmetry === "0.2_and_above",
        vertical_ratio: data.verticalRatio === "0.6_and_above",
        total_score: totalScore,
        risk_level: riskLevel
      });

    if (error) {
      console.error("Error updating questionnaire:", error);
      throw error;
    }

    if (updateResult === false) {
      throw new Error("No questionnaire was updated. Ensure you have permission to edit this questionnaire.");
    }

    return { success: true, score: totalScore, riskLevel };
  } catch (error) {
    console.error("Failed to update questionnaire:", error);
    throw error;
  }
}
