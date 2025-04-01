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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  FileText,
  User,
  Home,
  LogOut,
  Stethoscope,
  BarChart3,
  Activity,
  Clock,
  Calendar,
  BookOpen,
  Microscope,
  Building2,
  GraduationCap,
  Eye
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Navbar from "@/components/Navbar";
import { format } from "date-fns";

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  action: string;
  route: string;
}

interface StatisticCard {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
}

interface RecentActivity {
  id: string;
  patientName: string;
  action: string;
  date: Date;
  status: 'completed' | 'pending' | 'high-risk' | 'low-risk' | 'medium-risk';
}

interface ClinicalResource {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  category: 'diagnostics' | 'equipment' | 'community';
}

const Doctor = () => {
  const { user, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardCards, setDashboardCards] = useState<DashboardCard[]>([]);
  const [statistics, setStatistics] = useState<StatisticCard[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [clinicalResources, setClinicalResources] = useState<ClinicalResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentDate = new Date();

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
    
    // Simulated statistics data
    const stats: StatisticCard[] = [
      {
        title: "Total Patients",
        value: 128,
        icon: <Users className="h-5 w-5" />,
        change: "+12% from last month",
        trend: "up",
        color: "text-blue-500"
      },
      {
        title: "Questionnaires",
        value: 87,
        icon: <FileText className="h-5 w-5" />,
        change: "+5% from last month",
        trend: "up",
        color: "text-indigo-500"
      },
      {
        title: "High Risk Patients",
        value: 24,
        icon: <Activity className="h-5 w-5" />,
        change: "-3% from last month",
        trend: "down",
        color: "text-red-500"
      },
      {
        title: "Avg. Risk Score",
        value: "42.8",
        icon: <BarChart3 className="h-5 w-5" />,
        change: "Stable",
        trend: "neutral",
        color: "text-amber-500"
      }
    ];
    
    // Simulated recent activities
    const activities: RecentActivity[] = [
      {
        id: "act-1",
        patientName: "John Smith",
        action: "Completed questionnaire",
        date: new Date(currentDate.getTime() - 1000 * 60 * 30), // 30 minutes ago
        status: "high-risk"
      },
      {
        id: "act-2",
        patientName: "Maria Garcia",
        action: "Completed questionnaire",
        date: new Date(currentDate.getTime() - 1000 * 60 * 120), // 2 hours ago
        status: "low-risk"
      },
      {
        id: "act-3",
        patientName: "Robert Johnson",
        action: "Started questionnaire",
        date: new Date(currentDate.getTime() - 1000 * 60 * 180), // 3 hours ago
        status: "pending"
      },
      {
        id: "act-4",
        patientName: "Sarah Williams",
        action: "Completed questionnaire",
        date: new Date(currentDate.getTime() - 1000 * 60 * 240), // 4 hours ago
        status: "medium-risk"
      },
      {
        id: "act-5",
        patientName: "David Brown",
        action: "Completed questionnaire",
        date: new Date(currentDate.getTime() - 1000 * 60 * 300), // 5 hours ago
        status: "low-risk"
      }
    ];
    
    // Simulated clinical resources
    const resources: ClinicalResource[] = [
      {
        title: "Glaucoma Diagnostic Guidelines",
        description: "Latest clinical guidelines for glaucoma diagnosis and treatment",
        icon: <Microscope className="h-5 w-5 text-blue-500" />,
        link: "https://www.aao.org/eye-health/diseases/glaucoma-diagnosis",
        category: "diagnostics"
      },
      {
        title: "Tonometry Equipment Guide",
        description: "Comprehensive guide to tonometry equipment and best practices",
        icon: <Eye className="h-5 w-5 text-indigo-500" />,
        link: "https://www.aao.org/eye-health/diseases/glaucoma-diagnosis",
        category: "equipment"
      },
      {
        title: "Local Ophthalmology Network",
        description: "Connect with local ophthalmologists and specialists",
        icon: <Building2 className="h-5 w-5 text-green-500" />,
        link: "https://www.aao.org/eye-health/diseases/glaucoma-diagnosis",
        category: "community"
      },
      {
        title: "Continuing Education Resources",
        description: "Latest courses and certifications in glaucoma management",
        icon: <GraduationCap className="h-5 w-5 text-amber-500" />,
        link: "https://www.aao.org/eye-health/diseases/glaucoma-diagnosis",
        category: "community"
      }
    ];
    
    setStatistics(stats);
    setRecentActivities(activities);
    setClinicalResources(resources);
    setIsLoading(false);
  }, [user, isAdmin, loading, navigate, currentDate]);

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
        {/* Welcome Banner with Medical Illustration */}
        <Card className="mb-8 glass-panel hover:shadow-lg transition-shadow">
          <CardHeader className="text-center pb-0">
            <CardTitle className="text-3xl font-bold text-blue-700 animate-slide-up">
              Welcome, {user.name || "Doctor"}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-1 pt-2">
              <Badge variant="outline" className="px-4 py-1 text-sm font-medium">
                Eye Care Specialists
              </Badge>
              <p className="text-gray-600 text-sm">123 Medical Plaza, Suite 456</p>
              <p className="text-gray-600 text-sm">New York, NY 10001</p>
              <div className="flex items-center gap-2 mt-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <p className="text-gray-600 text-sm font-medium">
                  {format(currentDate, "EEEE, MMMM do, yyyy")}
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-gray-700 text-center mb-2">
                This dashboard provides tools to manage patient risk assessments for glaucoma.
              </p>
              <p className="text-gray-700 text-center">
                Use the buttons below to add new patients or review existing questionnaires.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                className="hover-lift text-lg py-6 font-bold flex-1 bg-blue-600 hover:bg-blue-700"
                size="lg"
                onClick={() => navigate("/questionnaire")}
              >
                <Users className="mr-2 h-5 w-5" />
                Add New Patient
              </Button>
              <Button
                className="hover-lift text-lg py-6 font-bold flex-1 bg-indigo-600 hover:bg-indigo-700"
                size="lg"
                onClick={() => navigate("/questionnaires")}
              >
                <FileText className="mr-2 h-5 w-5" />
                View Questionnaires
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 questionnaire-text">
            <BarChart3 className="h-5 w-5" />
            Key Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statistics.map((stat, index) => (
              <Card key={index} className="glass-panel hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-full ${stat.color} bg-opacity-10`}>
                      {stat.icon}
                    </div>
                  </div>
                  {stat.change && (
                    <div className="mt-2">
                      <Badge variant={stat.trend === 'up' ? 'default' : stat.trend === 'down' ? 'destructive' : 'outline'}>
                        {stat.trend === 'up' && '↑'}
                        {stat.trend === 'down' && '↓'}
                        {stat.change}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 questionnaire-text">
              <Activity className="h-5 w-5" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {dashboardCards.map((card, index) => {
                // Determine if this is one of the two most important cards
                const isPrimary = card.title === "New Patient" || card.title === "Patient Questionnaires";
                
                return (
                <Card
                  key={index}
                  className={`glass-panel hover:shadow-lg transition-shadow ${isPrimary ? 'border-2 border-blue-500' : ''}`}
                >
                  <CardHeader className={`pb-2 ${isPrimary ? 'bg-blue-50' : ''}`}>
                    <CardTitle className={`flex items-center gap-2 text-lg ${isPrimary ? 'text-blue-700' : ''}`}>
                      {card.icon} {card.title}
                      {isPrimary && <Badge className="ml-2 bg-blue-600">Important</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <CardDescription>
                      {card.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className={`w-full hover-lift ${isPrimary ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      onClick={() => navigate(card.route)}
                    >
                      {card.action}
                    </Button>
                  </CardFooter>
                </Card>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 questionnaire-text">
              <Clock className="h-5 w-5" />
              Recent Activity
            </h2>
            <Card className="glass-panel hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100">
                      <div className={`p-2 rounded-full
                        ${activity.status === 'high-risk' ? 'bg-red-100 text-red-500' :
                          activity.status === 'medium-risk' ? 'bg-amber-100 text-amber-500' :
                          activity.status === 'low-risk' ? 'bg-green-100 text-green-500' :
                          'bg-blue-100 text-blue-500'}`}>
                        {activity.status === 'high-risk' ? <Activity className="h-4 w-4" /> :
                         activity.status === 'pending' ? <Clock className="h-4 w-4" /> :
                         <FileText className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.patientName}</p>
                        <p className="text-sm text-gray-500">{activity.action}</p>
                        <p className="text-xs text-gray-400">{format(activity.date, 'h:mm a')}</p>
                      </div>
                      <Badge variant={
                        activity.status === 'high-risk' ? 'destructive' :
                        activity.status === 'medium-risk' ? 'default' :
                        activity.status === 'low-risk' ? 'success' :
                        activity.status === 'pending' ? 'outline' : 'secondary'
                      }>
                        {activity.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Button variant="link" onClick={() => navigate("/questionnaires")}>
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Clinical Information */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 questionnaire-text">
              <BookOpen className="h-5 w-5" />
              Clinical Information
            </h2>
            <Card className="glass-panel hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Tabs defaultValue="diagnostics">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="diagnostics" className="flex-1">Diagnostics</TabsTrigger>
                    <TabsTrigger value="equipment" className="flex-1">Equipment</TabsTrigger>
                    <TabsTrigger value="community" className="flex-1">Community</TabsTrigger>
                  </TabsList>
                  
                  {['diagnostics', 'equipment', 'community'].map((category) => (
                    <TabsContent key={category} value={category} className="space-y-4">
                      {clinicalResources
                        .filter(resource => resource.category === category)
                        .map((resource, idx) => (
                          <div key={idx} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-full bg-opacity-10 bg-blue-100">
                                {resource.icon}
                              </div>
                              <div>
                                <h3 className="font-medium">{resource.title}</h3>
                                <p className="text-sm text-gray-500">{resource.description}</p>
                                <a
                                  href={resource.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-500 hover:underline mt-1 inline-block"
                                >
                                  Learn more →
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Doctor;
