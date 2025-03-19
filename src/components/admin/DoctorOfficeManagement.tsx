import { useState, useEffect } from "react";
import { FixedAdminService, DoctorOffice } from "@/services/FixedAdminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Edit, MapPin, Building, Calendar, Save, X, Phone, Mail, Clock, Trash2, AlertTriangle } from "lucide-react";
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DoctorOfficeManagement = () => {
  const [doctorOffices, setDoctorOffices] = useState<DoctorOffice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOffice, setSelectedOffice] = useState<DoctorOffice | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    office_name: string;
    specialty: string;
    fax_number: string;
    email: string;
    website: string;
    address: string;
    location: string;
    state: string;
    zip_code: string;
    office_hours: string;
    accepting_new_patients: boolean;
    insurance_accepted: string;
    additional_notes: string;
  }>({
    name: "",
    office_name: "",
    specialty: "",
    fax_number: "",
    email: "",
    website: "",
    address: "",
    location: "",
    state: "",
    zip_code: "",
    office_hours: "",
    accepting_new_patients: true,
    insurance_accepted: "",
    additional_notes: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterState, setFilterState] = useState<string>("all-states");
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all-specialties");
  const [states, setStates] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<DoctorOffice | null>(null);

  useEffect(() => {
    loadDoctorOffices();
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      // Get unique locations for filtering
      const { states, locations, zipCodes } = await FixedAdminService.getUniqueLocations();
      // Filter out empty strings to avoid Select.Item errors
      setStates(states.filter(state => state && state.trim() !== ''));
      
      // Extract unique specialties from doctor offices
      const doctors = await FixedAdminService.fetchApprovedDoctors();
      const uniqueSpecialties = Array.from(
        new Set(doctors.map(d => d.specialty).filter(specialty => specialty && specialty.trim() !== '') as string[])
      );
      setSpecialties(uniqueSpecialties);
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  };

  const loadDoctorOffices = async () => {
    setIsLoading(true);
    try {
      console.log("Loading doctor offices...");
      
      // Use FixedAdminService to fetch doctor offices
      const offices = await FixedAdminService.fetchDoctorOffices();
      
      console.log("Doctor offices fetched:", offices.length, "results");
      setDoctorOffices(offices);
    } catch (error) {
      console.error("Error loading doctor offices:", error);
      toast.error("Failed to load doctor offices");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditOffice = (office: DoctorOffice) => {
    setSelectedOffice(office);
    setEditFormData({
      name: office.name || "",
      office_name: office.office_name || "",
      specialty: office.specialty || "",
      fax_number: office.fax_number || "",
      email: office.email || "",
      website: office.website || "",
      address: office.address || "",
      location: office.location || "",
      state: office.state || "",
      zip_code: office.zip_code || "",
      office_hours: office.office_hours || "",
      accepting_new_patients: office.accepting_new_patients || true,
      insurance_accepted: office.insurance_accepted || "",
      additional_notes: office.additional_notes || ""
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (office: DoctorOffice) => {
    setDoctorToDelete(office);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!doctorToDelete) return;
    
    setIsDeleting(true);
    try {
      // Delete the doctor
      const success = await FixedAdminService.deleteDoctor(doctorToDelete.id);
      
      if (success) {
        // Remove the doctor from the local state
        setDoctorOffices(current => 
          current.filter(o => o.id !== doctorToDelete.id)
        );
        
        setShowDeleteConfirm(false);
        toast.success("Doctor deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting doctor:", error);
      toast.error("Failed to delete doctor");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveOffice = async () => {
    if (!selectedOffice) return;
    
    setIsSaving(true);
    try {
      // Update the doctor office information
      const success = await FixedAdminService.updateDoctorOffice({
        id: selectedOffice.id,
        name: editFormData.name,
        specialty: editFormData.specialty,
        address: editFormData.address,
        location: editFormData.location,
        state: editFormData.state,
        zip_code: editFormData.zip_code,
        office_name: editFormData.office_name,
        office_hours: editFormData.office_hours,
        fax_number: editFormData.fax_number,
        website: editFormData.website,
        accepting_new_patients: editFormData.accepting_new_patients,
        insurance_accepted: editFormData.insurance_accepted,
        additional_notes: editFormData.additional_notes
      });
      
      if (success) {
        // Update the office in the local state with all fields
        setDoctorOffices(current => 
          current.map(o => 
            o.id === selectedOffice.id 
              ? {
                  ...o,
                  name: editFormData.name,
                  office_name: editFormData.office_name,
                  specialty: editFormData.specialty,
                  fax_number: editFormData.fax_number,
                  email: editFormData.email,
                  website: editFormData.website,
                  address: editFormData.address,
                  location: editFormData.location,
                  state: editFormData.state,
                  zip_code: editFormData.zip_code,
                  office_hours: editFormData.office_hours,
                  accepting_new_patients: editFormData.accepting_new_patients,
                  insurance_accepted: editFormData.insurance_accepted,
                  additional_notes: editFormData.additional_notes
                }
              : o
          )
        );
        
        setIsEditOpen(false);
        toast.success("Doctor office information updated successfully");
      }
    } catch (error) {
      console.error("Error updating doctor office:", error);
      toast.error("Failed to update doctor office information");
    } finally {
      setIsSaving(false);
    }
  };

  // Apply filters and search
  const filteredOffices = doctorOffices.filter(office => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (office.name && office.name.toLowerCase().includes(searchLower)) ||
      (office.email && office.email.toLowerCase().includes(searchLower)) ||
      (office.office_name && office.office_name.toLowerCase().includes(searchLower)) ||
      (office.specialty && office.specialty.toLowerCase().includes(searchLower)) ||
      (office.location && office.location.toLowerCase().includes(searchLower)) ||
      (office.address && office.address.toLowerCase().includes(searchLower));
    
    const matchesState = !filterState || filterState === "all-states" || office.state === filterState;
    const matchesSpecialty = !filterSpecialty || filterSpecialty === "all-specialties" || office.specialty === filterSpecialty;
    
    return matchesSearch && matchesState && matchesSpecialty;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Building size={20} />
          <h2 className="text-xl font-semibold">Doctor Office Management</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search offices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-animation"
            />
          </div>
          <Button onClick={loadDoctorOffices} variant="outline" className="hover-lift">
            Refresh
          </Button>
          <Button 
            onClick={async () => {
              try {
                const diagnostics = await FixedAdminService.diagnosePendingApprovals();
                console.log("Approval diagnostics:", diagnostics);
                toast.info(`Diagnostics: ${diagnostics.authUsers} users, ${diagnostics.profilesWithoutApproval} unapproved profiles, ${diagnostics.pendingDoctorsView} in view`);
              } catch (error) {
                console.error("Error running diagnostics:", error);
                toast.error("Failed to run diagnostics");
              }
            }} 
            variant="outline" 
            className="hover-lift"
          >
            Run Diagnostics
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="w-1/4">
          <Label htmlFor="state-filter">Filter by State</Label>
          <Select 
            value={filterState} 
            onValueChange={setFilterState}
          >
            <SelectTrigger id="state-filter">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-states">All States</SelectItem>
              {states
                .filter(state => state && state.trim() !== '')
                .map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
        <div className="w-1/4">
          <Label htmlFor="specialty-filter">Filter by Specialty</Label>
          <Select 
            value={filterSpecialty} 
            onValueChange={setFilterSpecialty}
          >
            <SelectTrigger id="specialty-filter">
              <SelectValue placeholder="All Specialties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-specialties">All Specialties</SelectItem>
              {specialties
                .filter(specialty => specialty && specialty.trim() !== '')
                .map(specialty => (
                  <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="glass-panel mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Doctor Offices</CardTitle>
          <CardDescription>
            {doctorOffices.length} doctor {doctorOffices.length === 1 ? 'office' : 'offices'} in the system
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
                    <TableHead>Office Name</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOffices.length > 0 ? (
                    filteredOffices.map((office) => (
                      <TableRow key={office.id} className="hover:bg-secondary/40 transition-colors">
                        <TableCell className="font-medium">{office.office_name}</TableCell>
                        <TableCell>{office.name}</TableCell>
                        <TableCell>
                          {office.specialty ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {office.specialty}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {office.location ? (
                            <div className="flex items-center gap-1">
                              <MapPin size={14} className="text-gray-500" />
                              <span>
                                {office.location}
                                {office.state ? `, ${office.state}` : ""}
                              </span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mail size={14} className="text-gray-500" />
                            <span>{office.email || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditOffice(office)}
                                className="hover:bg-secondary"
                              >
                                <Edit size={16} className="mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(office)}
                                className="hover:bg-red-100 text-red-600 border-red-200"
                              >
                                <Trash2 size={16} className="mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        {searchTerm || filterState || filterSpecialty ? "No matching offices found" : "No doctor offices available"}
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
              Are you sure you want to delete this doctor? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {doctorToDelete && (
            <div className="py-4">
              <div className="space-y-2">
                <div className="font-medium">Doctor Information:</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Name:</div>
                  <div>{doctorToDelete.name}</div>
                  
                  <div className="text-muted-foreground">Email:</div>
                  <div>{doctorToDelete.email}</div>
                  
                  <div className="text-muted-foreground">Office:</div>
                  <div>{doctorToDelete.office_name}</div>
                  
                  <div className="text-muted-foreground">Specialty:</div>
                  <div>{doctorToDelete.specialty}</div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex items-center justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                  <span>Deleting...</span>
                </div>
              ) : (
                <>
                  <Trash2 size={16} className="mr-1" />
                  Delete Doctor
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Office Dialog */}
      {selectedOffice && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Edit Doctor Office Information</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="contact">Contact & Location</TabsTrigger>
                <TabsTrigger value="practice">Practice Details</TabsTrigger>
              </TabsList>
              
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="office_name">Office/Practice Name</Label>
                    <Input
                      id="office_name"
                      value={editFormData.office_name}
                      onChange={(e) => setEditFormData({...editFormData, office_name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Doctor Name</Label>
                    <Input
                      id="name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Input
                      id="specialty"
                      value={editFormData.specialty}
                      onChange={(e) => setEditFormData({...editFormData, specialty: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accepting_new_patients">Accepting New Patients</Label>
                    <Select 
                      value={editFormData.accepting_new_patients ? "yes" : "no"}
                      onValueChange={(value) => setEditFormData({
                        ...editFormData, 
                        accepting_new_patients: value === "yes"
                      })}
                    >
                      <SelectTrigger id="accepting_new_patients">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="office_hours">Office Hours</Label>
                    <Input
                      id="office_hours"
                      value={editFormData.office_hours}
                      onChange={(e) => setEditFormData({...editFormData, office_hours: e.target.value})}
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Contact & Location Tab */}
              <TabsContent value="contact" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="space-y-2">
                    <Label htmlFor="fax_number">Fax Number</Label>
                    <Input
                      id="fax_number"
                      value={editFormData.fax_number}
                      onChange={(e) => setEditFormData({...editFormData, fax_number: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={editFormData.website}
                      onChange={(e) => setEditFormData({...editFormData, website: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">City</Label>
                    <Input
                      id="location"
                      value={editFormData.location}
                      onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={editFormData.state}
                      onChange={(e) => setEditFormData({...editFormData, state: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">Zip Code</Label>
                    <Input
                      id="zip_code"
                      value={editFormData.zip_code}
                      onChange={(e) => setEditFormData({...editFormData, zip_code: e.target.value})}
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Practice Details Tab */}
              <TabsContent value="practice" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="insurance_accepted">Insurance Accepted</Label>
                    <Textarea
                      id="insurance_accepted"
                      value={editFormData.insurance_accepted}
                      onChange={(e) => setEditFormData({...editFormData, insurance_accepted: e.target.value})}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="additional_notes">Additional Notes</Label>
                    <Textarea
                      id="additional_notes"
                      value={editFormData.additional_notes}
                      onChange={(e) => setEditFormData({...editFormData, additional_notes: e.target.value})}
                      rows={5}
                      placeholder="Enter any additional information about the practice..."
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="flex items-center justify-end gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsEditOpen(false)}
              >
                <X size={16} className="mr-1" />
                Cancel
              </Button>
              <Button 
                onClick={handleSaveOffice}
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <>
                    <Save size={16} className="mr-1" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DoctorOfficeManagement;
