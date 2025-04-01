import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import SuspendedAccountDialog from "@/components/SuspendedAccountDialog"; // Import the new dialog

const Login = () => {
  const { login, user, loading: authLoading } = useAuth();
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailVerified = searchParams.get('email_verified');
  const [isSuspendedDialogOpen, setIsSuspendedDialogOpen] = useState(false);
  const [suspendedEmail, setSuspendedEmail] = useState('');

  useEffect(() => {
    // Show toast for email verification if parameter is present
    if (emailVerified === 'true') {
      toast.success("Email verified successfully! You can now log in.");
    }
    
    // Redirect if already logged in
    if (user && !authLoading) {
      if (user.isAdmin) {
        console.log("Admin user is logged in, redirecting to admin panel");
        navigate("/new-admin", { replace: true });
      } else {
        // Check if the user is a doctor and needs approval
        const checkApprovalStatus = async () => {
          try {
            // Use the raw query method with type assertion
            const { data, error } = await supabase
              .rpc('check_doctor_approval_status', {
                p_user_id: user.id
              }) as unknown as { 
                data: { status: string | null } | null, 
                error: Error | null 
              };
              
            if (error) {
              console.error("Error checking approval status:", error);
              navigate("/dashboard", { replace: true });
              return;
            }
            
            if (data && data.status) {
              // If doctor account and not approved yet, redirect to pending page
              const status = data.status;
              if (status === 'pending' || status === 'rejected') {
                console.log("Doctor account pending approval, redirecting to approval page");
                navigate("/pending-approval", { replace: true });
                return;
              }
            }
            
            // Otherwise redirect to dashboard
            console.log("User is logged in, redirecting to dashboard");
            navigate("/dashboard", { replace: true });
          } catch (error) {
            console.error("Error in approval check:", error);
            navigate("/dashboard", { replace: true });
          }
        };
        
        checkApprovalStatus();
      }
    }
  }, [user, authLoading, navigate, emailVerified]);

  const handleLogin = async (data: { email: string; password: string }) => {
    if (formLoading) return; // Prevent multiple submissions
    
    setFormLoading(true);
    try {
      console.log("Attempting login for:", data.email);
      const result = await login(data.email, data.password);
      
      if (result) {
        console.log("Login successful, user:", result);
        toast.success("Login successful!");
        
        // Redirecting will be handled by the useEffect
        if (result.isAdmin) {
          navigate("/new-admin", { replace: true });
        } else {
          // Check if the user is a doctor with pending approval
          if (result.isDoctor && result.isPendingApproval) {
            console.log("Doctor pending approval, redirecting to approval page");
            navigate("/pending-approval", { replace: true });
          } else if (result.isDoctor) {
            console.log("Approved doctor, redirecting to doctor dashboard");
            navigate("/doctor", { replace: true });
          } else {
            console.log("Regular user, redirecting to dashboard");
            navigate("/dashboard", { replace: true });
          }
        }
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      
      const errorMsg = error instanceof Error ? error.message : "Unknown error";

      // Check for specific suspension error
      if (errorMsg === "ACCOUNT_SUSPENDED") {
        setSuspendedEmail(data.email); // Store the email for the dialog
        setIsSuspendedDialogOpen(true); // Open the dialog
        // Don't show a generic error toast in this case
      } else if (errorMsg.includes("Email not confirmed")) {
        toast.error("Please verify your email before logging in. Check your inbox for the verification link.");
      } else {
        // Generic login error
        toast.error(errorMsg || "Login failed. Please check your credentials.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Show loading spinner while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-3 text-blue-700">Checking authentication status...</span>
        </div>
      </div>
    );
  }

  // If user is already logged in, useEffect will handle redirect
  if (user) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-3 text-blue-700">
            Redirecting to {user.isAdmin ? "admin panel" : "dashboard"}...
          </span>
        </div>
      </div>
    );
  }

  return (
    <> {/* Wrap in fragment to allow sibling Dialog */}
    <div className="min-h-screen flex flex-col bg-blue-50">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          {emailVerified === 'true' && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <InfoIcon className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                Your email has been verified! You can now log in.
              </AlertDescription>
            </Alert>
          )}
          
          <AuthForm
            type="login"
            onSubmit={handleLogin}
            isLoading={formLoading}
          />
          <div className="mt-6 text-center animate-fade-in animation-delay-300">
            <p className="text-sm text-blue-700">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-500 font-medium hover:underline">
                Register
              </Link>
            </p>
            <p className="text-sm text-blue-700 mt-2">
              <Link to="/reset-password" className="text-blue-500 font-medium hover:underline">
                Forgot your password?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Render the Suspended Account Dialog */}
    <SuspendedAccountDialog
      isOpen={isSuspendedDialogOpen}
      onClose={() => setIsSuspendedDialogOpen(false)}
      userEmail={suspendedEmail}
    />
  </> // Close the fragment
  );
};

export default Login;
