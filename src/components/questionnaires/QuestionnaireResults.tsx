import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, FileText, User } from "lucide-react"; // Added User icon
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ContributingFactor {
  question: string;
  answer: string;
  score: number;
}

interface QuestionnaireResultsProps {
  score: number;
  riskLevel: string;
  contributing_factors?: ContributingFactor[];
  advice?: string;
  firstName?: string; // Added firstName prop
  lastName?: string;  // Added lastName prop
}

const QuestionnaireResults = ({
  score,
  riskLevel,
  contributing_factors = [],
  advice = "",
  firstName = "Patient", // Default value if not provided
  lastName = ""       // Default value if not provided
}: QuestionnaireResultsProps) => {
  const navigate = useNavigate();

  // Determine the color based on risk level
  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'text-green-600';
      case 'moderate':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const patientFullName = `${firstName} ${lastName}`.trim();

  return (
    <div className="space-y-6">
      <Card className="w-full shadow-md">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} />
            Questionnaire Results
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold mb-2">Risk Assessment Complete</h2>
            {/* Display Patient Name */}
            {patientFullName && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                <User size={16} />
                <span>{patientFullName}</span>
              </div>
            )}
            <p className="text-muted-foreground">Based on the questionnaire responses, we've determined the following:</p>
          </div>

          {/* Total Score */}
          <div className="text-center mb-8">
            <div className="text-6xl font-bold mb-2">{score}</div>
            <div className={`text-2xl font-semibold ${getRiskColor(riskLevel)}`}>
              {riskLevel} Risk
            </div>
          </div>

          {/* Contributing Factors */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold mb-4">Contributing Factors</h3>
            {contributing_factors.length > 0 ? (
              contributing_factors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-medium">{factor.question}</h4>
                    <p className="text-sm text-muted-foreground">
                      Selected: {factor.answer}
                    </p>
                  </div>
                  <div className="text-lg font-semibold text-primary">
                    +{factor.score}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No specific contributing factors identified for this score.</p>
            )}
          </div>

          {/* Recommendations Section - Directly visible */}
          <div className="mb-8 border rounded-md">
            <div className="bg-primary/5 border-b px-4 py-3 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Recommendations</h3>
            </div>
            <div className="p-4">
              <div className="mb-2 text-sm text-muted-foreground">
                Based on the <span className={getRiskColor(riskLevel)}>{riskLevel.toLowerCase()} risk</span> level:
              </div>
              <div className="border-l-4 border-primary pl-4 py-3 bg-primary/5 rounded-r-md">
                <p className="font-semibold mb-2">Doctor Recommendation:</p>
                <p className="text-sm whitespace-pre-wrap">
                  {advice || "No specific recommendations available at this time."}
                </p>
              </div>
              
              {/* Still keep the dialog for detailed view */}
              <div className="mt-4 text-right">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Info className="mr-2 h-4 w-4" />
                      Detailed View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Risk Assessment Recommendations</DialogTitle>
                      <DialogDescription>
                        Based on the {riskLevel.toLowerCase()} risk level, here are the recommended actions:
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                      <div className="border-l-4 border-primary pl-4 py-2">
                        <p className="font-semibold mb-2">Doctor Recommendation:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {advice || "No specific recommendations available at this time."}
                        </p>
                        <div className="mt-4 text-xs text-muted-foreground border-t pt-2">
                          <p>Risk Level: {riskLevel}</p>
                          <p>Total Score: {score}</p>
                          <p className="mt-1">ID: rec_{Math.random().toString(36).substring(2, 7)}</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 flex justify-center">
            <Button onClick={() => navigate("/questionnaires")} className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Questionnaires
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionnaireResults;
