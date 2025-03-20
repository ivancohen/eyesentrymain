import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clipboard, HourglassIcon, LogOut, UserCheck, Bell } from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";

const PendingApproval = () => {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const navigate = useNavigate();

  useEffect(() => {
    const checkApprovalStatus = async () => {
      setIsLoading(true);
      
      if (!user) {
        navigate("/login");
        return;
      }
      
      try {
        // Check if user is already approved
        if (user.isAdmin) {
          navigate("/new-admin");
          return;
        }

        // Check approval status using the doctor approval status function
        const { data, error } = await supabase
          .rpc('check_doctor_approval_status', {
            p_user_id: user.id
          }) as unknown as { 
            data: { status: string | null } | null, 
            error: Error | null 
          };

        if (error) {
          console.error("Error fetching approval status:", error);
          return;
        }

        if (data && data.status) {
          if (data.status === "approved") {
            setApprovalStatus("approved");
            
            // Give user a moment to see the approved message, then redirect
            setTimeout(() => {
              navigate("/doctor");
            }, 2000);
          } else if (data.status === "rejected") {
            setApprovalStatus("rejected");
          } else {
            setApprovalStatus("pending");
          }
        }
      } catch (error) {
        console.error("Error checking approval status:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkApprovalStatus();
    
    // Poll for status changes every 30 seconds
    const intervalId = setInterval(checkApprovalStatus, 30000);
    
    return () => clearInterval(intervalId);
  }, [user, navigate]);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  
  const copyEmailToClipboard = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      toast.success("Email copied to clipboard");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
        <span className="ml-3">Checking approval status...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/20 p-4">
      <div className="w-full max-w-md">
        <Card className="glass-panel animate-fade-in shadow-lg">
          <CardHeader className="text-center">
            {approvalStatus === "approved" ? (
              <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl text-green-700">Account Approved!</CardTitle>
              </>
            ) : approvalStatus === "rejected" ? (
              <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <Bell className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-xl text-red-700">Account Access Denied</CardTitle>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <HourglassIcon className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-xl text-amber-700">Account Pending Approval</CardTitle>
              </>
            )}
            
            <CardDescription className="pt-2">
              {approvalStatus === "approved" ? (
                "Your account has been approved! Redirecting you to the doctor dashboard..."
              ) : approvalStatus === "rejected" ? (
                "Your account application has been rejected. Please contact support for more information."
              ) : (
                "Your account is currently pending administrator approval."
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center">
            {approvalStatus === "pending" && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We review all doctor account applications before granting access to our platform. 
                  This usually takes 1-2 business days. You'll receive an email notification when your account is approved.
                </p>
                
                <div className="rounded-md bg-primary/10 p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Your registered email:</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0" 
                      onClick={copyEmailToClipboard}
                    >
                      <Clipboard className="h-4 w-4" />
                      <span className="sr-only">Copy email</span>
                    </Button>
                  </div>
                  <p className="text-primary font-medium">{user?.email}</p>
                </div>
              </div>
            )}
            
            {approvalStatus === "rejected" && (
              <div className="space-y-4 pt-2">
                <p className="text-muted-foreground">
                  Unfortunately, your account application has not been approved at this time. 
                  This could be due to incomplete or incorrect information.
                </p>
                
                <div className="rounded-md bg-muted p-3 text-left">
                  <p className="text-sm font-medium mb-2">Common reasons for rejection:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Incomplete or incorrect license information</li>
                    <li>Unable to verify professional credentials</li>
                    <li>Missing required information in your profile</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pt-2">
            {approvalStatus === "pending" && (
              <>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/user-profile")}
                >
                  Update Your Profile
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Ensuring your profile is complete can speed up the approval process.
                </p>
              </>
            )}
            
            {approvalStatus === "rejected" && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/user-profile")}
              >
                Update Your Profile & Reapply
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              className="mt-2 text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" /> Log Out
            </Button>
          </CardFooter>
        </Card>
        
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>
            Need help? <Link to="/contact" className="text-primary hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
