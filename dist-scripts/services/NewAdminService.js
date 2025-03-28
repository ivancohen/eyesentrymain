import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
export const NewAdminService = {
    // USER MANAGEMENT
    async fetchUsers() {
        try {
            console.log("Fetching users from Supabase...");
            // Direct query to profiles table
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                console.error("Error fetching profiles:", error);
                throw error;
            }
            // Transform profiles data to match UserProfile interface
            const userProfiles = (data || []).map((profile) => ({
                id: profile.id,
                email: profile.email,
                name: profile.name || '',
                is_admin: profile.is_admin || false,
                is_approved: profile.is_approved || false,
                created_at: profile.created_at,
                location: profile.location || '',
                state: profile.state || '',
                zip_code: profile.zip_code || '',
                specialty: profile.specialty || '',
                phone_number: profile.phone_number || '',
                address: profile.address || ''
            }));
            console.log("Users fetched successfully:", userProfiles.length, "results");
            return userProfiles;
        }
        catch (error) {
            console.error("Error fetching users:", error);
            toast.error(`Error fetching users: ${error.message}`);
            return [];
        }
    },
    async setAdminStatus(email, isAdmin) {
        try {
            console.log(`Setting admin status for ${email} to ${isAdmin}`);
            // First try the RPC function
            const { data, error } = await supabase.rpc('create_admin', {
                admin_email: email,
                admin_name: email.split('@')[0] // Default name if not known
            });
            if (error) {
                console.error("Error updating admin status:", error);
                throw error;
            }
            toast.success(`${isAdmin ? 'Granted' : 'Revoked'} admin rights for ${email}`);
            return true;
        }
        catch (error) {
            console.error("Error updating admin status:", error);
            toast.error(`Error updating admin status: ${error.message}`);
            return false;
        }
    },
    async createUser(userData) {
        try {
            console.log("Creating new user:", userData.email);
            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: userData.email,
                password: userData.password,
                email_confirm: true,
                user_metadata: {
                    name: userData.name,
                    specialty: userData.specialty,
                    phoneNumber: userData.phone_number,
                    address: userData.address
                }
            });
            if (authError) {
                console.error("Error creating auth user:", authError);
                toast.error(`Error creating user: ${authError.message}`);
                return false;
            }
            if (!authData.user) {
                console.error("No user returned from auth API");
                toast.error("Error creating user: No user data returned");
                return false;
            }
            // Create profile for the user
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                id: authData.user.id,
                email: userData.email,
                name: userData.name,
                is_admin: userData.is_admin,
                is_approved: userData.is_admin || false, // Admins are auto-approved
                location: userData.location,
                state: userData.state,
                zip_code: userData.zip_code,
                specialty: userData.specialty,
                phone_number: userData.phone_number,
                address: userData.address,
                created_at: new Date().toISOString()
            });
            if (profileError) {
                console.error("Error creating profile:", profileError);
                toast.error(`Error creating profile: ${profileError.message}`);
                return false;
            }
            toast.success("User created successfully");
            return true;
        }
        catch (error) {
            console.error("Error creating user:", error);
            toast.error(`Error creating user: ${error.message}`);
            return false;
        }
    },
    async updateUser(userData) {
        try {
            console.log("Updating user:", userData.email);
            // Update the profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                name: userData.name,
                is_admin: userData.is_admin,
                is_approved: userData.is_approved,
                location: userData.location,
                state: userData.state,
                zip_code: userData.zip_code,
                specialty: userData.specialty,
                phone_number: userData.phone_number,
                address: userData.address
            })
                .eq('id', userData.id);
            if (profileError) {
                console.error("Error updating profile:", profileError);
                throw profileError;
            }
            toast.success("User updated successfully");
            return true;
        }
        catch (error) {
            console.error("Error updating user:", error);
            toast.error(`Error updating user: ${error.message}`);
            return false;
        }
    },
    // DOCTOR APPROVAL MANAGEMENT
    async fetchPendingDoctorApprovals() {
        try {
            console.log("Fetching pending doctor approvals...");
            const { data, error } = await supabase
                .from('pending_doctor_approvals')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                console.error("Error fetching pending approvals:", error);
                throw error;
            }
            // Map to DoctorApproval interface
            const pendingApprovals = (data || []).map((profile) => ({
                id: profile.id,
                email: profile.email,
                name: profile.name || '',
                is_admin: false,
                is_approved: false,
                created_at: profile.created_at,
                location: profile.location || '',
                state: profile.state || '',
                zip_code: profile.zip_code || '',
                specialty: profile.specialty || '',
                contact: profile.contact || '',
                address: profile.address || ''
            }));
            console.log("Pending approvals fetched successfully:", pendingApprovals.length, "results");
            return pendingApprovals;
        }
        catch (error) {
            console.error("Error fetching pending approvals:", error);
            toast.error(`Error fetching pending approvals: ${error.message}`);
            return [];
        }
    },
    async approveDoctor(doctorId) {
        try {
            console.log(`Approving doctor account: ${doctorId}`);
            const { data, error } = await supabase.rpc('approve_doctor', { doctor_id: doctorId });
            if (error) {
                console.error("Error approving doctor:", error);
                throw error;
            }
            toast.success("Doctor account approved successfully");
            return true;
        }
        catch (error) {
            console.error("Error approving doctor:", error);
            toast.error(`Error approving doctor: ${error.message}`);
            return false;
        }
    },
    async rejectDoctor(doctorId) {
        try {
            console.log(`Rejecting doctor account: ${doctorId}`);
            const { data, error } = await supabase.rpc('reject_doctor', { doctor_id: doctorId });
            if (error) {
                console.error("Error rejecting doctor:", error);
                throw error;
            }
            toast.success("Doctor account rejected");
            return true;
        }
        catch (error) {
            console.error("Error rejecting doctor:", error);
            toast.error(`Error rejecting doctor: ${error.message}`);
            return false;
        }
    },
    // PATIENT DATA MANAGEMENT
    async fetchPatientData(filters) {
        try {
            console.log("Fetching patient data...", filters);
            // Start with the base query
            let query = supabase
                .from('admin_patient_view')
                .select('*');
            // Apply filters if provided
            if (filters) {
                if (filters.doctor_id) {
                    query = query.eq('doctor_id', filters.doctor_id);
                }
                if (filters.state) {
                    query = query.eq('state', filters.state);
                }
                if (filters.zip_code) {
                    query = query.eq('zip_code', filters.zip_code);
                }
                if (filters.office_location) {
                    query = query.eq('office_location', filters.office_location);
                }
            }
            // Order by created_at
            query = query.order('created_at', { ascending: false });
            // Execute the query
            const { data, error } = await query;
            if (error) {
                console.error("Error fetching patient data:", error);
                throw error;
            }
            console.log("Patient data fetched successfully:", data?.length || 0, "results");
            // Map to PatientData interface
            const patientData = (data || []).map((item) => ({
                id: item.id,
                age: item.age || 'Unknown',
                race: item.race || 'Unknown',
                risk_level: item.risk_level || 'Unknown',
                total_score: item.total_score || 0,
                created_at: item.created_at,
                systemic_steroid: item.systemic_steroid === true,
                ocular_steroid: item.ocular_steroid === true,
                intravitreal: item.intravitreal === true,
                family_glaucoma: item.family_glaucoma === true,
                iop_baseline: item.iop_baseline === true,
                vertical_asymmetry: item.vertical_asymmetry === true,
                vertical_ratio: item.vertical_ratio === true,
                doctor_id: item.doctor_id || '',
                doctor_name: item.doctor_name || 'Unknown',
                specialty: item.specialty || '',
                office_location: item.office_location || '',
                state: item.state || '',
                zip_code: item.zip_code || ''
            }));
            return patientData;
        }
        catch (error) {
            console.error("Error fetching patient data:", error);
            toast.error(`Error fetching patient data: ${error.message}`);
            return [];
        }
    },
    async getPatientsByRegion(region) {
        // This is a convenience wrapper around fetchPatientData
        return this.fetchPatientData({ state: region });
    },
    async getPatientsByDoctor(doctorId) {
        // This is a convenience wrapper around fetchPatientData
        return this.fetchPatientData({ doctor_id: doctorId });
    },
    // QUESTION MANAGEMENT
    async fetchQuestionScores() {
        try {
            console.log("Fetching question scores...");
            // Query questions with nested selects for dropdown options
            const { data: questionsData, error: questionsError } = await supabase
                .from('questions')
                .select(`
          id,
          question,
          question_type,
          dropdown_options (
            id,
            option_text,
            score
          ),
          conditional_items (
            id,
            condition_value,
            score
          )
        `);
            if (questionsError) {
                console.error("Error fetching questions:", questionsError);
                throw questionsError;
            }
            // Transform the data into QuestionScore format
            const questionScores = [];
            // Process the data
            questionsData?.forEach((question) => {
                // Add dropdown options
                if (question.dropdown_options && question.dropdown_options.length > 0) {
                    question.dropdown_options.forEach((option) => {
                        questionScores.push({
                            id: question.id,
                            question: question.question,
                            question_type: question.question_type,
                            score: option.score || 0,
                            option_id: option.id,
                            option_text: option.option_text
                        });
                    });
                }
                // Add conditional items
                if (question.conditional_items && question.conditional_items.length > 0) {
                    question.conditional_items.forEach((item) => {
                        questionScores.push({
                            id: question.id,
                            question: question.question,
                            question_type: question.question_type,
                            score: item.score || 0,
                            option_id: item.id,
                            option_text: item.condition_value
                        });
                    });
                }
                // If no options or items, add the base question
                if ((!question.dropdown_options || question.dropdown_options.length === 0) &&
                    (!question.conditional_items || question.conditional_items.length === 0)) {
                    questionScores.push({
                        id: question.id,
                        question: question.question,
                        question_type: question.question_type,
                        score: 0
                    });
                }
            });
            console.log("Question scores fetched successfully:", questionScores.length, "results");
            return questionScores;
        }
        catch (error) {
            console.error("Error fetching question scores:", error);
            toast.error(`Error fetching question scores: ${error.message}`);
            return [];
        }
    },
    async updateQuestionScore(questionId, optionId, score) {
        try {
            if (!optionId) {
                console.error("No option ID provided");
                return false;
            }
            console.log(`Updating score for option ${optionId} to ${score}...`);
            // First determine if this is a dropdown option or conditional item
            const { count: dropdownCount, error: countError } = await supabase
                .from('dropdown_options')
                .select('*', { count: 'exact', head: true })
                .eq('id', optionId);
            if (countError) {
                console.error("Error checking option type:", countError);
                throw countError;
            }
            // Use the option type to call the RPC function
            const optionType = dropdownCount && dropdownCount > 0 ? 'dropdown' : 'conditional';
            console.log(`Identified option type as: ${optionType}`);
            const { data, error } = await supabase.rpc('update_question_score', {
                option_type: optionType,
                option_id: optionId,
                new_score: score
            });
            if (error) {
                console.error("Error updating score:", error);
                throw error;
            }
            console.log("Score updated successfully");
            toast.success("Question score updated successfully");
            return true;
        }
        catch (error) {
            console.error("Error updating question score:", error);
            toast.error(`Error updating score: ${error.message}`);
            return false;
        }
    },
    // LOCATION DATA
    async getUniqueLocations() {
        try {
            console.log("Fetching unique locations...");
            // Get all profiles with location data
            const { data, error } = await supabase
                .from('profiles')
                .select('state, location, zip_code')
                .not('state', 'is', null);
            if (error) {
                console.error("Error fetching locations:", error);
                throw error;
            }
            // Extract unique values
            const states = Array.from(new Set(data?.map(p => p.state).filter(Boolean)));
            const locations = Array.from(new Set(data?.map(p => p.location).filter(Boolean)));
            const zipCodes = Array.from(new Set(data?.map(p => p.zip_code).filter(Boolean)));
            return { states, locations, zipCodes };
        }
        catch (error) {
            console.error("Error fetching locations:", error);
            toast.error(`Error fetching location data: ${error.message}`);
            return { states: [], locations: [], zipCodes: [] };
        }
    }
};
