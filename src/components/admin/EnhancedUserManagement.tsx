import { useState, useEffect } from "react";
import { UserService, UserProfile } from "@/services"; // Import from barrel file
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Users, Search, CheckCircle, XCircle, Plus, Pencil, RefreshCw, Ban, Undo } from "lucide-react"; // Added Ban, Undo icons
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

/**
 * @fileoverview Component for managing administrator users.
 * Allows viewing, adding, editing, suspending, and changing admin status.
 */

/**
 * Interface for the user form data state.
 */
interface UserFormData {
  id?: string;
  email: string;
  name: string;
  password?: string;
  is_admin: boolean;
  is_approved?: boolean; // Keep for consistency, though admins are usually auto-approved
  location?: string;
  state?: string;
  zip_code?: string;
  specialty?: string; // Less relevant for admins, but keep for profile consistency
  phone_number?: string;
  address?: string;
}

/**
 * EnhancedUserManagement component definition.
 */
const EnhancedUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserFormData | null>(null);
  const { user: currentUser } = useAuth(); // Renamed to avoid conflict

  useEffect(() => {
    loadUsers();
  }, []);

  /**
   * Loads admin users from the UserService.
   * Filters fetched users to only include those with is_admin = true.
   * Ensures the current logged-in admin is included in the list.
   */
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await UserService.fetchUsers();
      // Filter to show only admin users
      const adminUsers = fetchedUsers.filter(u => u.is_admin);

      // Ensure the current admin user is always in the list if not already fetched
      if (currentUser && !adminUsers.some(u => u.id === currentUser.id)) {
         console.log("Current admin not in fetched list, adding manually.");
         // Create a UserProfile object for the current user
         const currentUserProfile: UserProfile = {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name || '',
            is_admin: true,
            is_approved: true, // Admins are implicitly approved
            is_suspended: false, // Assume current admin is not suspended
            created_at: new Date().toISOString(), // Add created_at if needed by UserProfile
            // Add other optional fields if available from currentUser context
            location: currentUser.city || undefined, // Use city instead of location
            state: currentUser.state || undefined,
            zip_code: currentUser.zipCode || undefined,
            specialty: currentUser.specialty || undefined,
            phone_number: currentUser.phoneNumber || undefined,
            address: currentUser.address || undefined,
            street_address: currentUser.streetAddress || undefined,
            city: currentUser.city || undefined,
         };
         adminUsers.push(currentUserProfile);
      }

      setUsers(adminUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users. Please try again.");

      // If error, at least add current user to list if available
      if (currentUser) {
         const currentUserProfile: UserProfile = {
           id: currentUser.id,
           email: currentUser.email,
           name: currentUser.name || '',
           is_admin: true, // Current user must be admin to view this page
           created_at: new Date().toISOString(),
           // Add other fields as above if needed
         };
        setUsers([currentUserProfile]);
      } else {
        setUsers([]); // Set to empty if current user is also unavailable
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggles the admin status of a user.
   * Prevents users from changing their own status.
   * Uses UserService.updateUser to persist the change.
   * @param {string} userEmail - The email of the user to modify.
   * @param {boolean} currentStatus - The current admin status of the user.
   */
  const handleToggleAdmin = async (userEmail: string, currentStatus: boolean) => {
    // Don't allow changing own admin status
    if (currentUser?.email === userEmail) {
      toast.error("You cannot change your own admin status");
      return;
    }

    const userToUpdate = users.find(u => u.email === userEmail);
    if (!userToUpdate) {
      toast.error("User not found");
      return;
    }

    setIsLoading(true); // Indicate processing
    try {
        const success = await UserService.updateUser({ ...userToUpdate, is_admin: !currentStatus });
        if (success) {
          // Update local state
          setUsers(users.map(u =>
            u.email === userEmail ? { ...u, is_admin: !currentStatus } : u
          ));
          toast.success(`Admin status ${!currentStatus ? 'granted' : 'revoked'} successfully`);
        } else {
          toast.error("Failed to update admin status."); // Handle failure case
        }
    } catch (error) {
        console.error("Error toggling admin status:", error);
        toast.error("An error occurred while updating admin status.");
    } finally {
        setIsLoading(false);
    }
  };

  // Note: handleApproveUser might be less relevant for an admin-only management screen,
  // as admins are typically implicitly approved. Kept for potential future use cases.
  /**
   * Toggles the approval status of a user.
   * Prevents users from changing their own status.
   * Uses UserService.updateUser to persist the change.
   * @param {string} userId - The ID of the user to modify.
   * @param {boolean} currentStatus - The current approval status of the user.
   */
  const handleApproveUser = async (userId: string, currentStatus: boolean) => {
    // Don't allow changing own approval status
    if (currentUser?.id === userId) {
      toast.error("You cannot change your own approval status");
      return;
    }

    try {
      setIsLoading(true);

      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) {
        toast.error("User not found");
        setIsLoading(false); // Stop loading if user not found
        return;
      }

      // Update user with new approval status
      const success = await UserService.updateUser({
        ...userToUpdate,
        is_approved: !currentStatus
      });

      if (success) {
        // Update local state
        setUsers(users.map(u =>
          u.id === userId ? { ...u, is_approved: !currentStatus } : u
        ));

        toast.success(`User ${!currentStatus ? 'approved' : 'unapproved'} successfully`);
      } else {
         toast.error("Failed to update user approval status."); // Handle failure
      }
    } catch (error) {
      console.error("Error toggling user approval:", error);
      toast.error("Failed to update user approval status");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Opens the user form dialog in 'add' mode with default values.
   */
  const handleAddUser = () => {
    setEditingUser({
      email: "",
      name: "",
      password: "",
      is_admin: true, // Default to creating an admin in this component
      is_approved: true, // Admins are auto-approved
      location: "",
      state: "",
      zip_code: "",
      specialty: "",
      phone_number: "",
      address: ""
    });
    setIsFormOpen(true);
  };

  /**
   * Opens the user form dialog in 'edit' mode, pre-filled with the selected user's data.
   * @param {UserProfile} userProfile - The profile of the user to edit.
   */
  const handleEditUser = (userProfile: UserProfile) => {
    setEditingUser({
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name || "",
      is_admin: userProfile.is_admin,
      is_approved: userProfile.is_approved === undefined ? true : userProfile.is_approved, // Default approved if undefined
      location: userProfile.location || "",
      state: userProfile.state || "",
      zip_code: userProfile.zip_code || "",
      specialty: userProfile.specialty || "",
      phone_number: userProfile.phone_number || "",
      address: userProfile.address || ""
      // Password is not pre-filled for editing
    });
    setIsFormOpen(true);
  };

  /**
   * Handles saving user data from the form (create or update).
   * Calls the appropriate UserService method.
   * @param {React.FormEvent} e - The form submission event.
   */
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsLoading(true);
    try {
      if (editingUser.id) {
        // Update existing user
        const updatePayload: UserProfile = {
            id: editingUser.id,
            email: editingUser.email, // Usually email is not editable, but include if needed
            name: editingUser.name,
            is_admin: editingUser.is_admin,
            is_approved: editingUser.is_approved,
            location: editingUser.location,
            state: editingUser.state,
            zip_code: editingUser.zip_code,
            specialty: editingUser.specialty,
            phone_number: editingUser.phone_number,
            address: editingUser.address,
            // is_suspended is handled separately
        };
        const success = await UserService.updateUser(updatePayload);

        if (success) {
          toast.success("User updated successfully");
          await loadUsers(); // Refresh list
          setIsFormOpen(false);
          setEditingUser(null);
        } else {
           toast.error("Failed to update user.");
        }
      } else {
        // Create new user
        if (!editingUser.password) {
          toast.error("Password is required for new users");
          setIsLoading(false);
          return;
        }

        // Call the implemented UserService.createUser
        const { data, error } = await UserService.createUser({
          email: editingUser.email,
          password: editingUser.password, // Password is required here by the check above
          email_confirm: true, // Auto-confirm email for admin-created users? Or set based on UI?
          user_metadata: {
            name: editingUser.name,
            is_admin: editingUser.is_admin,
            is_approved: editingUser.is_approved, // Ensure this is set correctly
            location: editingUser.location,
            state: editingUser.state,
            zip_code: editingUser.zip_code,
            specialty: editingUser.specialty,
            phone_number: editingUser.phone_number,
            address: editingUser.address
          }
        });

        if (error) throw error; // Let the catch block handle the error toast

        // Check if data and data.user exist before proceeding
        if (data?.user) {

        if (error) throw error;

           toast.success("User created successfully");
           await loadUsers(); // Refresh list
           setIsFormOpen(false);
           setEditingUser(null);
        } else {
           // This case might occur if the createUser function returns null data without an error
           toast.error("Failed to create user (no data returned).");
        }
        // Removed stray closing comment marker
      }
    } catch (error: any) {
      console.error("Error saving user:", error);
      toast.error(`Error saving user: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Suspends a user account.
   * @param {string} userId - The ID of the user to suspend.
   * @param {string} userName - The name/email of the user for confirmation message.
   */
  const handleSuspendUser = async (userId: string, userName: string) => {
    if (currentUser?.id === userId) {
        toast.error("You cannot suspend your own account.");
        return;
    }
    if (!confirm(`Are you sure you want to suspend user ${userName}? They will lose access.`)) return;
    setIsLoading(true);
    try {
      const success = await UserService.suspendUser(userId);
      if (success) {
        setUsers(users.map(u => u.id === userId ? { ...u, is_suspended: true } : u));
        toast.success(`User ${userName} suspended successfully.`);
      } else {
         toast.error("Failed to suspend user.");
      }
    } catch (error) {
      console.error("Error suspending user:", error);
      toast.error("Failed to suspend user.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Unsuspends a user account.
   * @param {string} userId - The ID of the user to unsuspend.
   * @param {string} userName - The name/email of the user for confirmation message.
   */
  const handleUnsuspendUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to unsuspend user ${userName}? They will regain access.`)) return;
    setIsLoading(true);
    try {
      const success = await UserService.unsuspendUser(userId);
      if (success) {
        setUsers(users.map(u => u.id === userId ? { ...u, is_suspended: false } : u));
        toast.success(`User ${userName} unsuspended successfully.`);
      } else {
         toast.error("Failed to unsuspend user.");
      }
    } catch (error) {
      console.error("Error unsuspending user:", error);
      toast.error("Failed to unsuspend user.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(userProfile => {
    const searchLower = searchTerm.toLowerCase();
    return (
      userProfile.email.toLowerCase().includes(searchLower) ||
      (userProfile.name && userProfile.name.toLowerCase().includes(searchLower)) ||
      (userProfile.specialty && userProfile.specialty.toLowerCase().includes(searchLower)) || // Keep specialty search?
      (userProfile.location && userProfile.location.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="animate-fade-in">
      {/* Header and Search/Actions */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Users size={20} />
          <h2 className="text-xl font-semibold">Admin User Management</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-animation"
            />
          </div>
          <Button onClick={loadUsers} variant="outline" className="hover-lift" disabled={isLoading}>
            <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleAddUser} className="hover-lift flex items-center gap-2">
            <Plus size={16} />
            <span>Add Admin User</span>
          </Button>
        </div>
      </div>

      {/* User Table Card */}
      <Card className="glass-panel mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Admin Accounts</CardTitle>
          <CardDescription>
            Manage administrator accounts and permissions. Total Admins: {users.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && users.length === 0 ? ( // Show spinner only if loading and no users yet
            <div className="flex justify-center items-center p-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((userProfile) => (
                      <TableRow key={userProfile.id} className="hover:bg-secondary/40 transition-colors">
                        <TableCell>{userProfile.name || "—"}</TableCell>
                        <TableCell>{userProfile.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {userProfile.is_admin ? (
                              <>
                                <Shield size={16} className="text-primary" />
                                <span className="text-sm text-primary font-medium">Admin</span>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">Not Admin</span> // Should not appear due to filter
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {userProfile.is_suspended ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : (
                            <Badge variant="secondary">Active</Badge> // Admins are active if not suspended
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1"> {/* Use justify-end */}
                            <Button
                              variant="ghost"
                              size="icon" // Use icon size for consistency
                              onClick={() => handleEditUser(userProfile)}
                              className="hover:bg-primary/10 hover:text-primary h-8 w-8"
                              title="Edit User"
                            >
                              <Pencil size={16} />
                            </Button>

                            {/* Admin Toggle Button */}
                            {currentUser?.email !== userProfile.email && (
                              <Button
                                variant="ghost" // Use ghost for less emphasis
                                size="icon"
                                className={userProfile.is_admin ? "text-destructive hover:bg-destructive/10" : "text-primary hover:bg-primary/10"}
                                onClick={() => handleToggleAdmin(userProfile.email, userProfile.is_admin)}
                                title={userProfile.is_admin ? "Remove Admin" : "Make Admin"}
                              >
                                {userProfile.is_admin ? (
                                  <XCircle size={16} />
                                ) : (
                                  <Shield size={16} />
                                )}
                              </Button>
                            )}

                            {/* Suspend/Unsuspend Buttons */}
                            {currentUser?.id !== userProfile.id && ( // Can't suspend self
                              userProfile.is_suspended ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8"
                                  onClick={() => handleUnsuspendUser(userProfile.id, userProfile.name || userProfile.email)}
                                  title="Unsuspend User"
                                >
                                  <Undo size={16} />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                  onClick={() => handleSuspendUser(userProfile.id, userProfile.name || userProfile.email)}
                                  title="Suspend User"
                                >
                                  <Ban size={16} />
                                </Button>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        {searchTerm ? "No matching admin users found" : "No admin users found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
          if (!isOpen) {
              setEditingUser(null); // Clear editing state when dialog closes
          }
          setIsFormOpen(isOpen);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingUser?.id ? 'Edit Admin User' : 'Add New Admin User'}</DialogTitle>
          </DialogHeader>
          {/* Render form only when editingUser is not null */}
          {editingUser && (
            <form onSubmit={handleSaveUser} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser(prev => prev ? {...prev, name: e.target.value} : null)}
                    required
                  />
                </div>
                {/* Email */}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser(prev => prev ? {...prev, email: e.target.value} : null)}
                    required
                    disabled={!!editingUser.id} // Disable email editing for existing users
                    className={editingUser.id ? "bg-muted/50" : ""}
                  />
                </div>
                {/* Password (only for new users) */}
                {!editingUser.id && (
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={editingUser.password || ''}
                      onChange={(e) => setEditingUser(prev => prev ? {...prev, password: e.target.value} : null)}
                      required
                    />
                  </div>
                )}
                {/* Admin Status Toggle */}
                <div className="grid gap-2 items-center md:col-span-2">
                   <div className="flex items-center space-x-2">
                     <input
                       type="checkbox"
                       id="is_admin"
                       checked={editingUser.is_admin}
                       onChange={(e) => setEditingUser(prev => prev ? {...prev, is_admin: e.target.checked} : null)}
                       className="form-checkbox h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                       disabled={currentUser?.id === editingUser.id} // Prevent changing own admin status
                     />
                     <Label htmlFor="is_admin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                       Administrator Role
                     </Label>
                   </div>
                </div>
                {/* Optional Fields (Consider if needed for Admins) */}
                {/*
                <div className="grid gap-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input id="specialty" value={editingUser.specialty || ''} onChange={(e) => setEditingUser(prev => prev ? {...prev, specialty: e.target.value} : null)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input id="phone_number" value={editingUser.phone_number || ''} onChange={(e) => setEditingUser(prev => prev ? {...prev, phone_number: e.target.value} : null)} />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={editingUser.address || ''} onChange={(e) => setEditingUser(prev => prev ? {...prev, address: e.target.value} : null)} />
                </div>
                */}
              </div>
              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    editingUser.id ? 'Save Changes' : 'Create User'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedUserManagement;
