
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { Database, Users, FileQuestion } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientDataService, QuestionScoreService, PatientData, QuestionScore } from "@/services"; // Import from barrel file
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DataManagement = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("patients");
  const [patientData, setPatientData] = useState<PatientData[]>([]);
  const [questionScores, setQuestionScores] = useState<QuestionScore[]>([]);
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [editingScore, setEditingScore] = useState<{
    questionId: string;
    optionId?: string;
    question: string;
    optionText?: string;
    score: number;
  } | null>(null);

  // Check authentication status on mount and when it changes
  useEffect(() => {
    console.log("DataManagement page: Authentication check", { 
      userExists: !!user, 
      isAdmin, 
      authLoading 
    });

    if (authLoading) {
      // Still loading authentication, wait
      return;
    }

    if (!user) {
      // Not logged in, redirect to login
      console.log("DataManagement page: Not logged in, redirecting to login");
      toast.error("Please log in to access this page");
      navigate("/login");
      return;
    }

    if (!isAdmin) {
      // Not admin, redirect to dashboard
      console.log("DataManagement page: User not admin, redirecting to dashboard");
      toast.error("You don't have permission to access the Data Management page");
      navigate("/dashboard");
      return;
    }

    // User is admin and authenticated, allowed access
    console.log("DataManagement page: User is admin, allowing access");
    loadData();
  }, [user, isAdmin, authLoading, navigate, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      if (activeTab === "patients") {
        const data = await PatientDataService.fetchAnonymousPatientData();
        setPatientData(data);
      } else if (activeTab === "scores") {
        const data = await QuestionScoreService.fetchQuestionScores();
        setQuestionScores(data);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error(`Error loading data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditScore = (id: string) => {
    const score = questionScores.find(q => 
      (q.option_id && q.option_id === id) || 
      (!q.option_id && q.id === id)
    );

    if (score) {
      setEditingScore({
        questionId: score.id,
        optionId: score.option_id,
        question: score.question,
        optionText: score.option_text,
        score: score.score
      });
      setIsScoreDialogOpen(true);
    }
  };

  const handleSaveScore = async () => {
    if (!editingScore) return;

    try {
      setIsLoading(true);
      const success = await QuestionScoreService.updateQuestionScore(
        editingScore.questionId, // Assuming this is the correct ID for the score record
        editingScore.optionId, 
        editingScore.score
      );

      if (success) {
        toast.success("Score updated successfully");
        setIsScoreDialogOpen(false);
        loadData();
      }
    } catch (error) {
      console.error("Error updating score:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format patient data for table
  const patientColumns = [
    { key: "id", label: "ID" },
    { key: "age", label: "Age" },
    { key: "race", label: "Race" },
    { key: "risk_level", label: "Risk Level" },
    { key: "total_score", label: "Total Score" },
    { key: "created_at", label: "Date Created" },
  ];

  // Format question scores for table
  const scoreColumns = [
    { key: "question", label: "Question" },
    { key: "question_type", label: "Type" },
    { key: "option_text", label: "Option" },
    { key: "score", label: "Score" },
  ];

  const formattedScores = questionScores.map(score => ({
    id: score.option_id || score.id,
    question: score.question,
    question_type: score.question_type,
    option_text: score.option_text || "N/A",
    score: score.score
  }));

  // Format patient data to display readable date
  const formattedPatients = patientData.map(patient => ({
    ...patient,
    created_at: new Date(patient.created_at).toLocaleString()
  }));

  // If still checking authentication
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

  // If authentication check is complete but no user, or user is not admin,
  // return null as the useEffect will handle the redirect
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container px-4 py-4 mb-8 animate-fade-in">
        <PageHeader
          title="Data Management"
          icon={<Database size={20} />}
          description="Manage patient data and question scores in the system."
        />

        <Tabs 
          defaultValue="patients" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="patients" className="flex items-center gap-2">
              <Users size={16} />
              <span>Patient Data</span>
            </TabsTrigger>
            <TabsTrigger value="scores" className="flex items-center gap-2">
              <FileQuestion size={16} />
              <span>Question Scores</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="patients" className="pt-4">
            <div className="mb-6 flex justify-end">
              <Button onClick={() => loadData()} className="hover-lift">
                Refresh Data
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center mt-8">
                <LoadingSpinner />
              </div>
            ) : (
              formattedPatients.length > 0 ? (
                <DataTable data={formattedPatients} columns={patientColumns} />
              ) : (
                <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-700">
                  <p className="font-medium">No patient data available</p>
                  <p className="text-sm">There are currently no patient records in the system.</p>
                </div>
              )
            )}
          </TabsContent>
          
          <TabsContent value="scores" className="pt-4">
            <div className="mb-6 flex justify-end">
              <Button onClick={() => loadData()} className="hover-lift">
                Refresh Data
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center mt-8">
                <LoadingSpinner />
              </div>
            ) : (
              formattedScores.length > 0 ? (
                <DataTable 
                  data={formattedScores} 
                  columns={scoreColumns} 
                  onEdit={handleEditScore}
                />
              ) : (
                <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-700">
                  <p className="font-medium">No question scores available</p>
                  <p className="text-sm">There are currently no questions with scoring in the system.</p>
                </div>
              )
            )}
          </TabsContent>
        </Tabs>

        {/* Score Edit Dialog */}
        <Dialog open={isScoreDialogOpen} onOpenChange={setIsScoreDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Score</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="mb-4">
                <Label className="text-muted-foreground">Question</Label>
                <p className="font-medium">{editingScore?.question}</p>
              </div>
              
              {editingScore?.optionText && (
                <div className="mb-4">
                  <Label className="text-muted-foreground">Option</Label>
                  <p className="font-medium">{editingScore.optionText}</p>
                </div>
              )}
              
              <div className="mb-4">
                <Label htmlFor="score">Score</Label>
                <Input
                  id="score"
                  type="number"
                  value={editingScore?.score || 0}
                  onChange={(e) => setEditingScore(prev => 
                    prev ? {...prev, score: parseInt(e.target.value) || 0} : null
                  )}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsScoreDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveScore} disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default DataManagement;
