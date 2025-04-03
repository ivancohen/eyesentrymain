import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
// Removed FixedAdminService import, specific services will be used where needed
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  Users,
  Database, 
  Shield, 
  FileQuestion, 
  UserCheck, 
  Bot, 
  ArrowLeft, 
  HelpCircle, 
  BarChart3, 
  Building,
  User,
  Home,
  Settings,
  LogOut,
  Stethoscope,
  BookOpen // Added icon for Clinical Resources
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import DoctorApprovals from "@/components/admin/DoctorApprovals";
import DoctorOfficeManagement from "@/components/admin/DoctorOfficeManagement";
import EnhancedUserManagement from "@/components/admin/EnhancedUserManagement";
import EnhancedQuestionManager from "@/components/admin/EnhancedQuestionManager";
import PatientAnalyticsDashboard from "@/components/admin/PatientAnalyticsDashboard";
import AdminNotifications from "@/components/admin/AdminNotifications";
import RiskAssessmentAdmin from "@/components/admin/RiskAssessmentAdmin";
import { SpecialistQuestionManager } from "@/components/admin/SpecialistQuestionManager";
import { UserProfile } from "@/services"; // Import UserProfile from the barrel file

// Admin section types
type AdminSection = 'dashboard' | 'users' | 'approvals' | 'offices' | 'analytics' | 'questions' | 'ai' | 'risk-assessment' | 'specialist-questions' | 'faq' | 'chatbot-faq' | 'clinical-resources';

const validAdminSections: AdminSection[] = ['dashboard', 'users', 'approvals', 'offices', 'analytics', 'questions', 'ai', 'risk-assessment', 'specialist-questions', 'faq', 'chatbot-faq', 'clinical-resources'];
const NewAdmin = () => {
  const { user, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  // Get section from URL params, or default to dashboard
  const sectionParam = searchParams.get('section') as AdminSection | null;
  
  // State to track which admin section is currently being displayed
  const [currentSection, setCurrentSection] = useState<AdminSection>(
    sectionParam && validAdminSections.includes(sectionParam)
      ? sectionParam
      : 'dashboard'
  );
  
  // Handle browser navigation (back/forward buttons)
  useEffect(() => {
    // Function to handle popstate (when user clicks back/forward)
    const handlePopState = (event: PopStateEvent) => {
      // Get the section from history state
      const section = event.state?.section || 'dashboard';
      // Update our section state
      setCurrentSection(section as AdminSection);
    };

    // Add popstate event listener
    window.addEventListener('popstate', handlePopState);

    // Clean up when component unmounts
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Function to change section with proper history management
  const changeSection = (section: AdminSection) => {
    // Only push new state if we're changing to a different section
    if (section !== currentSection) {
      // Push the new state to history
      window.history.pushState({ section }, '', `/new-admin?section=${section}`);
      // Update our state
      setCurrentSection(section);
    }
  };

  // Update section based on URL search params
  useEffect(() => {
    if (sectionParam && sectionParam !== currentSection && validAdminSections.includes(sectionParam)) {
        // Note: 'clinical-resources' won't be handled here as it navigates away
      setCurrentSection(sectionParam);
    }
  }, [sectionParam]);

  // Check auth status when component mounts or auth state changes
  useEffect(() => {
    // Auth check is complete and user is not logged in
    if (!loading && !user) {
      toast.error("You must be logged in to access the admin panel");
      navigate("/login");
      return;
    }

    // Auth check is complete and user is not admin
    if (!loading && !isAdmin) {
      toast.error("You don't have admin privileges");
      navigate("/dashboard");
      return;
    }
  }, [user, isAdmin, loading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
        <span className="ml-3">Loading dashboard...</span>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  // Render the appropriate content based on current section
  const renderContent = () => {
    switch (currentSection) {
      case 'faq':
        return (
          <>
            <div className="mb-6 flex items-center justify-center">
              <Button
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-50"
                onClick={() => changeSection('dashboard')}
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold">FAQ Management</h2>
              <p className="text-muted-foreground">
                Manage frequently asked questions for the doctor chatbot
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                className="hover-lift"
                onClick={() => navigate('/admin/faq')}
              >
                Open FAQ Management
              </Button>
            </div>
          </>
        );
      case 'chatbot-faq':
        return (
          <>
            <div className="mb-6 flex items-center justify-center">
              <Button
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-50"
                onClick={() => changeSection('dashboard')}
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold">Chatbot Knowledge Base</h2>
              <p className="text-muted-foreground">
                Manage the knowledge base for the doctor chatbot assistant
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                className="hover-lift"
                onClick={() => navigate('/admin/chatbot-faq')}
              >
                Open Knowledge Base Management
              </Button>
            </div>
          </>
        );
      case 'users':
        return (
          <>
            <div className="mb-6 flex items-center justify-center">
              <Button
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-50"
                onClick={() => changeSection('dashboard')}
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <EnhancedUserManagement />
          </>
        );
      case 'approvals':
        return (
          <>
            <div className="mb-6 flex items-center justify-center">
              <Button
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-50"
                onClick={() => changeSection('dashboard')}
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <DoctorApprovals />
          </>
        );
      case 'offices':
        return (
          <>
            <div className="mb-6 flex items-center justify-center">
              <Button
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-50"
                onClick={() => changeSection('dashboard')}
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <DoctorOfficeManagement />
          </>
        );
      case 'analytics':
        return (
          <>
            <div className="mb-6 flex items-center justify-center">
              <Button
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-50"
                onClick={() => changeSection('dashboard')}
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <PatientAnalyticsDashboard />
          </>
        );
      case 'questions':
        return (
          <>
            <div className="mb-6 flex items-center justify-center">
              <Button
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-50"
                onClick={() => changeSection('dashboard')}
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <EnhancedQuestionManager />
          </>
        );
      case 'ai':
        // Instead of rendering content here, redirect immediately
        navigate('/ai-assistant');
        return (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner />
            <span className="ml-3">Redirecting to AI Assistant...</span>
          </div>
        );
      case 'risk-assessment':
        return (
          <>
            <div className="mb-6 flex items-center justify-center">
              <Button
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-50"
                onClick={() => changeSection('dashboard')}
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <RiskAssessmentAdmin />
          </>
        );
      case 'specialist-questions':
        return (
          <>
            <div className="mb-6 flex items-center justify-center">
              <Button
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-50"
                onClick={() => changeSection('dashboard')}
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <SpecialistQuestionManager />
          </>
        );
      default:
        return (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold mb-2 animate-slide-up flex items-center justify-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Control Panel
              </h1>
              <p className="text-muted-foreground animate-slide-up animation-delay-100">
                Welcome Administrator. You have access to system settings and administrative functions.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" /> User Management
                  </CardTitle>
                  <CardDescription className="text-center">
                    Manage user accounts, permissions and roles
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full hover-lift"
                    onClick={() => changeSection('users')}
                  >
                    Manage Users
                  </Button>
                </CardFooter>
              </Card>

              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <UserCheck className="h-5 w-5 text-green-500" /> Doctor Approvals
                  </CardTitle>
                  <CardDescription className="text-center">
                    Review and approve doctor account requests
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full hover-lift"
                    onClick={() => changeSection('approvals')}
                  >
                    Manage Doctor Approvals
                  </Button>
                </CardFooter>
              </Card>

              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Stethoscope className="h-5 w-5 text-amber-500" /> Doctor Management {/* Changed Icon & Title */}
                  </CardTitle>
                  <CardDescription className="text-center">
                    Manage doctor accounts, approval, and suspension status {/* Changed Description */}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full hover-lift"
                    onClick={() => changeSection('offices')} // Keep 'offices' section key for now
                  >
                    Manage Doctors {/* Changed Button Text */}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <BarChart3 className="h-5 w-5 text-violet-500" /> Patient Analytics
                  </CardTitle>
                  <CardDescription className="text-center">
                    Analyze patient data and generate reports
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full hover-lift"
                    onClick={() => changeSection('analytics')}
                  >
                    View Analytics
                  </Button>
                </CardFooter>
              </Card>

              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <HelpCircle className="h-5 w-5 text-indigo-500" /> Question Management
                  </CardTitle>
                  <CardDescription className="text-center">
                    Create, edit and manage questionnaire questions
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full hover-lift"
                    onClick={() => changeSection('questions')}
                  >
                    Manage Questions
                  </Button>
                </CardFooter>
              </Card>

              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <BarChart3 className="h-5 w-5 text-amber-500" /> Risk Assessment
                  </CardTitle>
                  <CardDescription className="text-center">
                    Configure risk scores and advice for questionnaire's
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full hover-lift"
                    onClick={() => changeSection('risk-assessment')}
                  >
                    Manage Risk Assessment
                  </Button>
                </CardFooter>
              </Card>

              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Stethoscope className="h-5 w-5 text-blue-500" /> Specialist Questions
                  </CardTitle>
                  <CardDescription className="text-center">
                    Create and manage questions for specialist assessments
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full hover-lift"
                    onClick={() => changeSection('specialist-questions')}
                  >
                    Manage Specialist Questions
                  </Button>
                </CardFooter>
              </Card>

              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Bot className="h-5 w-5 text-rose-500" /> AI Assistant
                  </CardTitle>
                  <CardDescription className="text-center">
                    Get insights and generate reports from questionnaire data
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full hover-lift"
                    onClick={() => navigate('/ai-assistant')}
                  >
                    Open AI Assistant
                  </Button>
                </CardFooter>
              </Card>
              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <FileQuestion className="h-5 w-5 text-cyan-500" /> Website FAQs
                  </CardTitle>
                  <CardDescription className="text-center">
                    Manage frequently asked questions for the website
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full hover-lift"
                    onClick={() => changeSection('faq')}
                  >
                    Manage Website FAQs
                  </Button>
                </CardFooter>
              </Card>

              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Bot className="h-5 w-5 text-emerald-500" /> Chatbot Knowledge Base
                  </CardTitle>
                  <CardDescription className="text-center">
                    Manage the knowledge base for the doctor chatbot assistant
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full hover-lift"
                    onClick={() => changeSection('chatbot-faq')}
                  >
                    Manage Knowledge Base
                  </Button>
                </CardFooter>
              </Card>

              {/* New Card for Clinical Resources */}
              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <BookOpen className="h-5 w-5 text-teal-500" /> Clinical Resources
                  </CardTitle>
                  <CardDescription className="text-center">
                    Manage clinical info for the doctor dashboard
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full hover-lift"
                    onClick={() => navigate('/admin/clinical-resources')} // Navigate directly
                  >
                    Manage Clinical Resources
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <Navbar showProfile={true} />
      <main className="flex-1 container px-6 py-6 mx-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default NewAdmin;
