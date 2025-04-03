import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { safeQueryWithFallback } from "@/utils/supabaseErrorHandler";
import { UserProfile } from "./UserService"; // Import UserProfile

/**
 * @fileoverview Service for managing doctor-specific data and operations.
 */

/**
 * Represents a doctor profile with potential contact information,
 * extending the base UserProfile.
 */
export interface DoctorApproval extends UserProfile {
  contact?: string;
}

/**
 * Represents a doctor's office profile, extending the base UserProfile
 * with office-specific details.
 */
export interface DoctorOffice extends UserProfile {
  office_name?: string;
  office_hours?: string;
  fax_number?: string;
  website?: string;
  accepting_new_patients?: boolean;
  insurance_accepted?: string;
  additional_notes?: string;
}

/**
 * Provides methods for interacting with doctor-related data.
 */
export const DoctorService = {
  /**
   * Fetches profiles of users identified as doctors (non-admin).
   * Maps profile data to the DoctorOffice interface.
   * @returns {Promise<DoctorOffice[]>} A promise resolving to an array of doctor office profiles.
   */
  async fetchDoctorOffices(): Promise<DoctorOffice[]> {
    console.log("Fetching doctor offices...");

    // Use safeQueryWithFallback to handle potential 500 errors
    const data = await safeQueryWithFallback(
      () => supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false) // Assuming non-admins are doctors/patients
        .order('created_at', { ascending: false }),
      [], // Empty array as fallback
      2  // 2 retries
    );

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
      // DoctorOffice specific fields (example data)
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
  },

  /**
   * Fetches profiles of doctors who are approved (non-admin, is_approved = true).
   * @returns {Promise<UserProfile[]>} A promise resolving to an array of approved doctor profiles.
   */
  async fetchApprovedDoctors(): Promise<UserProfile[]> {
    console.log("Fetching approved doctors...");

    // Use safeQueryWithFallback to handle potential 500 errors
    const data = await safeQueryWithFallback(
      () => supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false)
        .eq('is_approved', true)
        .order('created_at', { ascending: false }),
      [], // Empty array as fallback
      2  // 2 retries
    );

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
  },

  /**
   * Fetches profiles of doctors pending approval (non-admin, is_approved = false).
   * Maps profile data to the DoctorApproval interface.
   * @returns {Promise<DoctorApproval[]>} A promise resolving to an array of pending doctor approvals.
   */
  async fetchPendingDoctorApprovals(): Promise<DoctorApproval[]> {
    console.log("Fetching pending doctor approvals...");

    // Use safeQueryWithFallback to handle potential 500 errors
    const data = await safeQueryWithFallback(
      () => supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false)
        .eq('is_approved', false)
        .order('created_at', { ascending: false }),
      [], // Empty array as fallback
      2  // 2 retries
    );

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
      contact: profile.phone_number || profile.email || '' // Add contact field
    }));

    console.log("Pending approvals fetched successfully:", pendingApprovals.length, "results");
    return pendingApprovals;
  },

  /**
   * Approves a doctor's account by calling the 'approve_doctor' RPC function.
   * @param {string} doctorId - The ID of the doctor to approve.
   * @returns {Promise<boolean>} A promise resolving to true if successful, false otherwise.
   */
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

  /**
   * Rejects a doctor's account by calling the 'reject_doctor' RPC function.
   * @param {string} doctorId - The ID of the doctor to reject.
   * @returns {Promise<boolean>} A promise resolving to true if successful, false otherwise.
   */
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

  /**
   * Deletes a doctor's account. Requires admin privileges.
   * Checks admin status first, then attempts deletion via RPC ('delete_doctor')
   * with a fallback to direct deletion from the 'profiles' table.
   * @param {string} doctorId - The ID of the doctor to delete.
   * @returns {Promise<boolean>} A promise resolving to true if successful, false otherwise.
   */
  async deleteDoctor(doctorId: string): Promise<boolean> {
    try {
      console.log(`Deleting doctor: ${doctorId}`);
      // Check if the current user is an admin before proceeding
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

      // Attempt deletion via RPC first
      try {
        const { data, error } = await supabase.rpc(
          'delete_doctor',
          { doctor_id: doctorId }
        );

        if (error) {
          console.warn("RPC method 'delete_doctor' failed, trying direct delete:", error);
          throw error; // Trigger fallback
        }

        toast.success("Doctor deleted successfully via RPC");
        return true;
      } catch (rpcError) {
        // Fallback to direct deletion if RPC fails
        console.warn("Using fallback direct delete method for doctor");
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', doctorId);

        if (deleteError) {
          console.error("Direct delete failed:", deleteError);
          throw deleteError; // Throw the error from the direct delete attempt
        }

        toast.success("Doctor deleted successfully via direct delete");
        return true;
      }
    } catch (error: unknown) {
      console.error("Error deleting doctor:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error deleting doctor: ${errorMessage}`);
      return false;
    }
  },

  /**
   * Placeholder for updating doctor office information. Currently not implemented.
   * @param {any} data - The data for updating the doctor office.
   * @returns {Promise<boolean>} A promise resolving to true (placeholder).
   */
  async updateDoctorOffice(data: any): Promise<boolean> {
    console.warn("updateDoctorOffice is not fully implemented");
    // Placeholder implementation
    return true;
  },
};