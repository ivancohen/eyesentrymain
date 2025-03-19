import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, FileQuestion, Database } from "lucide-react";
import Navbar from "@/components/Navbar";

// Dashboard component with automatic role-based redirection
const Dashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect after authentication is complete
    if (!loading) {
      // If user is admin, redirect to admin panel
      if (isAdmin) {
        console.log("User is admin, redirecting to admin panel");
        navigate("/new-admin");
      } else if (user) {
        // If user is a doctor, redirect to doctor dashboard
        console.log("User is doctor, redirecting to doctor dashboard");
        navigate("/doctor");
      }
    }
  }, [isAdmin, loading, navigate, user]);

  // If still loading, show spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
        <span className="ml-3">Loading dashboard...</span>
      </div>
    );
  }

  // If user is logged in but not yet redirected (waiting for admin/doctor status verification)
  // show a useful dashboard with direct links to important features
  if (user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
            
            {/* Add additional cards for other quick actions as needed */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileQuestion className="h-5 w-5" /> Patient Questionnaire
                </CardTitle>
                <CardDescription>
                  Fill out a new patient assessment form
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <Link to="/questionnaire">Start Questionnaire</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" /> View Records
                </CardTitle>
                <CardDescription>
                  Access your patient records and history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" disabled={true}>Coming Soon</Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 text-center text-muted-foreground">
            <p>Redirecting to {isAdmin ? 'admin panel' : 'doctor dashboard'} shortly...</p>
            <LoadingSpinner className="mx-auto mt-2" />
          </div>
        </main>
      </div>
    );
  }

  // If no user is logged in, redirect to login
  navigate("/login");
  return null;
};

export default Dashboard;
