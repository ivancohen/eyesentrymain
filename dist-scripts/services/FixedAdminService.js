import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
export const FixedAdminService = {
    // USER MANAGEMENT
    async fetchUsers() {
        try {
            console.log("Fetching users from Supabase...");
            // Direct query to profiles table - all authenticated users can query profiles
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                console.error("Error fetching profiles:", error);
                throw error;
            }
            // Transform profiles data to match UserProfile interface
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                address: profile.address || '',
                street_address: profile.street_address || '',
                city: profile.city || ''
            }));
            console.log("Users fetched successfully:", userProfiles.length, "results");
            return userProfiles;
        }
        catch (error) {
            console.error("Error fetching users:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error(`Error fetching users: ${errorMessage}`);
            return [];
        }
    },
    async fetchDoctorOffices() {
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
            // Transform profiles into doctor offices
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const doctorOffices = (data || []).map((profile) => ({
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
        }
        catch (error) {
            console.error("Error fetching doctor offices:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error(`Error fetching doctor offices: ${errorMessage}`);
            return [];
        }
    },
    async fetchApprovedDoctors() {
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
            const approvedDoctors = (data || []).map((profile) => ({
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
                city: profile.city || ''
            }));
            console.log("Approved doctors fetched successfully:", approvedDoctors.length, "results");
            return approvedDoctors;
        }
        catch (error) {
            console.error("Error fetching approved doctors:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error(`Error fetching approved doctors: ${errorMessage}`);
            return [];
        }
    },
    // DOCTOR APPROVAL MANAGEMENT
    async fetchPendingDoctorApprovals() {
        try {
            console.log("Fetching pending doctor approvals...");
            // Query profiles directly instead of using the view
            // to match the same logic used by notifications
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
            // Map to DoctorApproval interface with explicit casting
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                phone_number: profile.phone_number || '',
                address: profile.address || '',
                street_address: profile.street_address || '',
                city: profile.city || '',
                contact: profile.phone_number || profile.email || ''
            }));
            console.log("Pending approvals fetched successfully:", pendingApprovals.length, "results");
            return pendingApprovals;
        }
        catch (error) {
            console.error("Error fetching pending approvals:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error(`Error fetching pending approvals: ${errorMessage}`);
            return [];
        }
    },
    async approveDoctor(doctorId) {
        try {
            console.log(`Approving doctor account: ${doctorId}`);
            // Use the RPC function that has built-in admin check
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
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error(`Error approving doctor: ${errorMessage}`);
            return false;
        }
    },
    async rejectDoctor(doctorId) {
        try {
            console.log(`Rejecting doctor account: ${doctorId}`);
            // Use the RPC function that has built-in admin check
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
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error(`Error rejecting doctor: ${errorMessage}`);
            return false;
        }
    },
    // NEW: Delete Doctor function
    async deleteDoctor(doctorId) {
        try {
            console.log(`Deleting doctor: ${doctorId}`);
            // First check if current user is admin
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
            // Try to use the delete_doctor RPC function first
            try {
                const { data, error } = await supabase.rpc('delete_doctor', { doctor_id: doctorId });
                if (error) {
                    console.warn("RPC method failed, trying direct delete:", error);
                    throw error;
                }
                toast.success("Doctor deleted successfully");
                return true;
            }
            catch (rpcError) {
                console.warn("Using fallback direct delete method");
                // Fallback to direct delete
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
        }
        catch (error) {
            console.error("Error deleting doctor:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error(`Error deleting doctor: ${errorMessage}`);
            return false;
        }
    },
    // User update function with multiple fallback strategies
    async updateUser(userData) {
        try {
            console.log(`Updating user: ${userData.email}`);
            // Minimize the update data to only what's needed
            const updateData = {
                name: userData.name || '',
                is_admin: userData.is_admin === true
            };
            // If additional fields are provided, include them
            if (userData.is_approved !== undefined) {
                updateData['is_approved'] = userData.is_approved === true;
            }
            // Only include non-empty strings for optional fields
            ['location', 'state', 'zip_code', 'specialty', 'phone_number',
                'address', 'street_address', 'city'].forEach(field => {
                if (userData[field] && userData[field].trim()) {
                    updateData[field] = userData[field];
                }
            });
            console.log("Update payload:", updateData);
            // First try the direct update
            try {
                console.log("Trying direct profile update...");
                const { error } = await supabase
                    .from('profiles')
                    .update(updateData)
                    .eq('id', userData.id);
                if (error)
                    throw error;
                toast.success("User updated successfully");
                return true;
            }
            catch (directError) {
                console.warn("Direct update failed, trying RPC method:", directError);
                // Try to use the update_user_profile RPC function
                try {
                    const { error } = await supabase.rpc('update_user_profile', {
                        user_id: userData.id,
                        user_name: userData.name || '',
                        is_admin_status: userData.is_admin === true
                    });
                    if (error)
                        throw error;
                    toast.success("User updated successfully via RPC");
                    return true;
                }
                catch (rpcError) {
                    console.warn("RPC update failed, trying simplified update:", rpcError);
                    // Try extra-simplified update with minimal fields
                    try {
                        const { error } = await supabase
                            .from('profiles')
                            .update({ name: userData.name })
                            .eq('email', userData.email);
                        if (error)
                            throw error;
                        toast.success("User name updated successfully");
                        toast.info("Some fields may not have been updated");
                        return true;
                    }
                    catch (finalError) {
                        console.error("All update methods failed:", finalError);
                        throw finalError;
                    }
                }
            }
        }
        catch (error) {
            console.error("Error updating user:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error(`Error updating user: ${errorMessage}`);
            return false;
        }
    },
    // LOCATION DATA (Merged implementation with admin check)
    async getUniqueLocations() {
        try {
            console.log("Fetching unique locations...");
            // First check if current user is admin (for admin-only view)
            try {
                const { data: isAdmin, error: adminCheckError } = await supabase.rpc('check_is_admin');
                if (adminCheckError) {
                    console.warn("Admin check failed, proceeding with general access:", adminCheckError);
                    // Continue execution - we'll show data to all authenticated users
                }
                else if (!isAdmin) {
                    console.log("Non-admin user accessing location data");
                    // We allow non-admins to access location data, but log it
                }
            }
            catch (adminError) {
                console.warn("Error checking admin status, continuing:", adminError);
                // Continue execution - error handling should not block data access
            }
            // Get all profiles with location data
            const { data, error } = await supabase
                .from('profiles')
                .select('state, location, zip_code')
                .not('state', 'is', null);
            if (error) {
                console.error("Error fetching locations:", error);
                throw error;
            }
            // Extract unique values with safety checks
            const safeData = (data || []);
            const states = [];
            const locations = [];
            const zipCodes = [];
            // Safely extract values
            safeData.forEach(profile => {
                if (profile.state && typeof profile.state === 'string' && !states.includes(profile.state)) {
                    states.push(profile.state);
                }
                if (profile.location && typeof profile.location === 'string' && !locations.includes(profile.location)) {
                    locations.push(profile.location);
                }
                if (profile.zip_code && typeof profile.zip_code === 'string' && !zipCodes.includes(profile.zip_code)) {
                    zipCodes.push(profile.zip_code);
                }
            });
            console.log(`Found ${states.length} states, ${locations.length} locations, ${zipCodes.length} zip codes`);
            return { states, locations, zipCodes };
        }
        catch (error) {
            console.error("Error fetching unique locations:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error(`Error fetching location data: ${errorMessage}`);
            return { states: [], locations: [], zipCodes: [] };
        }
    }
};
