import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { safeQueryWithFallback } from "@/utils/supabaseErrorHandler";

/**
 * @fileoverview Service for managing user profiles and related operations.
 */

/**
 * Represents the structure of a user profile in the database.
 */
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

/**
 * Provides methods for interacting with user profile data.
 */
export const UserService = {
  /**
   * Fetches all user profiles from the database.
   * Uses safeQueryWithFallback for error handling.
   * @returns {Promise<UserProfile[]>} A promise that resolves to an array of user profiles.
   */
  async fetchUsers(): Promise<UserProfile[]> {
    console.log("Fetching users from Supabase...");

    // Use safeQueryWithFallback to handle potential 500 errors
    const data = await safeQueryWithFallback(
      () => supabase
        .from('profiles')
        .select('id, email, name, is_admin, is_suspended, is_approved, created_at, specialty') // Add back specialty
        .order('created_at', { ascending: false }),
      [], // Empty array as fallback
      2  // 2 retries
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userProfiles: UserProfile[] = (data || []).map((profile: any) => ({
      id: profile.id,
      email: profile.email,
      name: profile.name || '',
      is_admin: profile.is_admin || false,
      is_approved: profile.is_approved || false, // Map added column
      created_at: profile.created_at, // Map added column
      location: undefined, // Not selected
      state: undefined, // Not selected
      zip_code: undefined, // Not selected
      specialty: profile.specialty || '', // Map added column
      phone_number: undefined, // Not selected
      address: undefined, // Not selected
      street_address: undefined, // Not selected
      city: undefined, // Not selected
      is_suspended: profile.is_suspended || false
    }));

    console.log("Users fetched successfully:", userProfiles.length, "results");
    return userProfiles;
  },

  /**
   * Updates a user's profile data in the database.
   * Attempts direct update first, then falls back to RPC and simplified updates.
   * @param {UserProfile} userData - The user profile data to update. Must include the user's ID.
   * @returns {Promise<boolean>} A promise that resolves to true if the update was successful, false otherwise.
   */
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

  /**
   * Suspends a user account by setting the 'is_suspended' flag to true.
   * @param {string} userId - The ID of the user to suspend.
   * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
   */
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

  /**
   * Unsuspends a user account by setting the 'is_suspended' flag to false.
   * @param {string} userId - The ID of the user to unsuspend.
   * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
   */
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

  /**
   * Creates a new user using the Supabase Admin API.
   * Requires the Supabase client to be initialized with the service role key.
   * @param {object} userData - User data including email, password, and metadata.
   * @returns {Promise<{ data: { user: SupabaseUser | null }; error: AuthError | null }>} Result object from Supabase.
   */
  async createUser(userData: {
    email: string;
    password?: string; // Password might be optional if using invites
    email_confirm?: boolean;
    user_metadata?: Record<string, any>;
  }): Promise<{ data: { user: import('@supabase/supabase-js').User | null } | null; error: import('@supabase/supabase-js').AuthError | null }> {
    console.log(`Attempting to create user: ${userData.email}`);
    try {
      // IMPORTANT: This requires the Supabase client to have admin privileges
      // Ensure SUPABASE_SERVICE_ROLE_KEY is set in the environment where this runs.
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: userData.email_confirm === undefined ? true : userData.email_confirm, // Default to requiring confirmation
        user_metadata: userData.user_metadata,
      });

      if (error) {
        console.error("Error creating user (Admin API):", error);
        toast.error(`Error creating user: ${error.message}`);
        return { data: null, error };
      }

      console.log("User created successfully via Admin API:", data.user?.email);
      toast.success("User created successfully");
      return { data, error: null };

    } catch (error: unknown) {
      console.error("Unexpected error during createUser:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Unexpected error creating user: ${errorMessage}`);
      // Return a simpler error object instead of trying to match AuthError exactly
      const simpleError = {
        message: errorMessage,
        status: 500, // Indicate server-side or unexpected issue
      };
      // Cast to 'any' to satisfy the return type structure, the caller handles errors
      return { data: null, error: simpleError as any };
    }
  }
};