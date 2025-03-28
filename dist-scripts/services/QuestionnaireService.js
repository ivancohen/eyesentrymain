import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
export const QuestionnaireService = {
    async submitQuestionnaire(data, userId) {
        try {
            // Transform the form data into database format
            const formattedData = {
                user_id: userId,
                patient_first_name: data.firstName || "",
                patient_last_name: data.lastName || "",
                age: typeof data.age === 'string' ? parseInt(data.age) : (data.age || 0),
                race: data.race || "",
                family_glaucoma: data.familyGlaucoma === "yes",
                ocular_steroid: data.ocularSteroid === "yes",
                intravitreal_steroids: data.intravitreal === "yes",
                systemic_steroid: data.systemicSteroid === "yes",
                iop_baseline_elevated: data.iopBaseline === "yes",
                vertical_disc_asymmetry: data.verticalAsymmetry === "yes",
                vertical_cd_ratio_elevated: data.verticalRatio === "yes"
            };
            console.log("Submitting questionnaire data:", formattedData);
            // Use the authenticated user's default permissions
            const { data: insertedData, error } = await supabase
                .from('patient_questionnaires')
                .insert([formattedData])
                .select();
            if (error) {
                console.error("Error submitting questionnaire:", error);
                throw error;
            }
            const id = insertedData?.[0]?.id;
            console.log("Questionnaire submitted successfully, ID:", id);
            return { success: true, id };
        }
        catch (error) {
            console.error("Error submitting questionnaire:", error);
            toast.error(`Error submitting questionnaire: ${error.message}`);
            return { success: false };
        }
    },
    async fetchQuestionnaires(userId) {
        try {
            // Use the authenticated user's default permissions
            const { data, error } = await supabase
                .from('patient_questionnaires')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) {
                console.error("Error fetching questionnaires:", error);
                throw error;
            }
            return data || [];
        }
        catch (error) {
            console.error("Error fetching questionnaires:", error);
            toast.error(`Error fetching questionnaires: ${error.message}`);
            return [];
        }
    }
};
