import { useState, useEffect, useCallback } from "react"; // Added useCallback
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import PageHeader from "@/components/PageHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clipboard, PlusCircle, AlertCircle, FileText, Info, UserCircle } from "lucide-react"; // Removed Edit, Trash2
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { getUserQuestionnaires, getQuestionnaireById } from "@/services/PatientQuestionnaireService"; // Removed deleteQuestionnaireById
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
// Removed AlertDialog imports
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
  // Removed state for delete confirmation dialog

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
      <div className="min-h-screen flex flex-col questionnaire-bg">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-3 text-lg text-blue-700">Checking authentication status...</span>
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
    console.log("===== VIEWING RISK ASSESSMENT FOR ID:", id, "=====");
    try {
      setSelectedQuestionnaire(id);
      setIsViewingRisk(true);
      const data = await getQuestionnaireById(id);
      
      // Log questionnaire data to ensure we have what we need
      console.log("QUESTIONNAIRE DATA:", {
        id: data.id,
        total_score: data.total_score,
        risk_level: data.risk_level,
        risk_level_type: typeof data.risk_level,
        has_answers: !!data.answers
      });
      
      // Clear the risk assessment service cache before fetching to ensure fresh data
      // This forces a fresh fetch from the database using our new RPC function
      // @ts-ignore - Accessing the cached advice variable directly
      riskAssessmentService["cachedAdvice"] = null;
      
      // Get advice using the standard pattern used by other parts of the system
      // This ensures we get admin-entered recommendations from the database
      const adviceList = await riskAssessmentService.getAdvice();
      console.log("ADVICE LIST FROM RPC:", adviceList.map(a => ({
        id: a.id,
        level: a.risk_level,
        // level_normalized: a.risk_level_normalized, // Property doesn't exist
        range: `${a.min_score}-${a.max_score}`,
        preview: a.advice?.substring(0, 30) + '...'
      })));
      
      // Define standard risk levels for reference
      const standardRiskLevels = {
        LOW: 'Low',
        MODERATE: 'Moderate',
        HIGH: 'High'
      };
      
      // ENHANCED MATCHING STRATEGY:
      // 1. Prepare the patient's risk level with standard casing if possible
      let patientRiskLevel = data.risk_level || '';
      let patientRiskLevelLower = patientRiskLevel.toLowerCase();
      let standardizedPatientRiskLevel = patientRiskLevel;
      
      // Standardize patient risk level for consistent matching
      if (patientRiskLevelLower.includes('low')) {
        standardizedPatientRiskLevel = standardRiskLevels.LOW;
      } else if (patientRiskLevelLower.includes('mod') || patientRiskLevelLower.includes('med')) {
        standardizedPatientRiskLevel = standardRiskLevels.MODERATE;
      } else if (patientRiskLevelLower.includes('high')) {
        standardizedPatientRiskLevel = standardRiskLevels.HIGH;
      }
      
      console.log("PATIENT RISK LEVEL:", {
        original: patientRiskLevel,
        standardized: standardizedPatientRiskLevel
      });
      
      // MULTIPLE MATCHING STRATEGIES:
      console.log("APPLYING MATCHING STRATEGIES:");
      
      // Strategy 1: Direct match with standardized risk level (most accurate)
      console.log("STRATEGY 1: Exact match with standardized risk level");
      let matchedAdvice = adviceList.find(a => a.risk_level === standardizedPatientRiskLevel);
      console.log("STRATEGY 1 RESULT:", matchedAdvice ?
        `FOUND: ${matchedAdvice.risk_level}` :
        "No match"
      );
      
      // Strategy 2: Case-insensitive matching if needed
      if (!matchedAdvice && standardizedPatientRiskLevel) {
        console.log("STRATEGY 2: Case-insensitive match");
        matchedAdvice = adviceList.find(a =>
          a.risk_level.toLowerCase() === standardizedPatientRiskLevel.toLowerCase()
        );
        console.log("STRATEGY 2 RESULT:", matchedAdvice ?
          `FOUND: ${matchedAdvice.risk_level}` :
          "No match"
        );
      }
      
      // Strategy 3: Try exact match with original risk level
      if (!matchedAdvice && patientRiskLevel) {
        console.log("STRATEGY 3: Exact match with original risk level");
        matchedAdvice = adviceList.find(a => a.risk_level === patientRiskLevel);
        console.log("STRATEGY 3 RESULT:", matchedAdvice ?
          `FOUND: ${matchedAdvice.risk_level}` :
          "No match"
        );
      }
      
      // Strategy 4: Try score-based matching
      if (!matchedAdvice && typeof data.total_score === 'number') {
        console.log("STRATEGY 4: Score-based match");
        matchedAdvice = adviceList.find(a =>
          data.total_score >= a.min_score && data.total_score <= a.max_score
        );
        console.log("STRATEGY 4 RESULT:", matchedAdvice ?
          `FOUND: ${matchedAdvice.risk_level} (score ${data.total_score} in range ${matchedAdvice.min_score}-${matchedAdvice.max_score})` :
          "No match"
        );
      }
      
      // Strategy 5: Manual mapping based on score ranges as last resort
      if (!matchedAdvice && typeof data.total_score === 'number') {
        console.log("STRATEGY 5: Manual mapping based on score");
        const score = data.total_score;
        let manualRiskLevel = score <= 2 ? standardRiskLevels.LOW :
                             score <= 5 ? standardRiskLevels.MODERATE :
                             standardRiskLevels.HIGH;
                             
        console.log(`Manual mapping: Score ${score} maps to risk level ${manualRiskLevel}`);
        
        matchedAdvice = adviceList.find(a => a.risk_level === manualRiskLevel);
        console.log("STRATEGY 5 RESULT:", matchedAdvice ?
          `FOUND: ${matchedAdvice.risk_level}` :
          "No match"
        );
      }
      
      // Final result
      console.log("FINAL MATCHING RESULT:", matchedAdvice ?
        `SUCCESS: Found advice for ${matchedAdvice.risk_level}` :
        "FAILED: No matching advice found"
      );
      
      // Use matched advice or fallback to a clear message
      // Following the pattern used by other parts of the system
      const advice = matchedAdvice?.advice ||
        "Recommendations will be provided by your doctor based on this assessment.";
      
      // Debug logs to ensure we can see the advice - consistent with other parts
      console.log("RECOMMENDATION FROM DATABASE:", advice);
      
      console.log("ADVICE TO DISPLAY:", advice.substring(0, 100) + (advice.length > 100 ? '...' : ''));
      
      // Transform the data into the format expected by QuestionnaireResults
      setRiskAssessment({
        score: data.total_score,
        riskLevel: data.risk_level ||
          (data.total_score <= 2 ? 'Low' :
           data.total_score <= 5 ? 'Moderate' : 'High'),
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
  
  // Removed delete handlers
  
  
  return (
    <div className="min-h-screen flex flex-col questionnaire-bg">
      <Navbar />
      <main className="flex-1 container px-6 py-6 mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2 animate-slide-up flex items-center justify-center gap-2">
            <Clipboard size={20} />
            Patient Questionnaires
          </h1>
          <p className="text-muted-foreground animate-slide-up animation-delay-100">
            View and manage patient questionnaire submissions.
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <Button
            onClick={() => navigate("/questionnaire")}
            className="flex items-center gap-2 hover-lift"
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
            <span className="ml-3 questionnaire-text">Loading questionnaires...</span>
          </div>
        ) : questionnaires.length === 0 && !error ? (
          <Card className="glass-panel">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No questionnaires submitted yet.</p>
              <Button
                onClick={() => navigate("/questionnaire")}
                className="flex items-center gap-2 hover-lift"
              >
                <PlusCircle size={16} />
                Create Your First Questionnaire
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {questionnaires.map((questionnaire) => (
              <Card key={questionnaire.id} className="glass-panel hover:shadow-lg transition-shadow">
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
                <CardFooter className="px-6 py-3 bg-slate-50 border-t flex justify-center gap-2"> {/* Ensure buttons are centered */}
                  <div className="flex gap-2">
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
                  {/* Delete Button Removed */}
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

        {/* Delete Confirmation Dialog Removed */}

      </main>
    </div>
  );
};

export default Questionnaires;
