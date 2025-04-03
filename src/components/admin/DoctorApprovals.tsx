import { useState, useEffect } from "react";
import { DoctorService, DoctorApproval } from "@/services"; // Import from barrel file
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle, UserCheck, UserX, MapPin, BadgeCheck, Calendar } from "lucide-react";
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

const DoctorApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState<DoctorApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    setIsLoading(true);
    try {
      console.log("Loading pending doctor approvals...");
      
      // Use FixedAdminService to fetch pending approvals
      const approvals = await DoctorService.fetchPendingDoctorApprovals();
      
      console.log("Pending approvals fetched:", approvals.length, "results");
      setPendingApprovals(approvals);
    } catch (error) {
      console.error("Error loading pending approvals:", error);
      toast.error("Failed to load pending approvals");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (doctorId: string) => {
    setProcessingIds((current) => [...current, doctorId]);
    try {
      const success = await DoctorService.approveDoctor(doctorId);
      
      if (success) {
        setPendingApprovals((current) => current.filter((doctor) => doctor.id !== doctorId));
        toast.success("Doctor approved successfully");
      }
    } catch (error) {
      console.error("Error approving doctor:", error);
      toast.error("Failed to approve doctor");
    } finally {
      setProcessingIds((current) => current.filter((id) => id !== doctorId));
    }
  };

  const handleReject = async (doctorId: string) => {
    setProcessingIds((current) => [...current, doctorId]);
    try {
      const success = await DoctorService.rejectDoctor(doctorId);
      
      if (success) {
        setPendingApprovals((current) => current.filter((doctor) => doctor.id !== doctorId));
        toast.success("Doctor rejected successfully");
      }
    } catch (error) {
      console.error("Error rejecting doctor:", error);
      toast.error("Failed to reject doctor");
    } finally {
      setProcessingIds((current) => current.filter((id) => id !== doctorId));
    }
  };

  // Apply search filter
  const filteredApprovals = pendingApprovals.filter((doctor) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (doctor.name && doctor.name.toLowerCase().includes(searchLower)) ||
      (doctor.email && doctor.email.toLowerCase().includes(searchLower)) ||
      (doctor.specialty && doctor.specialty.toLowerCase().includes(searchLower)) ||
      (doctor.location && doctor.location.toLowerCase().includes(searchLower))
    );
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
          <BadgeCheck size={20} />
          <h2 className="text-xl font-semibold">Doctor Approval Requests</h2>
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
          <Button onClick={loadPendingApprovals} variant="outline" className="hover-lift">
            Refresh
          </Button>
        </div>
      </div>

      <Card className="glass-panel mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>
            {pendingApprovals.length} doctor {pendingApprovals.length === 1 ? 'account' : 'accounts'} awaiting approval
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
                    <TableHead>Doctor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApprovals.length > 0 ? (
                    filteredApprovals.map((doctor) => (
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
                          {doctor.street_address || doctor.location ? (
                            <div className="flex items-center gap-1">
                              <MapPin size={14} className="text-gray-500" />
                              <div className="flex flex-col">
                                <span>
                                  {doctor.street_address || doctor.location}
                                </span>
                                {(doctor.city || doctor.state) && (
                                  <span className="text-xs text-gray-500">
                                    {doctor.city && doctor.city}
                                    {doctor.city && doctor.state && ", "}
                                    {doctor.state && doctor.state}
                                    {doctor.zip_code && ` ${doctor.zip_code}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-gray-500" />
                            <span>{formatDate(doctor.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(doctor.id)}
                              disabled={processingIds.includes(doctor.id)}
                              className="hover:bg-green-100 text-green-600 border-green-200"
                            >
                              {processingIds.includes(doctor.id) ? (
                                <div className="w-4 h-4 border-b-2 border-green-600 rounded-full animate-spin mr-1"></div>
                              ) : (
                                <CheckCircle size={16} className="mr-1" />
                              )}
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(doctor.id)}
                              disabled={processingIds.includes(doctor.id)}
                              className="hover:bg-red-100 text-red-600 border-red-200"
                            >
                              {processingIds.includes(doctor.id) ? (
                                <div className="w-4 h-4 border-b-2 border-red-600 rounded-full animate-spin mr-1"></div>
                              ) : (
                                <XCircle size={16} className="mr-1" />
                              )}
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        {searchTerm
                          ? "No matching approval requests found"
                          : "No doctor accounts awaiting approval"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-gray-500 border-t pt-4 mt-4">
        <p>
          <strong>Note:</strong> Approving a doctor will grant them access to submit patient data.
          Rejection will permanently delete their account from the system.
        </p>
      </div>
    </div>
  );
};

export default DoctorApprovals;
