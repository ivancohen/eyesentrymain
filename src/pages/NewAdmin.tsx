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
  BookOpen, // Added icon for Clinical Resources
  MessageSquare // Added icon for Forum
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
import ForumCategoryManager from "@/components/admin/ForumCategoryManager"; // Import Forum Category Manager
import { UserProfile } from "@/services"; // Import UserProfile from the barrel file

// Admin section types
type AdminSection = 'dashboard' | 'users' | 'approvals' | 'offices' | 'analytics' | 'questions' | 'ai' | 'risk-assessment' | 'specialist-questions' | 'faq' | 'chatbot-faq' | 'clinical-resources' | 'forum'; // Add 'forum'

const validAdminSections: AdminSection[] = ['dashboard', 'users', 'approvals', 'offices', 'analytics', 'questions', 'ai', 'risk-assessment', 'specialist-questions', 'faq', 'chatbot-faq', 'clinical-resources', 'forum']; // Add 'forum'
const NewAdmin = () => {
  const { user, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<UserProfile[]>([]); // Keep if needed for other parts, otherwise remove

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
    const handlePopState = (event: PopStateEvent) => {
      const section = event.state?.section || 'dashboard';
      setCurrentSection(section as AdminSection);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Function to change section with proper history management
  const changeSection = (section: AdminSection) => {
    if (section !== currentSection) {
      window.history.pushState({ section }, '', `/new-admin?section=${section}`);
      setCurrentSection(section);
    }
  };

  // Update section based on URL search params
  useEffect(() => {
    if (sectionParam && sectionParam !== currentSection && validAdminSections.includes(sectionParam)) {
      setCurrentSection(sectionParam);
    }
  }, [sectionParam, currentSection]); // Added currentSection dependency

  // Check auth status when component mounts or auth state changes
  useEffect(() => {
    if (!loading && !user) {
      toast.error("You must be logged in to access the admin panel");
      navigate("/login");
      return;
    }
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
    const BackToDashboardButton = () => (
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
    );

    switch (currentSection) {
      case 'faq':
        return (
          <>
            <BackToDashboardButton />
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
            <BackToDashboardButton />
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
            <BackToDashboardButton />
            <EnhancedUserManagement />
          </>
        );
      case 'approvals':
        return (
          <>
            <BackToDashboardButton />
            <DoctorApprovals />
          </>
        );
      case 'offices':
        return (
          <>
            <BackToDashboardButton />
            <DoctorOfficeManagement />
          </>
        );
      case 'analytics':
        return (
          <>
            <BackToDashboardButton />
            <PatientAnalyticsDashboard />
          </>
        );
      case 'questions':
        return (
          <>
            <BackToDashboardButton />
            <EnhancedQuestionManager />
          </>
        );
      case 'ai':
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
            <BackToDashboardButton />
            <RiskAssessmentAdmin />
          </>
        );
      case 'specialist-questions':
        return (
          <>
            <BackToDashboardButton />
            <SpecialistQuestionManager />
          </>
        );
      case 'forum': // Add case for forum management
        return (
          <>
            <BackToDashboardButton />
            <ForumCategoryManager />
          </>
        );
      default: // Dashboard View
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
              {/* User Management Card */}
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

              {/* Doctor Approvals Card */}
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

              {/* Doctor Management Card */}
              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Stethoscope className="h-5 w-5 text-amber-500" /> Doctor Management
                  </CardTitle>
                  <CardDescription className="text-center">
                    Manage doctor accounts, approval, and suspension status
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full hover-lift"
                    onClick={() => changeSection('offices')} // Keep 'offices' section key for now
                  >
                    Manage Doctors
                  </Button>
                </CardFooter>
              </Card>

              {/* Patient Analytics Card */}
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

              {/* Question Management Card */}
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

              {/* Risk Assessment Card */}
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

              {/* Specialist Questions Card */}
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

              {/* AI Assistant Card */}
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

              {/* Website FAQs Card */}
              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <FileQuestion className="h-5 w-5 text-cyan-500" /> Website FAQs
                  </CardTitle>
                  <CardDescription className="text-center">
                    Manage frequently asked questions for the public website
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

              {/* Chatbot FAQs Card */}
              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Bot className="h-5 w-5 text-teal-500" /> Chatbot Knowledge Base
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
                    Manage Chatbot FAQs
                  </Button>
                </CardFooter>
              </Card>

              {/* Clinical Resources Card */}
              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <BookOpen className="h-5 w-5 text-lime-500" /> Clinical Resources
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
                    Manage Resources
                  </Button>
                </CardFooter>
              </Card>

              {/* Forum Management Card */}
              <Card className="hover-lift transition-shadow duration-200 glass-panel">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-500" /> Forum Management
                  </CardTitle>
                  <CardDescription className="text-center">
                    Manage forum categories and moderate discussions
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                   <Button
                     className="w-full hover-lift"
                     onClick={() => changeSection('forum')}
                   >
                     Manage Forum
                   </Button>
                </CardFooter>
              </Card>

            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navbar showProfile={true} /> {/* Removed isAdmin prop */}
      <main className="flex-1 container px-6 py-8 mx-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default NewAdmin;
