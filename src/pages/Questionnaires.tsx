import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clipboard, PlusCircle, Edit, AlertCircle, FileText, Info, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { getUserQuestionnaires, getQuestionnaireById } from "@/services/PatientQuestionnaireService";
import { SpecialistService } from "@/services/SpecialistService";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QuestionnaireResults from "@/components/questionnaires/QuestionnaireResults";
import { supabase } from "@/lib/supabase";
import { riskAssessmentService } from '@/services/RiskAssessmentService';
import { SpecialistTab } from "@/components/patient/SpecialistTab";

interface ContributingFactor {
  question: string;
  answer: string;
  score: number;
}

interface QuestionnaireResult {
  score: number;
  riskLevel: string;
  contributing_factors: ContributingFactor[];
  advice: string;
}

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
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<QuestionnaireResult | null>(null);
  const [isViewingRisk, setIsViewingRisk] = useState(false);
  const [selectedQuestionnaireForSpecialist, setSelectedQuestionnaireForSpecialist] = useState<string | null>(null);
  const [isViewingSpecialist, setIsViewingSpecialist] = useState(false);

  useEffect(() => {
    const fetchQuestionnaires = async () => {
      if (!user) return;
      
      try {
        setError(null);
        const data = await getUserQuestionnaires();
        setQuestionnaires(data);
      } catch (error: unknown) {
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

  const handleViewRiskAssessment = async (id: string) => {
    try {
      setSelectedQuestionnaire(id);
      setIsViewingRisk(true);
      const data = await getQuestionnaireById(id);
      
      // Get advice using the service
      const adviceList = await riskAssessmentService.getAdvice();
      const advice = adviceList.find(a => a.risk_level === data.risk_level)?.advice || 
        "No specific recommendations available at this time.";
      
      // Transform the data into the format expected by QuestionnaireResults
      setRiskAssessment({
        score: data.total_score,
        riskLevel: data.risk_level,
        contributing_factors: [
          { question: "Race", answer: data.race, score: data.race === "black" || data.race === "hispanic" ? 2 : 0 },
          { question: "Family History of Glaucoma", answer: data.family_glaucoma ? "Yes" : "No", score: data.family_glaucoma ? 2 : 0 },
          { question: "Ocular Steroid Use", answer: data.ocular_steroid ? "Yes" : "No", score: data.ocular_steroid ? 2 : 0 },
          { question: "Intravitreal Steroid Use", answer: data.intravitreal ? "Yes" : "No", score: data.intravitreal ? 2 : 0 },
          { question: "Systemic Steroid Use", answer: data.systemic_steroid ? "Yes" : "No", score: data.systemic_steroid ? 2 : 0 },
          { question: "IOP Baseline", answer: data.iop_baseline ? "22 and above" : "21 and under", score: data.iop_baseline ? 2 : 0 },
          { question: "Vertical Asymmetry", answer: data.vertical_asymmetry ? "0.2 and above" : "under 0.2", score: data.vertical_asymmetry ? 2 : 0 },
          { question: "Vertical Ratio", answer: data.vertical_ratio ? "0.6 and above" : "below 0.6", score: data.vertical_ratio ? 2 : 0 }
        ].filter(factor => factor.score > 0),
        advice: advice
      });
    } catch (error: unknown) {
      console.error("Error loading risk assessment:", error);
      toast.error("Failed to load risk assessment");
    }
  };

  const handleViewSpecialist = (id: string) => {
    setSelectedQuestionnaireForSpecialist(id);
    setIsViewingSpecialist(true);
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
                <CardFooter className="px-6 py-3 bg-slate-50 border-t flex justify-between">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1.5"
                      onClick={() => handleEditQuestionnaire(questionnaire.id)}
                    >
                      <Edit size={14} />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5"
                      onClick={() => handleViewRiskAssessment(questionnaire.id)}
                    >
                      <Info size={14} />
                      Risk Assessment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5"
                      onClick={() => handleViewSpecialist(questionnaire.id)}
                    >
                      <UserCircle size={14} />
                      Specialist
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Risk Assessment Dialog */}
        <Dialog open={isViewingRisk} onOpenChange={setIsViewingRisk}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Risk Assessment Details</DialogTitle>
              <DialogDescription>
                Detailed analysis of patient risk factors and recommendations
              </DialogDescription>
            </DialogHeader>
            {riskAssessment && <QuestionnaireResults {...riskAssessment} />}
          </DialogContent>
        </Dialog>

        {/* Specialist Dialog */}
        <Dialog open={isViewingSpecialist} onOpenChange={setIsViewingSpecialist}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Specialist Responses</DialogTitle>
              <DialogDescription>
                View and manage specialist responses for this patient
              </DialogDescription>
            </DialogHeader>
            {selectedQuestionnaireForSpecialist && (
              <SpecialistTab patientId={selectedQuestionnaireForSpecialist} />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Questionnaires;
