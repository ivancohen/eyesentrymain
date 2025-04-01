import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  Stethoscope
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Navbar from "@/components/Navbar";

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
        icon: <Users className="h-5 w-5 text-blue-500" />,
        count: 0,
        action: "Add New Patient",
        route: "/questionnaire"
      },
      {
        title: "Patient Questionnaires",
        description: "View and manage patient questionnaire responses",
        icon: <FileText className="h-5 w-5 text-indigo-500" />,
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
      <div className="flex items-center justify-center min-h-screen questionnaire-bg">
        <LoadingSpinner />
        <span className="ml-3 questionnaire-text">Loading dashboard...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col questionnaire-bg">
      <Navbar showProfile={true} />
      <main className="flex-1 container px-6 py-6 mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2 animate-slide-up flex items-center justify-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Doctor Dashboard
          </h1>
          <p className="text-muted-foreground animate-slide-up animation-delay-100">
            Welcome back, {user.name || "Doctor"}. You have access to patient management and questionnaire functions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card, index) => (
            <Card key={index} className="glass-panel hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  {card.icon} {card.title}
                </CardTitle>
                <CardDescription className="text-center">
                  {card.description}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  className="w-full hover-lift"
                  onClick={() => navigate(card.route)}
                >
                  {card.action}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Doctor;
