import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}
async function deleteUser() {
    try {
        // Create admin client with service role key
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        // Delete from profiles table
        const { error: profileDeleteError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('email', 'ivantech@eyesentrymed.com');
        if (profileDeleteError) {
            console.error("Error deleting from profiles:", profileDeleteError);
            toast.error("Failed to delete user profile");
            return;
        }
        // Delete from auth.users table
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser('ivantech@eyesentrymed.com');
        if (authDeleteError) {
            console.error("Error deleting from auth.users:", authDeleteError);
            toast.error("Failed to delete auth user");
            return;
        }
        console.log("User deleted successfully from both profiles and auth.users");
        toast.success("User deleted successfully");
    }
    catch (error) {
        console.error("Error:", error);
        toast.error("An error occurred while deleting the user");
    }
}
// Run the delete function
deleteUser();
