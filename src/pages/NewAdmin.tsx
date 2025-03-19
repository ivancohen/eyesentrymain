import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FixedAdminService } from "@/services/FixedAdminService"; 
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
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
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
import { UserProfile } from "@/services/FixedAdminService";

// Admin section types
type AdminSection = 'dashboard' | 'users' | 'approvals' | 'offices' | 'analytics' | 'questions' | 'ai';

const NewAdmin = () => {
  const { user, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  // Get section from URL params, or default to dashboard
  const sectionParam = searchParams.get('section') as AdminSection | null;
  
  // State to track which admin section is currently being displayed
  const [currentSection, setCurrentSection] = useState<AdminSection>(
    sectionParam && ['dashboard', 'users', 'approvals', 'offices', 'analytics', 'questions', 'ai'].includes(sectionParam) 
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
    if (sectionParam && sectionParam !== currentSection && 
        ['dashboard', 'users', 'approvals', 'offices', 'analytics', 'questions', 'ai'].includes(sectionParam)) {
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
      case 'users':
        return (
          <>
            <div className="mb-6 flex items-center">
              <Button
                variant="outline"
                className="mr-4"
                onClick={() => changeSection('dashboard')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <h2 className="text-2xl font-bold">User Management</h2>
            </div>
            <EnhancedUserManagement />
          </>
        );
      case 'approvals':
        return (
          <>
            <div className="mb-6 flex items-center">
              <Button
                variant="outline"
                className="mr-4"
                onClick={() => changeSection('dashboard')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <h2 className="text-2xl font-bold">Doctor Approvals</h2>
            </div>
            <DoctorApprovals />
          </>
        );
      case 'offices':
        return (
          <>
            <div className="mb-6 flex items-center">
              <Button
                variant="outline"
                className="mr-4"
                onClick={() => changeSection('dashboard')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <h2 className="text-2xl font-bold">Doctor Office Management</h2>
            </div>
            <DoctorOfficeManagement />
          </>
        );
      case 'analytics':
        return (
          <>
            <div className="mb-6 flex items-center">
              <Button
                variant="outline"
                className="mr-4"
                onClick={() => changeSection('dashboard')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <h2 className="text-2xl font-bold">Patient Analytics</h2>
            </div>
            <PatientAnalyticsDashboard />
          </>
        );
      case 'questions':
        return (
          <>
            <div className="mb-6 flex items-center">
              <Button
                variant="outline"
                className="mr-4"
                onClick={() => changeSection('dashboard')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <h2 className="text-2xl font-bold">Question Management</h2>
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
      default:
        return (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2 animate-slide-up flex items-center gap-2">
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
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" /> User Management
                  </CardTitle>
                  <CardDescription>
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
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-green-500" /> Doctor Approvals
                  </CardTitle>
                  <CardDescription>
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
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-amber-500" /> Doctor Offices
                  </CardTitle>
                  <CardDescription>
                    Manage doctor office information and details
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full hover-lift"
                    onClick={() => changeSection('offices')}
                  >
                    Manage Doctor Offices
                  </Button>
                </CardFooter>
              </Card>

              <Card className="glass-panel hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-violet-500" /> Patient Analytics
                  </CardTitle>
                  <CardDescription>
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
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-indigo-500" /> Question Management
                  </CardTitle>
                  <CardDescription>
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
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-rose-500" /> AI Assistant
                  </CardTitle>
                  <CardDescription>
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
            </div>
          </>
        );
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold select-none">
                  {user.name?.charAt(0) || user.email?.charAt(0) || "A"}
                </div>
                <div className="ml-2 overflow-hidden group-data-[collapsible=icon]:hidden">
                  <div className="text-sm font-medium truncate">{user.name || user.email}</div>
                  <div className="text-xs text-muted-foreground truncate">Administrator</div>
                </div>
              </div>
              <AdminNotifications />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={currentSection === 'dashboard'} 
                    tooltip="Dashboard" 
                    onClick={() => changeSection('dashboard')}
                  >
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={currentSection === 'users'} 
                    tooltip="Users" 
                    onClick={() => changeSection('users')}
                  >
                    <Users className="h-4 w-4" />
                    <span>Users</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={currentSection === 'approvals'} 
                    tooltip="Doctor Approvals" 
                    onClick={() => changeSection('approvals')}
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Doctor Approvals</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={currentSection === 'offices'} 
                    tooltip="Doctor Offices" 
                    onClick={() => changeSection('offices')}
                  >
                    <Building className="h-4 w-4" />
                    <span>Doctor Offices</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Data</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={currentSection === 'analytics'} 
                    tooltip="Analytics" 
                    onClick={() => changeSection('analytics')}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={currentSection === 'questions'} 
                    tooltip="Questions" 
                    onClick={() => changeSection('questions')}
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Questions</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={currentSection === 'ai'} 
                    tooltip="AI Assistant" 
                    onClick={() => changeSection('ai')}
                  >
                    <Bot className="h-4 w-4" />
                    <span>AI Assistant</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Account</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Profile" onClick={() => navigate("/user-profile")}>
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Settings" onClick={() => navigate("/settings")}>
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Logout" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center justify-between p-4 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              <span>EyeSentry</span>
              <span>v1.0.0</span>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div className="p-6">
            {renderContent()}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default NewAdmin;
