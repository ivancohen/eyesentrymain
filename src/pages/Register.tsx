
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { InfoIcon, HourglassIcon } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

const Register = () => {
  const { register, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user && !loading) {
    return <Navigate to="/dashboard" />;
  }

  const handleRegister = async (data: { 
    email: string; 
    password: string; 
    name: string; 
    doctorName: string;
    phoneNumber: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    specialty: string;
  }) => {
    setIsLoading(true);
    try {
      // Determine if this is a doctor registration
      const isDocRegistration = !!data.doctorName;
      setIsDoctor(isDocRegistration);
      
      // Construct a formatted address string
      const formattedAddress = `${data.streetAddress}, ${data.city}, ${data.state} ${data.zipCode}`;
      
      // Include all the practice information in the user metadata
      // Also add requestRole flag if it's a doctor registration
      const metadata = {
        name: data.name,
        phoneNumber: data.phoneNumber,
        address: formattedAddress,
        streetAddress: data.streetAddress,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        specialty: data.specialty,
        requestRole: isDocRegistration ? 'doctor' : 'patient',
        ...(data.doctorName && { doctorName: data.doctorName })
      };
      
      const result = await register(
        data.email, 
        data.password, 
        metadata
      );
      
      if (result?.error) {
        throw new Error(result.error.message);
      }
      
      // Mark registration as complete to show verification message
      setRegistrationComplete(true);
      
      // Show a different toast message depending on the account type
      if (isDocRegistration) {
        toast.success("Registration successful! Please check your email for the verification link. Your account will require admin approval.");
        
        // Notify admins directly in the UI
        setTimeout(() => {
          toast.info("Admins have been notified about your registration");
        }, 2000);
      } else {
        toast.success("Registration successful! Please check your email for the verification link.");
      }

    } catch (error: unknown) {
      console.error("Registration error:", error);
      
      // Handle duplicate email error
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      if (errorMsg.includes("already registered")) {
        toast.error("This email is already registered. Please use a different email or try to log in.");
      } else {
        toast.error(errorMsg || "Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show verification message after successful registration
  if (registrationComplete) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
          <div className="w-full max-w-md">
            <div className="mb-10 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <InfoIcon className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-green-700 mb-2">Registration Successful!</h1>
            </div>
            
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <InfoIcon className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700">
                Please check your email for the verification link.
                You need to verify your email before you can log in.
              </AlertDescription>
            </Alert>
            
            {isDoctor && (
              <div>
                <Alert className="mb-6 bg-amber-50 border-amber-200">
                  <HourglassIcon className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-700">
                    <p className="font-medium">Your doctor account requires approval</p>
                    <p className="mt-1">
                      After verifying your email, your account will need to be approved by an administrator 
                      before you can access the doctor dashboard. This usually takes 1-2 business days.
                    </p>
                  </AlertDescription>
                </Alert>
                
                <Card className="mb-6 p-4 bg-gray-50">
                  <CardContent className="pt-4 px-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">What happens next?</h3>
                    <ol className="space-y-2 text-sm text-gray-600 list-decimal pl-5">
                      <li>Check your email for a verification link and click it</li>
                      <li>Our administrators have been notified of your registration</li>
                      <li>Once approved, you'll receive a confirmation email</li>
                      <li>You can then log in with your credentials</li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div className="mt-6 text-center animate-fade-in">
              <p className="text-sm text-muted-foreground">
                Already verified?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <AuthForm
            type="register"
            onSubmit={handleRegister}
            isLoading={isLoading || loading}
          />
          <div className="mt-6 text-center animate-fade-in animation-delay-300">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
