import { useState, useEffect } from "react";
import { UserProfile } from "@/services/AdminService";
import { NewAdminService } from "@/services/NewAdminService";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Users, Search, CheckCircle, XCircle, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserFormData {
  id?: string;
  email: string;
  name: string;
  password?: string;
  is_admin: boolean;
}

const UserManagement = () => {
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
      const fetchedUsers = await NewAdminService.fetchUsers();
      
      // If no users returned but current user exists, at least add current user to list
      if (fetchedUsers.length === 0 && user) {
        console.log("No users returned, adding current user to list");
        setUsers([{
          id: user.id,
          email: user.email,
          name: user.name || '',
          is_admin: true, // Current user must be admin to view this page
          created_at: new Date().toISOString()
        }]);
      } else {
        setUsers(fetchedUsers);
      }
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

    const success = await NewAdminService.setAdminStatus(userEmail, !currentStatus);
    if (success) {
      // Update local state
      setUsers(users.map(u => 
        u.email === userEmail ? { ...u, is_admin: !currentStatus } : u
      ));
    }
  };

  const handleAddUser = () => {
    setEditingUser({
      email: "",
      name: "",
      password: "",
      is_admin: false
    });
    setIsFormOpen(true);
  };

  const handleEditUser = (userProfile: UserProfile) => {
    setEditingUser({
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name || "",
      is_admin: userProfile.is_admin
    });
    setIsFormOpen(true);
  };

  // Simple direct SQL query function to work around type issues
  const updateProfileDirectly = async (id: string, name: string, isAdmin: boolean): Promise<boolean> => {
    try {
      // This bypasses all the TypeScript checking by using any
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: name, 
          is_admin: isAdmin 
        } as any)
        .eq('id', id as any);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating profile directly:", error);
      return false;
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setIsLoading(true);
      
      if (editingUser.id) {
        // Use our direct update function to bypass TypeScript issues
        const success = await updateProfileDirectly(
          editingUser.id,
          editingUser.name,
          editingUser.is_admin
        );
        
        if (!success) {
          throw new Error("Failed to update user profile");
        }
        
        toast.success("User updated successfully");
      } else {
        // Create new user - ensure password is defined when passing to createUser
        if (!editingUser.password) {
          toast.error("Password is required for new users");
          setIsLoading(false);
          return;
        }
        
        // Using NewAdminService for user creation
        await NewAdminService.createUser({
          email: editingUser.email,
          password: editingUser.password,
          name: editingUser.name,
          is_admin: editingUser.is_admin
        });
        toast.success("User created successfully");
      }
      
      // Refresh user list
      await loadUsers();
      setIsFormOpen(false);
      setEditingUser(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (user.name && user.name.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Users size={20} />
          <h2 className="text-xl font-semibold">User Management</h2>
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
          <Button onClick={handleAddUser} className="hover-lift flex items-center gap-2">
            <Plus size={16} />
            <span>Add User</span>
          </Button>
        </div>
      </div>

      <Card className="glass-panel">
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
                  <TableHead>Joined</TableHead>
                  <TableHead>Admin Status</TableHead>
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
                        {new Date(userProfile.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {userProfile.is_admin ? (
                            <>
                              <Shield size={16} className="text-primary" />
                              <span className="text-sm text-primary font-medium">Admin</span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">Standard User</span>
                          )}
                        </div>
                      </TableCell>
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
                          
                          {user?.email !== userProfile.email ? (
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
                                  <CheckCircle size={16} className="mr-1" />
                                  Make Admin
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Current User</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* User Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser?.id ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveUser} className="space-y-4 pt-4">
            <div className="grid gap-4">
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
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
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
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
