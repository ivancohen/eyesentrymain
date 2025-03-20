import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DatabaseError, getErrorMessage } from "@/types/error";
import { 
    SpecialistQuestion, 
    SpecialistResponse, 
    PatientAccessCode,
    SpecialistSubmission 
} from "@/types/specialist";

export const SpecialistService = {
    // Admin functions for managing specialist questions
    async createQuestion(question: Partial<SpecialistQuestion>): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('specialist_questions')
                .insert([{
                    ...question,
                    created_at: new Date().toISOString(),
                    dropdown_options: question.question_type === 'select' ? question.dropdown_options : null
                }]);

            if (error) throw error;
            return true;
        } catch (error: unknown) {
            console.error("Error creating specialist question:", error);
            toast.error(`Error creating question: ${getErrorMessage(error)}`);
            return false;
        }
    },

    async updateQuestion(id: string, question: Partial<SpecialistQuestion>): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('specialist_questions')
                .update({
                    ...question,
                    dropdown_options: question.question_type === 'select' ? question.dropdown_options : null
                })
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error: unknown) {
            console.error("Error updating specialist question:", error);
            toast.error(`Error updating question: ${getErrorMessage(error)}`);
            return false;
        }
    },

    async deleteQuestion(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('specialist_questions')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error: unknown) {
            console.error("Error deleting specialist question:", error);
            toast.error(`Error deleting question: ${getErrorMessage(error)}`);
            return false;
        }
    },

    async getQuestions(): Promise<SpecialistQuestion[]> {
        try {
            const { data, error } = await supabase
                .from('specialist_questions')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error: unknown) {
            console.error("Error fetching specialist questions:", error);
            toast.error(`Error fetching questions: ${getErrorMessage(error)}`);
            return [];
        }
    },

    // Patient access code management
    async generateAccessCode(patientId: string): Promise<string | null> {
        try {
            // First, check if a patient record exists
            const { data: existingPatient, error: patientError } = await supabase
                .from('patients')
                .select('id')
                .eq('id', patientId)
                .single();

            if (patientError && patientError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                throw patientError;
            }

            // If patient doesn't exist, create one
            if (!existingPatient) {
                const { error: createError } = await supabase
                    .from('patients')
                    .insert([{
                        id: patientId,
                        doctor_id: (await supabase.auth.getUser()).data.user?.id
                    }]);

                if (createError) throw createError;
            }

            // Now generate the access code
            const { data, error } = await supabase
                .rpc('create_patient_access_code', {
                    p_patient_id: patientId,
                    p_created_by: (await supabase.auth.getUser()).data.user?.id
                });

            if (error) throw error;
            return data;
        } catch (error: unknown) {
            console.error("Error generating access code:", error);
            toast.error(`Error generating access code: ${getErrorMessage(error)}`);
            return null;
        }
    },

    async validateAccessCode(code: string): Promise<string | null> {
        try {
            const { data, error } = await supabase
                .rpc('validate_access_code', {
                    p_code: code
                });

            if (error) throw error;
            return data;
        } catch (error: unknown) {
            console.error("Error validating access code:", error);
            toast.error(`Error validating access code: ${getErrorMessage(error)}`);
            return null;
        }
    },

    // Specialist response management
    async submitSpecialistResponses(submission: SpecialistSubmission): Promise<boolean> {
        try {
            // First validate the access code
            const patientId = await this.validateAccessCode(submission.access_code);
            if (!patientId || patientId !== submission.patient_id) {
                throw new Error("Invalid or expired access code");
            }

            // Insert all responses
            const { error } = await supabase
                .from('specialist_responses')
                .insert(
                    submission.responses.map(response => ({
                        patient_id: submission.patient_id,
                        question_id: response.question_id,
                        response: response.response,
                        created_at: new Date().toISOString()
                    }))
                );

            if (error) throw error;
            return true;
        } catch (error: unknown) {
            console.error("Error submitting specialist responses:", error);
            toast.error(`Error submitting responses: ${getErrorMessage(error)}`);
            return false;
        }
    },

    async getPatientResponses(patientId: string): Promise<SpecialistResponse[]> {
        try {
            const { data, error } = await supabase
                .from('specialist_responses')
                .select(`
                    *,
                    question:specialist_questions(question)
                `)
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error: unknown) {
            console.error("Error fetching patient responses:", error);
            toast.error(`Error fetching responses: ${getErrorMessage(error)}`);
            return [];
        }
    },

    async sendAccessLinkEmail(
        recipientEmail: string,
        accessCode: string,
        patientName: string,
        doctorName: string
    ): Promise<boolean> {
        try {
            const { data, error } = await supabase.rpc(
                'send_specialist_access_email',
                {
                    p_recipient_email: recipientEmail,
                    p_access_code: accessCode,
                    p_patient_name: patientName,
                    p_doctor_name: doctorName
                }
            );

            if (error) {
                console.error('Error sending access link email:', error);
                return false;
            }

            return data || false;
        } catch (error) {
            console.error('Error sending access link email:', error);
            return false;
        }
    },

    async updateQuestionOrder(updates: { id: string; display_order: number }[]): Promise<boolean> {
        try {
            const { error } = await supabase.rpc('update_specialist_question_order', {
                order_updates: updates
            });

            if (error) throw error;
            return true;
        } catch (error: unknown) {
            console.error("Error updating question order:", error);
            toast.error(`Error updating question order: ${getErrorMessage(error)}`);
            return false;
        }
    }
}; 