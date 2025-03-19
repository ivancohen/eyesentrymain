
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clipboard, PlusCircle, Edit, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { getUserQuestionnaires } from "@/services/PatientQuestionnaireService";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Questionnaire {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string;
  risk_level: string;
  total_score: number;
}

const Questionnaires = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestionnaires = async () => {
      if (!user) return;
      
      try {
        setError(null);
        const data = await getUserQuestionnaires();
        setQuestionnaires(data);
      } catch (error: any) {
        console.error("Error fetching questionnaires:", error);
        setError("Failed to load questionnaires. Please try again later.");
        toast.error("Failed to load questionnaires");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchQuestionnaires();
    }
  }, [user]);

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

  // If no user is logged in, redirect to login
  if (!user) {
    navigate("/login");
    return null;
  }

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high': return "bg-red-500 hover:bg-red-600";
      case 'moderate': 
      case 'medium': return "bg-yellow-500 hover:bg-yellow-600";
      case 'low': return "bg-green-500 hover:bg-green-600";
      default: return "bg-blue-500 hover:bg-blue-600";
    }
  };

  const handleEditQuestionnaire = (id: string) => {
    navigate(`/questionnaire/edit/${id}`);
  };

  const handleTryAgain = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getUserQuestionnaires();
      setQuestionnaires(data);
      toast.success("Questionnaires loaded successfully");
    } catch (error) {
      console.error("Error retrying questionnaires fetch:", error);
      setError("Failed to load questionnaires. Please try again later.");
      toast.error("Failed to load questionnaires");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container px-4 py-4 mb-8 animate-fade-in">
        <PageHeader
          title="Patient Questionnaires"
          icon={<Clipboard size={20} />}
          description="View and manage patient questionnaire submissions."
        />

        <div className="flex justify-end mb-6">
          <Button 
            onClick={() => navigate("/questionnaire")}
            className="flex items-center gap-2"
          >
            <PlusCircle size={16} />
            New Questionnaire
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleTryAgain}
                className="ml-4"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
            <span className="ml-3">Loading questionnaires...</span>
          </div>
        ) : questionnaires.length === 0 && !error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No questionnaires submitted yet.</p>
              <Button 
                onClick={() => navigate("/questionnaire")}
                className="flex items-center gap-2"
              >
                <PlusCircle size={16} />
                Create Your First Questionnaire
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {questionnaires.map((questionnaire) => (
              <Card key={questionnaire.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-lg">
                        {questionnaire.first_name} {questionnaire.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(questionnaire.created_at), "PPP")}
                      </p>
                    </div>
                    <Badge className={getRiskBadgeColor(questionnaire.risk_level)}>
                      {questionnaire.risk_level} Risk
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <p>Score: {questionnaire.total_score}</p>
                  </div>
                </CardContent>
                <CardFooter className="px-6 py-3 bg-slate-50 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1.5"
                    onClick={() => handleEditQuestionnaire(questionnaire.id)}
                  >
                    <Edit size={14} />
                    Edit
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Questionnaires;
