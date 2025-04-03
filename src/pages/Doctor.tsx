import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
// Lazy load heavy components
const ChatWidget = lazy(() => import("@/components/chat/ChatWidget"));
// Lazy load heavy components
const ChatbotFAQ = lazy(() => import("@/components/chat/ChatbotFAQ"));
import { QuestionnaireService } from "@/services/QuestionnaireService";
import { riskAssessmentService } from "@/services/RiskAssessmentService";
// Import the admin service and the correct interface
import { ClinicalResourceService, ClinicalResource as FetchedClinicalResource } from "@/services"; // Import from barrel file
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
  Eye,
  MessageCircle,
  X,
  BookOpenCheck, // Example if needed
  MessagesSquare // Icon for Forum card
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

// Remove the local interface, we'll use the imported FetchedClinicalResource
// interface ClinicalResource {
//   title: string;
//   description: string;
//   icon: React.ReactNode;
//   link: string;
//   category: 'diagnostics' | 'equipment' | 'community';
// }

// Helper function to map icon names to Lucide components
const getIconComponent = (iconName?: string): React.ReactNode => {
  const iconProps = { className: "h-5 w-5" }; // Consistent styling
  switch (iconName?.toLowerCase()) {
    case 'microscope': return <Microscope {...iconProps} />;
    case 'eye': return <Eye {...iconProps} />;
    case 'building2': return <Building2 {...iconProps} />;
    case 'graduationcap': return <GraduationCap {...iconProps} />;
    case 'bookopen': return <BookOpen {...iconProps} />;
    // Add more cases as needed for other icons used in the database
    default: return <BookOpen {...iconProps} />; // Default icon
  }
};

const Doctor = () => {
  const { user, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardCards, setDashboardCards] = useState<DashboardCard[]>([]);
  const [statistics, setStatistics] = useState<StatisticCard[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [clinicalResources, setClinicalResources] = useState<FetchedClinicalResource[]>([]); // Use imported interface
  const [isLoading, setIsLoading] = useState(true);
  const [showChatIntro, setShowChatIntro] = useState(false);
  
  // Add state variables for lazy loading sections
  const [loadChatWidget, setLoadChatWidget] = useState(false);
  const [loadChatbotFAQ, setLoadChatbotFAQ] = useState(false);
  const [loadClinicalResources, setLoadClinicalResources] = useState(false);
  
  // Check localStorage for chat intro preference when component mounts
  useEffect(() => {
    const hasSeenChatIntro = localStorage.getItem('hasSeenChatIntro') === 'true';
    setShowChatIntro(!hasSeenChatIntro);
  }, []);
  
  // Function to dismiss chat intro and save preference
  const dismissChatIntro = () => {
    setShowChatIntro(false);
    localStorage.setItem('hasSeenChatIntro', 'true');
  };
  // Use useRef for the date to avoid re-renders
  const currentDateRef = useRef(new Date());
  const currentDate = currentDateRef.current;
  
  // Function to convert questionnaire to answers format
  const mapQuestionnaireToAnswers = (questionnaire: any): Record<string, string> => {
    return {
      'ab1c10d1-3183-4b27-baac-936c881bda83': questionnaire.family_glaucoma ? 'yes' : 'no',
      '879cd028-1b29-4529-9cdb-7adcaf44d553': questionnaire.ocular_steroid ? 'yes' : 'no',
      '631db108-0f4c-46ff-941e-c37f6856060c': questionnaire.intravitreal_steroids ? 'yes' : 'no',
      'a43ecfbc-413f-4925-8908-f9fc0d35ea0f': questionnaire.systemic_steroid ? 'yes' : 'no',
      '2aaed7f2-3777-461d-b45f-932a16c21cb6': questionnaire.iop_baseline_elevated ? 'yes' : 'no',
      'e07b2e94-5bc4-4bb0-b561-0bad4403d9cd': questionnaire.vertical_disc_asymmetry ? 'yes' : 'no',
      '3ca68854-3213-4254-a1e2-083ddfb758fb': questionnaire.vertical_cd_ratio_elevated ? 'yes' : 'no',
      '52761412-7613-46c7-83dc-d85d6a16124e': questionnaire.age.toString(),
      'ab438232-5f80-4862-894a-d9bdb7276fa4': questionnaire.race
    };
  };

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

    // Load essential dashboard data first
    setIsLoading(true);
    
    const loadEssentialData = async () => {
      try {
        if (!user?.id) {
          setIsLoading(false);
          return;
        }
        
        // Only fetch basic questionnaire data initially (count and basic info)
        const questionnaires = await QuestionnaireService.fetchQuestionnaires(user.id);
        const totalPatients = questionnaires.length;
        
        // Create dashboard cards with basic data
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
            count: totalPatients,
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
          // Removed Forum Card from here, will be added separately in JSX
        ];

        setDashboardCards(cards);
        
        // Set initial statistics with basic data
        const initialStats: StatisticCard[] = [
          {
            title: "Total Patients",
            value: totalPatients,
            icon: <Users className="h-5 w-5" />,
            change: "Based on real data",
            trend: "neutral",
            color: "text-blue-500"
          },
          {
            title: "Questionnaires",
            value: totalPatients,
            icon: <FileText className="h-5 w-5" />,
            change: "Based on real data",
            trend: "neutral",
            color: "text-indigo-500"
          },
          {
            title: "High Risk Patients",
            value: "Loading...",
            icon: <Activity className="h-5 w-5" />,
            change: "Calculating...",
            trend: "neutral",
            color: "text-red-500"
          },
          {
            title: "Avg. Risk Score",
            value: "Loading...",
            icon: <BarChart3 className="h-5 w-5" />,
            change: "Calculating...",
            trend: "neutral",
            color: "text-amber-500"
          }
        ];
        
        setStatistics(initialStats);
        
        // Set initial activities with loading state
        const initialActivities: RecentActivity[] = [];
        if (questionnaires.length > 0) {
          // Take up to 5 recent questionnaires but don't calculate risk yet
          const recentQuestionnaires = questionnaires.slice(0, 5);
          for (let i = 0; i < recentQuestionnaires.length; i++) {
            const q = recentQuestionnaires[i];
            initialActivities.push({
              id: q.id || `act-${i}`,
              patientName: `${q.patient_first_name} ${q.patient_last_name}`,
              action: "Completed questionnaire",
              date: q.created_at ? new Date(q.created_at) : new Date(currentDate.getTime() - 1000 * 60 * (30 * (i + 1))),
              status: 'pending'
            });
          }
        }
        
        setRecentActivities(initialActivities);
        
        // Fetch clinical resources from the service
        const fetchedResources = await ClinicalResourceService.fetchClinicalResources();
        // Filter only active resources for display on the dashboard
        const activeResources = fetchedResources.filter(res => res.is_active);
        setClinicalResources(activeResources);

        setIsLoading(false); // Set loading false after essential data (including resources) is fetched
        
        // After essential data is loaded, calculate risk scores in the background
        setTimeout(() => {
          calculateRiskScores(questionnaires);
        }, 100);
        
      } catch (error) {
        console.error("Error loading essential dashboard data:", error);
        setIsLoading(false);
      }
    };
    
    // Function to calculate risk scores in the background
    const calculateRiskScores = async (questionnaires: any[]) => {
      try {
        if (questionnaires.length === 0) return;
        
        // Prepare all questionnaires for batch processing
        const questionnaireAnswers = questionnaires.map(q => ({
          id: q.id,
          answers: mapQuestionnaireToAnswers(q),
          firstName: q.patient_first_name,
          lastName: q.patient_last_name,
          createdAt: q.created_at
        }));
        
        // Calculate risk scores for all questionnaires (up to 10 at a time to avoid overloading)
        const batchSize = 10;
        const results: Record<string, any> = {};
        
        for (let i = 0; i < questionnaireAnswers.length; i += batchSize) {
          const batch = questionnaireAnswers.slice(i, i + batchSize);
          
          // Process batch in parallel
          const batchResults = await Promise.all(
            batch.map(async (item) => {
              const riskResult = await riskAssessmentService.calculateRiskScore(item.answers);
              return {
                id: item.id,
                result: riskResult,
                firstName: item.firstName,
                lastName: item.lastName,
                createdAt: item.createdAt
              };
            })
          );
          
          // Store results
          batchResults.forEach(item => {
            results[item.id] = item;
          });
        }
        
        // Calculate statistics
        let highRiskCount = 0;
        let totalScore = 0;
        
        Object.values(results).forEach((item: any) => {
          totalScore += item.result.total_score;
          if (item.result.risk_level === 'High') {
            highRiskCount++;
          }
        });
        
        // Calculate average risk score
        const avgRiskScore = questionnaires.length > 0 ? (totalScore / questionnaires.length).toFixed(1) : "0.0";
        
        // Update statistics with calculated data
        setStatistics(prev => {
          const updated = [...prev];
          // Update High Risk Patients
          updated[2] = {
            ...updated[2],
            value: highRiskCount,
            change: "Based on calculated data"
          };
          // Update Avg. Risk Score
          updated[3] = {
            ...updated[3],
            value: avgRiskScore,
            change: "Based on calculated data"
          };
          return updated;
        });
        
        // Update recent activities with risk levels
        setRecentActivities(prev => {
          return prev.map(activity => {
            const resultData = results[activity.id];
            if (resultData) {
              return {
                ...activity,
                status: resultData.result.risk_level.toLowerCase() === 'high' ? 'high-risk' :
                        resultData.result.risk_level.toLowerCase() === 'moderate' ? 'medium-risk' : 'low-risk'
              };
            }
            return activity;
          });
        });
        
      } catch (error) {
        console.error("Error calculating risk scores:", error);
      }
    };
    
    // Load essential data first
    loadEssentialData();
    
    // After 2 seconds, enable loading of ChatWidget
    const chatWidgetTimer = setTimeout(() => {
      setLoadChatWidget(true);
    }, 2000);
    
    // After 3 seconds, enable loading of clinical resources
    const resourcesTimer = setTimeout(() => {
      setLoadClinicalResources(true);
    }, 3000);
    
    // After 4 seconds, enable loading of ChatbotFAQ
    const faqTimer = setTimeout(() => {
      setLoadChatbotFAQ(true);
    }, 4000);
    
    // Clean up timers
    return () => {
      clearTimeout(chatWidgetTimer);
      clearTimeout(resourcesTimer);
      clearTimeout(faqTimer);
    };
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
    <div className="min-h-screen flex flex-col questionnaire-bg relative">
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
                return (
                <Card
                  key={index}
                  className="glass-panel hover:shadow-lg transition-shadow" // Removed conditional border
                >
                  <CardHeader className="pb-2"> {/* Removed conditional background */}
                    <CardTitle className="flex items-center gap-2 text-lg"> {/* Removed conditional text color */}
                      {card.icon} {card.title}
                      {/* Removed Important Badge */}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <CardDescription>
                      {card.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full hover-lift" // Removed conditional background
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

          {/* Knowledge Base (Moved Here) */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 questionnaire-text">
              <MessageCircle className="h-5 w-5" />
              Knowledge Base
            </h2>
            {loadChatbotFAQ ? (
              <Suspense fallback={<div className="p-4 text-center">Loading knowledge base...</div>}>
                <ChatbotFAQ />
              </Suspense>
            ) : (
              <div className="p-4 border rounded-md text-center">
                <p className="text-muted-foreground">Knowledge base will load shortly...</p>
              </div>
            )}
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
                              <div className={`p-2 rounded-full bg-opacity-10 ${
                                  resource.category === 'diagnostics' ? 'bg-blue-100 text-blue-500' :
                                  resource.category === 'equipment' ? 'bg-indigo-100 text-indigo-500' :
                                  'bg-green-100 text-green-500'
                                }`}>
                                {getIconComponent(resource.icon_name)} {/* Use helper function */}
                              </div>
                              <div>
                                <h3 className="font-medium">{resource.title}</h3>
                                <p className="text-sm text-gray-500">{resource.description || 'No description.'}</p>
                                {resource.link ? (
                                    <a
                                      href={resource.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-500 hover:underline mt-1 inline-block"
                                    >
                                      Learn more →
                                    </a>
                                ) : (
                                    <span className="text-sm text-gray-400 italic mt-1 inline-block">No link</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
            
            {/* Doctor Forum Card - Moved here */}
            <div className="mt-6"> {/* Add margin top for spacing */}
               {/* Removed redundant title h2 */}
               <Card className="glass-panel hover:shadow-lg transition-shadow flex flex-col">
                 <CardHeader>
                   <div className="flex items-start gap-3">
                     <div className="mt-1"><MessagesSquare className="h-5 w-5 text-purple-500" /></div>
                     <div>
                       <CardTitle className="text-lg">Doctor Forum</CardTitle>
                       <CardDescription>Discuss cases and share insights with colleagues</CardDescription>
                     </div>
                   </div>
                 </CardHeader>
                 <CardFooter className="mt-auto pt-4">
                   <Button
                     className="w-full hover-lift"
                     onClick={() => navigate("/forum")}
                   >
                     Go to Forum
                   </Button>
                 </CardFooter>
               </Card>
            </div>
            
          </div>
        </div>
        
        {/* Forum card JSX removed from here */}
      </main>
      
      {/* Chat Introduction Notification */}
      {showChatIntro && (
        <div className="fixed top-20 right-4 bg-white rounded-lg shadow-xl p-4 max-w-md z-50 border border-blue-200 animate-fade-in">
          <div className="flex items-start">
            <div className="bg-blue-100 rounded-full p-2 mr-3">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">New: AI Assistant Available!</h3>
              <p className="text-sm text-gray-600 mb-3">
                Have questions about the questionnaire, measurements, or interpreting results?
                Our AI assistant is here to help! Look for the chat button in the bottom right corner.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={dismissChatIntro}
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600"
                  onClick={() => {
                    dismissChatIntro();
                    // This would ideally trigger the chat to open, but we'll need to refactor the ChatWidget component to accept a prop for this
                  }}
                >
                  Try it now
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={dismissChatIntro}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {/* Lazy load ChatWidget */}
      {loadChatWidget && (
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      )}
    </div>
  );
};

export default Doctor;
