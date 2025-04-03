import { useState, useEffect } from "react";
import { PatientDataService, LocationService, UserService, PatientData, LocationFilter } from "@/services"; // Import from barrel file
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Database, Filter, MapPin, RefreshCw } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const PatientDataManagement = () => {
  const [patientData, setPatientData] = useState<PatientData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Location Filters
  const [locationFilter, setLocationFilter] = useState<LocationFilter>({});
  const [locations, setLocations] = useState<{
    states: string[];
    locations: string[];
    zipCodes: string[];
  }>({
    states: [],
    locations: [],
    zipCodes: []
  });
  
  // For selecting doctors
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    loadPatientData();
    loadFilterOptions();
  }, []);

  const loadPatientData = async (filters?: LocationFilter) => {
    setIsLoading(true);
    try {
      const data = await PatientDataService.fetchPatientData(filters || locationFilter);
      setPatientData(data);
    } catch (error) {
      console.error("Error loading patient data:", error);
      toast.error("Failed to load patient data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      // Load location data
      const locationData = await LocationService.getUniqueLocations();
      setLocations(locationData);
      
      // Load doctors
      const usersData = await UserService.fetchUsers();
      // Filter for only doctors (those with specialties)
      const doctorsList = usersData
        .filter(user => user.specialty && user.is_approved)
        .map(user => ({
          id: user.id,
          name: `${user.name} (${user.specialty || 'Unknown'})` 
        }));
      
      setDoctors(doctorsList);
    } catch (error) {
      console.error("Error loading filter options:", error);
      toast.error("Failed to load filter options");
    }
  };

  const handleFilterChange = (key: keyof LocationFilter, value: string | undefined) => {
    const newFilters = { ...locationFilter };
    
    // Check if the value is one of the "All" options
    if (value && ['all_doctors', 'all_states', 'all_cities', 'all_zip_codes'].includes(value)) {
      // If it's an "All" option, remove the filter
      delete newFilters[key];
    } else if (value) {
      // Otherwise, set the filter
      newFilters[key] = value;
    } else {
      // If no value, remove the filter
      delete newFilters[key];
    }
    
    setLocationFilter(newFilters);
  };

  const applyFilters = () => {
    loadPatientData(locationFilter);
  };

  const clearFilters = () => {
    setLocationFilter({});
    loadPatientData({});
  };

  const handleViewDetails = (patient: PatientData) => {
    setSelectedPatient(patient);
    setIsDetailsOpen(true);
  };

  // Filter data based on search term
  const filteredData = patientData.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    
    // Search in limited fields (simplified for compatibility)
    return (
      (patient.doctor_name || '').toLowerCase().includes(searchLower) ||
      patient.doctor_email.toLowerCase().includes(searchLower) ||
      (patient.office_location || '').toLowerCase().includes(searchLower) ||
      (patient.state || '').toLowerCase().includes(searchLower) ||
      (patient.zip_code || '').toLowerCase().includes(searchLower) ||
      (patient.specialty || '').toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Simplified UI - removed risk level badge

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Database size={20} />
          <h2 className="text-xl font-semibold">Patient Data</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search patient data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-animation"
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter size={16} />
                <span>Filters</span>
                {Object.keys(locationFilter).length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {Object.keys(locationFilter).length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Filter Patient Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Filter patient data by location or doctor
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Doctor</label>
                  <Select
                    value={locationFilter.doctor_id}
                    onValueChange={(value) => handleFilterChange("doctor_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_doctors">All Doctors</SelectItem>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">State</label>
                  <Select
                    value={locationFilter.state}
                    onValueChange={(value) => handleFilterChange("state", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_states">All States</SelectItem>
                      {locations.states.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Select
                    value={locationFilter.office_location}
                    onValueChange={(value) => handleFilterChange("office_location", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_cities">All Cities</SelectItem>
                      {locations.locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">ZIP Code</label>
                  <Select
                    value={locationFilter.zip_code}
                    onValueChange={(value) => handleFilterChange("zip_code", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a ZIP code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_zip_codes">All ZIP Codes</SelectItem>
                      {locations.zipCodes.map((zipCode) => (
                        <SelectItem key={zipCode} value={zipCode}>
                          {zipCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button onClick={applyFilters} className="flex-1">
                    Apply Filters
                  </Button>
                  <Button variant="outline" onClick={clearFilters} className="flex-1">
                    Clear Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button
            onClick={() => loadPatientData()}
            className="hover-lift"
            disabled={isLoading}
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="glass-panel mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Anonymous Patient Data</CardTitle>
          <CardDescription>
            {Object.keys(locationFilter).length > 0 
              ? `Filtered view of patient data (${filteredData.length} results)`
              : `Showing all patient data (${filteredData.length} records)`
            }
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
                    <TableHead>ID</TableHead>
                    <TableHead>Doctor Email</TableHead>
                    <TableHead>Doctor Name</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map((patient) => (
                      <TableRow key={patient.id} className="hover:bg-secondary/40 transition-colors">
                        <TableCell className="font-mono text-xs">
                          {patient.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>{patient.doctor_email}</TableCell>
                        <TableCell>{patient.doctor_name || "Unknown"}</TableCell>
                        <TableCell>{patient.specialty || "—"}</TableCell>
                        <TableCell>
                          {patient.doctor_name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {patient.office_location ? (
                            <div className="flex items-center gap-1">
                              <MapPin size={14} className="text-gray-500" />
                              <span>
                                {patient.office_location}
                                {patient.state ? `, ${patient.state}` : ""}
                              </span>
                            </div>
                          ) : (
                            "Unknown"
                          )}
                        </TableCell>
                        <TableCell>{formatDate(patient.created_at)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(patient)}
                            className="hover:bg-secondary"
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                        {searchTerm || Object.keys(locationFilter).length > 0 
                          ? "No matching patient data found" 
                          : "No patient data available"
                        }
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Dialog */}
      {selectedPatient && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Anonymous Patient Details</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">ID</h3>
                <p className="font-mono">{selectedPatient.id}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Date Created</h3>
                <p>{formatDate(selectedPatient.created_at)}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Doctor Email</h3>
                <p className="text-lg">{selectedPatient.doctor_email}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Specialty</h3>
                <p className="text-lg">{selectedPatient.specialty || "Not specified"}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Doctor</h3>
                <p className="text-lg">{selectedPatient.doctor_name || "Unknown"}</p>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="text-lg">
                  {selectedPatient.office_location 
                    ? `${selectedPatient.office_location}${selectedPatient.state ? `, ${selectedPatient.state}` : ""}${selectedPatient.zip_code ? ` ${selectedPatient.zip_code}` : ""}`
                    : "Unknown"
                  }
                </p>
              </div>
              
              <div className="space-y-2 md:col-span-2 border-t pt-4 mt-2">
                <h3 className="text-sm font-medium text-gray-500">Note</h3>
                <p className="text-sm text-muted-foreground">
                  This simplified view shows only basic patient record information.
                  Detailed patient data and risk factors are visible to doctors who
                  submitted the data.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PatientDataManagement;
