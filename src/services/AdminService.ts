import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  created_at: string;
}

export interface PatientData {
  id: string;
  age: string;
  race: string;
  risk_level: string;
  total_score: number;
  created_at: string;
  systemic_steroid: boolean;
  ocular_steroid: boolean;
  intravitreal: boolean;
  family_glaucoma: boolean;
  iop_baseline: boolean;
  vertical_asymmetry: boolean;
  vertical_ratio: boolean;
}

export interface QuestionScore {
  id: string;
  question: string;
  question_type: string;
  score: number;
  option_id?: string;
  option_text?: string;
}

export const AdminService = {
  async fetchUsers(): Promise<UserProfile[]> {
    try {
      console.log("Fetching users from Supabase...");
      
      // Try RPC function first (security-definer function that can access auth tables)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_users_secure');
      
      // If RPC succeeded, use that data
      if (!rpcError && rpcData) {
        console.log("Users fetched successfully via RPC:", (rpcData as any[]).length, "results");
        return rpcData as UserProfile[];
      }
      
      // If RPC failed, log the error but continue with fallback
      if (rpcError) {
        console.warn("RPC function failed, using fallback method:", rpcError.message);
      }
      
      // Fallback: Direct query to profiles table
      console.log("Using fallback method to fetch users from profiles table");
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }
      
      // Transform profiles data to match UserProfile interface
      const userProfiles: UserProfile[] = (profilesData || []).map((profile: any) => ({
        id: profile.id,
        email: profile.email,
        name: profile.name || '',
        is_admin: profile.is_admin || false,
        created_at: profile.created_at
      }));
      
      console.log("Users fetched successfully via fallback:", userProfiles.length, "results");
      return userProfiles;
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(`Error fetching users: ${error.message}`);
      return [];
    }
  },

  async setAdminStatus(email: string, isAdmin: boolean): Promise<boolean> {
    try {
      console.log(`Setting admin status for ${email} to ${isAdmin}`);
      
      // First try the RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'set_user_admin_status',
        { 
          user_email: email,
          admin_status: isAdmin
        }
      );
      
      // If the RPC call was successful, we're done
      if (!rpcError) {
        console.log("Admin status updated successfully via RPC");
        toast.success(`${isAdmin ? 'Granted' : 'Revoked'} admin rights for ${email}`);
        return true;
      }
      
      // Log RPC error but continue with fallback
      console.warn("RPC function failed, using fallback method:", rpcError.message);
      
      // Fallback: First fetch the user's profile by email
      console.log("Using fallback method to update admin status");
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email as any)
        .single();
      
      if (profileError) {
        console.error("Error finding profile:", profileError);
        throw new Error(`Could not find user profile for ${email}`);
      }
      
      // Check if profileData exists and has an id property before accessing it
      const profileId = profileData && 'id' in profileData ? (profileData as any).id : null;
      
      if (!profileId) {
        throw new Error(`No profile found for email: ${email}`);
      }
      
      // Now update the profile's is_admin flag
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: isAdmin } as any)
        .eq('id', profileId as any);
      
      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw updateError;
      }
      
      console.log("Admin status updated successfully via direct profile update");
      toast.success(`${isAdmin ? 'Granted' : 'Revoked'} admin rights for ${email}`);
      return true;
    } catch (error: any) {
      console.error("Error updating admin status:", error);
      toast.error(`Error updating admin status: ${error.message}`);
      return false;
    }
  },

  async createUser(userData: { email: string, password: string, name: string, is_admin: boolean }): Promise<boolean> {
    try {
      console.log("Creating new user:", userData.email);
      
      // Try the admin.createUser method first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: { name: userData.name }
      });
      
      // If admin API works, use that
      if (!authError && authData.user) {
        console.log("User created successfully via admin API");
        
        // Try to create the profile manually as well
        try {
          // Insert record directly into profiles
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: userData.email,
              name: userData.name,
              is_admin: userData.is_admin,
              created_at: new Date().toISOString()
            } as any);
            
          if (profileError) {
            console.warn("Error creating profile, but auth user created:", profileError);
          }
        } catch (profileInsertError) {
          console.warn("Failed to create profile record:", profileInsertError);
        }
        
        if (userData.is_admin) {
          // Set admin status if needed
          await this.setAdminStatus(userData.email, true);
        }
        
        return true;
      }
      
      // If admin API fails, report the specific error
      if (authError) {
        console.warn("Admin API failed:", authError.message);
        
        // If it's a permission error, tell the user they don't have admin rights
        if (authError.message.includes('permission')) {
          toast.error("You don't have permission to create users via the admin API");
          return false;
        }
        
        // For other errors, throw to continue to fallback
        throw authError;
      }
      
      // Fallback for standard users - use signUp
      // Note: This won't actually create the user immediately but will send confirmation email
      console.log("Using fallback method to create user");
      toast.info("Creating user via standard signup (confirmation email will be sent)");
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name
          }
        }
      });
      
      if (signUpError) throw signUpError;
      
      toast.success("User signup initiated, confirmation email sent");
      return true;
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(`Error creating user: ${error.message}`);
      return false;
    }
  },

  async updateUser(userData: { id: string, email: string, name: string, is_admin: boolean }): Promise<boolean> {
    try {
      // Update the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          name: userData.name,
          is_admin: userData.is_admin 
        } as any)
        .eq('id', userData.id as any);
      
      if (profileError) throw profileError;
      
      return true;
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(`Error updating user: ${error.message}`);
      return false;
    }
  },

  async fetchAnonymousPatientData(): Promise<PatientData[]> {
    try {
      console.log("Fetching anonymous patient data...");
      
      // Use the public view we created specifically for this purpose
      // This view extracts the JSON fields into proper columns and doesn't require admin role
      const { data, error } = await supabase
        .from('patient_data_view')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching patient data:", error);
        if (error.message.includes('permission denied')) {
          toast.error('Permission denied. Your account may not have admin privileges.');
        } else {
          toast.error(`Error fetching patient data: ${error.message}`);
        }
        throw error;
      }
      
      console.log("Patient data fetched successfully via view:", data?.length || 0, "results");
      
      // Data from view is already in the correct format, just need to normalize it
      const patientData: PatientData[] = (data || []).map((item: any) => ({
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
        vertical_ratio: item.vertical_ratio === true
      }));
      
      return patientData;
    } catch (error: any) {
      console.error("Error fetching patient data:", error);
      toast.error(`Error fetching patient data: ${error.message}`);
      return [];
    }
  },

  async fetchQuestionScores(): Promise<QuestionScore[]> {
    try {
      console.log("Fetching question scores...");
      
      // With RLS policies, we can directly query with nested selects
      // First, get dropdown option scores
      const { data: dropdownData, error: dropdownError } = await supabase
        .from('questions')
        .select(`
          id,
          question_text,
          question_type,
          dropdown_options (
            id,
            option_text,
            score
          )
        `);
      
      if (dropdownError) {
        console.error("Error fetching dropdown scores:", dropdownError);
        if (dropdownError.message.includes('permission denied')) {
          toast.error('Permission denied. Your account may not have admin privileges.');
        } else {
          toast.error(`Error fetching dropdown scores: ${dropdownError.message}`);
        }
        throw dropdownError;
      }
      
      // Then get conditional item scores
      const { data: conditionalData, error: conditionalError } = await supabase
        .from('questions')
        .select(`
          id,
          question_text,
          question_type,
          conditional_items (
            id,
            condition_value,
            score
          )
        `);
      
      if (conditionalError) {
        console.error("Error fetching conditional scores:", conditionalError);
        if (conditionalError.message.includes('permission denied')) {
          toast.error('Permission denied. Your account may not have admin privileges.');
        } else {
          toast.error(`Error fetching conditional scores: ${conditionalError.message}`);
        }
        throw conditionalError;
      }
      
      console.log("Question scores fetched successfully");
      
      // Transform the data into the expected format
      const questionScores: QuestionScore[] = [];
      
      // Process dropdown options
      dropdownData?.forEach((question: any) => {
        if (question.dropdown_options && question.dropdown_options.length > 0) {
          // Add each dropdown option score
          question.dropdown_options.forEach((option: any) => {
            questionScores.push({
              id: question.id,
              question: question.question_text,
              question_type: question.question_type,
              score: option.score || 0,
              option_id: option.id,
              option_text: option.option_text
            });
          });
        } else {
          // Question with no dropdown options
          questionScores.push({
            id: question.id,
            question: question.question_text,
            question_type: question.question_type,
            score: 0
          });
        }
      });
      
      // Process conditional items
      conditionalData?.forEach((question: any) => {
        if (question.conditional_items && question.conditional_items.length > 0) {
          // Add each conditional item score
          question.conditional_items.forEach((item: any) => {
            // Only add if not already added from dropdown options
            const existing = questionScores.find(
              q => q.id === question.id && q.option_id === item.id
            );
            
            if (!existing) {
              questionScores.push({
                id: question.id,
                question: question.question_text,
                question_type: question.question_type,
                score: item.score || 0,
                option_id: item.id,
                option_text: item.condition_value
              });
            }
          });
        }
      });
      
      return questionScores;
    } catch (error: any) {
      console.error("Error fetching question scores:", error);
      toast.error(`Error fetching question scores: ${error.message}`);
      return [];
    }
  },

  async updateQuestionScore(questionId: string, optionId: string | undefined, score: number): Promise<boolean> {
    try {
      if (!optionId) {
        return false; // No option ID provided
      }
      console.log(`Updating score for option ${optionId} to ${score}...`);
      
      // First determine if this is a dropdown option or conditional item
      const { count: dropdownCount, error: countError } = await supabase
        .from('dropdown_options')
        .select('*', { count: 'exact', head: true })
        .eq('id', optionId as any);
        
      if (countError) {
        console.error("Error checking option type:", countError);
        if (countError.message.includes('permission denied')) {
          toast.error('Permission denied. Your account may not have admin privileges.');
          return false;
        }
        throw countError;
      }
      
      // Directly update the appropriate table based on the option type
      const optionType = dropdownCount && dropdownCount > 0 ? 'dropdown' : 'conditional';
      console.log(`Identified option type as: ${optionType}`);
      
      let error;
      
      if (optionType === 'dropdown') {
        // Update dropdown option
        const { error: updateError } = await supabase
          .from('dropdown_options')
          .update({ score: score } as any)
          .eq('id', optionId as any);
          
        error = updateError;
      } else {
        // Update conditional item
        const { error: updateError } = await supabase
          .from('conditional_items')
          .update({ score: score } as any)
          .eq('id', optionId as any);
          
        error = updateError;
      }
      
      if (error) {
        console.error("Error updating score:", error);
        if (error.message.includes('permission denied')) {
          toast.error('Permission denied. Your account may not have admin privileges.');
        } else {
          toast.error(`Error updating score: ${error.message}`);
        }
        throw error;
      }
      
      console.log("Score updated successfully");
      return true;
    } catch (error: any) {
      console.error("Error updating question score:", error);
      toast.error(`Error updating score: ${error.message}`);
      return false;
    }
  }
};
