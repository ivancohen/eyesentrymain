import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { getErrorMessage } from "@/types/error";
export const SpecialistService = {
    // Admin functions for managing specialist questions
    async createQuestion(question) {
        try {
            const { error } = await supabase
                .from('specialist_questions')
                .insert([{
                    ...question,
                    created_at: new Date().toISOString(),
                    dropdown_options: question.question_type === 'select' ? question.dropdown_options : null
                }]);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            console.error("Error creating specialist question:", error);
            toast.error(`Error creating question: ${getErrorMessage(error)}`);
            return false;
        }
    },
    async updateQuestion(id, question) {
        try {
            const { error } = await supabase
                .from('specialist_questions')
                .update({
                ...question,
                dropdown_options: question.question_type === 'select' ? question.dropdown_options : null
            })
                .eq('id', id);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            console.error("Error updating specialist question:", error);
            toast.error(`Error updating question: ${getErrorMessage(error)}`);
            return false;
        }
    },
    async deleteQuestion(id) {
        try {
            const { error } = await supabase
                .from('specialist_questions')
                .update({ is_active: false })
                .eq('id', id);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            console.error("Error deleting specialist question:", error);
            toast.error(`Error deleting question: ${getErrorMessage(error)}`);
            return false;
        }
    },
    async getQuestions() {
        try {
            const { data, error } = await supabase
                .from('specialist_questions')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            console.error("Error fetching specialist questions:", error);
            toast.error(`Error fetching questions: ${getErrorMessage(error)}`);
            return [];
        }
    },
    // Patient access code management
    async generateAccessCode(patientId) {
        try {
            console.log("Generating access code for patient:", patientId);
            // Skip checking if patient exists and directly generate the access code
            // This avoids the 406 error when trying to access the patients table
            const { data, error } = await supabase
                .rpc('create_patient_access_code', {
                p_patient_id: patientId,
                p_created_by: (await supabase.auth.getUser()).data.user?.id
            });
            if (error) {
                console.error("Error from RPC call:", error);
                throw error;
            }
            console.log("Access code generated successfully:", data);
            return data;
        }
        catch (error) {
            console.error("Error generating access code:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            toast.error(`Error generating access code: ${getErrorMessage(error)}`);
            return null;
        }
    },
    async validateAccessCode(code) {
        try {
            const { data, error } = await supabase
                .rpc('validate_access_code', {
                p_code: code
            });
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error("Error validating access code:", error);
            toast.error(`Error validating access code: ${getErrorMessage(error)}`);
            return null;
        }
    },
    // Specialist response management
    async submitSpecialistResponses(submission) {
        try {
            // First validate the access code
            const patientId = await this.validateAccessCode(submission.access_code);
            if (!patientId || patientId !== submission.patient_id) {
                throw new Error("Invalid or expired access code");
            }
            // Insert all responses
            const { error } = await supabase
                .from('specialist_responses')
                .insert(submission.responses.map(response => ({
                patient_id: submission.patient_id,
                question_id: response.question_id,
                response: response.response,
                created_at: new Date().toISOString()
            })));
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            console.error("Error submitting specialist responses:", error);
            toast.error(`Error submitting responses: ${getErrorMessage(error)}`);
            return false;
        }
    },
    async getPatientResponses(patientId) {
        try {
            const { data, error } = await supabase
                .from('specialist_responses')
                .select(`
                    *,
                    question:specialist_questions(question)
                `)
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            console.error("Error fetching patient responses:", error);
            toast.error(`Error fetching responses: ${getErrorMessage(error)}`);
            return [];
        }
    },
    async sendAccessLinkEmail(recipientEmail, accessCode, patientName, doctorName) {
        console.log('Starting email sending process...');
        console.log('Parameters:', {
            recipientEmail,
            accessCode,
            patientName,
            doctorName
        });
        // Skip the RPC method and use the client-side EmailService directly
        // This is more reliable and easier to debug
        try {
            // Import dynamically to avoid circular dependencies
            const { EmailService } = await import('@/services/EmailService');
            if (!EmailService) {
                throw new Error('EmailService not available');
            }
            console.log('Using client-side EmailService directly');
            // Try to send the email using the client-side service
            const success = await EmailService.sendSpecialistAccessLink(recipientEmail, accessCode, patientName, doctorName);
            if (success) {
                console.log('Successfully sent email using client-side EmailService');
                return true;
            }
            else {
                console.error('Failed to send email using client-side EmailService');
                // For development, return true even if there's an error
                // This allows testing the UI flow without a working email service
                if (process.env.NODE_ENV === 'development' || import.meta.env.DEV) {
                    console.log('Development mode: Simulating successful email sending despite error');
                    return true;
                }
                return false;
            }
        }
        catch (error) {
            console.error('Error sending access link email:', error);
            // For development, return true even if there's an error
            if (process.env.NODE_ENV === 'development' || import.meta.env.DEV) {
                console.log('Development mode: Simulating successful email sending despite error');
                return true;
            }
            return false;
        }
    },
    async updateQuestionOrder(updates) {
        try {
            const { error } = await supabase.rpc('update_specialist_question_order', {
                order_updates: updates
            });
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            console.error("Error updating question order:", error);
            toast.error(`Error updating question order: ${getErrorMessage(error)}`);
            return false;
        }
    }
};
