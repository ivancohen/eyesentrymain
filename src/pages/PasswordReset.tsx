import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PasswordReset = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Make sure the redirect URL is properly formatted
      const baseUrl = window.location.origin;
      const redirectUrl = `${baseUrl}/reset-confirmation`;
      
      console.log("Sending password reset to:", email);
      console.log("Using redirect URL:", redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) throw error;
      
      setIsSuccess(true);
      toast.success("Password reset instructions sent to your email");
    } catch (error: unknown) {
      console.error("Password reset error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send reset instructions. Please try again.");
    } finally {
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
              Enter your email address and we'll send you instructions to reset your password.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isSuccess ? (
              <Alert className="animate-slide-up bg-green-50 text-green-800 border-green-200">
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Reset instructions have been sent to <strong>{email}</strong>. 
                  Please check your email inbox and follow the instructions to reset your password.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-animation"
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Instructions"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pt-4">
            <div className="text-center text-sm">
              <Link 
                to="/login" 
                className="text-primary hover:underline"
              >
                Remember your password? Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default PasswordReset;
