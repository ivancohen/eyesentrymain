import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
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
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  User,
  Home,
  LogOut,
} from "lucide-react";

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  action: string;
  route: string;
}

const Doctor = () => {
  const { user, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardCards, setDashboardCards] = useState<DashboardCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only allow authenticated users who are not admins
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (!loading && isAdmin) {
      navigate("/new-admin");
      return;
    }

    // Load dashboard data
    setIsLoading(true);
    
    // Simulated dashboard data
    const cards: DashboardCard[] = [
      {
        title: "New Patient",
        description: "Register a new patient and complete questionnaire",
        icon: <Users className="h-5 w-5 text-purple-500" />,
        count: 0,
        action: "Add New Patient",
        route: "/questionnaire"
      },
      {
        title: "Patient Questionnaires",
        description: "View and manage patient questionnaire responses",
        icon: <FileText className="h-5 w-5 text-blue-500" />,
        count: 24,
        action: "View Questionnaires",
        route: "/questionnaires"
      },
      {
        title: "Profile",
        description: "Update your profile information and settings",
        icon: <User className="h-5 w-5 text-green-500" />,
        count: 0,
        action: "Edit Profile",
        route: "/user-profile"
      }
    ];
    
    setDashboardCards(cards);
    setIsLoading(false);
  }, [user, isAdmin, loading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
        <span className="ml-3">Loading dashboard...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center p-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold select-none">
                {user.name?.charAt(0) || user.email?.charAt(0) || "D"}
              </div>
              <div className="ml-2 overflow-hidden group-data-[collapsible=icon]:hidden">
                <div className="text-sm font-medium truncate">{user.name || user.email}</div>
                <div className="text-xs text-muted-foreground truncate">Doctor</div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="New Patient" onClick={() => navigate("/questionnaire")}>
                    <Users className="h-4 w-4" />
                    <span>New Patient</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive tooltip="Dashboard" onClick={() => navigate("/doctor")}>
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Questionnaires" onClick={() => navigate("/questionnaires")}>
                    <FileText className="h-4 w-4" />
                    <span>Questionnaires</span>
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
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2 animate-slide-up">Doctor Dashboard</h1>
              <p className="text-muted-foreground animate-slide-up animation-delay-100">
                Welcome back, {user.name || "Doctor"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {dashboardCards.map((card, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow glass-panel">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="p-2 rounded-lg bg-secondary/20">{card.icon}</div>
                      {card.count > 0 && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                          {card.count}
                        </span>
                      )}
                    </div>
                    <CardTitle className="mt-3">{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full hover-lift"
                      onClick={() => navigate(card.route)}
                    >
                      {card.action}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Doctor;
