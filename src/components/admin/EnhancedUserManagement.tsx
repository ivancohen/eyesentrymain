import { useState, useEffect } from "react";
import { FixedAdminService, UserProfile } from "@/services/FixedAdminService";
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

interface UserFormData {
  id?: string;
  email: string;
  name: string;
  password?: string;
  is_admin: boolean;
  is_approved?: boolean;
  location?: string;
  state?: string;
  zip_code?: string;
  specialty?: string;
  phone_number?: string;
  address?: string;
}

const EnhancedUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserFormData | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await FixedAdminService.fetchUsers();
      // Filter to show only admin users
      const adminUsers = fetchedUsers.filter(u => u.is_admin);
      
      // Ensure the current admin user is always in the list if not already fetched
      if (user && !adminUsers.some(u => u.id === user.id)) {
         console.log("Current admin not in fetched list, adding manually.");
         adminUsers.push({
            id: user.id,
            email: user.email,
            name: user.name || '',
            is_admin: true,
            is_approved: true, // Admins are implicitly approved
            is_suspended: false, // Assume current admin is not suspended
            created_at: new Date().toISOString()
         });
      }
      
      setUsers(adminUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users. Please try again.");
      
      // If error, at least add current user to list
      if (user) {
        setUsers([{
          id: user.id,
          email: user.email,
          name: user.name || '',
          is_admin: true, // Current user must be admin to view this page
          created_at: new Date().toISOString()
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAdmin = async (userEmail: string, currentStatus: boolean) => {
    // Don't allow changing own admin status
    if (user?.email === userEmail) {
      toast.error("You cannot change your own admin status");
      return;
    }

    const success = await FixedAdminService.setAdminStatus(userEmail, !currentStatus);
    if (success) {
      // Update local state
      setUsers(users.map(u => 
        u.email === userEmail ? { ...u, is_admin: !currentStatus } : u
      ));
    }
  };

  const handleApproveUser = async (userId: string, currentStatus: boolean) => {
    // Don't allow changing own approval status
    if (user?.id === userId) {
      toast.error("You cannot change your own approval status");
      return;
    }

    try {
      setIsLoading(true);
      
      // Get the user to update
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) {
        toast.error("User not found");
        return;
      }
      
      // Update user with new approval status
      const success = await FixedAdminService.updateUser({
        ...userToUpdate,
        is_approved: !currentStatus
      // Removed created_at from update payload
      });
      
      if (success) {
        // Update local state
        setUsers(users.map(u => 
          u.id === userId ? { ...u, is_approved: !currentStatus } : u
        ));
        
        toast.success(`User ${!currentStatus ? 'approved' : 'unapproved'} successfully`);
      }
    } catch (error) {
      console.error("Error toggling user approval:", error);
      toast.error("Failed to update user approval status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser({
      email: "",
      name: "",
      password: "",
      is_admin: false,
      is_approved: false,
      location: "",
      state: "",
      zip_code: "",
      specialty: "",
      phone_number: "",
      address: ""
    });
    setIsFormOpen(true);
  };

  const handleEditUser = (userProfile: UserProfile) => {
    setEditingUser({
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name || "",
      is_admin: userProfile.is_admin,
      is_approved: userProfile.is_approved || false,
      location: userProfile.location || "",
      state: userProfile.state || "",
      zip_code: userProfile.zip_code || "",
      specialty: userProfile.specialty || "",
      phone_number: userProfile.phone_number || "",
      address: userProfile.address || ""
    });
    setIsFormOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setIsLoading(true);
      
      if (editingUser.id) {
        // Update existing user
        const success = await FixedAdminService.updateUser({
          id: editingUser.id,
          email: editingUser.email,
          name: editingUser.name,
          is_admin: editingUser.is_admin,
          is_approved: editingUser.is_approved,
          location: editingUser.location,
          state: editingUser.state,
          zip_code: editingUser.zip_code,
          specialty: editingUser.specialty,
          phone_number: editingUser.phone_number,
          address: editingUser.address
        // Removed created_at from update payload
        });
        
        if (success) {
          toast.success("User updated successfully");
          
          // Refresh user list to get the updated data
          await loadUsers();
          setIsFormOpen(false);
          setEditingUser(null);
        }
      } else {
        // Create new user
        if (!editingUser.password) {
          toast.error("Password is required for new users");
          setIsLoading(false);
          return;
        }
        
        const success = await FixedAdminService.createUser({
          email: editingUser.email,
          password: editingUser.password,
          name: editingUser.name,
          is_admin: editingUser.is_admin,
          location: editingUser.location,
          state: editingUser.state,
          zip_code: editingUser.zip_code,
          specialty: editingUser.specialty,
          phone_number: editingUser.phone_number,
          address: editingUser.address
        });
        
        if (success) {
          toast.success("User created successfully");
          
          // Refresh user list to include the new user
          await loadUsers();
          setIsFormOpen(false);
          setEditingUser(null);
        }
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to suspend user ${userName}? They will lose access.`)) return;
    setIsLoading(true);
    try {
      const success = await FixedAdminService.suspendUser(userId);
      if (success) {
        setUsers(users.map(u => u.id === userId ? { ...u, is_suspended: true } : u));
        toast.success(`User ${userName} suspended successfully.`);
      }
    } catch (error) {
      console.error("Error suspending user:", error);
      toast.error("Failed to suspend user.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsuspendUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to unsuspend user ${userName}? They will regain access.`)) return;
    setIsLoading(true);
    try {
      const success = await FixedAdminService.unsuspendUser(userId);
      if (success) {
        setUsers(users.map(u => u.id === userId ? { ...u, is_suspended: false } : u));
        toast.success(`User ${userName} unsuspended successfully.`);
      }
    } catch (error) {
      console.error("Error unsuspending user:", error);
      toast.error("Failed to unsuspend user.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(userProfile => { // Renamed variable for clarity
    const searchLower = searchTerm.toLowerCase();
    return (
      userProfile.email.toLowerCase().includes(searchLower) ||
      (userProfile.name && userProfile.name.toLowerCase().includes(searchLower)) ||
      (userProfile.specialty && userProfile.specialty.toLowerCase().includes(searchLower)) ||
      (userProfile.location && userProfile.location.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="animate-fade-in">
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
          <Button onClick={loadUsers} variant="outline" className="hover-lift">
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAddUser} className="hover-lift flex items-center gap-2">
            <Plus size={16} />
            <span>Add User</span>
          </Button>
        </div>
      </div>

      <Card className="glass-panel mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Admin Accounts</CardTitle>
          <CardDescription>
            Manage administrator accounts and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
                    {/* Location column header removed */}
                    <TableHead>Actions</TableHead>
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
                              // This case should not be reached due to filtering, but keep for valid syntax
                              <span className="text-sm text-muted-foreground">Not Admin</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {userProfile.is_suspended ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : userProfile.specialty ? ( // Only show Approved/Pending if not suspended and is a doctor
                            userProfile.is_approved ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Approved
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Pending
                              </Badge>
                            )
                          ) : (
                            <Badge variant="secondary">Active</Badge> // Standard user status
                          )}
                        </TableCell>
                        {/* Location table cell removed */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(userProfile)}
                              className="hover:bg-primary/10 hover:text-primary h-8 w-8 p-0"
                            >
                              <Pencil size={16} />
                            </Button>
                            
                            {/* Doctor Approval Button logic removed */}
                            
                            {/* Admin Toggle Button */}
                            {user?.email !== userProfile.email && (
                              <Button
                                variant={userProfile.is_admin ? "outline" : "default"}
                                size="sm"
                                className={userProfile.is_admin ? "hover:bg-destructive/10" : "hover-lift"}
                                onClick={() => handleToggleAdmin(userProfile.email, userProfile.is_admin)}
                              >
                                {userProfile.is_admin ? (
                                  <>
                                    <XCircle size={16} className="mr-1" />
                                    Remove Admin
                                  </>
                                ) : (
                                  <>
                                    <Shield size={16} className="mr-1" />
                                    Make Admin
                                  </>
                                )}
                              </Button>
                            )}

                            {/* Suspend/Unsuspend Buttons */}
                            {user?.id !== userProfile.id && ( // Can't suspend self
                              userProfile.is_suspended ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleUnsuspendUser(userProfile.id, userProfile.name || userProfile.email)}
                                >
                                  <Undo size={16} className="mr-1" />
                                  Unsuspend
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleSuspendUser(userProfile.id, userProfile.name || userProfile.email)}
                                >
                                  <Ban size={16} className="mr-1" />
                                  Suspend
                                </Button>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground"> {/* Correct colSpan is 5 */}
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
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingUser?.id ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveUser} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editingUser?.name || ''}
                  onChange={(e) => setEditingUser(prev => prev ? {...prev, name: e.target.value} : null)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser?.email || ''}
                  onChange={(e) => setEditingUser(prev => prev ? {...prev, email: e.target.value} : null)}
                  required
                />
              </div>
              
              {!editingUser?.id && (
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={editingUser?.password || ''}
                    onChange={(e) => setEditingUser(prev => prev ? {...prev, password: e.target.value} : null)}
                    required={!editingUser?.id}
                  />
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="isAdmin">Admin Status</Label>
                <Select
                  value={editingUser?.is_admin ? 'true' : 'false'}
                  onValueChange={(value) => setEditingUser(prev => prev ? {...prev, is_admin: value === 'true'} : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select admin status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Admin</SelectItem>
                    <SelectItem value="false">Standard User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="specialty">Specialty (for Doctors)</Label>
                <Input
                  id="specialty"
                  value={editingUser?.specialty || ''}
                  onChange={(e) => setEditingUser(prev => prev ? {...prev, specialty: e.target.value} : null)}
                  placeholder="E.g., Ophthalmology"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={editingUser?.phone_number || ''}
                  onChange={(e) => setEditingUser(prev => prev ? {...prev, phone_number: e.target.value} : null)}
                  placeholder="(123) 456-7890"
                />
              </div>
              
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={editingUser?.address || ''}
                  onChange={(e) => setEditingUser(prev => prev ? {...prev, address: e.target.value} : null)}
                  placeholder="Full address"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="location">City/Location</Label>
                <Input
                  id="location"
                  value={editingUser?.location || ''}
                  onChange={(e) => setEditingUser(prev => prev ? {...prev, location: e.target.value} : null)}
                  placeholder="City"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={editingUser?.state || ''}
                  onChange={(e) => setEditingUser(prev => prev ? {...prev, state: e.target.value} : null)}
                  placeholder="State"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={editingUser?.zip_code || ''}
                  onChange={(e) => setEditingUser(prev => prev ? {...prev, zip_code: e.target.value} : null)}
                  placeholder="ZIP Code"
                />
              </div>
              
              {editingUser?.specialty && (
                <div className="grid gap-2">
                  <Label htmlFor="isApproved">Approval Status</Label>
                  <Select
                    value={editingUser?.is_approved ? 'true' : 'false'}
                    onValueChange={(value) => setEditingUser(prev => prev ? {...prev, is_approved: value === 'true'} : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select approval status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Approved</SelectItem>
                      <SelectItem value="false">Pending Approval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedUserManagement;
