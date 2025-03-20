import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Key, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ResetConfirmation = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Extract hash parameters from URL and handle Supabase recovery flow
  useEffect(() => {
    const checkSession = async () => {
      try {
        // The recovery token is automatically handled by Supabase
        // Get the current session which should be established from the recovery link
        const { data, error } = await supabase.auth.getSession();
        
        console.log("Session check for password reset:", data);
        
        if (error || !data.session) {
          console.error("No valid session for password reset:", error);
          toast.error("Invalid or missing recovery link. Please request a new password reset.");
          setTimeout(() => navigate("/reset-password"), 2000);
        }
      } catch (err) {
        console.error("Error getting session:", err);
        toast.error("Error processing recovery link. Please request a new password reset.");
        setTimeout(() => navigate("/reset-password"), 2000);
      }
    };
    
    checkSession();
  }, [navigate]);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Create a direct reset function for the loading state
  const resetLoadingState = () => {
    console.log("Force resetting loading state");
    setIsLoading(false);
  };
  
  // Monitor the loading state
  useEffect(() => {
    if (isLoading) {
      // If we're in a loading state, set a backup timeout
      const backupTimer = setTimeout(() => {
        if (isLoading) {
          console.log("Backup timer triggered to reset loading state");
          setIsLoading(false);
        }
      }, 5000);
      
      return () => clearTimeout(backupTimer);
    }
  }, [isLoading]);
  
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    // Set a timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError("Password reset is taking too long. Please try again.");
        toast.error("Request timed out. Please try again.");
      }
    }, 10000); // 10 second timeout

    try {
      console.log("Starting password update process");
      
      // First check if we have a valid session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error("No active session found. Please use the reset link from your email again.");
      }
      
      // Update the user's password using the current session
      const { data, error } = await supabase.auth.updateUser({ 
        password: password 
      });

      clearTimeout(timeoutId);
      
      if (error) {
        console.error("Supabase updateUser error:", error);
        throw error;
      }
      
      console.log("Password update response:", data);
      
      // First set success state to true, then stop loading
      console.log("Password reset successful, updating component state");
      setIsSuccess(true);
      setIsLoading(false);
      toast.success("Password has been reset successfully");
      
      // Force re-render with a small timeout if needed
      setTimeout(() => {
        if (isLoading) {
          console.log("Manual reset of loading state");
          setIsLoading(false);
        }
      }, 500);
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      console.error("Error resetting password:", error);
      const errorMsg = error instanceof Error ? error.message : "An error occurred while resetting your password";
      setError(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/20 p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <div className="flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">EyeSentry</span>
          </div>
        </div>

        <Card className="glass-panel animate-fade-in shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Reset Your Password</CardTitle>
            <CardDescription>
              Enter your new password below to complete the reset process.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isSuccess ? (
              <div className="text-center py-4">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-700 mb-2">Password Reset Complete</h3>
                <p className="text-muted-foreground mb-4">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
                <Button
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  Go to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 input-animation"
                      placeholder="Enter new password"
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={toggleShowPassword}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10 input-animation"
                      placeholder="Confirm new password"
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={toggleShowConfirmPassword}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">
                        {showConfirmPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  onClick={(e) => {
                    if (isLoading) {
                      e.preventDefault(); // Prevent normal submission if already loading
                      // Force disable loading state if it gets stuck
                      console.log("Manual click reset of loading state");
                      resetLoadingState();
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Reset Password
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          {!isSuccess && (
            <CardFooter className="flex flex-col space-y-4 pt-4">
              <div className="text-center text-sm">
                <Link
                  to="/login"
                  className="text-primary hover:underline"
                >
                  Return to sign in
                </Link>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetConfirmation;
