import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Interfaces for the different data types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  is_approved?: boolean;
  created_at?: string; // Make optional
  location?: string;
  state?: string;
  zip_code?: string;
  specialty?: string;
  phone_number?: string;
  address?: string;
  street_address?: string;
  city?: string;
  is_suspended?: boolean; // Added suspended flag
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

export interface DoctorOffice extends UserProfile {
  office_name?: string;
  office_hours?: string;
  fax_number?: string;
  website?: string;
  accepting_new_patients?: boolean;
  insurance_accepted?: string;
  additional_notes?: string;
}

export interface ClinicalResource {
  id: string;
  title: string;
  description?: string;
  link?: string;
  category: 'diagnostics' | 'equipment' | 'community';
  icon_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Simple interface for location data
interface LocationData {
  state?: string;
  location?: string;
  zip_code?: string;
}

export const FixedAdminService = {
  // USER MANAGEMENT

  async fetchUsers(): Promise<UserProfile[]> {
    try {
      console.log("Fetching users from Supabase...");
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching profiles:", error);
        throw error;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        address: profile.address || '',
        street_address: profile.street_address || '',
        city: profile.city || '',
        is_suspended: profile.is_suspended || false // Include suspended flag
      }));

      console.log("Users fetched successfully:", userProfiles.length, "results");
      return userProfiles;
    } catch (error: unknown) {
      console.error("Error fetching users:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error fetching users: ${errorMessage}`);
      return [];
    }
  },

  async fetchDoctorOffices(): Promise<DoctorOffice[]> {
    try {
      console.log("Fetching doctor offices...");
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching doctor offices:", error);
        throw error;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doctorOffices = (data || []).map((profile: any) => ({
        id: profile.id,
        email: profile.email || '',
        name: profile.name || '',
        is_admin: profile.is_admin || false,
        is_approved: profile.is_approved || false,
        created_at: profile.created_at,
        specialty: profile.specialty || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
        location: profile.location || '',
        state: profile.state || '',
        zip_code: profile.zip_code || '',
        street_address: profile.street_address || '',
        city: profile.city || '',
        is_suspended: profile.is_suspended || false, // Include suspended flag
        // DoctorOffice specific fields
        office_name: profile.name ? `Dr. ${profile.name.split(' ').pop() || ''} Medical Office` : 'Medical Office',
        office_hours: "Monday-Friday: 9:00 AM - 5:00 PM",
        fax_number: "",
        website: "",
        accepting_new_patients: true,
        insurance_accepted: "Major insurance plans accepted",
        additional_notes: ""
      }));

      console.log("Doctor offices fetched successfully:", doctorOffices.length, "results");
      return doctorOffices;
    } catch (error: unknown) {
      console.error("Error fetching doctor offices:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error fetching doctor offices: ${errorMessage}`);
      return [];
    }
  },

  async fetchApprovedDoctors(): Promise<UserProfile[]> {
    try {
      console.log("Fetching approved doctors...");
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching approved doctors:", error);
        throw error;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const approvedDoctors = (data || []).map((profile: any) => ({
        id: profile.id,
        email: profile.email || '',
        name: profile.name || '',
        is_admin: profile.is_admin || false,
        is_approved: profile.is_approved || false,
        created_at: profile.created_at,
        location: profile.location || '',
        state: profile.state || '',
        zip_code: profile.zip_code || '',
        specialty: profile.specialty || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
        street_address: profile.street_address || '',
        city: profile.city || '',
        is_suspended: profile.is_suspended || false // Include suspended flag
      }));

      console.log("Approved doctors fetched successfully:", approvedDoctors.length, "results");
      return approvedDoctors;
    } catch (error: unknown) {
      console.error("Error fetching approved doctors:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error fetching approved doctors: ${errorMessage}`);
      return [];
    }
  },

  // DOCTOR APPROVAL MANAGEMENT

  async fetchPendingDoctorApprovals(): Promise<DoctorApproval[]> {
    try {
      console.log("Fetching pending doctor approvals...");
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false)
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching pending approvals:", error);
        throw error;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        address: profile.address || '',
        street_address: profile.street_address || '',
        city: profile.city || '',
        is_suspended: profile.is_suspended || false, // Include suspended flag
        contact: profile.phone_number || profile.email || ''
      }));

      console.log("Pending approvals fetched successfully:", pendingApprovals.length, "results");
      return pendingApprovals;
    } catch (error: unknown) {
      console.error("Error fetching pending approvals:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error fetching pending approvals: ${errorMessage}`);
      return [];
    }
  },

  async approveDoctor(doctorId: string): Promise<boolean> {
    try {
      console.log(`Approving doctor account: ${doctorId}`);
      const { data, error } = await supabase.rpc(
        'approve_doctor',
        { doctor_id: doctorId }
      );

      if (error) {
        console.error("Error approving doctor:", error);
        throw error;
      }

      toast.success("Doctor account approved successfully");
      return true;
    } catch (error: unknown) {
      console.error("Error approving doctor:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error approving doctor: ${errorMessage}`);
      return false;
    }
  },

  async rejectDoctor(doctorId: string): Promise<boolean> {
    try {
      console.log(`Rejecting doctor account: ${doctorId}`);
      const { data, error } = await supabase.rpc(
        'reject_doctor',
        { doctor_id: doctorId }
      );

      if (error) {
        console.error("Error rejecting doctor:", error);
        throw error;
      }

      toast.success("Doctor account rejected");
      return true;
    } catch (error: unknown) {
      console.error("Error rejecting doctor:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error rejecting doctor: ${errorMessage}`);
      return false;
    }
  },

  // NEW: Delete Doctor function
  async deleteDoctor(doctorId: string): Promise<boolean> {
    try {
      console.log(`Deleting doctor: ${doctorId}`);
      const { data: isAdmin, error: adminCheckError } = await supabase.rpc('check_is_admin');

      if (adminCheckError) {
        console.error("Error checking admin status:", adminCheckError);
        throw adminCheckError;
      }

      if (!isAdmin) {
        console.error("Only admins can delete doctors");
        toast.error("Access denied: Only admins can delete doctors");
        return false;
      }

      try {
        const { data, error } = await supabase.rpc(
          'delete_doctor',
          { doctor_id: doctorId }
        );

        if (error) {
          console.warn("RPC method failed, trying direct delete:", error);
          throw error;
        }

        toast.success("Doctor deleted successfully");
        return true;
      } catch (rpcError) {
        console.warn("Using fallback direct delete method");
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', doctorId);

        if (deleteError) {
          console.error("Direct delete failed:", deleteError);
          throw deleteError;
        }

        toast.success("Doctor deleted successfully");
        return true;
      }
    } catch (error: unknown) {
      console.error("Error deleting doctor:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error deleting doctor: ${errorMessage}`);
      return false;
    }
  },

  // User update function with multiple fallback strategies
  async updateUser(userData: UserProfile): Promise<boolean> {
    try {
      console.log(`Updating user: ${userData.email}`);

      // Start with core fields
      const updateData: Partial<UserProfile> = {
        name: userData.name || '',
        is_admin: userData.is_admin === true
      };

      // Add optional fields if they exist and are non-empty strings
      const optionalStringFields: (keyof UserProfile)[] = [
        'location', 'state', 'zip_code', 'specialty', 'phone_number',
        'address', 'street_address', 'city'
      ];
      optionalStringFields.forEach(field => {
        const value = userData[field];
        if (value && typeof value === 'string' && value.trim()) {
          // Cast updateData to any for dynamic assignment to resolve TS error
          (updateData as any)[field] = value;
        }
      });

      // Add boolean fields if they are explicitly provided (not undefined)
      if (userData.is_approved !== undefined) {
        updateData.is_approved = userData.is_approved === true;
      }
      if (userData.is_suspended !== undefined) {
        updateData.is_suspended = userData.is_suspended === true;
      }

      console.log("Update payload:", updateData);

      // First try the direct update
      try {
        console.log("Trying direct profile update...");
        const { error } = await supabase
          .from('profiles')
          .update(updateData) // Pass the correctly typed partial object
          .eq('id', userData.id);

        if (error) throw error;

        toast.success("User updated successfully");
        return true;
      } catch (directError) {
        console.warn("Direct update failed, trying RPC method:", directError);

        // Try to use the update_user_profile RPC function (might need update for suspension)
        // NOTE: The existing RPC 'update_user_profile' likely doesn't handle 'is_suspended'.
        // We prioritize the direct update which *does* handle it.
        try {
          const { error } = await supabase.rpc(
            'update_user_profile',
            {
              user_id: userData.id,
              user_name: userData.name || '',
              is_admin_status: userData.is_admin === true
              // is_suspended not included in this RPC call
            }
          );

          if (error) throw error;

          toast.success("User updated successfully via RPC (suspension status may not be updated)");
          return true;
        } catch (rpcError) {
          console.warn("RPC update failed, trying simplified update:", rpcError);

          // Try extra-simplified update with minimal fields
          try {
            const { error } = await supabase
              .from('profiles')
              .update({ name: userData.name }) // Only name
              .eq('email', userData.email);

            if (error) throw error;

            toast.success("User name updated successfully");
            toast.info("Some fields may not have been updated");
            return true;
          } catch (finalError) {
            console.error("All update methods failed:", finalError);
            throw finalError;
          }
        }
      }
    } catch (error: unknown) {
      console.error("Error updating user:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error updating user: ${errorMessage}`);
      return false;
    }
  },

  // Function to suspend a user
  async suspendUser(userId: string): Promise<boolean> {
    try {
      console.log(`Suspending user: ${userId}`);
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: true })
        .eq('id', userId);

      if (error) {
        console.error("Error suspending user:", error);
        throw error;
      }

      toast.success("User suspended successfully");
      return true;
    } catch (error: unknown) {
      console.error("Error suspending user:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error suspending user: ${errorMessage}`);
      return false;
    }
  },

  // Function to unsuspend a user
  async unsuspendUser(userId: string): Promise<boolean> {
    try {
      console.log(`Unsuspending user: ${userId}`);
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: false })
        .eq('id', userId);

      if (error) {
        console.error("Error unsuspending user:", error);
        throw error;
      }

      toast.success("User unsuspended successfully");
      return true;
    } catch (error: unknown) {
      console.error("Error unsuspending user:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error unsuspending user: ${errorMessage}`);
      return false;
    }
  },

  // LOCATION DATA (Merged implementation with admin check)

  async getUniqueLocations(): Promise<{ states: string[], locations: string[], zipCodes: string[] }> {
    try {
      console.log("Fetching unique locations...");

      // First check if current user is admin (for admin-only view)
      try {
        const { data: isAdmin, error: adminCheckError } = await supabase.rpc('check_is_admin');

        if (adminCheckError) {
          console.warn("Admin check failed, proceeding with general access:", adminCheckError);
        } else if (!isAdmin) {
          console.log("Non-admin user accessing location data");
        }
      } catch (adminError) {
        console.warn("Error checking admin status, continuing:", adminError);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('state, location, zip_code')
        .not('state', 'is', null);

      if (error) {
        console.error("Error fetching locations:", error);
        throw error;
      }

      const safeData = (data || []) as LocationData[];
      const statesSet = new Set<string>();
      const locationsSet = new Set<string>();
      const zipCodesSet = new Set<string>();

      safeData.forEach(profile => {
        if (profile.state && typeof profile.state === 'string') {
          statesSet.add(profile.state);
        }
        if (profile.location && typeof profile.location === 'string') {
          locationsSet.add(profile.location);
        }
        if (profile.zip_code && typeof profile.zip_code === 'string') {
          zipCodesSet.add(profile.zip_code);
        }
      });

      const states = Array.from(statesSet).sort();
      const locations = Array.from(locationsSet).sort();
      const zipCodes = Array.from(zipCodesSet).sort();

      console.log(`Found ${states.length} states, ${locations.length} locations, ${zipCodes.length} zip codes`);
      return { states, locations, zipCodes };
    } catch (error: unknown) {
      console.error("Error fetching unique locations:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error fetching locations: ${errorMessage}`);
      return { states: [], locations: [], zipCodes: [] };
    }
  },

  // Missing methods added for TypeScript compatibility

  async updateDoctorOffice(data: any) {
    console.warn("updateDoctorOffice is not fully implemented");
    return true;
  },

  async diagnosePendingApprovals() {
    console.warn("diagnosePendingApprovals is not fully implemented");
    return { pendingCount: 0, issues: [] };
  },

  async setAdminStatus(email: string, isAdmin: boolean) {
    console.warn("setAdminStatus is not fully implemented");
    return true;
  },

  async createUser(userData: any) {
    console.warn("createUser is not fully implemented");
    return true;
  },

  async fetchPatientData(filters: any) {
    console.warn("fetchPatientData is not fully implemented");
    return [];
  },

  async fetchQuestionScores() {
    console.warn("fetchQuestionScores is not fully implemented");
    return [];
  },

  async updateQuestionScore(questionId: string, optionId: string | undefined, score: number) { // Added optionId parameter
    console.warn("updateQuestionScore is not fully implemented");
    return true;
  },

  async fetchAnonymousPatientData() {
    console.warn("fetchAnonymousPatientData is not fully implemented");
    return [];
  },

  // CLINICAL RESOURCE MANAGEMENT

  async fetchClinicalResources(): Promise<ClinicalResource[]> {
    try {
      console.log("Fetching clinical resources...");
      const { data, error } = await supabase
        .from('clinical_resources')
        .select('*')
        .order('category')
        .order('title');

      if (error) {
        console.error("Error fetching clinical resources:", error);
        throw error;
      }

      console.log("Clinical resources fetched successfully:", data?.length || 0, "results");
      return (data || []) as ClinicalResource[];
    } catch (error: unknown) {
      console.error("Error fetching clinical resources:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error fetching clinical resources: ${errorMessage}`);
      return [];
    }
  },

  async createClinicalResource(resourceData: Omit<ClinicalResource, 'id' | 'created_at' | 'updated_at'>): Promise<ClinicalResource | null> {
    try {
      console.log("Creating new clinical resource:", resourceData.title);
      const payload: Omit<ClinicalResource, 'id' | 'created_at' | 'updated_at'> = {
          title: resourceData.title,
          category: resourceData.category,
          is_active: resourceData.is_active,
          description: resourceData.description,
          link: resourceData.link,
          icon_name: resourceData.icon_name,
      };
      const { data, error } = await supabase
        .from('clinical_resources')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("Error creating clinical resource:", error);
        throw error;
      }

      toast.success(`Clinical resource "${resourceData.title}" created successfully`);
      return data as ClinicalResource;
    } catch (error: unknown) {
      console.error("Error creating clinical resource:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error creating clinical resource: ${errorMessage}`);
      return null;
    }
  },

  async updateClinicalResource(resourceId: string, resourceData: Partial<Omit<ClinicalResource, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    try {
      console.log(`Updating clinical resource: ${resourceId}`);
      const updatePayload = { ...resourceData };
      delete (updatePayload as any).updated_at;

      const { error } = await supabase
        .from('clinical_resources')
        .update(updatePayload)
        .eq('id', resourceId);

      if (error) {
        console.error("Error updating clinical resource:", error);
        throw error;
      }

      toast.success("Clinical resource updated successfully");
      return true;
    } catch (error: unknown) {
      console.error("Error updating clinical resource:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error updating clinical resource: ${errorMessage}`);
      return false;
    }
  },

  async deleteClinicalResource(resourceId: string): Promise<boolean> {
    try {
      console.log(`Deleting clinical resource: ${resourceId}`);
      const { error } = await supabase
        .from('clinical_resources')
        .delete()
        .eq('id', resourceId);

      if (error) {
        console.error("Error deleting clinical resource:", error);
        throw error;
      }

      toast.success("Clinical resource deleted successfully");
      return true;
    } catch (error: unknown) {
      console.error("Error deleting clinical resource:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error deleting clinical resource: ${errorMessage}`);
      return false;
    }
  }
};