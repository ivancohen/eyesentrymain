import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

// Interfaces for the different data types (same as FixedAdminService)
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  is_approved?: boolean;
  created_at: string;
  location?: string;
  state?: string;
  zip_code?: string;
  specialty?: string;
  phone_number?: string;
  address?: string;
}

export interface PatientData {
  id: string;
  created_at: string;
  doctor_id: string;
  profile_id: string;
  doctor_email: string;
  doctor_name?: string;
  office_location?: string;
  state?: string;
  zip_code?: string;
  specialty?: string;
}

export interface QuestionScore {
  id: string;
  question: string;
  question_type: string;
  score: number;
  option_id?: string;
  option_text?: string;
}

export interface LocationFilter {
  doctor_id?: string;
  state?: string;
  zip_code?: string;
  office_location?: string;
}

export interface DoctorApproval extends UserProfile {
  contact?: string;
}

// EMERGENCY SERVICE THAT USES DIRECT TABLE ACCESS
// For use when RLS policies are causing permission issues
export const EmergencyAdminService = {
  // USER MANAGEMENT
  
  async fetchUsers(): Promise<UserProfile[]> {
    try {
      console.log("EMERGENCY MODE: Fetching users from Supabase...");
      
      // Try emergency view first
      let data, error;
      try {
        const result = await supabase
          .from('emergency_users_view')
          .select('*')
          .order('created_at', { ascending: false });
        
        data = result.data;
        error = result.error;
      } catch (viewError) {
        // If emergency view doesn't exist, try direct table access
        console.log("Emergency view not available, attempting direct table access");
        const result = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        data = result.data;
        error = result.error;
      }
      
      if (error) {
        throw error;
      }
      
      // Transform profiles data to match UserProfile interface
      const userProfiles: UserProfile[] = (data || []).map((profile: any) => ({
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
      
      console.log("EMERGENCY MODE: Users fetched successfully:", userProfiles.length, "results");
      
      // If no users returned but we have current user info from auth, include current user
      if (userProfiles.length === 0) {
        // Add current authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log("No users returned, adding current user to list");
          userProfiles.push({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || '',
            is_admin: true, // Assume admin since they reached this page
            created_at: user.created_at || new Date().toISOString()
          });
        }
      }
      
      return userProfiles;
    } catch (error: any) {
      console.error("EMERGENCY MODE: Error fetching users:", error);
      toast.error(`Error fetching users: ${error.message}`);
      
      // Return current user as fallback
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          return [{
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || '',
            is_admin: true, // Assume admin since they reached this page
            created_at: user.created_at || new Date().toISOString()
          }];
        }
      } catch (e) {
        console.error("Failed to get current user as fallback:", e);
      }
      
      return [];
    }
  },

  async setAdminStatus(email: string, isAdmin: boolean): Promise<boolean> {
    try {
      console.log(`EMERGENCY MODE: Setting admin status for ${email} to ${isAdmin}`);
      
      // Direct table update instead of RPC
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: isAdmin })
        .eq('email', email);
      
      if (error) {
        throw error;
      }
      
      toast.success(`${isAdmin ? 'Granted' : 'Revoked'} admin rights for ${email}`);
      return true;
    } catch (error: any) {
      console.error("EMERGENCY MODE: Error updating admin status:", error);
      toast.error(`Error updating admin status: ${error.message}`);
      return false;
    }
  },

  async createUser(userData: { 
    email: string, 
    password: string, 
    name: string, 
    is_admin: boolean,
    location?: string,
    state?: string,
    zip_code?: string,
    specialty?: string,
    phone_number?: string,
    address?: string
  }): Promise<boolean> {
    try {
      console.log("EMERGENCY MODE: Creating new user:", userData.email);
      
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
      
      // Create profile for the user - direct table insert
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
        } as any);
        
      if (profileError) {
        console.error("Error creating profile:", profileError);
        toast.error(`Error creating profile: ${profileError.message}`);
        return false;
      }
      
      toast.success("User created successfully");
      return true;
    } catch (error: any) {
      console.error("EMERGENCY MODE: Error creating user:", error);
      toast.error(`Error creating user: ${error.message}`);
      return false;
    }
  },

  async updateUser(userData: { 
    id: string, 
    email: string, 
    name: string, 
    is_admin: boolean,
    is_approved?: boolean,
    location?: string,
    state?: string,
    zip_code?: string,
    specialty?: string,
    phone_number?: string,
    address?: string
  }): Promise<boolean> {
    try {
      console.log("EMERGENCY MODE: Updating user:", userData.email);
      
      // Direct update to profiles table
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
        } as any)
        .eq('id', userData.id as any);
      
      if (profileError) {
        console.error("Error updating profile:", profileError);
        throw profileError;
      }
      
      toast.success("User updated successfully");
      return true;
    } catch (error: any) {
      console.error("EMERGENCY MODE: Error updating user:", error);
      toast.error(`Error updating user: ${error.message}`);
      return false;
    }
  },
  
  // DOCTOR APPROVAL MANAGEMENT
  
  async fetchPendingDoctorApprovals(): Promise<DoctorApproval[]> {
    try {
      console.log("EMERGENCY MODE: Fetching pending doctor approvals...");
      
      // Try emergency view first
      let data, error;
      try {
        const result = await supabase
          .from('emergency_doctor_approvals')
          .select('*')
          .order('created_at', { ascending: false });
        
        data = result.data;
        error = result.error;
      } catch (viewError) {
        // If emergency view doesn't exist, try direct query
        console.log("Emergency view not available, attempting direct query");
        const result = await supabase
          .from('profiles')
          .select('*')
          .is('is_approved', false)
          .not('specialty', 'is', null)
          .order('created_at', { ascending: false });
        
        data = result.data;
        error = result.error;
      }
      
      if (error) {
        throw error;
      }
      
      // Map to DoctorApproval interface
      const pendingApprovals: DoctorApproval[] = (data || []).map((profile: any) => ({
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
        phone_number: profile.phone_number || '',
        address: profile.address || ''
      }));
      
      console.log("EMERGENCY MODE: Pending approvals fetched successfully:", pendingApprovals.length, "results");
      return pendingApprovals;
    } catch (error: any) {
      console.error("EMERGENCY MODE: Error fetching pending approvals:", error);
      toast.error(`Error fetching pending approvals: ${error.message}`);
      return [];
    }
  },
  
  async approveDoctor(doctorId: string): Promise<boolean> {
    try {
      console.log(`EMERGENCY MODE: Approving doctor account: ${doctorId}`);
      
      // Direct table update instead of RPC
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', doctorId);
      
      if (error) {
        throw error;
      }
      
      toast.success("Doctor account approved successfully");
      return true;
    } catch (error: any) {
      console.error("EMERGENCY MODE: Error approving doctor:", error);
      toast.error(`Error approving doctor: ${error.message}`);
      return false;
    }
  },
  
  async rejectDoctor(doctorId: string): Promise<boolean> {
    try {
      console.log(`EMERGENCY MODE: Rejecting doctor account: ${doctorId}`);
      
      // Direct table update instead of RPC
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: false })
        .eq('id', doctorId);
      
      if (error) {
        throw error;
      }
      
      toast.success("Doctor account rejected");
      return true;
    } catch (error: any) {
      console.error("EMERGENCY MODE: Error rejecting doctor:", error);
      toast.error(`Error rejecting doctor: ${error.message}`);
      return false;
    }
  },
  
  // PATIENT DATA MANAGEMENT
  
  async fetchPatientData(filters?: LocationFilter): Promise<PatientData[]> {
    try {
      console.log("EMERGENCY MODE: Fetching patient data...", filters);
      
      // Try emergency view first
      let query;
      try {
        query = supabase
          .from('emergency_patient_data')
          .select('*');
      } catch (viewError) {
        // If emergency view doesn't exist, try direct query
        console.log("Emergency view not available, attempting direct query");
        query = supabase
          .from('patient_responses')
          .select(`
            *,
            doctor:profiles(email, name, specialty, location, state, zip_code)
          `);
      }
      
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
        throw error;
      }
      
      console.log("EMERGENCY MODE: Patient data fetched successfully:", data?.length || 0, "results");
      
      // Map to PatientData interface
      const patientData: PatientData[] = (data || []).map((item: any) => {
        // Handle both emergency view format and joined query format
        const doctor = item.doctor || {};
        return {
          id: item.id,
          created_at: item.created_at,
          doctor_id: item.doctor_id || '',
          profile_id: item.profile_id || '',
          doctor_email: item.doctor_email || doctor.email || '',
          doctor_name: item.doctor_name || doctor.name || 'Unknown',
          office_location: item.office_location || doctor.location || '',
          state: item.state || doctor.state || '',
          zip_code: item.zip_code || doctor.zip_code || '',
          specialty: item.specialty || doctor.specialty || ''
        };
      });
      
      return patientData;
    } catch (error: any) {
      console.error("EMERGENCY MODE: Error fetching patient data:", error);
      toast.error(`Error fetching patient data: ${error.message}`);
      return [];
    }
  },
  
  async getPatientsByRegion(region: string): Promise<PatientData[]> {
    // Convenience wrapper around fetchPatientData
    return this.fetchPatientData({ state: region });
  },
  
  async getPatientsByDoctor(doctorId: string): Promise<PatientData[]> {
    // Convenience wrapper around fetchPatientData
    return this.fetchPatientData({ doctor_id: doctorId });
  },
  
  // QUESTION MANAGEMENT
  
  async fetchQuestionScores(): Promise<QuestionScore[]> {
    try {
      console.log("EMERGENCY MODE: Fetching question scores...");
      
      // Direct query to questions table
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
        throw questionsError;
      }
      
      // Transform the data into QuestionScore format
      const questionScores: QuestionScore[] = [];
      
      // Process the data
      questionsData?.forEach((question: any) => {
        // Add dropdown options
        if (question.dropdown_options && question.dropdown_options.length > 0) {
          question.dropdown_options.forEach((option: any) => {
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
          question.conditional_items.forEach((item: any) => {
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
      
      console.log("EMERGENCY MODE: Question scores fetched successfully:", questionScores.length, "results");
      return questionScores;
    } catch (error: any) {
      console.error("EMERGENCY MODE: Error fetching question scores:", error);
      toast.error(`Error fetching question scores: ${error.message}`);
      return [];
    }
  },
  
  async updateQuestionScore(questionId: string, optionId: string | undefined, score: number): Promise<boolean> {
    try {
      if (!optionId) {
        console.error("No option ID provided");
        return false;
      }
      
      console.log(`EMERGENCY MODE: Updating score for option ${optionId} to ${score}...`);
      
      // First determine if this is a dropdown option or conditional item
      const { count: dropdownCount, error: countError } = await supabase
        .from('dropdown_options')
        .select('*', { count: 'exact', head: true })
        .eq('id', optionId as any);
        
      if (countError) {
        throw countError;
      }
      
      const optionType = dropdownCount && dropdownCount > 0 ? 'dropdown' : 'conditional';
      console.log(`Identified option type as: ${optionType}`);
      
      // DIRECT TABLE UPDATE 
      let error;
      if (optionType === 'dropdown') {
        const { error: updateError } = await supabase
          .from('dropdown_options')
          .update({ score })
          .eq('id', optionId as any);
        error = updateError;
      } else {
        const { error: updateError } = await supabase
          .from('conditional_items')
          .update({ score })
          .eq('id', optionId as any);
        error = updateError;
      }
      
      if (error) {
        throw error;
      }
      
      console.log("EMERGENCY MODE: Score updated successfully");
      toast.success("Question score updated successfully");
      return true;
    } catch (error: any) {
      console.error("EMERGENCY MODE: Error updating question score:", error);
      toast.error(`Error updating score: ${error.message}`);
      return false;
    }
  },
  
  // LOCATION DATA
  
  async getUniqueLocations(): Promise<{ states: string[], locations: string[], zipCodes: string[] }> {
    try {
      console.log("EMERGENCY MODE: Fetching unique locations...");
      
      // Get all profiles with location data
      const { data, error } = await supabase
        .from('profiles')
        .select('state, location, zip_code')
        .not('state', 'is', null);
      
      if (error) {
        throw error;
      }
      
      // Extract unique values
      const states = Array.from(new Set(data?.map(p => p.state).filter(Boolean)));
      const locations = Array.from(new Set(data?.map(p => p.location).filter(Boolean)));
      const zipCodes = Array.from(new Set(data?.map(p => p.zip_code).filter(Boolean)));
      
      return { states, locations, zipCodes };
    } catch (error: any) {
      console.error("EMERGENCY MODE: Error fetching locations:", error);
      toast.error(`Error fetching location data: ${error.message}`);
      return { states: [], locations: [], zipCodes: [] };
    }
  }
};
