import { useState, useEffect } from "react";
import { UserService, DoctorService, UserProfile } from "@/services"; // Import from barrel file
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Edit, MapPin, Users, RefreshCw, Ban, Undo, CheckCircle, XCircle, Shield, Trash2, AlertTriangle, Pencil } from "lucide-react"; // Ensure all needed icons are here
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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label"; // Add missing Label import
import { Textarea } from "@/components/ui/textarea"; // Keep if needed for edit form

// Renamed component
const DoctorManagement = () => {
  const [doctors, setDoctors] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<UserProfile | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user: adminUser } = useAuth();
  const [editingDoctor, setEditingDoctor] = useState<UserProfile | null>(null); // Use UserProfile for editing state
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      console.log("Loading doctors (non-admin users)...");
      const allUsers = await UserService.fetchUsers();
      const doctorUsers = allUsers.filter(u => !u.is_admin);
      console.log("Doctors fetched:", doctorUsers.length, "results");
      setDoctors(doctorUsers);
    } catch (error) {
      console.error("Error loading doctors:", error);
      toast.error("Failed to load doctors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (doctor: UserProfile) => {
    setDoctorToDelete(doctor);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!doctorToDelete) return;
    setIsDeleting(true);
    try {
      const success = await DoctorService.deleteDoctor(doctorToDelete.id);
      if (success) {
        setDoctors(current => current.filter(d => d.id !== doctorToDelete.id));
        setShowDeleteConfirm(false);
        toast.success("Doctor deleted successfully");
      } else {
         toast.error("Failed to delete doctor."); // Added error toast if success is false
      }
    } catch (error) {
      console.error("Error deleting doctor:", error);
      toast.error("Failed to delete doctor");
    } finally {
      setIsDeleting(false);
      setDoctorToDelete(null);
    }
  };

  const handleSuspendUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to suspend doctor ${userName}? They will lose access.`)) return;
    setIsLoading(true);
    try {
      const success = await UserService.suspendUser(userId);
      if (success) {
        setDoctors(doctors.map(d => d.id === userId ? { ...d, is_suspended: true } : d));
        toast.success(`Doctor ${userName} suspended successfully.`);
      } else {
         toast.error("Failed to suspend doctor.");
      }
    } catch (error) {
      console.error("Error suspending doctor:", error);
      toast.error("Failed to suspend doctor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsuspendUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to unsuspend doctor ${userName}? They will regain access.`)) return;
    setIsLoading(true);
    try {
      const success = await UserService.unsuspendUser(userId);
      if (success) {
        setDoctors(doctors.map(d => d.id === userId ? { ...d, is_suspended: false } : d));
        toast.success(`Doctor ${userName} unsuspended successfully.`);
      } else {
         toast.error("Failed to unsuspend doctor.");
      }
    } catch (error) {
      console.error("Error unsuspending doctor:", error);
      toast.error("Failed to unsuspend doctor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDoctor = (doctor: UserProfile) => {
    // Ensure we have the latest data before editing
    const currentDoctorData = doctors.find(d => d.id === doctor.id);
    setEditingDoctor(currentDoctorData ? { ...currentDoctorData } : null);
    setIsEditFormOpen(true);
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    setIsLoading(true);
    try {
      // Prepare only editable fields
      const updatePayload: Partial<UserProfile> = {
        id: editingDoctor.id,
        name: editingDoctor.name,
        // email: editingDoctor.email, // Usually not editable
        specialty: editingDoctor.specialty,
        location: editingDoctor.location,
        state: editingDoctor.state,
        zip_code: editingDoctor.zip_code,
        phone_number: editingDoctor.phone_number,
        address: editingDoctor.address,
        // Do not include is_admin, is_approved, is_suspended
      };

      // Need to pass the full UserProfile type expected by updateUser
      const fullPayload: UserProfile = {
          ...doctors.find(d => d.id === editingDoctor.id)!, // Get existing data
          ...updatePayload // Overwrite with changes
      };


      const success = await UserService.updateUser(fullPayload);

      if (success) {
        toast.success("Doctor profile updated successfully");
        // Update local state with potentially modified data
        setDoctors(doctors.map(d => d.id === editingDoctor.id ? { ...d, ...editingDoctor } : d));
        setIsEditFormOpen(false);
        setEditingDoctor(null);
      } else {
         toast.error("Update failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Error updating doctor:", error);
      toast.error(`Update failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (doctor.name && doctor.name.toLowerCase().includes(searchLower)) ||
      (doctor.email && doctor.email.toLowerCase().includes(searchLower)) ||
      (doctor.specialty && doctor.specialty.toLowerCase().includes(searchLower)) ||
      (doctor.location && doctor.location.toLowerCase().includes(searchLower)) ||
      (doctor.state && doctor.state.toLowerCase().includes(searchLower)) ||
      (doctor.address && doctor.address.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="animate-fade-in">
      {/* Header and Search */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Users size={20} />
          <h2 className="text-xl font-semibold">Doctor Management</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-animation"
            />
          </div>
          <Button onClick={loadDoctors} variant="outline" className="hover-lift">
             <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Card and Table */}
      <Card className="glass-panel mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Doctor Accounts</CardTitle>
          <CardDescription>
            Manage doctor accounts, approval, and suspension status. Total Doctors: {doctors.length}
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
                    <TableHead>Specialty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                      <TableRow key={doctor.id} className="hover:bg-secondary/40 transition-colors">
                        <TableCell className="font-medium">{doctor.name || "—"}</TableCell>
                        <TableCell>{doctor.email}</TableCell>
                        <TableCell>
                          {doctor.specialty ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {doctor.specialty}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {doctor.is_suspended ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : doctor.is_approved ? (
                               <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                 Approved
                               </Badge>
                             ) : (
                               <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                 Pending Approval
                               </Badge>
                             )}
                        </TableCell>
                        <TableCell>
                          {doctor.location || doctor.city || doctor.state ? (
                            <div className="flex items-center gap-1">
                              <MapPin size={14} className="text-gray-500" />
                              <span>
                                {doctor.location || `${doctor.city || ''}${doctor.city && doctor.state ? ', ' : ''}${doctor.state || ''}`}
                              </span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             {/* Edit Button */}
                             <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => handleEditDoctor(doctor)}
                               className="hover:bg-primary/10 hover:text-primary"
                               title="Edit Doctor Profile" // Added title for clarity
                             >
                               <Pencil size={16} />
                               <span className="sr-only">Edit</span>
                             </Button>

                             {/* Suspend/Unsuspend Buttons */}
                             {doctor.is_suspended ? (
                               <Button
                                 variant="outline"
                                 size="sm"
                                 className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                 onClick={() => handleUnsuspendUser(doctor.id, doctor.name || doctor.email)}
                                 title="Unsuspend Doctor Account" // Added title
                               >
                                 <Undo size={16} className="mr-1" />
                                 Unsuspend
                               </Button>
                             ) : (
                               <Button
                                 variant="outline"
                                 size="sm"
                                 className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                 onClick={() => handleSuspendUser(doctor.id, doctor.name || doctor.email)}
                                 title="Suspend Doctor Account" // Added title
                               >
                                 <Ban size={16} className="mr-1" />
                                 Suspend
                               </Button>
                             )}

                             {/* Delete Button */}
                             <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => handleDeleteClick(doctor)}
                               className="text-red-600 hover:text-red-700 hover:bg-red-50"
                               title="Delete Doctor Account" // Added title
                             >
                               <Trash2 size={16} />
                               <span className="sr-only">Delete</span>
                             </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        {searchTerm ? "No matching doctors found" : "No doctors available"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this doctor account? All associated data might be affected. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {doctorToDelete && (
            <div className="py-4">
              <div className="space-y-2">
                <div className="font-medium">Doctor Information:</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Name:</div>
                  <div>{doctorToDelete.name || 'N/A'}</div>
                  <div className="text-muted-foreground">Email:</div>
                  <div>{doctorToDelete.email}</div>
                  <div className="text-muted-foreground">Specialty:</div>
                  <div>{doctorToDelete.specialty || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex items-center justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? (
                 <div className="flex items-center"><LoadingSpinner size="sm" className="mr-2 border-white" /> Deleting...</div> // Improved loading indicator
              ) : (
                <><Trash2 size={16} className="mr-1" /> Delete Doctor</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Doctor Dialog */}
      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Doctor Profile</DialogTitle>
            <DialogDescription>Update the doctor's profile information below.</DialogDescription>
          </DialogHeader>
          {editingDoctor && (
            <form onSubmit={handleSaveDoctor} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input id="edit-name" value={editingDoctor.name || ''} onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, name: e.target.value } : null)} required />
                </div>
                {/* Email (Readonly) */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" value={editingDoctor.email || ''} readOnly className="bg-muted/50" />
                </div>
                {/* Specialty */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-specialty">Specialty</Label>
                  <Input id="edit-specialty" value={editingDoctor.specialty || ''} onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, specialty: e.target.value } : null)} />
                </div>
                {/* Phone Number */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input id="edit-phone" value={editingDoctor.phone_number || ''} onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, phone_number: e.target.value } : null)} />
                </div>
                {/* Address */}
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input id="edit-address" value={editingDoctor.address || ''} onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, address: e.target.value } : null)} />
                </div>
                {/* Location (City) */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-location">Location (City)</Label>
                  <Input id="edit-location" value={editingDoctor.location || ''} onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, location: e.target.value } : null)} />
                </div>
                {/* State */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-state">State</Label>
                  <Input id="edit-state" value={editingDoctor.state || ''} onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, state: e.target.value } : null)} />
                </div>
                {/* Zip Code */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-zip">Zip Code</Label>
                  <Input id="edit-zip" value={editingDoctor.zip_code || ''} onChange={(e) => setEditingDoctor(prev => prev ? { ...prev, zip_code: e.target.value } : null)} />
                </div>
              </div>
              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={() => { setIsEditFormOpen(false); setEditingDoctor(null); }}>Cancel</Button> {/* Clear editing state on cancel */}
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <><LoadingSpinner size="sm" className="mr-2 border-white" /> Saving...</> : 'Save Changes'} {/* Improved loading indicator */}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default DoctorManagement;
