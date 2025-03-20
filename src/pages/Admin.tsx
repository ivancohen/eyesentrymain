import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Database, 
  Shield, 
  FileQuestion, 
  UserCheck,
  Bot
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import our admin components
import EnhancedUserManagement from "@/components/admin/EnhancedUserManagement";
import DoctorApprovals from "@/components/admin/DoctorApprovals";
import PatientDataManagement from "@/components/admin/PatientDataManagement";
import EnhancedQuestionManager from "@/components/admin/EnhancedQuestionManager";
import AIAssistant from "@/components/admin/AIAssistant";

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Additional state to handle admin override
  const [adminOverride, setAdminOverride] = useState<boolean>(false);

  // Check auth status when component mounts or auth state changes
  useEffect(() => {
    console.log("Admin page: Auth state check", { 
      userExists: !!user, 
      isAdmin, 
      authLoading,
      adminOverride
    });

    // Wait until auth check is complete
    if (authLoading) {
      console.log("Admin page: Authentication is still loading");
      return;
    }

    // Auth check is complete and user is not logged in
    if (!user) {
      console.log("Admin page: Not logged in, redirecting to login page");
      toast.error("You must be logged in to access the admin panel");
      navigate("/login");
      return;
    }
    
    // Check for additional admin emails (backup hardcoded access for specific accounts)
    // This is a fallback in case the isAdmin flag determination isn't working
    const adminEmails = ['ivan.s.cohen@gmail.com']; // Add any admin emails here
    const isAdminByEmail = adminEmails.includes(user.email);
    
    // Grant admin override if email is in the admin list
    if (isAdminByEmail && !isAdmin) {
      console.log("User has admin email but isAdmin flag is false, granting override access");
      setAdminOverride(true);
    }
    
    // Auth check is complete and user is not admin
    if (!isAdmin && !adminOverride && !isAdminByEmail) {
      console.log("Admin page: User is not admin, redirecting to dashboard");
      console.log("User details:", { id: user.id, email: user.email, isAdmin });
      toast.error("You don't have admin privileges");
      navigate("/dashboard");
      return;
    }
    
    console.log("Admin page: User is admin or has override, showing admin panel");
  }, [user, isAdmin, authLoading, navigate, adminOverride]);

  // Function to handle tab navigation clicks from dashboard cards
  const handleTabClick = (tabValue: string) => {
    const tabTrigger = document.querySelector(`[data-value="${tabValue}"]`);
    if (tabTrigger && tabTrigger instanceof HTMLElement) {
      tabTrigger.click();
    }
  };

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-3 text-lg">Checking authentication status...</span>
        </div>
      </div>
    );
  }

  // If user is null but not loading, useEffect will handle redirect
  if (!user) {
    return null;
  }

  // If user is not admin and has no override, useEffect will handle redirect
  if (!isAdmin && !adminOverride) {
    return null;
  }

  // Admin content
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container px-4 py-4 mb-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 animate-slide-up flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Control Panel
          </h1>
          <p className="text-muted-foreground animate-slide-up animation-delay-100">
            Welcome, Administrator. You have access to system settings and administrative functions.
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard" data-value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users" data-value="users">User Management</TabsTrigger>
            <TabsTrigger value="approvals" data-value="approvals">Doctor Approvals</TabsTrigger>
            <TabsTrigger value="patient-data" data-value="patient-data">Patient Data</TabsTrigger>
            <TabsTrigger value="questions" data-value="questions">Question Management</TabsTrigger>
            <TabsTrigger value="ai-assistant" data-value="ai-assistant">AI Assistant</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="pt-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> User Management
                  </CardTitle>
                  <CardDescription>
                    Manage user accounts, permissions and roles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full hover-lift" onClick={() => handleTabClick("users")}>
                    Manage Users
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" /> Doctor Approvals
                  </CardTitle>
                  <CardDescription>
                    Review and approve doctor account requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full hover-lift" onClick={() => handleTabClick("approvals")}>
                    Manage Doctor Approvals
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" /> Patient Data
                  </CardTitle>
                  <CardDescription>
                    View and filter patient data by location and doctor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full hover-lift" onClick={() => handleTabClick("patient-data")}>
                    View Patient Data
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileQuestion className="h-5 w-5" /> Question Management
                  </CardTitle>
                  <CardDescription>
                    Manage and customize assessment questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full hover-lift" onClick={() => handleTabClick("questions")}>
                    Manage Questions
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" /> AI Assistant
                  </CardTitle>
                  <CardDescription>
                    Generate insights from patient data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full hover-lift" onClick={() => handleTabClick("ai-assistant")}>
                    Open AI Assistant
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="pt-4">
            <EnhancedUserManagement />
          </TabsContent>
          
          <TabsContent value="approvals" className="pt-4">
            <DoctorApprovals />
          </TabsContent>
          
          <TabsContent value="patient-data" className="pt-4">
            <PatientDataManagement />
          </TabsContent>
          
          <TabsContent value="questions" className="pt-4">
            <EnhancedQuestionManager />
          </TabsContent>

          <TabsContent value="ai-assistant" className="pt-4">
            <AIAssistant />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
